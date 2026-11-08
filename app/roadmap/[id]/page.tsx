import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTrackByIdOrSlug } from "@/lib/roadmaps";
import { getOrFetchPlaylistWithCache } from "@/lib/youtube-cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import RoadmapPublicClient, {
  type RoadmapLesson,
  type RoadmapModule,
} from "./RoadmapPublicClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const curated = getTrackByIdOrSlug(id);

  let title = "Curated Roadmap";
  let creator = "Watchlify Community";
  let lessonCount = 40;
  let duration = "20h";
  let description =
    "Distraction-free learning roadmap with complete syllabus view, timestamped notes, and daily progress tracking on Watchlify.";

  if (curated) {
    title = curated.title;
    creator = curated.creator;
    lessonCount = curated.lessonCount;
    duration = curated.estimatedHours;
    description = curated.description;
  } else {
    try {
      const admin = createAdminClient();
      const { data: pl } = await admin
        .from("playlists")
        .select("title, channel_title, id")
        .or(`youtube_playlist_id.eq.${id},id.eq.${id}`)
        .maybeSingle();

      if (pl) {
        title = pl.title;
        creator = pl.channel_title || "YouTube";
      }
    } catch {
      // fallback
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://watchlify.app";
  const canonicalUrl = `${siteUrl}/roadmap/${id}`;

  return {
    title: `${title} — Distraction-Free Study Roadmap`,
    description: `Study "${title}" by ${creator} on Watchlify without ads or algorithmic distractions. ${lessonCount} lessons (${duration} total).`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} (${duration}) | Watchlify Roadmap`,
      description,
      url: canonicalUrl,
      siteName: "Watchlify",
      type: "article",
      images: [
        {
          url: `${canonicalUrl}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${title} Roadmap on Watchlify`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Watchlify Study Roadmap`,
      description,
      images: [`${canonicalUrl}/opengraph-image`],
    },
  };
}

export default async function RoadmapPublicPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const curated = getTrackByIdOrSlug(id);

  let title = "Learning Roadmap";
  let creator = "Watchlify Community";
  let description =
    "Follow this structured roadmap step-by-step. All lessons are distraction-free with zero sidebars or recommendation rabbit holes.";
  let level = "All Levels";
  let estimatedHours = "20h";
  let tags: string[] = [];
  let lessons: RoadmapLesson[] = [];
  let modules: RoadmapModule[] | undefined = undefined;

  if (curated) {
    title = curated.title;
    creator = curated.creator;
    description = curated.description;
    level = curated.level;
    estimatedHours = curated.estimatedHours;
    tags = curated.tags;
    modules = curated.modules;

    // Fetch or read from cache for video list
    try {
      const plData = await getOrFetchPlaylistWithCache(curated.playlistUrl);
      lessons = plData.videos.map((v) => ({
        id: v.id,
        youtubeVideoId: v.youtubeVideoId,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        durationSeconds: v.durationSeconds,
        position: v.position,
      }));
    } catch {
      // Mock / fallback if offline or no key
      lessons = (curated.modules || []).flatMap((mod, mIdx) =>
        mod.lessons.map((l, lIdx) => ({
          id: `mod-${mIdx}-${lIdx}`,
          youtubeVideoId: "dQw4w9WgXcQ",
          title: l,
          thumbnailUrl: null,
          durationSeconds: 1200,
          position: mIdx * 10 + lIdx,
        }))
      );
    }
  } else {
    // Check if it's a playlist or database course
    try {
      const plData = await getOrFetchPlaylistWithCache(id);
      title = plData.title;
      creator = plData.channelTitle || "YouTube Creator";
      description = `Complete syllabus for ${plData.title}. Track each lesson, take notes, and finish without algorithmic distractions.`;
      const totalSec = plData.videos.reduce((acc, v) => acc + (v.durationSeconds || 0), 0);
      const hours = Math.floor(totalSec / 3600);
      estimatedHours = hours > 0 ? `${hours}h ${Math.floor((totalSec % 3600) / 60)}m` : "Self-paced";
      lessons = plData.videos.map((v) => ({
        id: v.id,
        youtubeVideoId: v.youtubeVideoId,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        durationSeconds: v.durationSeconds,
        position: v.position,
      }));
    } catch {
      // Try checking public user_learning_paths
      const admin = createAdminClient();
      const { data: path } = await admin
        .from("user_learning_paths")
        .select("id, title, description")
        .eq("id", id)
        .maybeSingle();

      if (!path) notFound();

      title = path.title;
      description = path.description || "Community curated learning path on Watchlify.";
      creator = "Community Curator";

      const { data: links } = await admin
        .from("user_learning_path_videos")
        .select("position, video:videos(id, youtube_video_id, title, thumbnail_url, duration_seconds)")
        .eq("path_id", path.id)
        .order("position", { ascending: true });

      lessons = (links ?? []).map((l: any) => {
        const v = Array.isArray(l.video) ? l.video[0] : l.video;
        return {
          id: v.id,
          youtubeVideoId: v.youtube_video_id,
          title: v.title,
          thumbnailUrl: v.thumbnail_url,
          durationSeconds: v.duration_seconds || 0,
          position: l.position,
        };
      });
      const totalSec = lessons.reduce((acc, v) => acc + v.durationSeconds, 0);
      const hours = Math.floor(totalSec / 3600);
      estimatedHours = `${hours}h`;
    }
  }

  return (
    <main className="min-h-screen bg-transparent text-zinc-100">
      <RoadmapPublicClient
        roadmapId={id}
        title={title}
        creator={creator}
        description={description}
        level={level}
        estimatedHours={estimatedHours}
        tags={tags}
        lessons={lessons}
        modules={modules}
        isAuthenticated={Boolean(user)}
      />
    </main>
  );
}
