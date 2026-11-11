import Link from "next/link";
import { redirect } from "next/navigation";
import AddCourseForm from "@/components/AddCourseForm";
import CourseLibrary from "@/components/CourseLibrary";
import StreakCalendar from "@/components/StreakCalendar";
import AchievementsBadges from "@/components/AchievementsBadges";
import ProfileReminderBanner from "@/components/ProfileReminderBanner";
import { computeProfileCompletion } from "@/lib/profile";
import { ArrowRightIcon } from "@/components/Icons";
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
  const today = dateInTz(tz);

  // 6 months (180 days) for the LeetCode-style activity heatmap
  const dates = lastNDates(180, tz);

  const secondsByDate = new Map<string, number>();
  const activeDaysList: { activity_date: string; seconds_learned: number }[] = [];

  for (const a of (allActivity ?? []) as any[]) {
    secondsByDate.set(a.activity_date, a.seconds_learned);
    if (a.seconds_learned > 0) {
      activeDaysList.push(a);
    }
  }

  const days = dates.map((date) => ({ date, seconds: secondsByDate.get(date) ?? 0 }));
  const streak = Number(streakData ?? 0);
  const totalActiveDays = activeDaysList.length;
  const totalSecondsLearned = Array.from(secondsByDate.values()).reduce((a, b) => a + b, 0);

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

  const firstName = displayName.trim() ? displayName.trim().split(" ")[0] : "";

  return (
    <main className="dashboard-shell">
      {/* Sleek Compact Header */}
      <section className="dashboard-welcome-compact">
        <div className="welcome-compact-left">
          <span className="welcome-dot" />
          <h1 className="welcome-title">
            {firstName ? `Welcome back, ${firstName}` : "Study Workspace"}
          </h1>
          <span className="welcome-subtag">Focused Study</span>
        </div>
        <div className="welcome-compact-date">
          <span>
            {new Intl.DateTimeFormat("en", {
              weekday: "short",
              month: "short",
              day: "numeric",
              timeZone: tz,
            }).format(new Date())}
          </span>
        </div>
      </section>

      {/* Slim Profile Reminder Pill (only shows if profile < 100%) */}
      <ProfileReminderBanner
        percent={profileCompletion.percent}
        remainingLabels={profileCompletion.remainingSteps.map((s) => s.label)}
      />

      {/* Sleek Compact Resume Bar (if active lesson exists) */}
      {resume && resume.continueVideoId && (
        <section className="resume-compact-bar">
          <div className="resume-compact-left">
            <span className="resume-compact-badge">RESUME</span>
            <span className="resume-compact-title" title={resume.title}>
              {resume.title}
            </span>
            <span className="resume-compact-meta">
              ({resume.completedVideos}/{resume.totalVideos} videos
              {resume.channelTitle ? ` · ${resume.channelTitle}` : ""})
            </span>
          </div>
          <Link
            href={`/watch/${resume.id}/${resume.continueVideoId}`}
            className="resume-compact-btn"
          >
            <span>Continue</span>
            <ArrowRightIcon size={12} />
          </Link>
        </section>
      )}

      {/* LeetCode-style Consistency Heatmap (Placed prominently near top, not wide, no future days) */}
      <section id="consistency" className="mb-3.5">
        <StreakCalendar
          days={days}
          today={today}
          totalActiveDays={totalActiveDays}
          maxStreak={maxStreak}
          totalSecondsLearned={totalSecondsLearned}
        />
      </section>

      {/* Compact Quick-Add Bar */}
      <section className="add-course-bar-wrap">
        <AddCourseForm />
      </section>

      {/* Main Course Library */}
      <section id="courses" className="library-section">
        <div className="section-title-compact">
          <h2>
            Your Courses <span className="heading-count">{courses.length}</span>
          </h2>
          <span className="section-side-note">Click any course to resume learning</span>
        </div>
        <CourseLibrary courses={courses} initialQuery={search} />
      </section>

      {/* Gamification: Badges & Milestones (Compact Collapsible) */}
      <section className="mt-5 mb-5">
        <AchievementsBadges
          streak={streak}
          totalActiveDays={totalActiveDays}
          completedVideos={completedVideos}
          totalCourses={courses.length}
          finishedCourses={finishedCourses}
        />
      </section>
    </main>
  );
}
