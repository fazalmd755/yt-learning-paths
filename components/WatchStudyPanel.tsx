"use client";

import { useState } from "react";
import VideoNotes, { type VideoNote } from "./VideoNotes";
import AiStudyAssist from "./AiStudyAssist";
import VideoDescription from "./VideoDescription";

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

  return (
    <div className="watch-study-panel">
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
          <span>🤖 AI Tutor</span>
          <span className="watch-tab-badge">AI</span>
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
    </div>
  );
}
