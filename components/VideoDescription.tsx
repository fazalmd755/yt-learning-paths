"use client";

import { useMemo, useState } from "react";

function parseTimestampToSeconds(ts: string): number {
  const parts = ts.split(":").map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

export default function VideoDescription({
  description,
  channelTitle,
}: {
  description: string;
  channelTitle?: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  const cleanDescription = (description || "").trim();

  // Parse links and timestamps in description
  const formattedContent = useMemo(() => {
    if (!cleanDescription) return null;

    // Regex for URLs or timestamps (e.g. 1:23 or 01:23:45)
    const tokenRegex = /(https?:\/\/[^\s]+|\b(?:\d{1,2}:)?\d{1,2}:\d{2}\b)/g;
    const parts = cleanDescription.split(tokenRegex);

    return parts.map((part, index) => {
      if (/^https?:\/\//i.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="video-description-link"
          >
            {part}
          </a>
        );
      }

      if (/^(?:\d{1,2}:)?\d{1,2}:\d{2}$/.test(part)) {
        const seconds = parseTimestampToSeconds(part);
        return (
          <button
            key={index}
            type="button"
            className="video-description-time-btn"
            onClick={() => {
              if (typeof window !== "undefined") {
                const seekTo = (window as any).__watchlifySeekTo || (window as any).__watchifySeekTo;
                if (typeof seekTo === "function") {
                  seekTo(seconds);
                }
              }
            }}
            title={`Jump to ${part}`}
          >
            {part}
          </button>
        );
      }

      return part;
    });
  }, [cleanDescription]);

  if (!cleanDescription) {
    return null;
  }

  const isLong = cleanDescription.length > 280 || cleanDescription.split("\n").length > 4;

  return (
    <div className={`video-description-card ${expanded ? "expanded" : "collapsed"}`}>
      <div className="video-description-header">
        <span className="video-description-label">ABOUT THIS VIDEO</span>
        {channelTitle && <span className="video-description-channel">By {channelTitle}</span>}
      </div>

      <div className="video-description-body">
        {formattedContent}
      </div>

      {isLong && (
        <button
          type="button"
          className="video-description-toggle"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Show less ▴" : "Show more ▾"}
        </button>
      )}
    </div>
  );
}
