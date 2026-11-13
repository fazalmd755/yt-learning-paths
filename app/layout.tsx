import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import SiteHeader from "@/components/SiteHeader";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import AnimatedBackground from "@/components/AnimatedBackground";
import { WatchlifyIcon } from "@/components/BrandLogo";
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
  return "https://watchlify.online";
}

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Watchlify — Turn YouTube Playlists into Structured Courses",
    template: "%s | Watchlify",
  },
  description:
    "Transform scattered YouTube playlists into organized, distraction-free learning paths. Track video progress, build daily streaks, take timestamped notes, and finish what you start.",
  applicationName: "Watchlify",
  authors: [{ name: "Watchlify", url: "https://watchlify.online" }],
  generator: "Next.js",
  keywords: [
    "watchlify",
    "watchlify.online",
    "youtube playlist to course",
    "youtube learning tracker",
    "distraction free youtube",
    "study tracker",
    "youtube course creator",
    "video notes",
    "timestamped notes",
    "study streak tracker",
    "youtube study planner",
    "free course organizer",
  ],
  creator: "Watchlify",
  publisher: "Watchlify",
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
    title: "Watchlify — Turn YouTube Playlists into Structured Courses",
    description:
      "Transform scattered YouTube playlists into organized learning paths. Zero clickbait, timestamped notes, daily streaks.",
    siteName: "Watchlify",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Watchlify - Turn YouTube Playlists into Structured Courses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Watchlify — Turn YouTube Playlists into Structured Courses",
    description:
      "Turn YouTube playlists into structured learning paths with progress tracking and daily streaks.",
    site: "@watchlify_",
    creator: "@watchlify_",
    images: ["/opengraph-image"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
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

  const avatarUrl = user
    ? [
        user.user_metadata?.avatar_url,
        user.user_metadata?.picture,
        user.identities?.[0]?.identity_data?.avatar_url,
        user.identities?.[0]?.identity_data?.picture,
      ].find((value): value is string => typeof value === "string" && value.trim().length > 0) ?? ""
    : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Watchlify",
        alternateName: ["Watchlify Online", "Watchlify App"],
        description:
          "Turn YouTube playlists into structured, distraction-free study courses with progress tracking, timestamped notes, and daily streaks.",
        inLanguage: "en",
        publisher: {
          "@type": "Organization",
          "@id": `${siteUrl}/#organization`,
          name: "Watchlify",
          url: siteUrl,
          logo: {
            "@type": "ImageObject",
            url: `${siteUrl}/icon.svg`,
          },
          sameAs: ["https://instagram.com/watchlify_"],
          contactPoint: {
            "@type": "ContactPoint",
            email: "contact.watchlify@gmail.com",
            contactType: "customer support",
          },
        },
      },
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#webapp`,
        name: "Watchlify",
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
          "Distraction-free video player (no shorts, no ads)",
          "Video progress tracking and bookmarking",
          "Daily study streak and consistency heatmap",
          "Timestamped rich video notes",
          "Weekly study planner and scheduling",
          "Curated Roadmaps and Collaborative Study Hubs",
        ],
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtm.js?id=GTM-P767SJF7"
          strategy="afterInteractive"
        />
        <Script id="google-gtm-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          `}
        </Script>
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
      <body className="min-h-screen antialiased relative overflow-x-hidden">
        <AnimatedBackground />
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand-link" aria-label="Watchlify Home">
              <WatchlifyIcon size={32} />
              <span className="brand-name">
                Watch<span className="text-gradient-brand">lify</span>
              </span>
            </Link>
            <nav className="site-nav">
              <div className="site-nav-links">
                {user ? <Link href="/dashboard">Dashboard</Link> : null}
                <Link href="/study-hubs">Study Hubs</Link>
                <Link href="/planner">Planner</Link>
              </div>
              {user && headerData ? (
                <SiteHeader
                  email={user.email ?? ""}
                  displayName={displayName}
                  avatarUrl={avatarUrl}
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

        {/* Mobile Bottom Navigation — only visible on small screens via CSS */}
        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          <Link href="/" className="mobile-bottom-nav-link" aria-label="Home">
            <span className="nav-icon" aria-hidden="true">🏠</span>
            <span>Home</span>
          </Link>
          {user ? (
            <Link href="/dashboard" className="mobile-bottom-nav-link" aria-label="Dashboard">
              <span className="nav-icon" aria-hidden="true">📊</span>
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link href="/login" className="mobile-bottom-nav-link" aria-label="Login">
              <span className="nav-icon" aria-hidden="true">🔑</span>
              <span>Login</span>
            </Link>
          )}
          <Link href="/study-hubs" className="mobile-bottom-nav-link" aria-label="Study Hubs">
            <span className="nav-icon" aria-hidden="true">👥</span>
            <span>Hubs</span>
          </Link>
          <Link href="/planner" className="mobile-bottom-nav-link" aria-label="Planner">
            <span className="nav-icon" aria-hidden="true">📅</span>
            <span>Planner</span>
          </Link>
          {user ? (
            <Link href="/settings" className="mobile-bottom-nav-link" aria-label="Settings">
              <span className="nav-icon" aria-hidden="true">⚙️</span>
              <span>Settings</span>
            </Link>
          ) : (
            <Link href="/roadmaps" className="mobile-bottom-nav-link" aria-label="Roadmaps">
              <span className="nav-icon" aria-hidden="true">🗺️</span>
              <span>Roadmaps</span>
            </Link>
          )}
        </nav>
      </body>
    </html>
  );
}
