import type { SupabaseClient } from "@supabase/supabase-js";

export type CourseSummary = {
  id: string;
  title: string;
  channelTitle: string | null;
  thumbnailUrl: string | null;
  totalVideos: number;
  completedVideos: number;
  totalSeconds: number;
  completedSeconds: number;
  continueVideoId: string | null;
  lastActivity: string | null;
};

const one = <T,>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

export async function getCourseSummaries(
  supabase: SupabaseClient,
  userId: string
): Promise<CourseSummary[]> {
  const { data: courses } = await supabase
    .from("user_courses")
    .select(
      "id, last_video_id, created_at, playlist:playlists(id, title, channel_title, thumbnail_url)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const list = (courses ?? []) as any[];
  if (list.length === 0) return [];

  const playlistIds = list.map((c) => one<any>(c.playlist)?.id).filter(Boolean);

  const { data: links } = await supabase
    .from("playlist_videos")
    .select("playlist_id, position, video_id, video:videos(id, duration_seconds)")
    .in("playlist_id", playlistIds)
    .order("position", { ascending: true })
    .limit(10000);

  const videoIds = [...new Set((links ?? []).map((link) => link.video_id))];
  const { data: progress } = videoIds.length
    ? await supabase
        .from("video_progress")
        .select("video_id, status, updated_at")
        .eq("user_id", userId)
        .in("video_id", videoIds)
        .limit(10000)
    : { data: [] };

  const progressByVideo = new Map<string, { status: string; updated_at: string }>();
  for (const p of (progress ?? []) as any[]) progressByVideo.set(p.video_id, p);

  const linksByPlaylist = new Map<string, any[]>();
  for (const l of (links ?? []) as any[]) {
    const arr = linksByPlaylist.get(l.playlist_id) ?? [];
    arr.push(l);
    linksByPlaylist.set(l.playlist_id, arr);
  }

  return list.map((c) => {
    const pl = one<any>(c.playlist);
    const vids = linksByPlaylist.get(pl?.id) ?? [];
    let completedVideos = 0;
    let totalSeconds = 0;
    let completedSeconds = 0;
    let lastActivity: string | null = null;
    let firstPending: string | null = null;

    for (const l of vids) {
      const dur = one<any>(l.video)?.duration_seconds ?? 0;
      const p = progressByVideo.get(l.video_id);
      totalSeconds += dur;
      if (p?.status === "completed") {
        completedVideos += 1;
        completedSeconds += dur;
      } else if (!firstPending) {
        firstPending = l.video_id;
      }
      if (p && (!lastActivity || p.updated_at > lastActivity)) lastActivity = p.updated_at;
    }

    const lastPlayed = c.last_video_id as string | null;
    const lastPlayedPending =
      lastPlayed && progressByVideo.get(lastPlayed)?.status !== "completed" ? lastPlayed : null;

    return {
      id: c.id,
      title: pl?.title ?? "Untitled",
      channelTitle: pl?.channel_title ?? null,
      thumbnailUrl: pl?.thumbnail_url ?? null,
      totalVideos: vids.length,
      completedVideos,
      totalSeconds,
      completedSeconds,
      continueVideoId: lastPlayedPending ?? firstPending ?? vids[0]?.video_id ?? null,
      lastActivity,
    };
  });
}
