import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { removeCourse } from "@/app/dashboard/actions";
import CourseLessonScheduleButton from "@/components/CourseLessonScheduleButton";
import CourseNotesExport, { type ExportableNote } from "@/components/CourseNotesExport";
import { ArrowRightIcon, PlayIcon, TargetIcon } from "@/components/Icons";
import ProgressBar from "@/components/ProgressBar";
import SyncPlaylistButton from "@/components/SyncPlaylistButton";
import CourseCertificate from "@/components/CourseCertificate";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

const one = <T,>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [courseRes, profileRes] = await Promise.all([
    supabase
      .from("user_courses")
      .select("id, last_video_id, playlist:playlists(id, youtube_playlist_id, title, channel_title, thumbnail_url)")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("daily_goal_minutes")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const courseRow = courseRes.data;
  if (!courseRow) notFound();

  const playlist = one<any>((courseRow as any).playlist);
  if (!playlist) notFound();

  const { data: links } = await supabase
    .from("playlist_videos")
    .select(
      "position, video_id, video:videos(id, title, thumbnail_url, duration_seconds, embeddable)"
    )
    .eq("playlist_id", playlist.id)
    .order("position", { ascending: true })
    .limit(10000);

  const videoIds = [...new Set((links ?? []).map((link) => link.video_id))];

  let progress: any[] = [];
  let notesData: any[] = [];

  if (videoIds.length > 0) {
    const results = await Promise.allSettled([
      supabase
        .from("video_progress")
        .select("video_id, status, last_position")
        .eq("user_id", user.id)
        .in("video_id", videoIds)
        .limit(10000),
      supabase
        .from("video_notes")
        .select("id, video_id, timestamp_seconds, content, created_at")
        .eq("user_id", user.id)
        .in("video_id", videoIds)
        .order("timestamp_seconds", { ascending: true }),
    ]);

    if (results[0].status === "fulfilled" && results[0].value.data) {
      progress = results[0].value.data;
    }
    if (results[1].status === "fulfilled" && results[1].value.data) {
      notesData = results[1].value.data;
    }
  }

  const statusByVideo = new Map<string, string>();
  for (const p of progress) statusByVideo.set(p.video_id, p.status);

  const videos = ((links ?? []) as any[])
    .map((l) => ({ ...one<any>(l.video), status: statusByVideo.get(l.video_id) ?? "not_started" }))
    .filter((v) => v && v.id);

  const done = videos.filter((v) => v.status === "completed").length;
  const totalSeconds = videos.reduce((s, v) => s + (v.duration_seconds ?? 0), 0);
  const remainingSeconds = videos.filter((v) => v.status !== "completed").reduce((s, v) => s + (v.duration_seconds ?? 0), 0);
  const lastId = (courseRow as any).last_video_id as string | null;
  const lastPending = lastId && statusByVideo.get(lastId) !== "completed" ? lastId : null;
  const nextVideo = lastPending ?? videos.find((v) => v.status !== "completed")?.id ?? videos[0]?.id;

  // Prepare notes for export
  const videoMetaMap = new Map<string, { title: string; position: number }>();
  videos.forEach((v, idx) => {
    videoMetaMap.set(v.id, { title: v.title, position: idx });
  });

  const exportableNotes: ExportableNote[] = notesData.map((n: any) => {
    const meta = videoMetaMap.get(n.video_id);
    return {
      videoTitle: meta?.title ?? "Lesson",
      position: meta?.position ?? 0,
      timestampSeconds: n.timestamp_seconds,
      content: n.content,
      createdAt: n.created_at,
    };
  });

  // Calculate Estimated Completion Date (ETC) safely
  const goalMinutes = Math.max(1, profileRes.data?.daily_goal_minutes ?? 15);
  const remainingMinutes = Math.max(0, Math.ceil(remainingSeconds / 60));
  const daysToFinish = Math.max(0, Math.ceil(remainingMinutes / goalMinutes));
  const targetDate = new Date();
  if (Number.isFinite(daysToFinish)) {
    targetDate.setDate(targetDate.getDate() + daysToFinish);
  }
  let formattedTargetDate = "Soon";
  try {
    formattedTargetDate = new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(targetDate);
  } catch {
    formattedTargetDate = "in a few days";
  }

  const completionPct = videos.length > 0 ? Math.round((done / videos.length) * 100) : 0;

  return (
    <main className="course-page">
      <Link href="/dashboard" className="back-link"><span aria-hidden="true">←</span> My learning</Link>
      <section className="course-detail-hero">
        <div className="course-detail-art">
          {playlist.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={playlist.thumbnail_url} alt="" />
          ) : <PlayIcon size={48} />}
          <div className="course-detail-art-shade" />
        </div>
        <div className="course-detail-copy">
          <h1>{playlist.title}</h1>
          <p>{playlist.channel_title || "YouTube course"}</p>
          <div className="course-detail-stats">
            <span><strong>{videos.length}</strong> videos</span>
            <i />
            <span><strong>{formatDuration(totalSeconds)}</strong> total</span>
            <i />
            <span><strong>{formatDuration(remainingSeconds)}</strong> left</span>
            <i />
            <span><strong>{done}</strong> complete</span>
          </div>

          {/* Estimated Course Completion Card */}
          <div className="course-etc-banner">
            <span className="etc-icon"><TargetIcon size={20} /></span>
            <div className="etc-copy">
              <strong>
                {done === videos.length && videos.length > 0
                  ? "Course Completed! 🎉"
                  : `Finish in ~${daysToFinish} ${daysToFinish === 1 ? "day" : "days"} (by ${formattedTargetDate})`}
              </strong>
              <span>
                {done === videos.length && videos.length > 0
                  ? "Great job finishing this playlist."
                  : `Based on your daily goal of ${goalMinutes} mins/day (${formatDuration(remainingSeconds)} remaining).`}
              </span>
            </div>
          </div>

          <div className="detail-progress-row"><span>YOUR PROGRESS</span><strong>{completionPct}%</strong></div>
          <ProgressBar value={completionPct} className="detail-progress" />
          <div className="course-detail-action">
            <span>{done}/{videos.length} videos complete</span>
            <div className="course-detail-actions">
              {nextVideo && (
                <Link href={`/watch/${id}/${nextVideo}`} className="detail-start-button">
                  {done === 0 ? "Start course" : done === videos.length ? "Review course" : "Continue learning"} <ArrowRightIcon size={14} className="inline-block ml-1" />
                </Link>
              )}
              <form action={removeCourse} className="detail-remove-form">
                <input type="hidden" name="courseId" value={id} />
                <button type="submit" className="detail-remove-button">Remove playlist</button>
              </form>
            </div>
          </div>

          {/* Course Utilities Toolbar */}
          <div className="course-utilities-toolbar">
            <CourseCertificate
              courseTitle={playlist.title}
              channelTitle={playlist.channel_title}
              userName={user.user_metadata?.display_name || user.email?.split("@")[0] || "Learner"}
              totalLessons={videos.length}
              isCompleted={done === videos.length && videos.length > 0}
            />
            <CourseNotesExport
              courseTitle={playlist.title}
              channelTitle={playlist.channel_title}
              notes={exportableNotes}
            />
            {playlist.youtube_playlist_id && (
              <SyncPlaylistButton youtubePlaylistId={playlist.youtube_playlist_id} />
            )}
          </div>
        </div>
      </section>

      <section className="video-list-section">
        <div className="video-list-heading">
          <div>
            <h2>Video lessons</h2>
          </div>
          <span>{videos.length} lessons</span>
        </div>
        <ol className="video-list">
          {videos.map((v, i) => (
            <li key={v.id} className="video-list-item">
              <div className="video-row">
                <Link href={`/watch/${id}/${v.id}`} className="video-row-link">
                  <span className="video-index">{String(i + 1).padStart(2, "0")}</span>
                  {v.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnail_url} alt="" className="video-thumbnail" loading="lazy" decoding="async" />
                  ) : (
                    <div className="video-thumbnail video-thumbnail-empty"><PlayIcon size={16} /></div>
                  )}
                  <div className="video-row-copy">
                    <p>{v.title}</p>
                    <span>{formatDuration(v.duration_seconds ?? 0)}{v.embeddable === false && " · Watch on YouTube"}</span>
                  </div>
                </Link>
                <div className="video-row-actions">
                  <CourseLessonScheduleButton
                    userId={user.id}
                    videoTitle={v.title}
                    courseTitle={playlist.title}
                    watchUrl={`/watch/${id}/${v.id}`}
                  />
                  <Link href={`/watch/${id}/${v.id}`} className={`video-status video-status-${v.status}`}>
                    {v.status === "completed"
                      ? "Complete"
                      : v.status === "in_progress"
                        ? "In progress"
                        : "Not started"}
                  </Link>
                  <Link href={`/watch/${id}/${v.id}`} className="video-row-arrow" aria-hidden="true">→</Link>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
