import { redirect } from "next/navigation";
import ProfileSettingsForms from "@/components/ProfileSettingsForms";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("daily_goal_minutes, reminder_enabled")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Could not load profile settings: ${error.message}`);

  const displayName = [user.user_metadata?.display_name, user.user_metadata?.full_name, user.user_metadata?.name]
    .find((value): value is string => typeof value === "string") ?? "";

  const avatarUrl = [user.user_metadata?.avatar_url, user.user_metadata?.picture]
    .find((value): value is string => typeof value === "string") ?? "";

  const learningFocus = (user.user_metadata?.learning_focus as string) ?? "";
  const collegeOrCompany = (user.user_metadata?.college_or_company as string) ?? "";
  const bio = (user.user_metadata?.bio as string) ?? "";

  return (
    <main className="settings-page-shell">
      <header className="settings-page-heading">
        <div className="eyebrow"><span className="eyebrow-dot" /> PROFILE & PREFERENCES</div>
        <h1>Account & Profile Settings</h1>
        <p>Complete your profile from 0% to 100% to personalize your playlists, streaks, and study roadmap.</p>
      </header>
      <ProfileSettingsForms
        email={user.email ?? ""}
        displayName={displayName}
        avatarUrl={avatarUrl}
        learningFocus={learningFocus}
        collegeOrCompany={collegeOrCompany}
        bio={bio}
        dailyGoalMinutes={profile?.daily_goal_minutes ?? 15}
        reminderEnabled={profile?.reminder_enabled ?? true}
      />
    </main>
  );
}
