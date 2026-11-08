"use client";

import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon, PlayIcon, SparklesIcon } from "./Icons";
import { CURATED_TRACKS } from "@/lib/roadmaps";

export default function FeaturedRoadmaps() {
  // Select the 4 core requested tracks
  const topTracks = CURATED_TRACKS.filter((t) =>
    ["dsa-sheet", "fullstack-webdev", "core-cs-fundamentals", "gate-interview-revision"].includes(
      t.id
    )
  );

  return (
    <section className="featured-roadmaps-section my-16 px-4 max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#CEF432]/10 border border-[#CEF432]/30 px-3 py-1 text-xs font-semibold text-[#CEF432] mb-3">
          <SparklesIcon size={12} />
          <span>CURATED COMMUNITY ROADMAPS</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Jump straight into top community roadmaps
        </h2>
        <p className="mt-2 text-sm text-zinc-400 max-w-xl mx-auto">
          Hand-crafted tech and academic tracks with zero algorithm traps. Start immediately in guest mode or clone to your personal workspace.
        </p>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {topTracks.map((track) => (
          <article
            key={track.id}
            className="group relative rounded-2xl border border-white/10 bg-[#0e1017]/70 p-6 backdrop-blur-sm hover:border-[#CEF432]/40 hover:bg-[#0e1017]/95 transition-all duration-300 flex flex-col justify-between shadow-xl"
          >
            <div>
              {/* Badges & Meta */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="rounded-full bg-[#CEF432]/15 border border-[#CEF432]/30 px-2.5 py-0.5 text-[11px] font-semibold text-[#CEF432]">
                  {track.level}
                </span>
                <span className="text-xs font-medium text-zinc-400">
                  {track.lessonCount} videos · <strong className="text-zinc-200">{track.estimatedHours}</strong>
                </span>
              </div>

              {/* Title & Creator */}
              <h3 className="text-lg font-bold text-white group-hover:text-[#CEF432] transition-colors line-clamp-1">
                {track.title}
              </h3>
              <p className="mt-1 text-xs text-zinc-400 font-medium">
                Curated syllabus by <span className="text-zinc-300">{track.creator}</span>
              </p>

              {/* Description */}
              <p className="mt-3 text-xs text-zinc-400 leading-relaxed line-clamp-2">
                {track.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {track.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-[#141720] px-2 py-0.5 text-[10px] text-zinc-400 border border-white/5"
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#CEF432] hover:bg-[#dbfa50] text-[#08080C] px-4 py-2 text-xs font-bold transition shadow-md shadow-[#CEF432]/20 group-hover:scale-105"
              >
                <PlayIcon size={12} />
                <span>Start Track</span>
                <ArrowRightIcon size={12} />
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* Explore more roadmaps footer link */}
      <div className="text-center mt-8">
        <Link
          href="/roadmaps"
          className="inline-flex items-center gap-1.5 text-xs text-[#CEF432] hover:underline font-semibold underline-offset-4 transition"
        >
          <span>Explore all 10+ community curated paths & playlists</span>
          <ArrowRightIcon size={12} />
        </Link>
      </div>
    </section>
  );
}
