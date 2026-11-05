import Link from "next/link";
import { redirect } from "next/navigation";
import StudyPlanner from "@/components/StudyPlanner";
import { getCourseSummaries } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { dateInTz } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlannerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).maybeSingle();
  const today = dateInTz(profile?.timezone ?? "Asia/Kolkata");
  const year = Number(today.slice(0, 4));
  const firstLoadedDate = `${year - 1}-01-01`;
  const lastLoadedDate = `${year + 1}-12-31`;
  const [tasksResult, courses] = await Promise.all([
    supabase.from("study_tasks")
      .select("id, title, details, subject, task_date, start_time, is_completed")
      .eq("user_id", user.id)
      .gte("task_date", firstLoadedDate)
      .lte("task_date", lastLoadedDate)
      .order("start_time", { ascending: true }),
    getCourseSummaries(supabase, user.id),
  ]);
  if (tasksResult.error) throw new Error(`Could not load study tasks: ${tasksResult.error.message}`);

  return (
    <main className="product-shell">
      <section className="product-page-heading">
        <div><div className="eyebrow"><span className="eyebrow-dot" /> YOUR WEEK, AT YOUR PACE</div><h1>Study planner</h1><p>Build a simple plan, make room for breaks, and keep your learning moving.</p></div>
        <Link className="quiet-link" href="/syllabus/select">Browse my playlists <span aria-hidden="true">↗</span></Link>
      </section>
      <StudyPlanner userId={user.id} today={today} initialTasks={tasksResult.data ?? []} courses={courses} />
    </main>
  );
}
