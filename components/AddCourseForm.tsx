"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <form onSubmit={onSubmit} className="add-course-form">
      <label htmlFor="course-url" className="course-url-label">YOUTUBE PLAYLIST YA VIDEO KA LINK</label>
      <div className="course-url-row">
        <input
          id="course-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/playlist?list=..."
          className="course-url-input"
          type="url"
          required
        />
        <button
          disabled={loading}
          className="course-add-button"
        >
          {loading ? "Importing..." : <>Create path <span aria-hidden="true">↗</span></>}
        </button>
      </div>
      <p className="course-url-hint">Both playlists and individual videos are supported.</p>
      {error && <p role="alert" className="course-form-error">{error}</p>}
    </form>
  );
}
