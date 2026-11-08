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
    <div className="w-full max-w-2xl mx-auto my-6">
      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col sm:flex-row items-stretch gap-2 rounded-2xl border border-white/20 bg-white/[0.04] p-2 shadow-2xl backdrop-blur-2xl focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/25 transition-all"
      >
        <div className="flex flex-1 items-center gap-3 px-3 py-1">
          <PlayIcon size={18} className="text-emerald-400 shrink-0" />
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste any YouTube playlist or video URL..."
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
            aria-label="YouTube playlist or video URL"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-3 text-xs md:text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <span>{loading ? "Opening..." : "Open in Workspace"}</span>
          <ArrowRightIcon size={14} />
        </button>
      </form>

      {error ? (
        <p className="mt-2 text-xs text-rose-400 text-center font-medium animate-fade-in">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-[11px] text-zinc-400 text-center">
          Instant guest preview · No login required to test the workspace
        </p>
      )}
    </div>
  );
}
