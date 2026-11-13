"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRightIcon, SparklesIcon, CheckIcon } from "@/components/Icons";
import { CURATED_TRACKS, type CuratedTrack } from "@/lib/roadmaps";

export default function AddCourseForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Curated" },
    { id: "dsa", label: "DSA & LeetCode" },
    { id: "webdev", label: "Web Dev" },
    { id: "cs", label: "CS Core" },
    { id: "python", label: "Python & AI" },
    { id: "mobile", label: "Mobile Apps" },
    { id: "design", label: "UI/UX" },
  ];

  const filteredTracks =
    selectedCategory === "all"
      ? CURATED_TRACKS
      : CURATED_TRACKS.filter((t) => t.category === selectedCategory);

  async function importUrl(targetUrl: string, trackId?: string) {
    if (!targetUrl.trim()) return;
    setLoading(true);
    if (trackId) setImportingId(trackId);
    setError(null);

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong importing the course.");
      setUrl("");
      router.push(`/courses/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to import course.");
    } finally {
      setLoading(false);
      setImportingId(null);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    importUrl(url);
  }

  return (
    <div className="add-course-container space-y-3">
      {/* Main input bar */}
      <form onSubmit={onSubmit} className="add-course-compact-form">
        <div className="add-course-compact-row">
          <span className="add-course-compact-icon" aria-hidden="true">🔗</span>
          <input
            id="course-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube playlist or video URL to create course..."
            className="add-course-compact-input"
            type="url"
            required
            disabled={loading}
          />
          <button
            disabled={loading || !url.trim()}
            className="add-course-compact-btn"
            type="submit"
          >
            {loading && !importingId ? (
              "Importing..."
            ) : (
              <>
                <span>+ Import Link</span>
                <ArrowRightIcon size={12} className="inline-block" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowCatalog(!showCatalog)}
            className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              showCatalog
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <SparklesIcon size={13} className="text-emerald-500 dark:text-emerald-400" />
            <span>{showCatalog ? "Close Options" : "Pick from Curated"}</span>
          </button>
        </div>
      </form>

      {error && <p role="alert" className="course-form-error text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>}

      {/* Quick Select Preset Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-500">Or pick curated:</span>
        {CURATED_TRACKS.slice(0, 5).map((track) => (
          <button
            key={track.id}
            type="button"
            disabled={loading}
            onClick={() => importUrl(track.playlistUrl, track.id)}
            className="flex items-center gap-1 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-zinc-900/60 px-2.5 py-1 text-[11px] text-slate-700 dark:text-zinc-300 transition hover:border-emerald-500/40 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
          >
            <span>
              {track.category === "dsa"
                ? "🔥"
                : track.category === "webdev"
                ? "🌐"
                : track.category === "cs"
                ? "💻"
                : track.category === "python"
                ? "🐍"
                : "📱"}
            </span>
            <span className="font-medium truncate max-w-[150px]">{track.title.split("(")[0].trim()}</span>
            {importingId === track.id && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        ))}
        {!showCatalog && (
          <button
            type="button"
            onClick={() => setShowCatalog(true)}
            className="text-[11px] text-emerald-500 underline hover:text-emerald-400 pl-1"
          >
            + view all {CURATED_TRACKS.length}
          </button>
        )}
      </div>

      {/* Expandable Curated Playlists Drawer */}
      {showCatalog && (
        <div className="mt-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-zinc-950/80 p-4 shadow-xl backdrop-blur-md animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <SparklesIcon size={14} className="text-emerald-500" />
                <span>Curated Industry Playlists & Tracks</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Click any playlist to instantly add it to your personal study workspace
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
                    selectedCategory === c.id
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTracks.map((track) => {
              const isSelected = importingId === track.id;
              return (
                <div
                  key={track.id}
                  className="flex flex-col justify-between rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-zinc-900/50 p-3.5 transition hover:border-emerald-500/30 hover:bg-slate-100 dark:hover:bg-zinc-900/80"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="rounded bg-slate-200/70 dark:bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                        {track.level}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono">
                        {track.estimatedHours} · {track.lessonCount} videos
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 line-clamp-1" title={track.title}>
                      {track.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 line-clamp-1">
                      by {track.creator}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {track.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-white/5 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-500 truncate max-w-[120px]">
                      {track.tags.slice(0, 2).join(" · ")}
                    </span>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => importUrl(track.playlistUrl, track.id)}
                      className="flex items-center gap-1 rounded bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                      {isSelected ? (
                        <span>Adding...</span>
                      ) : (
                        <>
                          <span>+ Add Course</span>
                          <ArrowRightIcon size={10} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
