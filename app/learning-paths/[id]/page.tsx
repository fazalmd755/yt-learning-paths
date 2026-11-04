import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import LearningPathEditor, { type LearningPathVideo } from "@/components/LearningPathEditor";
import { createClient } from "@/lib/supabase/server";

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
  const { data: progress, error: progressError } = videoIds.length
    ? await supabase.from("video_progress").select("video_id, status").eq("user_id", user.id).in("video_id", videoIds)
    : { data: [], error: null };
  if (progressError) throw new Error(`Could not load learning progress: ${progressError.message}`);
  const statusByVideo = new Map((progress ?? []).map((item) => [item.video_id, item.status]));
  const videos = rawVideos.map((video) => ({
    ...video,
    status: statusByVideo.get(video.id) ?? "not_started",
  })) as LearningPathVideo[];
  const completed = videos.filter((video) => video.status === "completed").length;
  const totalSeconds = videos.reduce((sum, video) => sum + (video.duration_seconds ?? 0), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const duration = hours ? `${hours}h ${Math.floor((totalSeconds % 3600) / 60)}m` : `${Math.floor(totalSeconds / 60)}m`;

  return (
    <main className="course-page">
      <Link href="/syllabus/select" className="back-link"><span aria-hidden="true">←</span> My playlists</Link>
      <section className="learning-path-hero">
        <div className="eyebrow"><span className="eyebrow-dot" /> YOUR CUSTOM LEARNING PATH</div>
        <h1>{path.title}</h1>
        {path.description && <p>{path.description}</p>}
        <div className="learning-path-hero-stats">
          <span><strong>{videos.length}</strong> videos</span><i />
          <span><strong>{duration}</strong> total</span><i />
          <span><strong>{completed}</strong> complete</span>
        </div>
        {videos[0] && (
          <Link className="detail-start-button" href={`/learning-paths/${id}/watch/${videos.find((video) => video.status !== "completed")?.id ?? videos[0].id}`}>
            {completed ? "Continue learning" : "Start learning"} <span aria-hidden="true">→</span>
          </Link>
        )}
      </section>
      <LearningPathEditor pathId={id} initialTitle={path.title} videos={videos} />
    </main>
  );
}
