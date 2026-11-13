import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon, PlayIcon, SparklesIcon } from "@/components/Icons";
import { CURATED_TRACKS } from "@/lib/roadmaps";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Curated Roadmaps — Watchlify",
  description:
    "Explore community-curated learning roadmaps with complete syllabi, structured lesson sequences, and zero distractions.",
  alternates: {
    canonical: "/roadmaps",
  },
};

export default function RoadmapsPage() {
  return (
    <main className="min-h-screen pt-12 pb-20 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400 mb-3">
          <SparklesIcon size={12} />
          <span>CURATED ROADMAPS</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Hand-crafted learning roadmaps
        </h1>
        <p className="mt-3 text-sm md:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Structured tech, engineering, and academic syllabi built from the best free YouTube content.
          Zero algorithmic recommendations, zero clickbait.
        </p>
      </div>

      {/* Grid of all tracks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {CURATED_TRACKS.map((track) => (
          <article
            key={track.id}
            className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl hover:border-emerald-500/50 hover:bg-white/[0.08] transition-all duration-300 flex flex-col justify-between shadow-xl"
          >
            <div>
              {/* Badges & Meta */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  {track.level}
                </span>
                <span className="text-xs font-medium text-zinc-400">
                  {track.lessonCount} videos · <strong className="text-zinc-200">{track.estimatedHours}</strong>
                </span>
              </div>

              {/* Title & Creator */}
              <h2 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                {track.title}
              </h2>
              <p className="mt-1 text-xs text-zinc-400 font-medium">
                Curated syllabus by <span className="text-zinc-300">{track.creator}</span>
              </p>

              {/* Description */}
              <p className="mt-3 text-xs text-zinc-400 leading-relaxed line-clamp-2">
                {track.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {track.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] text-zinc-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <Link
                href={`/roadmap/${track.id}`}
                className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 transition"
              >
                <BookOpenIcon size={14} />
                <span>View Full Syllabus</span>
              </Link>

              <Link
                href={`/roadmap/${track.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 text-xs font-bold transition shadow-md shadow-emerald-500/10 group-hover:scale-105"
              >
                <PlayIcon size={12} />
                <span>Start Track</span>
                <ArrowRightIcon size={12} />
              </Link>
            </div>
          </article>
        ))}
      </div>

      <SiteFooter />
    </main>
  );
}
