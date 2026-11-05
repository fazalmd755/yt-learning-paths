import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Player from "@/components/Player";
import VideoNotes from "@/components/VideoNotes";
import { createClient } from "@/lib/supabase/server";

const one = <T,>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; videoId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const [{ courseId, videoId }, { t }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: course } = await supabase
    .from("user_courses")
    .select("id, playlist_id")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!course) notFound();

  const [{ data: currentLink }, { count: lessonCount }] = await Promise.all([
    supabase
      .from("playlist_videos")
      .select("position, video:videos(id, youtube_video_id, title, duration_seconds, embeddable)")
      .eq("playlist_id", course.playlist_id)
      .eq("video_id", videoId)
      .maybeSingle(),
    supabase
      .from("playlist_videos")
      .select("video_id", { count: "exact", head: true })
      .eq("playlist_id", course.playlist_id),
  ]);
  if (!currentLink) notFound();

  const position = (currentLink as any).position as number;
  const video = one<any>((currentLink as any).video);
  if (!video) notFound();

  const [{ data: previousLink }, { data: nextLink }, { data: progress }, { data: notes, error: notesError }] = await Promise.all([
    supabase
      .from("playlist_videos")
      .select("position, video:videos(id, title)")
      .eq("playlist_id", course.playlist_id)
      .lt("position", position)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("playlist_videos")
      .select("position, video:videos(id, title)")
      .eq("playlist_id", course.playlist_id)
      .gt("position", position)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("video_progress")
      .select("last_position, status")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .maybeSingle(),
    supabase
      .from("video_notes")
      .select("id, timestamp_seconds, content, created_at")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .order("timestamp_seconds", { ascending: true }),
  ]);
  if (notesError) throw new Error(`Could not load lesson notes: ${notesError.message}`);
  const prev = one<any>(previousLink?.video);
  const next = one<any>(nextLink?.video);
  const index = position;

  // Complete ho chuke video ko shuru se chalao
  const requestedStart = t && /^\d+$/.test(t) ? Number(t) : NaN;
  const startAt = Number.isSafeInteger(requestedStart) && requestedStart >= 0
    ? Math.min(requestedStart, video.duration_seconds || requestedStart)
    : progress && progress.status !== "completed" ? progress.last_position : 0;

  return (
    <main className="watch-page">
      <Link href={`/courses/${courseId}`} className="back-link">
        <span aria-hidden="true">←</span> Back to course
      </Link>
      <section className="watch-heading">
        <div className="eyebrow"><span className="eyebrow-dot" /> LESSON {String(index + 1).padStart(2, "0")} / {String(lessonCount ?? 0).padStart(2, "0")}</div>
        <h1>{video.title}</h1>
      </section>
      <div className="watch-content-grid">
        <div className="watch-player">
          <Player
            key={video.id}
            userId={user.id}
            courseId={courseId}
            videoId={video.id}
            youtubeId={video.youtube_video_id}
            durationSeconds={video.duration_seconds ?? 0}
            startAt={startAt ?? 0}
            embeddable={video.embeddable !== false}
            initialStatus={progress?.status ?? "not_started"}
            nextHref={next ? `/watch/${courseId}/${next.id}` : null}
          />
        </div>
        <VideoNotes
          userId={user.id}
          courseId={courseId}
          videoId={video.id}
          durationSeconds={video.duration_seconds ?? 0}
          notes={notes ?? []}
        />
      </div>

      <div className="watch-pagination">
        {prev ? (
          <Link href={`/watch/${courseId}/${prev.id}`} className="watch-prev">
            <span aria-hidden="true">←</span><span><small>PREVIOUS LESSON</small> {prev.title}</span>
          </Link>
        ) : (
          <span className="watch-prev-placeholder" />
        )}
        {next ? (
          <Link href={`/watch/${courseId}/${next.id}`} className="watch-next">
            <span><small>NEXT LESSON</small> {next.title}</span><span aria-hidden="true">→</span>
          </Link>
        ) : <Link href={`/courses/${courseId}`} className="watch-next watch-course-finish">Course complete <span aria-hidden="true">✓</span></Link>}
      </div>
    </main>
  );
}
