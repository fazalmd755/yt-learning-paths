import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AddCourseForm from "@/components/AddCourseForm";
import CourseLibrary from "@/components/CourseLibrary";
import { BookOpenIcon, CheckCircleIcon, PlayIcon } from "@/components/Icons";
import LearningPathLibrary from "@/components/LearningPathLibrary";
import { getCourseSummaries } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My Playlists & Learning Paths",
  description:
    "Browse and manage your YouTube playlists, organized courses, and custom learning paths.",
  alternates: {
    canonical: "/syllabus/select",
  },
};

export const dynamic = "force-dynamic";

export default async function PlaylistLibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const courses = await getCourseSummaries(supabase, user.id);
  const { data: pathRows, error: pathsError } = await supabase.from("user_learning_paths")
    .select("id, title, description, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (pathsError) throw new Error(`Could not load learning paths: ${pathsError.message}`);

  const pathIds = (pathRows ?? []).map((path) => path.id);
  const { data: pathVideoRows, error: pathVideosError } = pathIds.length
    ? await supabase.from("user_learning_path_videos").select("path_id").in("path_id", pathIds)
    : { data: [], error: null };
  if (pathVideosError) throw new Error(`Could not load learning path videos: ${pathVideosError.message}`);
  const pathVideoCounts = new Map<string, number>();
  for (const row of pathVideoRows ?? []) pathVideoCounts.set(row.path_id, (pathVideoCounts.get(row.path_id) ?? 0) + 1);
  const learningPaths = (pathRows ?? []).map((path) => ({ ...path, videoCount: pathVideoCounts.get(path.id) ?? 0 }));

  const videoCount = courses.reduce((total, course) => total + course.totalVideos, 0);

  return (
    <main className="dashboard-shell">
      <section className="dashboard-welcome">
        <div>
          <h1>Your <span>playlists.</span></h1>
          <p>Every YouTube playlist you add, together in one place.</p>
        </div>
        <Link className="quiet-link" href="/dashboard">Back to dashboard <span aria-hidden="true">↗</span></Link>
      </section>

      <section className="dashboard-overview playlist-overview">
        <article className="library-stat-card">
          <div className="overview-card-top"><span className="overview-icon library-icon"><BookOpenIcon size={16} /></span><span className="card-kicker">YOUR PLAYLISTS</span></div>
          <div className="library-stat-number">{courses.length}<span> playlists</span></div>
        </article>
        <article className="streak-card playlist-stat-card">
          <div className="overview-card-top"><PlayIcon size={14} /><span className="card-kicker">LESSONS TO LEARN</span></div>
          <div className="streak-number">{videoCount}<span> videos</span></div>
        </article>
        <article className="goal-card playlist-stat-card">
          <div className="overview-card-top"><CheckCircleIcon size={16} /><span className="card-kicker">COMPLETED LESSONS</span></div>
          <div className="goal-number">{courses.reduce((total, course) => total + course.completedVideos, 0)}<span> videos</span></div>
        </article>
      </section>

      <section className="add-course-section">
        <div className="section-title-row"><div><h2>Add a playlist</h2></div><span className="section-side-note">Paste a public YouTube playlist or video link.</span></div>
        <AddCourseForm />
      </section>

      <section className="learning-paths-section">
        <div className="section-title-row"><div><h2>Create a learning path</h2></div><span className="section-side-note">Combine individual YouTube videos in your own order.</span></div>
        <LearningPathLibrary paths={learningPaths} />
      </section>

      <section id="courses" className="library-section">
        <div className="section-title-row"><div><h2>All playlists <span className="heading-count">{courses.length}</span></h2></div><span className="section-side-note">Continue a lesson or check your progress.</span></div>
        <CourseLibrary courses={courses} />
      </section>
    </main>
  );
}
