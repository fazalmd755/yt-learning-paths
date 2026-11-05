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

  return (
    <main className="settings-page-shell">
      <header className="settings-page-heading">

        <h1>Profile settings</h1>
        <p>Manage your account details, learning goals and security.</p>
      </header>
      <ProfileSettingsForms
        email={user.email ?? ""}
        displayName={displayName}
        dailyGoalMinutes={profile?.daily_goal_minutes ?? 15}
        reminderEnabled={profile?.reminder_enabled ?? true}
      />
    </main>
  );
}
