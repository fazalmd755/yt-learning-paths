import Link from "next/link";
import { redirect } from "next/navigation";
import AddCourseForm from "@/components/AddCourseForm";
import CourseLibrary from "@/components/CourseLibrary";
import ProgressBar from "@/components/ProgressBar";
import StreakCalendar from "@/components/StreakCalendar";
import { getCourseSummaries } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { dateInTz, lastNDates } from "@/lib/utils";
import { updateSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search = "" } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, daily_goal_minutes, reminder_enabled")
    .eq("id", user.id)
    .maybeSingle();

  const tz = profile?.timezone ?? "Asia/Kolkata";
  const goalMinutes = profile?.daily_goal_minutes ?? 15;
  const goalSeconds = goalMinutes * 60;
  const today = dateInTz(tz);
  const dates = lastNDates(35, tz);

  const [courses, { data: activity }, { data: streakData }] = await Promise.all([
    getCourseSummaries(supabase, user.id),
    supabase
      .from("daily_activity")
      .select("activity_date, seconds_learned")
      .eq("user_id", user.id)
      .gte("activity_date", dates[0]),
    supabase.rpc("current_streak"),
  ]);

  const secondsByDate = new Map<string, number>();
  for (const a of (activity ?? []) as any[]) secondsByDate.set(a.activity_date, a.seconds_learned);
  const days = dates.map((date) => ({ date, seconds: secondsByDate.get(date) ?? 0 }));
  const todaySeconds = secondsByDate.get(today) ?? 0;
  const streak = Number(streakData ?? 0);
  const completedVideos = courses.reduce((total, course) => total + course.completedVideos, 0);
  const totalVideos = courses.reduce((total, course) => total + course.totalVideos, 0);

  const resume = [...courses]
    .filter((course) => course.continueVideoId && course.completedVideos < course.totalVideos)
    .sort((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""))[0];
  const goalPercent = goalSeconds ? Math.min(100, (todaySeconds / goalSeconds) * 100) : 0;

  return (
    <main className="dashboard-shell">
      <section className="dashboard-welcome">
        <div>
          <div className="eyebrow"><span className="eyebrow-dot" /> YOUR LEARNING SPACE</div>
          <h1>Let’s make <span>today a learning day.</span></h1>
          <p>Every small step brings you closer to your learning goals.</p>
        </div>
        <div className="welcome-date"><span>TODAY</span><strong>{new Intl.DateTimeFormat("en", { weekday: "long", month: "short", day: "numeric", timeZone: tz }).format(new Date())}</strong></div>
      </section>

      <section className="dashboard-overview">
        <article className="goal-card">
          <div className="overview-card-top"><span className="overview-icon goal-icon">✦</span><span className="card-kicker">DAILY FOCUS</span><span className="card-more">↗</span></div>
          <div className="goal-number">{Math.floor(todaySeconds / 60)}<span> / {goalMinutes} min</span></div>
          <ProgressBar value={goalPercent} className="goal-progress" />
          <div className="goal-caption"><span>{todaySeconds >= goalSeconds ? "Daily goal reached. Nice work!" : "A little more to reach your goal."}</span><strong>{Math.round(goalPercent)}%</strong></div>
        </article>
        <article className="streak-card">
          <div className="overview-card-top"><span className="overview-icon streak-icon">↗</span><span className="card-kicker">CURRENT STREAK</span><span className="card-more">✳</span></div>
          <div className="streak-number">{streak}<span> days</span></div>
          <p className="overview-caption">{streak ? "Consistency is your superpower." : "Start your streak today."}</p>
        </article>
        <article className="library-stat-card">
          <div className="overview-card-top"><span className="overview-icon library-icon">▤</span><span className="card-kicker">YOUR LIBRARY</span></div>
          <div className="library-stat-number">{courses.length}<span> courses</span></div>
          <p className="overview-caption">{completedVideos} of {totalVideos} videos complete</p>
          <div className="stat-decoration" aria-hidden="true">✳</div>
        </article>
      </section>

      {resume && resume.continueVideoId && (
        <section className="resume-card">
          <div className="resume-art"><span>▶</span><small>PICK UP WHERE YOU LEFT OFF</small></div>
          <div className="resume-copy"><span className="card-kicker">CONTINUE LEARNING</span><h2>{resume.title}</h2><p>{resume.completedVideos} of {resume.totalVideos} videos complete{resume.channelTitle ? ` · ${resume.channelTitle}` : ""}</p></div>
          <Link href={`/watch/${resume.id}/${resume.continueVideoId}`} className="resume-button">Continue <span aria-hidden="true">→</span></Link>
        </section>
      )}

      <section className="add-course-section">
        <div className="section-title-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> GROW YOUR SKILLS</div><h2>Start a new learning path</h2></div><span className="section-side-note">Paste a playlist link and we’ll take it from there.</span></div>
        <AddCourseForm />
      </section>

      <section id="courses" className="library-section">
        <div className="section-title-row"><div><div className="eyebrow"><span className="eyebrow-dot" /> YOUR COLLECTION</div><h2>Your courses <span className="heading-count">{courses.length}</span></h2></div><span className="section-side-note">Learn at your own pace and keep track of your progress.</span></div>
        <CourseLibrary courses={courses} initialQuery={search} />
      </section>

      <section id="settings" className="dashboard-lower">
        <div className="panel-card activity-panel">
          <div className="panel-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> SHOW UP, EVERY DAY</div><h2>Your consistency</h2></div><span className="panel-period">LAST 5 WEEKS</span></div>
          <StreakCalendar days={days} goalSeconds={goalSeconds} today={today} />
        </div>

        <form action={updateSettings} className="panel-card settings-panel">
          <div className="panel-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> MAKE IT YOURS</div><h2>Learning settings</h2></div><span className="settings-symbol" aria-hidden="true">⚙</span></div>
          <label className="settings-field">
            <span>Daily goal <small>Minutes you want to learn each day</small></span>
            <span className="input-suffix"><input name="daily_goal_minutes" type="number" min={1} max={600} defaultValue={goalMinutes} /><small>min</small></span>
          </label>
          <label className="settings-field">
            <span>Timezone <small>Used for your streak and reminders</small></span>
            <input name="timezone" defaultValue={tz} placeholder="Asia/Kolkata" />
          </label>
          <label className="reminder-setting">
            <input name="reminder_enabled" type="checkbox" defaultChecked={profile?.reminder_enabled ?? true} />
            <span className="custom-check" aria-hidden="true">✓</span>
            <span>Email reminder<small>Remind me when I miss my daily goal</small></span>
          </label>
          <button className="settings-save">Save preferences <span aria-hidden="true">→</span></button>
        </form>
      </section>
    </main>
  );
}
