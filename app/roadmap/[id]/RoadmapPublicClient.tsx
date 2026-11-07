"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlayIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  BookOpenIcon,
  TargetIcon,
} from "@/components/Icons";
import ShareRoadmapButton from "@/components/ShareRoadmapButton";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { signInWithGoogle } from "@/app/login/actions";

export interface RoadmapLesson {
  id: string;
  youtubeVideoId: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  position: number;
}

export interface RoadmapModule {
  title: string;
  duration: string;
  lessons: string[];
}

interface Props {
  roadmapId: string;
  title: string;
  creator: string;
  description: string;
  level?: string;
  estimatedHours: string;
  tags?: string[];
  lessons: RoadmapLesson[];
  modules?: RoadmapModule[];
  isAuthenticated: boolean;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ""}`;
  return `${s}s`;
}

export default function RoadmapPublicClient({
  roadmapId,
  title,
  creator,
  description,
  level = "All Levels",
  estimatedHours,
  tags = [],
  lessons,
  modules,
  isAuthenticated,
}: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [cloning, setCloning] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [collapsedModules, setCollapsedModules] = useState<Record<number, boolean>>({});

  const toggleModule = (index: number) => {
    setCollapsedModules((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const filteredLessons = lessons.filter(
    (l) =>
      searchQuery.trim() === "" ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClone = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setCloning(true);
    try {
      const res = await fetch("/api/roadmaps/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmapId }),
      });

      const data = await res.json();
      if (res.ok && data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        alert(data.error || "Failed to clone roadmap. Please try again.");
      }
    } catch {
      alert("Something went wrong while cloning the roadmap.");
    } finally {
      setCloning(false);
    }
  };

  return (
    <div className="roadmap-public-wrap max-w-5xl mx-auto px-4 py-8">
      {/* Top Banner Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/roadmaps"
          className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1.5"
        >
          <span>←</span> Back to all Roadmaps
        </Link>
        <ShareRoadmapButton
          roadmapId={roadmapId}
          title={title}
          totalDuration={estimatedHours}
          lessonCount={lessons.length}
        />
      </div>

      {/* Hero Header Card */}
      <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 md:p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
              <SparklesIcon size={12} /> PUBLIC ROADMAP
            </span>
            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-zinc-300">
              {level}
            </span>
            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-zinc-300">
              {lessons.length} Lessons · {estimatedHours}
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {title}
          </h1>

          <p className="mt-2 text-sm text-emerald-400 font-medium">
            Curated syllabus by <span className="text-zinc-200">{creator}</span>
          </p>

          <p className="mt-4 text-sm text-zinc-300 leading-relaxed max-w-3xl">
            {description}
          </p>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded bg-zinc-800/80 px-2 py-0.5 text-[11px] text-zinc-400"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Action Row */}
          <div className="mt-6 flex flex-wrap items-center gap-4 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={handleClone}
              disabled={cloning}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <TargetIcon size={18} />
              <span>
                {cloning
                  ? "Adding to your dashboard..."
                  : "Clone & Track this Roadmap on Watchlify"}
              </span>
              <ArrowRightIcon size={16} />
            </button>

            {lessons[0] && (
              <Link
                href={`/watch/guest?v=${lessons[0].youtubeVideoId}&title=${encodeURIComponent(
                  lessons[0].title
                )}`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white px-5 py-3 text-sm font-medium transition"
              >
                <PlayIcon size={16} />
                <span>Try First Lesson in Workspace</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Syllabus View Section */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpenIcon size={20} className="text-emerald-400" />
              Complete Syllabus & Modules
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Structured step-by-step curriculum with zero fluff or clickbait
            </p>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search syllabus lessons..."
              className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Curated Module Accordions (if modules defined) */}
        {modules && modules.length > 0 && searchQuery.trim() === "" && (
          <div className="space-y-4 mb-8">
            {modules.map((mod, idx) => {
              const isCollapsed = Boolean(collapsedModules[idx]);
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-zinc-900/40 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleModule(idx)}
                    className="w-full flex items-center justify-between p-4 text-left transition hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-400">
                        {idx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100">
                          {mod.title}
                        </h3>
                        <span className="text-xs text-zinc-400">
                          {mod.lessons.length} lessons · {mod.duration}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {isCollapsed ? "Expand +" : "Collapse −"}
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="p-4 pt-1 border-t border-white/5 bg-zinc-950/40 space-y-2">
                      {mod.lessons.map((lessonName, lIdx) => (
                        <div
                          key={lIdx}
                          className="flex items-center gap-2.5 text-xs text-zinc-300 py-1.5 px-2 rounded hover:bg-white/5 transition"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <span>{lessonName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Video Lesson Items */}
        <div className="space-y-2">
          {filteredLessons.map((lesson, idx) => (
            <div
              key={lesson.id || idx}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-zinc-900/40 p-3 hover:border-white/15 transition group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 text-center text-xs font-mono font-medium text-zinc-400">
                  {String(idx + 1).padStart(2, "0")}
                </span>

                {lesson.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={lesson.thumbnailUrl}
                    alt=""
                    className="w-16 h-10 object-cover rounded-md border border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-10 bg-zinc-800 rounded-md flex items-center justify-center shrink-0">
                    <PlayIcon size={14} className="text-zinc-500" />
                  </div>
                )}

                <div className="min-w-0">
                  <h4 className="text-xs md:text-sm font-medium text-zinc-200 group-hover:text-emerald-400 transition truncate">
                    {lesson.title}
                  </h4>
                  <span className="text-[11px] text-zinc-400">
                    {formatDuration(lesson.durationSeconds)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/watch/guest?v=${lesson.youtubeVideoId}&title=${encodeURIComponent(
                    lesson.title
                  )}`}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition"
                >
                  Preview
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Bottom Bar for Mobile / Convenience */}
      <div className="sticky bottom-4 mt-12 rounded-2xl border border-white/15 bg-zinc-950/90 p-4 backdrop-blur-lg shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">{title}</h4>
          <p className="text-xs text-zinc-400">
            Save to your account with 1-click Google OAuth
          </p>
        </div>
        <button
          type="button"
          onClick={handleClone}
          disabled={cloning}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2.5 text-xs font-bold transition disabled:opacity-50"
        >
          <TargetIcon size={16} />
          <span>Clone & Track this Roadmap</span>
        </button>
      </div>

      {/* Auth Modal for Unauthenticated Users */}
      {showAuthModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 mb-4">
              <SparklesIcon size={24} />
            </div>

            <h3 className="text-lg font-bold text-white">
              Clone Roadmap to Watchlify
            </h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Create your free Watchlify account with 1 click to save &quot;{title}&quot;,
              track your video progress, auto-resume at the exact second, and take timestamped notes.
            </p>

            <div className="mt-6 space-y-3">
              <form action={signInWithGoogle}>
                <GoogleAuthButton label="Continue with Google" />
              </form>

              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="w-full text-xs text-zinc-400 hover:text-white py-2 transition"
              >
                Maybe later, keep browsing syllabus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
