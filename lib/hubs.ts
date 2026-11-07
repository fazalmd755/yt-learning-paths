import type { SupabaseClient } from "@supabase/supabase-js";

export type HubType = "semester" | "class" | "exam" | "custom";

export type SubjectLecture = {
  id: string;
  youtubeVideoId: string;
  title: string;
  durationSeconds: number;
  position: number;
  isCompleted: boolean;
};

export type HubSubjectSummary = {
  id: string;
  hubId: string;
  name: string;
  code: string;
  color: string;
  position: number;
  courseId: string | null;
  playlistId: string | null;
  playlistTitle: string | null;
  thumbnailUrl: string | null;
  channelTitle: string | null;
  totalVideos: number;
  completedVideos: number;
  totalSeconds: number;
  completedSeconds: number;
  continueVideoId: string | null;
  continueVideoTitle: string | null;
  lectures: SubjectLecture[];
};

export type StudyHubSummary = {
  id: string;
  title: string;
  hubType: HubType;
  description: string;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
  totalSubjects: number;
  totalVideos: number;
  completedVideos: number;
  totalSeconds: number;
  completedSeconds: number;
  subjects: HubSubjectSummary[];
};

const one = <T,>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

export async function getStudyHubs(
  supabase: SupabaseClient,
  userId: string
): Promise<StudyHubSummary[]> {
  const { data: hubs, error: hubsError } = await supabase
    .from("user_study_hubs")
    .select("id, title, hub_type, description, target_date, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (hubsError) {
    // If table doesn't exist yet, return empty list gracefully
    console.warn("Could not query user_study_hubs:", hubsError.message);
    return [];
  }

  const hubList = hubs ?? [];
  if (hubList.length === 0) return [];

  const hubIds = hubList.map((h) => h.id);

  const { data: rawSubjects } = await supabase
    .from("study_hub_subjects")
    .select(
      `
      id, hub_id, name, code, color, position, course_id, playlist_id,
      course:user_courses(id, last_video_id, playlist:playlists(id, title, channel_title, thumbnail_url)),
      playlist:playlists(id, title, channel_title, thumbnail_url)
    `
    )
    .in("hub_id", hubIds)
    .order("position", { ascending: true });

  const subjectList = (rawSubjects ?? []) as any[];
  const playlistIds = [
    ...new Set(
      subjectList
        .map((s) => s.playlist_id || one<any>(s.course)?.playlist?.id)
        .filter(Boolean)
    ),
  ];

  let linksByPlaylist = new Map<string, any[]>();
  let progressByVideo = new Map<string, { status: string; updated_at: string }>();

  if (playlistIds.length > 0) {
    const { data: links } = await supabase
      .from("playlist_videos")
      .select("playlist_id, position, video_id, video:videos(id, title, duration_seconds)")
      .in("playlist_id", playlistIds)
      .order("position", { ascending: true })
      .limit(10000);

    for (const l of (links ?? []) as any[]) {
      const arr = linksByPlaylist.get(l.playlist_id) ?? [];
      arr.push(l);
      linksByPlaylist.set(l.playlist_id, arr);
    }

    const videoIds = [...new Set((links ?? []).map((l) => l.video_id))];
    if (videoIds.length > 0) {
      const { data: progress } = await supabase
        .from("video_progress")
        .select("video_id, status, updated_at")
        .eq("user_id", userId)
        .in("video_id", videoIds)
        .limit(10000);

      for (const p of (progress ?? []) as any[]) {
        progressByVideo.set(p.video_id, p);
      }
    }
  }

  const subjectsByHub = new Map<string, HubSubjectSummary[]>();

  for (const s of subjectList) {
    const courseObj = one<any>(s.course);
    const directPlaylistObj = one<any>(s.playlist);
    const pl = courseObj?.playlist ?? directPlaylistObj;
    const plId = pl?.id ?? s.playlist_id;

    const vids = plId ? linksByPlaylist.get(plId) ?? [] : [];

    let completedVideos = 0;
    let totalSeconds = 0;
    let completedSeconds = 0;
    let firstPendingId: string | null = null;
    let firstPendingTitle: string | null = null;

    const lectures: SubjectLecture[] = [];

    for (const l of vids) {
      const vid = one<any>(l.video);
      const dur = vid?.duration_seconds ?? 0;
      const prog = progressByVideo.get(l.video_id);
      const isDone = prog?.status === "completed";

      totalSeconds += dur;
      if (isDone) {
        completedVideos++;
        completedSeconds += dur;
      } else if (!firstPendingId) {
        firstPendingId = l.video_id;
        firstPendingTitle = vid?.title ?? "Next lecture";
      }

      lectures.push({
        id: l.video_id,
        youtubeVideoId: vid?.youtube_video_id ?? "",
        title: vid?.title ?? "Lecture",
        durationSeconds: dur,
        position: l.position,
        isCompleted: isDone,
      });
    }

    const lastPlayedId = courseObj?.last_video_id as string | null;
    const lastPlayedIsPending =
      lastPlayedId && progressByVideo.get(lastPlayedId)?.status !== "completed";

    const continueVideoId = lastPlayedIsPending
      ? lastPlayedId
      : firstPendingId ?? vids[0]?.video_id ?? null;

    const continueVideoTitle =
      (vids.find((v) => v.video_id === continueVideoId)?.video?.title as string | undefined) ??
      firstPendingTitle ??
      null;

    const summary: HubSubjectSummary = {
      id: s.id,
      hubId: s.hub_id,
      name: s.name,
      code: s.code || "",
      color: s.color || "blue",
      position: s.position,
      courseId: courseObj?.id ?? s.course_id ?? null,
      playlistId: plId,
      playlistTitle: pl?.title ?? null,
      thumbnailUrl: pl?.thumbnail_url ?? null,
      channelTitle: pl?.channel_title ?? null,
      totalVideos: vids.length,
      completedVideos,
      totalSeconds,
      completedSeconds,
      continueVideoId,
      continueVideoTitle,
      lectures,
    };

    const arr = subjectsByHub.get(s.hub_id) ?? [];
    arr.push(summary);
    subjectsByHub.set(s.hub_id, arr);
  }

  return hubList.map((h) => {
    const subjects = subjectsByHub.get(h.id) ?? [];
    const totalVideos = subjects.reduce((sum, s) => sum + s.totalVideos, 0);
    const completedVideos = subjects.reduce((sum, s) => sum + s.completedVideos, 0);
    const totalSeconds = subjects.reduce((sum, s) => sum + s.totalSeconds, 0);
    const completedSeconds = subjects.reduce((sum, s) => sum + s.completedSeconds, 0);

    return {
      id: h.id,
      title: h.title,
      hubType: (h.hub_type as HubType) ?? "semester",
      description: h.description ?? "",
      targetDate: h.target_date ?? null,
      createdAt: h.created_at,
      updatedAt: h.updated_at,
      totalSubjects: subjects.length,
      totalVideos,
      completedVideos,
      totalSeconds,
      completedSeconds,
      subjects,
    };
  });
}

export async function getStudyHubDetails(
  supabase: SupabaseClient,
  userId: string,
  hubId: string
): Promise<StudyHubSummary | null> {
  const hubs = await getStudyHubs(supabase, userId);
  return hubs.find((h) => h.id === hubId) ?? null;
}
