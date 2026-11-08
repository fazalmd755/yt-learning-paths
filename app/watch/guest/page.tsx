"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import {
  PlayIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  FlameIcon,
} from "@/components/Icons";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { signInWithGoogle } from "@/app/login/actions";
import PomodoroTimer from "@/components/PomodoroTimer";
import { parseYoutubeInput } from "@/lib/youtube";

function GuestWatchContent() {
  const searchParams = useSearchParams();
  const vParam = searchParams.get("v");
  const urlParam = searchParams.get("url");
  const titleParam = searchParams.get("title");

  let initialVideoId = "dQw4w9WgXcQ";
  if (vParam) {
    initialVideoId = vParam;
  } else if (urlParam) {
    const parsed = parseYoutubeInput(urlParam);
    if (parsed) {
      initialVideoId = parsed.id;
    }
  }

  const [videoId, setVideoId] = useState(initialVideoId);
  const [videoTitle, setVideoTitle] = useState(
    titleParam ? decodeURIComponent(titleParam) : "Interactive Guest Workspace"
  );
  const [showGentleModal, setShowGentleModal] = useState(false);
  const [gentleTriggerReason, setGentleTriggerReason] = useState<
    "note" | "streak" | "next_video"
  >("note");

  // Guest notes in localStorage
  const [guestNotes, setGuestNotes] = useState<
    Array<{ id: string; time: number; text: string }>
  >([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [currentTime, setCurrentTime] = useState(0);

  // Playback speed
  const [speed, setSpeed] = useState(1);

  // Mount iframe
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`watchlify_guest_notes_${videoId}`);
      if (saved) setGuestNotes(JSON.parse(saved));
    } catch {}
  }, [videoId]);

  // Window bridge for AI assist / notes
  useEffect(() => {
    (window as any).__watchlifyGetCurrentTime = () => currentTime;
    return () => {
      delete (window as any).__watchlifyGetCurrentTime;
    };
  }, [currentTime]);

  const triggerGentlePrompt = (reason: "note" | "streak" | "next_video") => {
    setGentleTriggerReason(reason);
    setShowGentleModal(true);
  };

  const handleAddGuestNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    // Trigger gentle prompt on taking notes so user knows how to sync to cloud
    triggerGentlePrompt("note");

    const newNote = {
      id: String(Date.now()),
      time: currentTime,
      text: newNoteText.trim(),
    };
    const updated = [...guestNotes, newNote];
    setGuestNotes(updated);
    setNewNoteText("");

    try {
      localStorage.setItem(`watchlify_guest_notes_${videoId}`, JSON.stringify(updated));
    } catch {}
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <main className="min-h-screen bg-[#090A0E] text-zinc-100 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Top Navbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1.5"
          >
            <span>←</span> Exit Guest Mode
          </Link>
          <span className="rounded-full bg-[#CEF432]/15 border border-[#CEF432]/30 px-2.5 py-0.5 text-[11px] font-semibold text-[#CEF432]">
            DEMO / GUEST SESSION
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => triggerGentlePrompt("streak")}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition"
          >
            <FlameIcon size={14} />
            <span>Save Today&apos;s Streak</span>
          </button>
          <PomodoroTimer />
        </div>
      </div>

      {/* Lesson Heading */}
      <div className="mb-4">
        <span className="text-xs font-mono text-zinc-400">GUEST PREVIEW</span>
        <h1 className="text-xl md:text-2xl font-bold text-white mt-1">
          {videoTitle}
        </h1>
      </div>

      {/* Player & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Player */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1&autoplay=1`}
              title={videoTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>

          {/* Quick controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-white/5 bg-[#0e1017]">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-[#CEF432] animate-pulse" />
              <span>Distraction-free environment (zero recommendations, no shorts)</span>
            </div>

            <button
              type="button"
              onClick={() => triggerGentlePrompt("next_video")}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1 text-xs font-medium text-white transition"
            >
              <span>Next Lesson</span>
              <ArrowRightIcon size={12} />
            </button>
          </div>

          {/* Guest AI Quick Assist preview */}
          <div className="rounded-xl border border-white/10 bg-[#0e1017] p-4">
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon size={16} className="text-[#CEF432]" />
              <h3 className="text-xs font-semibold text-zinc-200">
                AI Study Assist
              </h3>
            </div>
            <p className="text-xs text-zinc-400">
              Watchlify generates 3-bullet core summaries and practice quizzes for every lesson. Sign in to sync your notes to the cloud.
            </p>
          </div>
        </div>

        {/* Right 1 Col: Notes & Scratchpad */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 flex flex-col h-full min-h-[420px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Timestamped Notes (Demo)
              </h3>
              <span className="text-[11px] text-zinc-400">
                {guestNotes.length} saved locally
              </span>
            </div>

            {/* Note input */}
            <form onSubmit={handleAddGuestNote} className="space-y-2 mb-4">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Take a timestamped note (e.g. key insight, code snippet)..."
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-[#08080C] p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#CEF432] resize-none"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-[#CEF432] hover:bg-[#dbfa50] text-[#08080C] py-2 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>Add Note</span>
              </button>
            </form>

            {/* Notes list */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px]">
              {guestNotes.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-400">
                  No notes yet. Type a note above to test timestamped study notes!
                </div>
              ) : (
                guestNotes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-lg border border-white/5 bg-[#08080C]/70 p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-1.5 text-[#CEF432] font-mono text-[10px] mb-1">
                      <span>⏱</span>
                      <span>{formatSeconds(n.time)}</span>
                    </div>
                    <p className="text-zinc-300 whitespace-pre-wrap">{n.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gentle Modal */}
      {showGentleModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowGentleModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0e1017] p-6 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#CEF432]/15 text-[#CEF432] mb-4">
              <SparklesIcon size={24} />
            </div>

            <h3 className="text-lg font-bold text-white">
              Save your progress & notes with Google
            </h3>

            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              {gentleTriggerReason === "note"
                ? "You're taking great notes! Sign in with Google so they never get lost and sync across all your devices."
                : gentleTriggerReason === "streak"
                ? "Build your study habit! Sign in with Google to log today's active study time and light up your streak flame."
                : "Ready for the next lesson? Sign in to unlock full course tracking, auto-resume, and roadmap sync."}
            </p>

            <div className="mt-6 space-y-3">
              <form action={signInWithGoogle}>
                <GoogleAuthButton label="Continue with Google" />
              </form>

              <button
                type="button"
                onClick={() => setShowGentleModal(false)}
                className="w-full text-xs text-zinc-400 hover:text-white py-2 transition"
              >
                Keep exploring as guest
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function GuestWatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090A0E] flex items-center justify-center text-zinc-400 text-sm">
          Loading guest workspace...
        </div>
      }
    >
      <GuestWatchContent />
    </Suspense>
  );
}
