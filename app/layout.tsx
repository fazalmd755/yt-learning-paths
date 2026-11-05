import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import { dateInTz } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  title: "Watchify | Study with intention",
  description: "Watchify turns YouTube playlists into learning paths with progress tracking, study planning and timestamped notes.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let headerData: {
    streak: number;
    goalMinutes: number;
    todayMinutes: number;
    remindersEnabled: boolean;
  } | null = null;

  if (user) {
    const [{ data: profile }, { data: streakData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("timezone, daily_goal_minutes, reminder_enabled")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.rpc("current_streak"),
    ]);
    const timezone = profile?.timezone ?? "Asia/Kolkata";
    const { data: activity } = await supabase
      .from("daily_activity")
      .select("seconds_learned")
      .eq("user_id", user.id)
      .eq("activity_date", dateInTz(timezone))
      .maybeSingle();

    headerData = {
      streak: Number(streakData ?? 0),
      goalMinutes: profile?.daily_goal_minutes ?? 15,
      todayMinutes: Math.floor((activity?.seconds_learned ?? 0) / 60),
      remindersEnabled: profile?.reminder_enabled ?? true,
    };
  }
  const displayName = user
    ? [user.user_metadata?.display_name, user.user_metadata?.full_name, user.user_metadata?.name]
        .find((value): value is string => typeof value === "string") ?? ""
    : "";

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand-link">
              <span className="brand-mark">W</span>
              <span>Watchify</span>
            </Link>
            <nav className="site-nav">
              <div className="site-nav-links">
                <Link href="/syllabus/select">My playlists</Link>
                <Link href="/planner">Planner</Link>
              </div>
              {user && headerData ? (
                <SiteHeader
                  email={user.email ?? ""}
                  displayName={displayName}
                  streak={headerData.streak}
                  goalMinutes={headerData.goalMinutes}
                  todayMinutes={headerData.todayMinutes}
                  remindersEnabled={headerData.remindersEnabled}
                />
              ) : (
                <Link href="/login" className="nav-login">
                  Login <span aria-hidden="true">↗</span>
                </Link>
              )}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
