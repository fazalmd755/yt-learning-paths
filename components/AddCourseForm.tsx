"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRightIcon } from "@/components/Icons";

export default function AddCourseForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setUrl("");
      router.push(`/courses/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="add-course-compact-form">
      <div className="add-course-compact-row">
        <span className="add-course-compact-icon" aria-hidden="true">🔗</span>
        <input
          id="course-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube playlist or video URL to create course..."
          className="add-course-compact-input"
          type="url"
          required
        />
        <button
          disabled={loading || !url.trim()}
          className="add-course-compact-btn"
          type="submit"
        >
          {loading ? (
            "Importing..."
          ) : (
            <>
              <span>+ Import Path</span>
              <ArrowRightIcon size={12} className="inline-block" />
            </>
          )}
        </button>
      </div>
      {error && <p role="alert" className="course-form-error">{error}</p>}
    </form>
  );
}
