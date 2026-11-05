"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type VideoNote = {
  id: string;
  timestamp_seconds: number;
  content: string;
  created_at: string;
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

function parseTimeToSeconds(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  const parts = trimmed.split(":").map(Number);
  if (parts.some((n) => isNaN(n) || n < 0)) return null;
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  return null;
}

export default function VideoNotes({
  userId,
  courseId,
  videoId,
  durationSeconds,
  notes: initialNotes,
  watchBaseHref,
}: {
  userId: string;
  courseId: string;
  videoId: string;
  durationSeconds: number;
  notes: VideoNote[];
  watchBaseHref?: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [notes, setNotes] = useState(initialNotes);
  const [timestamp, setTimestamp] = useState("00:00");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState("");

  function captureCurrentTime() {
    if (typeof window !== "undefined" && typeof (window as any).__watchifyGetCurrentTime === "function") {
      const pos = (window as any).__watchifyGetCurrentTime();
      setTimestamp(formatTime(pos));
    }
  }

  function exportNotes() {
    if (notes.length === 0) return;
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    const contentLines = [
      `# Lesson Notes`,
      `*Exported from Watchify on ${dateStr}*\n`,
      `---`,
      ...notes.map((note) => `- **[${formatTime(note.timestamp_seconds)}]** ${note.content}`),
      `\n---`,
    ];
    const blob = new Blob([contentLines.join("\n\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `watchify-notes-${videoId.slice(0, 8)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function addNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const seconds = parseTimeToSeconds(timestamp);
    const text = content.trim();
    if (seconds === null || !Number.isInteger(seconds) || seconds < 0 || (durationSeconds > 0 && seconds > durationSeconds)) {
      setMessage(
        durationSeconds > 0
          ? `Enter a valid timestamp like "04:15" or seconds up to ${formatTime(durationSeconds)}.`
          : "Enter a valid timestamp (e.g. 04:15 or 120)."
      );
      return;
    }
    if (!text || text.length > 5000) {
      setMessage("Write a note (up to 5,000 characters) before saving.");
      return;
    }
    setSaving(true);
    setMessage("");
    const { data, error } = await supabase.from("video_notes")
      .insert({ user_id: userId, video_id: videoId, timestamp_seconds: seconds, content: text })
      .select("id, timestamp_seconds, content, created_at")
      .single();
    if (error) {
      setMessage(`Could not save your note: ${error.message}`);
    } else {
      setNotes((current) => [...current, data].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds));
      setContent("");
      setMessage("Note saved.");
      setTimeout(() => setMessage(""), 3000);
    }
    setSaving(false);
  }

  async function deleteNote(noteId: string) {
    setDeletingId(noteId);
    setMessage("");
    const { error } = await supabase.from("video_notes").delete().eq("user_id", userId).eq("id", noteId);
    if (error) {
      setMessage(`Could not delete your note: ${error.message}`);
    } else {
      setNotes((current) => current.filter((note) => note.id !== noteId));
    }
    setDeletingId("");
  }

  return (
    <section className="video-notes-panel">
      <div className="video-notes-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-dot" /> YOUR LESSON NOTES</div>
          <h2>Catch the important bits.</h2>
          <p>Save a note with a timestamp and jump back to that moment when you review.</p>
        </div>
        <div className="video-note-tools">
          {notes.length > 0 && (
            <button
              type="button"
              className="video-note-export-btn"
              onClick={exportNotes}
              title="Export all notes for this lesson as Markdown"
            >
              Export (.md)
            </button>
          )}
          <span className="notes-count">{notes.length} {notes.length === 1 ? "note" : "notes"}</span>
        </div>
      </div>

      <form className="video-note-form" onSubmit={addNote}>
        <div className="video-note-time-group">
          <label htmlFor="note-timestamp">
            Timestamp <span>MM:SS or sec</span>
          </label>
          <div className="video-note-time-input-wrap">
            <input
              id="note-timestamp"
              type="text"
              value={timestamp}
              onChange={(event) => setTimestamp(event.target.value)}
              placeholder="00:00"
              required
            />
            <button
              type="button"
              className="video-note-capture-btn"
              onClick={captureCurrentTime}
              title="Capture current playback timestamp from player"
            >
              ⏱ Current time
            </button>
          </div>
        </div>

        <label className="video-note-content">
          Note
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write down a key idea, formula, or question..."
            maxLength={5000}
            required
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : <>Save note <span aria-hidden="true">→</span></>}
        </button>
      </form>

      {message && <p className="inline-feedback" role="status">{message}</p>}

      {notes.length === 0 ? (
        <div className="notes-empty">Your notes for this lesson will show up here.</div>
      ) : (
        <ol className="video-note-list">
          {notes.map((note) => (
            <li className="video-note-item" key={note.id}>
              <Link
                className="video-note-time"
                href={`${watchBaseHref ?? `/watch/${courseId}`}/${videoId}?t=${note.timestamp_seconds}`}
                aria-label={`Jump to ${formatTime(note.timestamp_seconds)}`}
              >
                <span aria-hidden="true">▶</span> {formatTime(note.timestamp_seconds)}
              </Link>
              <p>{note.content}</p>
              <button
                type="button"
                className="video-note-delete"
                aria-label="Delete note"
                disabled={deletingId === note.id}
                onClick={() => deleteNote(note.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
