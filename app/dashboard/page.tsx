import Link from "next/link";
import { redirect } from "next/navigation";
import AddCourseForm from "@/components/AddCourseForm";
import CourseLibrary from "@/components/CourseLibrary";
import ProgressBar from "@/components/ProgressBar";
import StreakCalendar from "@/components/StreakCalendar";
import CompactDailyGoal from "@/components/CompactDailyGoal";
import AchievementsBadges from "@/components/AchievementsBadges";
import ProfileReminderBanner from "@/components/ProfileReminderBanner";
import { computeProfileCompletion } from "@/lib/profile";
import {
  FlameIcon,
  TargetIcon,
  BookOpenIcon,
  PlayIcon,
  ArrowRightIcon,
} from "@/components/Icons";
import { getCourseSummaries } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { dateInTz, lastNDates } from "@/lib/utils";

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

  // Single parallel batch for all dashboard data - avoids database waterfalls
  const [{ data: profile }, courses, { data: allActivity }, { data: streakData }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("timezone, daily_goal_minutes, reminder_enabled")
        .eq("id", user.id)
        .maybeSingle(),
      getCourseSummaries(supabase, user.id),
      supabase
        .from("daily_activity")
        .select("activity_date, seconds_learned")
        .eq("user_id", user.id)
        .order("activity_date", { ascending: true }),
      supabase.rpc("current_streak"),
    ]);

  const tz = profile?.timezone ?? "Asia/Kolkata";
  const goalMinutes = profile?.daily_goal_minutes ?? 15;
  const goalSeconds = goalMinutes * 60;
  const today = dateInTz(tz);

  // 16 weeks (~3.5 months) for the contribution heatmap
  const dates = lastNDates(112, tz);

  const secondsByDate = new Map<string, number>();
  const activeDaysList: { activity_date: string; seconds_learned: number }[] = [];

  for (const a of (allActivity ?? []) as any[]) {
    secondsByDate.set(a.activity_date, a.seconds_learned);
    if (a.seconds_learned > 0) {
      activeDaysList.push(a);
    }
  }

  const days = dates.map((date) => ({ date, seconds: secondsByDate.get(date) ?? 0 }));
  const todaySeconds = secondsByDate.get(today) ?? 0;
  const streak = Number(streakData ?? 0);
  const totalActiveDays = activeDaysList.length;

  let calculatedMax = 0;
  if (activeDaysList.length > 0) {
    let curRun = 1;
    calculatedMax = 1;
    for (let i = 1; i < activeDaysList.length; i++) {
      const prev = new Date(activeDaysList[i - 1].activity_date).getTime();
      const curr = new Date(activeDaysList[i].activity_date).getTime();
      const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        curRun++;
        if (curRun > calculatedMax) calculatedMax = curRun;
      } else if (diff > 1) {
        curRun = 1;
      }
    }
  }
  const maxStreak = Math.max(calculatedMax, streak);

  const completedVideos = courses.reduce((total, course) => total + course.completedVideos, 0);
  const totalVideos = courses.reduce((total, course) => total + course.totalVideos, 0);
  const finishedCourses = courses.filter((c) => c.completedVideos === c.totalVideos && c.totalVideos > 0).length;

  const resume = [...courses]
    .filter((course) => course.continueVideoId && course.completedVideos < course.totalVideos)
    .sort((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""))[0];
  const goalPercent = goalSeconds ? Math.min(100, (todaySeconds / goalSeconds) * 100) : 0;

  const displayName = [user.user_metadata?.display_name, user.user_metadata?.full_name, user.user_metadata?.name]
    .find((value): value is string => typeof value === "string") ?? "";
  const avatarUrl = [user.user_metadata?.avatar_url, user.user_metadata?.picture]
    .find((value): value is string => typeof value === "string") ?? "";
  const learningFocus = (user.user_metadata?.learning_focus as string) ?? "";
  const collegeOrCompany = (user.user_metadata?.college_or_company as string) ?? "";
  const bio = (user.user_metadata?.bio as string) ?? "";

  const profileCompletion = computeProfileCompletion({
    displayName,
    avatarUrl,
    learningFocus,
    collegeOrCompany,
    bio,
    dailyGoalMinutes: goalMinutes,
  });

  return (
    <main className="dashboard-shell">
      <section className="dashboard-welcome">
        <div>
          <div className="dashboard-space-badge">
            <span className="dashboard-badge-dot" /> Study Workspace
          </div>
          <h1 className="dashboard-heading">
            Make today a <span className="text-gradient-brand">learning day</span>
          </h1>
          <p>Every focused session builds unstoppable momentum towards your goals.</p>
        </div>
        <div className="welcome-date">
          <span>TODAY</span>
          <strong>
            {new Intl.DateTimeFormat("en", {
              weekday: "long",
              month: "short",
              day: "numeric",
              timeZone: tz,
            }).format(new Date())}
          </strong>
        </div>
      </section>

      <ProfileReminderBanner
        percent={profileCompletion.percent}
        remainingLabels={profileCompletion.remainingSteps.map((s) => s.label)}
      />

      <section className="dashboard-overview">
        <article className="goal-card">
          <div className="overview-card-top">
            <span className="overview-icon goal-icon">
              <TargetIcon size={18} />
            </span>
            <span className="card-kicker">DAILY FOCUS</span>
          </div>
          <div className="goal-number">
            {Math.floor(todaySeconds / 60)}
            <span> / {goalMinutes} min</span>
          </div>
          <ProgressBar value={goalPercent} className="goal-progress" />
          <div className="goal-caption">
            <span>
              {todaySeconds >= goalSeconds
                ? "Daily goal reached! Outstanding work."
                : `${Math.max(0, goalMinutes - Math.floor(todaySeconds / 60))} min remaining today.`}
            </span>
            <strong>{Math.round(goalPercent)}%</strong>
          </div>
        </article>

        <article className="streak-card streak-card-fire">
          <div className="overview-card-top">
            <span className="overview-icon streak-icon streak-icon-fire">
              <FlameIcon size={18} />
            </span>
            <span className="card-kicker streak-kicker">CURRENT STREAK</span>
          </div>
          <div className="streak-number streak-number-fire">
            {streak}
            <span> days</span>
          </div>
          <p className="overview-caption">
            {streak > 0 ? "You're on fire! Keep the momentum going." : "Start your streak with a lesson today."}
          </p>
        </article>

        <article className="library-stat-card">
          <div className="overview-card-top">
            <span className="overview-icon library-icon">
              <BookOpenIcon size={18} />
            </span>
            <span className="card-kicker">MY LIBRARY</span>
          </div>
          <div className="library-stat-number">
            {courses.length}
            <span> courses</span>
          </div>
          <p className="overview-caption">
            {completedVideos} of {totalVideos} lessons completed
          </p>
        </article>
      </section>

      {resume && resume.continueVideoId && (
        <section className="resume-card">
          <div className="resume-art">
            <PlayIcon size={24} />
            <small>CURRENT LESSON</small>
          </div>
          <div className="resume-copy">
            <h2>{resume.title}</h2>
            <p>
              {resume.completedVideos} of {resume.totalVideos} lessons complete
              {resume.channelTitle ? ` · ${resume.channelTitle}` : ""}
            </p>
          </div>
          <Link href={`/watch/${resume.id}/${resume.continueVideoId}`} className="resume-button">
            Continue learning <ArrowRightIcon size={16} />
          </Link>
        </section>
      )}

      {/* Study Hubs Shortcut Banner */}
      <section className="study-hubs-banner-wrap">
        <Link href="/study-hubs" className="study-hubs-banner">
          <div className="banner-left">
            <span className="banner-icon">🎓</span>
            <div>
              <strong>Study Hubs (Semester & Class Bundles)</strong>
              <p>Group all your subjects & playlists into one unified screen. Switch between subjects with one click.</p>
            </div>
          </div>
          <span className="banner-cta">
            Open Study Hubs <ArrowRightIcon size={14} />
          </span>
        </Link>
      </section>

      <section className="add-course-section">
        <div className="section-title-row">
          <div>
            <h2>Start a new learning path</h2>
          </div>
          <span className="section-side-note">Paste any YouTube playlist or video link.</span>
        </div>
        <AddCourseForm />
      </section>

      <section id="courses" className="library-section">
        <div className="section-title-row">
          <div>
            <h2>
              Your courses <span className="heading-count">{courses.length}</span>
            </h2>
          </div>
          <span className="section-side-note">Learn at your own pace and track your mastery.</span>
        </div>
        <CourseLibrary courses={courses} initialQuery={search} />
      </section>

      {/* Gamification: Badges & Milestones */}
      <section className="mb-6">
        <AchievementsBadges
          streak={streak}
          totalActiveDays={totalActiveDays}
          completedVideos={completedVideos}
          totalCourses={courses.length}
          finishedCourses={finishedCourses}
        />
      </section>

      {/* Consistency Heatmap + Compact Daily Goal */}
      <section id="consistency" className="dashboard-lower">
        <div className="panel-card activity-panel flex-1">
          <div className="panel-heading">
            <div>
              <h2>Your consistency</h2>
            </div>
            <span className="panel-period">ACTIVITY HEATMAP</span>
          </div>
          <StreakCalendar
            days={days}
            goalSeconds={goalSeconds}
            today={today}
            totalActiveDays={totalActiveDays}
            maxStreak={maxStreak}
          />
        </div>

        <div className="panel-card daily-goal-panel">
          <CompactDailyGoal initialMinutes={goalMinutes} />
        </div>
      </section>
    </main>
  );
}
