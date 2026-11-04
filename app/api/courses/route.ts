import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  fetchPlaylist,
  fetchSingleVideo,
  parseYoutubeInput,
  type YtPlaylist,
} from "@/lib/youtube";

const CACHE_MS = 24 * 60 * 60 * 1000;

/** Playlist + videos ko shared cache (service role) mein save karta hai. */
async function savePlaylist(
  admin: ReturnType<typeof createAdminClient>,
  yt: YtPlaylist,
  key: string
): Promise<string> {
  const { data: pl, error: plErr } = await admin
    .from("playlists")
    .upsert(
      {
        youtube_playlist_id: key,
        title: yt.title,
        channel_title: yt.channelTitle,
        thumbnail_url: yt.thumbnailUrl,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "youtube_playlist_id" }
    )
    .select("id")
    .single();
  if (plErr || !pl) throw new Error(plErr?.message ?? "Could not save playlist.");

  // Duplicate videos hatao (ek playlist mein same video do baar ho sakta hai)
  const seen = new Set<string>();
  const unique = yt.videos.filter((v) => {
    if (seen.has(v.youtubeVideoId)) return false;
    seen.add(v.youtubeVideoId);
    return true;
  });

  const idByYoutubeId = new Map<string, string>();
  for (let i = 0; i < unique.length; i += 500) {
    const chunk = unique.slice(i, i + 500).map((v) => ({
      youtube_video_id: v.youtubeVideoId,
      title: v.title,
      thumbnail_url: v.thumbnailUrl,
      duration_seconds: v.durationSeconds,
      embeddable: v.embeddable,
    }));
    const { data, error } = await admin
      .from("videos")
      .upsert(chunk, { onConflict: "youtube_video_id" })
      .select("id, youtube_video_id");
    if (error) throw new Error(error.message);
    for (const row of data ?? []) idByYoutubeId.set(row.youtube_video_id, row.id);
  }

  // Order dobara likho (re-sync par positions badal sakti hain)
  const { error: delErr } = await admin.from("playlist_videos").delete().eq("playlist_id", pl.id);
  if (delErr) throw new Error(delErr.message);

  const links = unique
    .map((v, index) => ({
      playlist_id: pl.id,
      video_id: idByYoutubeId.get(v.youtubeVideoId),
      position: index,
    }))
    .filter((l) => l.video_id);

  for (let i = 0; i < links.length; i += 500) {
    const { error } = await admin.from("playlist_videos").insert(links.slice(i, i + 500));
    if (error) throw new Error(error.message);
  }

  return pl.id as string;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = parseYoutubeInput(String(body?.url ?? ""));
  if (!parsed) {
    return NextResponse.json(
      { error: "This does not look like a valid YouTube playlist or video link." },
      { status: 400 }
    );
  }

  const key = parsed.kind === "playlist" ? parsed.id : `video_${parsed.id}`;
  const admin = createAdminClient();

  try {
    const { data: existing } = await admin
      .from("playlists")
      .select("id, last_synced_at")
      .eq("youtube_playlist_id", key)
      .maybeSingle();

    let playlistId: string | undefined = existing?.id;
    const stale =
      !existing || Date.now() - new Date(existing.last_synced_at).getTime() > CACHE_MS;

    if (stale) {
      const yt =
        parsed.kind === "playlist"
          ? await fetchPlaylist(parsed.id)
          : await fetchSingleVideo(parsed.id);
      if (yt.videos.length === 0) {
        return NextResponse.json(
          { error: "No available videos were found in this playlist." },
          { status: 422 }
        );
      }
      playlistId = await savePlaylist(admin, yt, key);
    }
    if (!playlistId) throw new Error("Playlist not found.");

    // User ka course (agar pehle se hai to wahi wapas)
    const { error: insErr } = await supabase
      .from("user_courses")
      .upsert(
        { user_id: user.id, playlist_id: playlistId },
        { onConflict: "user_id,playlist_id", ignoreDuplicates: true }
      );
    if (insErr) throw new Error(insErr.message);

    const { data: course, error: getErr } = await supabase
      .from("user_courses")
      .select("id")
      .eq("user_id", user.id)
      .eq("playlist_id", playlistId)
      .single();
    if (getErr || !course) throw new Error(getErr?.message ?? "Could not create course.");

    return NextResponse.json({ id: course.id });
  } catch (e: any) {
    const msg: string = e?.message ?? "Import failed.";
    const friendly = /not found or private/i.test(msg)
      ? "Playlist or video not found. Make sure it is not private."
      : /YOUTUBE_API_KEY/.test(msg)
        ? "YOUTUBE_API_KEY is not configured on the server."
        : msg;
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
