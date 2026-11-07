import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRightIcon } from "@/components/Icons";
import ShareRoadmapButton from "@/components/ShareRoadmapButton";
import LearningPathEditor, { type LearningPathVideo } from "@/components/LearningPathEditor";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const one = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

export default async function LearningPathPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: path, error: pathError } = await supabase.from("user_learning_paths")
    .select("id, title, description")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (pathError) throw new Error(`Could not load learning path: ${pathError.message}`);
  if (!path) notFound();

  const { data: links, error: linksError } = await supabase.from("user_learning_path_videos")
    .select("position, video:videos(id, title, thumbnail_url, duration_seconds, embeddable)")
    .eq("path_id", id)
    .order("position", { ascending: true })
    .limit(200);
  if (linksError) throw new Error(`Could not load learning path videos: ${linksError.message}`);

  const rawVideos = (links ?? []).map((link) => one(link.video)).filter((video) => video !== null);
  const videoIds = rawVideos.map((video) => video.id);

  const [{ data: progress, error: progressError }, { data: pvLinks, error: pvError }] = await Promise.all([
    videoIds.length
      ? supabase.from("video_progress").select("video_id, status").eq("user_id", user.id).in("video_id", videoIds)
      : { data: [], error: null },
    videoIds.length
      ? supabase
          .from("playlist_videos")
          .select("video_id, playlist_id, position, playlist:playlists(id, title, thumbnail_url, channel_title)")
          .in("video_id", videoIds)
      : { data: [], error: null },
  ]);
  if (progressError) throw new Error(`Could not load learning progress: ${progressError.message}`);
  if (pvError) {
    console.error("Could not load playlist video links:", pvError.message);
  }

  // Count how many videos in this path belong to each playlist_id
  const playlistOccurrences = new Map<string, number>();
  for (const pv of pvLinks ?? []) {
    if (pv.playlist_id) {
      playlistOccurrences.set(pv.playlist_id, (playlistOccurrences.get(pv.playlist_id) ?? 0) + 1);
    }
  }

  // Map each video_id to the best playlist match
  const bestPlaylistByVideo = new Map<string, any>();
  for (const pv of pvLinks ?? []) {
    const currentBest = bestPlaylistByVideo.get(pv.video_id);
    const count = playlistOccurrences.get(pv.playlist_id) ?? 0;
    if (!currentBest || count > (playlistOccurrences.get(currentBest.playlist_id) ?? 0)) {
      bestPlaylistByVideo.set(pv.video_id, pv);
    }
  }

  const statusByVideo = new Map((progress ?? []).map((item) => [item.video_id, item.status]));
  const videos = rawVideos.map((video) => {
    const pv = bestPlaylistByVideo.get(video.id);
    const count = pv ? (playlistOccurrences.get(pv.playlist_id) ?? 0) : 0;
    // Consider as playlist folder if at least 2 videos in this path belong to the same playlist
    const isPlaylist = pv && count >= 2;
    const pl = isPlaylist ? one<any>(pv.playlist) : null;

    return {
      ...video,
      status: statusByVideo.get(video.id) ?? "not_started",
      playlist_id: isPlaylist ? pv.playlist_id : null,
      playlist_title: pl?.title ?? null,
      playlist_thumbnail_url: pl?.thumbnail_url ?? null,
      playlist_channel_title: pl?.channel_title ?? null,
    };
  }) as LearningPathVideo[];

  const completed = videos.filter((video) => video.status === "completed").length;
  const totalSeconds = videos.reduce((sum, video) => sum + (video.duration_seconds ?? 0), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const duration = hours ? `${hours}h ${Math.floor((totalSeconds % 3600) / 60)}m` : `${Math.floor(totalSeconds / 60)}m`;

  return (
    <main className="course-page">
      <Link href="/syllabus/select" className="back-link"><span aria-hidden="true">←</span> My playlists</Link>
      <section className="learning-path-hero">
        <h1>{path.title}</h1>
        {path.description && <p>{path.description}</p>}
        <div className="learning-path-hero-stats">
          <span><strong>{videos.length}</strong> videos</span><i />
          <span><strong>{duration}</strong> total</span><i />
          <span><strong>{completed}</strong> complete</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          {videos[0] && (
            <Link className="detail-start-button" href={`/learning-paths/${id}/watch/${videos.find((video) => video.status !== "completed")?.id ?? videos[0].id}`}>
              {completed ? "Continue learning" : "Start learning"} <ArrowRightIcon size={14} className="inline-block ml-1" />
            </Link>
          )}
          <ShareRoadmapButton
            roadmapId={id}
            title={path.title}
            totalDuration={duration}
            lessonCount={videos.length}
          />
        </div>
      </section>
      <LearningPathEditor pathId={id} initialTitle={path.title} videos={videos} />
    </main>
  );
}
