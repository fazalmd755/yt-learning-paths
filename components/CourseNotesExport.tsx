"use client";

import { useState } from "react";
import { DownloadIcon } from "./Icons";

export type ExportableNote = {
  videoTitle: string;
  position: number;
  timestampSeconds: number;
  content: string;
  createdAt: string;
};

type Props = {
  courseTitle: string;
  channelTitle?: string | null;
  notes: ExportableNote[];
};

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const remainder = s % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export default function CourseNotesExport({ courseTitle, channelTitle, notes }: Props) {
  const [downloading, setDownloading] = useState(false);

  function exportMarkdown() {
    if (notes.length === 0) return;
    setDownloading(true);

    try {
      // Group notes by video
      const grouped = new Map<string, { videoTitle: string; position: number; items: ExportableNote[] }>();
      for (const n of notes) {
        if (!grouped.has(n.videoTitle)) {
          grouped.set(n.videoTitle, { videoTitle: n.videoTitle, position: n.position, items: [] });
        }
        grouped.get(n.videoTitle)!.items.push(n);
      }

      const sortedGroups = Array.from(grouped.values()).sort((a, b) => a.position - b.position);

      const lines: string[] = [
        `# ${courseTitle} - Course Study Notes`,
        channelTitle ? `**Instructor / Channel:** ${channelTitle}` : "",
        `**Exported:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
        `**Total Notes Recorded:** ${notes.length}`,
        "",
        "---",
        "",
      ];

      for (const group of sortedGroups) {
        lines.push(`## Lesson ${group.position + 1}: ${group.videoTitle}`);
        lines.push("");
        for (const item of group.items) {
          lines.push(`- **[${formatTime(item.timestampSeconds)}]**: ${item.content.trim()}`);
        }
        lines.push("");
      }

      const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeTitle = courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      a.href = url;
      a.download = `${safeTitle}-notes.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={exportMarkdown}
      disabled={notes.length === 0 || downloading}
      className={`course-notes-export-btn ${notes.length === 0 ? "course-notes-export-btn-empty" : ""}`}
      title={notes.length === 0 ? "No notes recorded yet for this course" : `Export all ${notes.length} notes as Markdown`}
    >
      <DownloadIcon size={14} className="inline-block mr-1.5" />
      <span>{downloading ? "Exporting..." : notes.length > 0 ? `Export All Notes (${notes.length})` : "Export Notes"}</span>
    </button>
  );
}
