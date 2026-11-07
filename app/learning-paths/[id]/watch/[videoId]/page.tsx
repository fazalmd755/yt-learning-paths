import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Player from "@/components/Player";
import VideoDescription from "@/components/VideoDescription";
import VideoNotes from "@/components/VideoNotes";
import AiStudyAssist from "@/components/AiStudyAssist";
import { createClient } from "@/lib/supabase/server";
import { fetchVideoDescription } from "@/lib/youtube";

export const dynamic = "force-dynamic";

const one = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

export default async function LearningPathWatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; videoId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const [{ id, videoId }, { t }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: path, error: pathError } = await supabase.from("user_learning_paths")
    .select("id, title")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (pathError) throw new Error(`Could not load learning path: ${pathError.message}`);
  if (!path) notFound();

  const { data: current, error: currentError } = await supabase.from("user_learning_path_videos")
    .select("position, video_id, video:videos(id, youtube_video_id, title, duration_seconds, embeddable)")
    .eq("path_id", id)
    .eq("video_id", videoId)
    .maybeSingle();
  if (currentError) throw new Error(`Could not load lesson: ${currentError.message}`);
  if (!current) notFound();

  const video = one(current.video);
  if (!video) notFound();

  const [
    { data: previous, error: previousError },
    { data: next, error: nextError },
    { data: progress, error: progressError },
    { data: notes, error: notesError },
    { count, error: countError },
    description,
  ] = await Promise.all([
    supabase.from("user_learning_path_videos")
      .select("video:videos(id, title)")
      .eq("path_id", id)
      .lt("position", current.position)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("user_learning_path_videos")
      .select("video:videos(id, title)")
      .eq("path_id", id)
      .gt("position", current.position)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from("video_progress")
      .select("last_position, status")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .maybeSingle(),
    supabase.from("video_notes")
      .select("id, timestamp_seconds, content, created_at")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .order("timestamp_seconds", { ascending: true }),
    supabase.from("user_learning_path_videos")
      .select("video_id", { count: "exact", head: true })
      .eq("path_id", id),
    fetchVideoDescription(video.youtube_video_id),
  ]);
  const detailsError = previousError ?? nextError ?? progressError ?? notesError ?? countError;
  if (detailsError) throw new Error(`Could not load lesson details: ${detailsError.message}`);

  const previousVideo = one(previous?.video);
  const nextVideo = one(next?.video);
  const requestedStart = t && /^\d+$/.test(t) ? Number(t) : NaN;
  const startAt = Number.isSafeInteger(requestedStart) && requestedStart >= 0
    ? Math.min(requestedStart, video.duration_seconds || requestedStart)
    : progress && progress.status !== "completed" ? progress.last_position : 0;
  const watchPath = `/learning-paths/${id}/watch`;

  return (
    <main className="watch-page">
      <Link href={`/learning-paths/${id}`} className="back-link"><span aria-hidden="true">←</span> Back to {path.title}</Link>
      <section className="watch-heading">
        <div className="watch-lesson-meta">Lesson {String(current.position + 1).padStart(2, "0")} of {String(count ?? 0).padStart(2, "0")}</div>
        <h1>{video.title}</h1>
      </section>
      <div className="watch-content-grid">
        <div className="watch-player">
          <Player
            key={video.id}
            userId={user.id}
            courseId={null}
            videoId={video.id}
            youtubeId={video.youtube_video_id}
            durationSeconds={video.duration_seconds ?? 0}
            startAt={startAt ?? 0}
            embeddable={video.embeddable !== false}
            initialStatus={progress?.status ?? "not_started"}
            nextHref={nextVideo ? `${watchPath}/${nextVideo.id}` : null}
            videoTitle={video.title}
            courseTitle={path.title}
          />
          <VideoDescription description={description} />
          <AiStudyAssist
            videoId={video.id}
            videoTitle={video.title}
            description={description}
            userId={user.id}
          />
        </div>
        <VideoNotes
          userId={user.id}
          courseId={id}
          videoId={video.id}
          durationSeconds={video.duration_seconds ?? 0}
          notes={notes ?? []}
          watchBaseHref={watchPath}
        />
      </div>
      <div className="watch-pagination">
        {previousVideo ? (
          <Link href={`${watchPath}/${previousVideo.id}`} className="watch-prev"><span aria-hidden="true">←</span><span><small>PREVIOUS LESSON</small> {previousVideo.title}</span></Link>
        ) : <span className="watch-prev-placeholder" />}
        {nextVideo ? (
          <Link href={`${watchPath}/${nextVideo.id}`} className="watch-next"><span><small>NEXT LESSON</small> {nextVideo.title}</span><span aria-hidden="true">→</span></Link>
        ) : <Link href={`/learning-paths/${id}`} className="watch-next watch-course-finish">Path complete <span aria-hidden="true">✓</span></Link>}
      </div>
    </main>
  );
}
