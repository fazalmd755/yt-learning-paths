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
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
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
  const [timestamp, setTimestamp] = useState("0");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState("");

  async function addNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const seconds = Number(timestamp);
    const text = content.trim();
    if (!Number.isInteger(seconds) || seconds < 0 || (durationSeconds > 0 && seconds > durationSeconds)) {
      setMessage("Enter a timestamp within this lesson's duration.");
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
      <div className="video-notes-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> YOUR LESSON NOTES</div><h2>Catch the important bits.</h2><p>Save a note with a timestamp and jump back to that moment when you review.</p></div><span className="notes-count">{notes.length} {notes.length === 1 ? "note" : "notes"}</span></div>
      <form className="video-note-form" onSubmit={addNote}>
        <label>Timestamp <span>seconds</span><input type="number" min={0} max={durationSeconds || undefined} step={1} value={timestamp} onChange={(event) => setTimestamp(event.target.value)} required /></label>
        <label className="video-note-content">Note<textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write down a key idea, example, or question..." maxLength={5000} required /></label>
        <button type="submit" disabled={saving}>{saving ? "Saving..." : <>Save note <span aria-hidden="true">↗</span></>}</button>
      </form>
      {message && <p className="inline-feedback" role="status">{message}</p>}
      {notes.length === 0 ? <div className="notes-empty">Your notes for this lesson will show up here.</div> : (
        <ol className="video-note-list">
          {notes.map((note) => (
            <li className="video-note-item" key={note.id}>
              <Link className="video-note-time" href={`${watchBaseHref ?? `/watch/${courseId}`}/${videoId}?t=${note.timestamp_seconds}`} aria-label={`Jump to ${formatTime(note.timestamp_seconds)}`}><span aria-hidden="true">▶</span>{formatTime(note.timestamp_seconds)}</Link>
              <p>{note.content}</p>
              <button type="button" className="video-note-delete" aria-label="Delete note" disabled={deletingId === note.id} onClick={() => deleteNote(note.id)}>×</button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
