"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LearningPath = {
  id: string;
  title: string;
  description: string;
  updated_at: string;
  videoCount: number;
};

export default function LearningPathLibrary({ paths }: { paths: LearningPath[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function createPath(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/learning-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not create your learning path.");
      setTitle("");
      setDescription("");
      router.push(`/learning-paths/${result.path.id}`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create your learning path.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePath(id: string, pathTitle: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${pathTitle}"?`)) return;
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(`/api/learning-paths/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not delete learning path.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete learning path.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="learning-path-library">
      <form className="learning-path-create" onSubmit={createPath}>
        <div>
          <label htmlFor="learning-path-title">Path name</label>
          <input
            id="learning-path-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            placeholder="e.g. Frontend development"
            required
          />
        </div>
        <div>
          <label htmlFor="learning-path-description">Description <span>optional</span></label>
          <input
            id="learning-path-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            placeholder="What do you want to learn?"
          />
        </div>
        <button type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create path"} <span aria-hidden="true">+</span>
        </button>
      </form>
      {error && <p className="inline-feedback" role="alert">{error}</p>}

      {paths.length === 0 ? (
        <div className="learning-path-empty">
          No custom learning paths yet. Create one, then add videos in the order you want to study them.
        </div>
      ) : (
        <div className="learning-path-grid">
          {paths.map((path) => (
            <div key={path.id} className="learning-path-card-shell">
              <Link href={`/learning-paths/${path.id}`} className="learning-path-card">
                <span className="learning-path-card-icon" aria-hidden="true">↗</span>
                <span className="learning-path-card-copy">
                  <strong>{path.title}</strong>
                  <span>{path.description || "Your personal video learning path"}</span>
                  <small>
                    {path.videoCount} {path.videoCount === 1 ? "video" : "videos"} · Updated {new Date(path.updated_at).toISOString().slice(0, 10)}
                  </small>
                </span>
                <span className="learning-path-card-arrow" aria-hidden="true">→</span>
              </Link>
              <button
                type="button"
                onClick={(e) => deletePath(path.id, path.title, e)}
                disabled={busyId === path.id}
                className="learning-path-item-delete"
                title={`Delete "${path.title}"`}
                aria-label={`Delete ${path.title}`}
              >
                {busyId === path.id ? "…" : "×"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
