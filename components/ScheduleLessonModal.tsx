"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  videoTitle: string;
  watchUrl: string;
  courseTitle?: string;
  onSuccess?: () => void;
};

export default function ScheduleLessonModal({
  isOpen,
  onClose,
  userId,
  videoTitle,
  watchUrl,
  courseTitle = "",
  onSuccess,
}: Props) {
  const [taskDate, setTaskDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [title, setTitle] = useState(videoTitle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(videoTitle);
      setError("");
      setSuccess(false);
      // Default to tomorrow's date
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setTaskDate(`${yyyy}-${mm}-${dd}`);
      setStartTime("18:00");
    }
  }, [isOpen, videoTitle]);

  if (!isOpen) return null;

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!taskDate) {
      setError("Please pick a date for your study session.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const fullUrl = watchUrl.startsWith("http") ? watchUrl : `${origin}${watchUrl}`;

      const { error: insertErr } = await supabase.from("study_tasks").insert({
        user_id: userId,
        title: title.trim() || videoTitle,
        subject: courseTitle.slice(0, 100),
        details: fullUrl,
        task_date: taskDate,
        start_time: startTime || null,
        is_completed: false,
      });

      if (insertErr) throw new Error(insertErr.message);

      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err?.message || "Failed to schedule task.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="schedule-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="schedule-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="schedule-modal-header">
          <div className="schedule-modal-icon">📅</div>
          <div>
            <h3>Schedule Study Session</h3>
            <p>Add this lesson directly to your Study Planner</p>
          </div>
          <button type="button" className="schedule-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {success ? (
          <div className="schedule-modal-success">
            <span>✓</span>
            <h4>Added to Study Planner!</h4>
            <p>Scheduled for {taskDate} {startTime ? `at ${startTime}` : ""}.</p>
          </div>
        ) : (
          <form onSubmit={handleSchedule} className="schedule-modal-form">
            <label>
              <span>Lesson Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={160}
                required
              />
            </label>

            <div className="schedule-modal-row">
              <label>
                <span>Study Date</span>
                <input
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  required
                />
              </label>

              <label>
                <span>Time (Optional)</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </label>
            </div>

            {error && <p className="schedule-modal-error">{error}</p>}

            <div className="schedule-modal-actions">
              <button type="button" onClick={onClose} className="schedule-modal-cancel">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="schedule-modal-submit">
                {saving ? "Scheduling..." : "Save to Planner →"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
