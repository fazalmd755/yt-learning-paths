"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayIcon, ArrowRightIcon } from "./Icons";
import { parseYoutubeInput } from "@/lib/youtube";

export default function HeroUrlInput() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    setError(null);
    setLoading(true);

    const parsed = parseYoutubeInput(trimmed);
    if (!parsed) {
      setError("Please paste a valid YouTube playlist or video link.");
      setLoading(false);
      return;
    }

    if (parsed.kind === "playlist") {
      // Direct roadmap preview or guest mode
      router.push(`/roadmap/${parsed.id}`);
    } else {
      // Single video in guest workspace
      router.push(`/watch/guest?v=${parsed.id}`);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-2 sm:px-0">
      <form
        onSubmit={handleSubmit}
        className="hero-url-form relative flex flex-row items-center justify-between rounded-full border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#141b18]/95 p-1.5 sm:p-2 shadow-2xl backdrop-blur-2xl transition-all focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/25"
      >
        <div className="flex flex-1 items-center gap-2.5 sm:gap-3 pl-3 sm:pl-4 pr-2 min-w-0">
          <PlayIcon size={18} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste any YouTube playlist or video URL..."
            className="hero-url-raw-input w-full bg-transparent text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none min-w-0"
            aria-label="YouTube playlist or video URL"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="hero-url-submit-btn inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
        >
          <span className="hidden xs:inline sm:inline">{loading ? "Opening..." : "Open in Workspace"}</span>
          <span className="xs:hidden sm:hidden">{loading ? "..." : "Open"}</span>
          <ArrowRightIcon size={14} className="shrink-0" />
        </button>
      </form>

      {error ? (
        <p className="mt-2.5 text-xs text-rose-500 dark:text-rose-400 text-center font-medium animate-fade-in">
          {error}
        </p>
      ) : (
        <p className="mt-2.5 text-[12px] text-neutral-500 dark:text-neutral-400 text-center font-medium">
          Instant guest preview · No login required to test the workspace
        </p>
      )}
    </div>
  );
}
