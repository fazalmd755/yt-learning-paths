import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import { createClient } from "@/lib/supabase/server";
import { dateInTz } from "@/lib/utils";
import "./globals.css";

function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://watchify.app";
}

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Watchify — Turn YouTube Playlists into Structured Courses",
    template: "%s | Watchify",
  },
  description:
    "Transform scattered YouTube playlists into organized learning paths. Track video progress, build daily streaks, take timestamped notes, and finish what you start.",
  applicationName: "Watchify",
  authors: [{ name: "Watchify" }],
  generator: "Next.js",
  keywords: [
    "youtube learning",
    "course tracker",
    "playlist to course",
    "study tracker",
    "learning paths",
    "video notes",
    "youtube study planner",
    "study streak",
    "habit tracker",
    "online course",
  ],
  creator: "Watchify",
  publisher: "Watchify",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "Watchify — Turn YouTube Playlists into Structured Courses",
    description:
      "Transform scattered YouTube playlists into organized learning paths. Track video progress, build daily streaks, take timestamped notes, and finish what you start.",
    siteName: "Watchify",
  },
  twitter: {
    card: "summary_large_image",
    title: "Watchify — Turn YouTube Playlists into Structured Courses",
    description:
      "Turn YouTube playlists into structured learning paths with progress tracking and daily streaks.",
    creator: "@watchify",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let user: any = null;
  let headerData: {
    streak: number;
    goalMinutes: number;
    todayMinutes: number;
    remindersEnabled: boolean;
  } | null = null;

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      user = authUser;

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
        const todayDate = dateInTz(timezone);

        const { data: activity } = await supabase
          .from("daily_activity")
          .select("seconds_learned")
          .eq("user_id", user.id)
          .eq("activity_date", todayDate)
          .maybeSingle();

        headerData = {
          streak: Number(streakData ?? 0),
          goalMinutes: profile?.daily_goal_minutes ?? 15,
          todayMinutes: Math.floor((activity?.seconds_learned ?? 0) / 60),
          remindersEnabled: profile?.reminder_enabled ?? true,
        };
      }
    }
  } catch (err) {
    console.error("RootLayout auth/profile load error:", err);
  }

  const displayName = user
    ? [user.user_metadata?.display_name, user.user_metadata?.full_name, user.user_metadata?.name]
        .find((value): value is string => typeof value === "string") ?? ""
    : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Watchify",
    url: siteUrl,
    applicationCategory: "EducationalApplication",
    operatingSystem: "All",
    description:
      "Turn YouTube playlists and videos into structured courses with progress tracking, timestamped notes, and daily study streaks.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "YouTube playlist to course conversion",
      "Video progress tracking and bookmarking",
      "Daily study streak and consistency heatmap",
      "Timestamped rich video notes",
      "Weekly study planner and scheduling",
    ],
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand-link">
              <span className="brand-mark">W</span>
              <span className="brand-name">Watchify</span>
            </Link>
            <nav className="site-nav">
              <div className="site-nav-links">
                <Link href="/roadmaps">Roadmaps</Link>
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
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
