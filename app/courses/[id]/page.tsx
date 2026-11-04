import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { removeCourse } from "@/app/dashboard/actions";
import ProgressBar from "@/components/ProgressBar";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/utils";

const one = <T,>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: courseRow } = await supabase
    .from("user_courses")
    .select("id, last_video_id, playlist:playlists(id, title, channel_title, thumbnail_url)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
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
  const { data: progress } = videoIds.length
    ? await supabase
        .from("video_progress")
        .select("video_id, status, last_position")
        .eq("user_id", user.id)
        .in("video_id", videoIds)
        .limit(10000)
    : { data: [] };

  const statusByVideo = new Map<string, string>();
  for (const p of (progress ?? []) as any[]) statusByVideo.set(p.video_id, p.status);

  const videos = ((links ?? []) as any[])
    .map((l) => ({ ...one<any>(l.video), status: statusByVideo.get(l.video_id) ?? "not_started" }))
    .filter((v) => v.id);

  const done = videos.filter((v) => v.status === "completed").length;
  const totalSeconds = videos.reduce((s, v) => s + (v.duration_seconds ?? 0), 0);
  const lastId = (courseRow as any).last_video_id as string | null;
  const lastPending = lastId && statusByVideo.get(lastId) !== "completed" ? lastId : null;
  const nextVideo = lastPending ?? videos.find((v) => v.status !== "completed")?.id ?? videos[0]?.id;

  return (
    <main className="course-page">
      <Link href="/dashboard" className="back-link"><span aria-hidden="true">←</span> My learning</Link>
      <section className="course-detail-hero">
        <div className="course-detail-art">
          {playlist.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={playlist.thumbnail_url} alt="" />
          ) : <span aria-hidden="true">✳</span>}
          <div className="course-detail-art-shade" />
          <span className="course-detail-art-label">YOUR LEARNING PATH</span>
        </div>
        <div className="course-detail-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> COURSE OVERVIEW</div>
          <h1>{playlist.title}</h1>
          <p>{playlist.channel_title || "YouTube course"}</p>
          <div className="course-detail-stats"><span><strong>{videos.length}</strong> videos</span><i /><span><strong>{formatDuration(totalSeconds)}</strong> total</span><i /><span><strong>{done}</strong> complete</span></div>
          <div className="detail-progress-row"><span>YOUR PROGRESS</span><strong>{videos.length ? Math.round((done / videos.length) * 100) : 0}%</strong></div>
          <ProgressBar value={videos.length ? (done / videos.length) * 100 : 0} className="detail-progress" />
          <div className="course-detail-action">
            <span>{done}/{videos.length} videos complete</span>
            <div className="course-detail-actions">
              {nextVideo && (
                <Link href={`/watch/${id}/${nextVideo}`} className="detail-start-button">
                  {done === 0 ? "Start course" : done === videos.length ? "Review course" : "Continue learning"} <span aria-hidden="true">→</span>
                </Link>
              )}
              <form action={removeCourse} className="detail-remove-form">
                <input type="hidden" name="courseId" value={id} />
                <button type="submit" className="detail-remove-button">Remove playlist</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="video-list-section">
        <div className="video-list-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> THE COURSE</div><h2>Video lessons</h2></div><span>{videos.length} lessons</span></div>
      <ol className="video-list">
        {videos.map((v, i) => (
          <li key={v.id} className="video-list-item">
            <Link href={`/watch/${id}/${v.id}`} className="video-row">
              <span className="video-index">{String(i + 1).padStart(2, "0")}</span>
              {v.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumbnail_url} alt="" className="video-thumbnail" loading="lazy" decoding="async" />
              ) : (
                <div className="video-thumbnail video-thumbnail-empty"><span>▶</span></div>
              )}
              <div className="video-row-copy">
                <p>{v.title}</p>
                <span>{formatDuration(v.duration_seconds ?? 0)}{v.embeddable === false && " · Watch on YouTube"}</span>
              </div>
              <span className={`video-status video-status-${v.status}`}>
                {v.status === "completed"
                  ? "Complete"
                  : v.status === "in_progress"
                    ? "In progress"
                    : "Not started"}
              </span>
              <span className="video-row-arrow" aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ol>
      </section>
    </main>
  );
}
