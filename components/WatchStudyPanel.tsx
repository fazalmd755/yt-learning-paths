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
          className={`watch-tab-btn ${activeTab === "ai" ? "active" : ""}`}
        >
          <SparklesIcon size={14} className="text-emerald-500" />
          <span>AI Tutor</span>
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

      {/* Floating Quick AI Tutor Launcher (Sticky at bottom-right, only when not already on AI tab) */}
      {activeTab !== "ai" && (
        <button
          type="button"
          onClick={openAiTutor}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-neutral-200/80 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 px-3.5 py-2 text-xs font-medium text-neutral-800 dark:text-zinc-200 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400 group"
          title="Open AI Tutor"
        >
          <SparklesIcon size={13} className="text-emerald-500 group-hover:rotate-12 transition-transform" />
          <span>AI Tutor</span>
        </button>
      )}
    </div>
  );
}
