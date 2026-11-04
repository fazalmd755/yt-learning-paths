import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { fetchSingleVideo, parseYoutubeInput } from "@/lib/youtube";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { id: pathId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const url = body && typeof body === "object" && "url" in body && typeof body.url === "string" ? body.url.trim() : "";
  const parsed = parseYoutubeInput(url);
  if (!parsed || parsed.kind !== "video") {
    return NextResponse.json({ error: "Paste a YouTube video link, not a playlist link." }, { status: 400 });
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
  if ((count ?? 0) >= 200) return NextResponse.json({ error: "A learning path can contain up to 200 videos." }, { status: 400 });

  try {
    const ytVideo = (await fetchSingleVideo(parsed.id)).videos[0];
    if (!ytVideo) return NextResponse.json({ error: "This YouTube video is unavailable." }, { status: 422 });

    const admin = createAdminClient();
    const { data: savedVideo, error: videoError } = await admin.from("videos")
      .upsert({
        youtube_video_id: ytVideo.youtubeVideoId,
        title: ytVideo.title,
        thumbnail_url: ytVideo.thumbnailUrl,
        duration_seconds: ytVideo.durationSeconds,
        embeddable: ytVideo.embeddable,
      }, { onConflict: "youtube_video_id" })
      .select("id")
      .single();
    if (videoError || !savedVideo) throw new Error(videoError?.message ?? "Could not save video details.");

    const { data: existing, error: existingError } = await supabase.from("user_learning_path_videos")
      .select("video_id")
      .eq("path_id", pathId)
      .eq("video_id", savedVideo.id)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (existing) return NextResponse.json({ error: "This video is already in your path." }, { status: 409 });

    const { error: insertError } = await supabase.from("user_learning_path_videos")
      .insert({ path_id: pathId, video_id: savedVideo.id, position: count ?? 0 });
    if (insertError) throw new Error(insertError.message);

    const { error: updateError } = await supabase.from("user_learning_paths")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", pathId)
      .eq("user_id", user.id);
    if (updateError) {
      return NextResponse.json({
        error: `Video was added, but path update time could not be saved: ${updateError.message}`,
        changed: true,
        video: {
          id: savedVideo.id,
          title: ytVideo.title,
          thumbnail_url: ytVideo.thumbnailUrl,
          duration_seconds: ytVideo.durationSeconds,
          embeddable: ytVideo.embeddable,
          position: count ?? 0,
        },
      }, { status: 500 });
    }
    return NextResponse.json({
      video: {
        id: savedVideo.id,
        title: ytVideo.title,
        thumbnail_url: ytVideo.thumbnailUrl,
        duration_seconds: ytVideo.durationSeconds,
        embeddable: ytVideo.embeddable,
        position: count ?? 0,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add video.";
    const friendly = /not found or private/i.test(message)
      ? "Video not found or private. Check the YouTube link and try again."
      : /YOUTUBE_API_KEY/i.test(message)
        ? "YouTube API key is not configured."
        : message;
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id: pathId } = await params;
  const videoId = new URL(request.url).searchParams.get("videoId");
  if (!videoId) return NextResponse.json({ error: "Video ID is required." }, { status: 400 });

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
    .eq("video_id", videoId);
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
