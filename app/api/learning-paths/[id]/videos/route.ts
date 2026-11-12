import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { fetchPlaylist, fetchSingleVideo, parseYoutubeInput } from "@/lib/youtube";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { learningPathAddVideoSchema } from "@/lib/validations/api";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { id: pathId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const clientIp = getClientIp(request);
  const [userLimit, ipLimit] = await Promise.all([
    checkRateLimit(`lp_vid:user:${user.id}`, 10, 60),
    checkRateLimit(`lp_vid:ip:${clientIp}`, 15, 60),
  ]);

  if (!userLimit.success || !ipLimit.success) {
    return NextResponse.json({ error: "Too many video import requests. Please wait a moment." }, { status: 429 });
  }

  const rawBody = await request.json().catch(() => null);
  const validation = learningPathAddVideoSchema.safeParse(rawBody);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0]?.message || "Invalid YouTube link." }, { status: 400 });
  }

  const { url } = validation.data;
  const parsed = parseYoutubeInput(url);
  if (!parsed) {
    return NextResponse.json({ error: "Paste a valid YouTube video or playlist link." }, { status: 400 });
  }

  const { data: path, error: pathError } = await supabase.from("user_learning_paths")
    .select("id")
    .eq("id", pathId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (pathError) return NextResponse.json({ error: pathError.message }, { status: 500 });
  if (!path) return NextResponse.json({ error: "Learning path not found." }, { status: 404 });

  const { count, error: countError } = await supabase.from("user_learning_path_videos")
    .select("video_id", { count: "exact", head: true })
    .eq("path_id", pathId);
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

  try {
    const source = parsed.kind === "playlist"
      ? await fetchPlaylist(parsed.id)
      : await fetchSingleVideo(parsed.id);
    const uniqueVideos = [...new Map(source.videos.map((video) => [video.youtubeVideoId, video])).values()];
    if (uniqueVideos.length === 0) {
      return NextResponse.json({ error: parsed.kind === "playlist" ? "No available videos were found in this playlist." : "This YouTube video is unavailable." }, { status: 422 });
    }

    const admin = createAdminClient();
    const { data: savedVideos, error: videoError } = await admin.from("videos")
      .upsert(uniqueVideos.map((video) => ({
        youtube_video_id: video.youtubeVideoId,
        title: video.title,
        thumbnail_url: video.thumbnailUrl,
        duration_seconds: video.durationSeconds,
        embeddable: video.embeddable,
      })), { onConflict: "youtube_video_id" })
      .select("id, youtube_video_id");
    if (videoError) throw new Error(videoError.message);

    const idByYoutubeId = new Map((savedVideos ?? []).map((video) => [video.youtube_video_id, video.id]));
    const savedItems = uniqueVideos.flatMap((video) => {
      const id = idByYoutubeId.get(video.youtubeVideoId);
      return id ? [{ video, id }] : [];
    });
    if (savedItems.length !== uniqueVideos.length) throw new Error("Could not save all playlist videos.");

    let playlistRecord: { id: string; title: string; thumbnailUrl: string | null; channelTitle: string | null } | null = null;
    if (parsed.kind === "playlist" && "youtubePlaylistId" in source) {
      const { data: pl } = await admin
        .from("playlists")
        .upsert(
          {
            youtube_playlist_id: parsed.id,
            title: source.title,
            channel_title: source.channelTitle,
            thumbnail_url: source.thumbnailUrl,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: "youtube_playlist_id" }
        )
        .select("id, title, thumbnail_url, channel_title")
        .single();

      if (pl) {
        playlistRecord = {
          id: pl.id,
          title: pl.title,
          thumbnailUrl: pl.thumbnail_url,
          channelTitle: pl.channel_title,
        };

        const plLinks = uniqueVideos
          .map((v, index) => {
            const vid = idByYoutubeId.get(v.youtubeVideoId);
            return vid ? { playlist_id: pl.id, video_id: vid, position: index } : null;
          })
          .filter((l): l is { playlist_id: string; video_id: string; position: number } => l !== null);

        if (plLinks.length > 0) {
          await admin.from("playlist_videos").upsert(plLinks, { onConflict: "playlist_id,video_id" });
        }
      }
    }

    const { data: existing, error: existingError } = await supabase.from("user_learning_path_videos")
      .select("video_id")
      .eq("path_id", pathId)
      .in("video_id", savedItems.map((item) => item.id));
    if (existingError) throw new Error(existingError.message);
    const existingIds = new Set((existing ?? []).map((item) => item.video_id));
    const newItems = savedItems.filter((item) => !existingIds.has(item.id));
    if (newItems.length === 0) {
      return NextResponse.json({
        error: parsed.kind === "playlist" ? "All videos in this playlist are already in your path." : "This video is already in your path.",
      }, { status: 409 });
    }
    if ((count ?? 0) + newItems.length > 200) {
      return NextResponse.json({ error: "A learning path can contain up to 200 videos. Remove some videos before adding this playlist." }, { status: 400 });
    }

    const videos = newItems.map(({ video, id }, index) => ({
      id,
      title: video.title,
      thumbnail_url: video.thumbnailUrl,
      duration_seconds: video.durationSeconds,
      embeddable: video.embeddable,
      position: (count ?? 0) + index,
      playlist_id: playlistRecord?.id ?? null,
      playlist_title: playlistRecord?.title ?? null,
      playlist_thumbnail_url: playlistRecord?.thumbnailUrl ?? null,
      playlist_channel_title: playlistRecord?.channelTitle ?? null,
    }));
    const { error: insertError } = await supabase.from("user_learning_path_videos")
      .insert(videos.map((video) => ({ path_id: pathId, video_id: video.id, position: video.position })));
    if (insertError) throw new Error(insertError.message);

    const { error: updateError } = await supabase.from("user_learning_paths")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", pathId)
      .eq("user_id", user.id);
    if (updateError) {
      return NextResponse.json({
        error: `Videos were added, but path update time could not be saved: ${updateError.message}`,
        changed: true,
        videos,
        kind: parsed.kind,
        playlist: playlistRecord,
      }, { status: 500 });
    }
    return NextResponse.json({ videos, kind: parsed.kind, playlist: playlistRecord }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add videos.";
    const friendly = /not found or private/i.test(message)
      ? `${parsed.kind === "playlist" ? "Playlist" : "Video"} not found or private. Check the YouTube link and try again.`
      : /YOUTUBE_API_KEY/i.test(message)
        ? "YouTube API key is not configured."
        : message;
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id: pathId } = await params;
  const url = new URL(request.url);
  const videoId = url.searchParams.get("videoId");
  const videoIdsParam = url.searchParams.get("videoIds");
  const targetIds = videoIdsParam
    ? videoIdsParam.split(",").map((v) => v.trim()).filter(Boolean)
    : videoId
    ? [videoId]
    : [];

  if (targetIds.length === 0) return NextResponse.json({ error: "Video ID is required." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const { data: path, error: pathError } = await supabase.from("user_learning_paths")
    .select("id")
    .eq("id", pathId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (pathError) return NextResponse.json({ error: pathError.message }, { status: 500 });
  if (!path) return NextResponse.json({ error: "Learning path not found." }, { status: 404 });

  const { error } = await supabase.from("user_learning_path_videos")
    .delete()
    .eq("path_id", pathId)
    .in("video_id", targetIds);
  if (error) return NextResponse.json({ error: `Could not remove video: ${error.message}` }, { status: 500 });

  const { data: videos, error: listError } = await supabase.from("user_learning_path_videos")
    .select("video_id")
    .eq("path_id", pathId)
    .order("position", { ascending: true });
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });
  for (const [position, video] of (videos ?? []).entries()) {
    const { error: updateError } = await supabase.from("user_learning_path_videos")
      .update({ position })
      .eq("path_id", pathId)
      .eq("video_id", video.video_id);
    if (updateError) return NextResponse.json({ error: `Video removed, but order could not be refreshed: ${updateError.message}`, changed: true }, { status: 500 });
  }
  const { error: updateError } = await supabase.from("user_learning_paths")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", pathId)
    .eq("user_id", user.id);
  if (updateError) {
    return NextResponse.json({ error: `Video was removed, but path update time could not be saved: ${updateError.message}`, changed: true }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
