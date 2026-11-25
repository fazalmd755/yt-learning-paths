"use client";

import { useState, useEffect } from "react";
import VideoNotes, { type VideoNote } from "./VideoNotes";
import AiStudyAssist from "./AiStudyAssist";
import VideoDescription from "./VideoDescription";
import { SparklesIcon } from "./Icons";

type Tab = "notes" | "ai" | "description";

interface Props {
  userId: string;
  courseId: string;
  videoId: string;
  videoTitle: string;
  durationSeconds: number;
  description: string;
  notes: VideoNote[];
  channelTitle?: string | null;
  watchBaseHref?: string;
}

export default function WatchStudyPanel({
  userId,
  courseId,
  videoId,
  videoTitle,
  durationSeconds,
  description,
  notes,
  channelTitle,
  watchBaseHref,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("notes");

  // Listen for global custom events to open AI Tutor
  useEffect(() => {
    const handleOpenAi = () => {
      setActiveTab("ai");
      const panel = document.querySelector(".watch-study-panel");
      if (panel) {
        panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    };

    window.addEventListener("watchlify-open-ai-tutor", handleOpenAi);
    return () => window.removeEventListener("watchlify-open-ai-tutor", handleOpenAi);
  }, []);

  const openAiTutor = () => {
    setActiveTab("ai");
    const panel = document.querySelector(".watch-study-panel");
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="watch-study-panel relative">
      {/* Tab Switcher Header */}
      <div className="watch-tabs-bar" role="tablist" aria-label="Study desk tabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "notes"}
          onClick={() => setActiveTab("notes")}
          className={`watch-tab-btn ${activeTab === "notes" ? "active" : ""}`}
        >
          <span>📝 Notes</span>
          <span className="watch-tab-count">{notes.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "ai"}
          onClick={() => setActiveTab("ai")}
          className={`watch-tab-btn relative ${activeTab === "ai" ? "active" : ""}`}
        >
          <span className="flex items-center gap-1.5">
            <SparklesIcon size={14} className="text-emerald-500 animate-pulse" />
            <span>AI Tutor</span>
          </span>
          <span className="watch-tab-badge">24/7</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "description"}
          onClick={() => setActiveTab("description")}
          className={`watch-tab-btn ${activeTab === "description" ? "active" : ""}`}
        >
          <span>ℹ️ Description</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="watch-tab-content">
        {activeTab === "notes" && (
          <VideoNotes
            userId={userId}
            courseId={courseId}
            videoId={videoId}
            durationSeconds={durationSeconds}
            notes={notes}
            watchBaseHref={watchBaseHref}
          />
        )}

        {activeTab === "ai" && (
          <div className="watch-tab-ai-wrap">
            <AiStudyAssist
              videoId={videoId}
              videoTitle={videoTitle}
              description={description}
              userId={userId}
            />
          </div>
        )}

        {activeTab === "description" && (
          <div className="watch-tab-desc-wrap">
            <VideoDescription description={description} channelTitle={channelTitle} />
          </div>
        )}
      </div>

      {/* Floating Quick AI Tutor Launcher (Sticky at bottom-right) */}
      <button
        type="button"
        onClick={openAiTutor}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-emerald-500/40 bg-neutral-900/90 dark:bg-zinc-900/90 px-4 py-2.5 text-xs font-semibold text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:border-emerald-400 hover:shadow-emerald-500/20 active:scale-95 group"
        title="Open 24/7 AI Tutor & Practice Quiz"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <SparklesIcon size={14} className="text-emerald-400 group-hover:rotate-12 transition-transform" />
        <span>Ask AI Tutor</span>
      </button>
    </div>
  );
}
