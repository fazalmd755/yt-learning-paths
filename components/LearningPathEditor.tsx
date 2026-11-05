"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type LearningPathVideo = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  embeddable: boolean;
  status: string;
};

function durationLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

export default function LearningPathEditor({
  pathId,
  initialTitle,
  videos: initialVideos,
}: {
  pathId: string;
  initialTitle: string;
  videos: LearningPathVideo[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [videos, setVideos] = useState(initialVideos);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const totalDuration = videos.reduce((acc, v) => acc + (v.duration_seconds || 0), 0);

  async function addVideos(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("add");
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/learning-paths/${pathId}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.changed) {
          if (Array.isArray(result.videos)) {
            setVideos((current) => [
              ...current,
              ...result.videos.map((video: Omit<LearningPathVideo, "status">) => ({ ...video, status: "not_started" })),
            ]);
          }
          router.refresh();
        }
        throw new Error(result.error ?? "Could not add videos.");
      }
      setVideos((current) => [
        ...current,
        ...result.videos.map((video: Omit<LearningPathVideo, "status">) => ({ ...video, status: "not_started" })),
      ]);
      setUrl("");
      setMessage(
        result.kind === "playlist"
          ? `${result.videos.length} ${result.videos.length === 1 ? "video" : "videos"} added from the playlist.`
          : "Video added to your learning path."
      );
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add videos.");
    } finally {
      setBusy("");
    }
  }

  async function persistOrder(reordered: LearningPathVideo[]) {
    setBusy("reorder");
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/learning-paths/${pathId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoIds: reordered.map((video) => video.id) }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.changed) {
          setVideos(reordered);
          router.refresh();
        }
        throw new Error(result.error ?? "Could not reorder videos.");
      }
      setVideos(reordered);
      setMessage("Order updated.");
      setTimeout(() => setMessage(""), 2500);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not reorder videos.");
    } finally {
      setBusy("");
    }
  }

  async function moveVideo(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= videos.length) return;
    const reordered = [...videos];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await persistOrder(reordered);
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  }

  async function handleDrop(e: React.DragEvent, targetIndex: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const reordered = [...videos];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setVideos(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
    await persistOrder(reordered);
  }

  async function removeVideo(videoId: string) {
    setBusy(videoId);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/learning-paths/${pathId}/videos?videoId=${encodeURIComponent(videoId)}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.changed) {
          setVideos((current) => current.filter((video) => video.id !== videoId));
          router.refresh();
        }
        throw new Error(result.error ?? "Could not remove video.");
      }
      setVideos((current) => current.filter((video) => video.id !== videoId));
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not remove video.");
    } finally {
      setBusy("");
    }
  }

  async function renamePath(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("rename");
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/learning-paths/${pathId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not rename learning path.");
      setMessage("Path name saved.");
      setTimeout(() => setMessage(""), 2500);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not rename learning path.");
    } finally {
      setBusy("");
    }
  }

  async function deletePath() {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    setBusy("delete");
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/learning-paths/${pathId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Could not delete learning path.");
      }
      router.push("/syllabus/select");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete learning path.");
      setBusy("");
    }
  }

  return (
    <div className="learning-path-editor">
      <div className="learning-path-rename-wrap">
        <form className="learning-path-rename" onSubmit={renamePath}>
          <label htmlFor="edit-path-title">Path name</label>
          <input
            id="edit-path-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
          />
          <button type="submit" disabled={busy !== ""}>
            {busy === "rename" ? "Saving..." : "Save name"}
          </button>
        </form>
        <button
          type="button"
          onClick={deletePath}
          disabled={busy !== ""}
          className="learning-path-delete-btn"
          title="Delete this learning path"
        >
          {busy === "delete" ? "Deleting..." : "Delete path"}
        </button>
      </div>

      <section className="learning-path-add-videos">
        <div className="eyebrow"><span className="eyebrow-dot" /> BUILD YOUR SEQUENCE</div>
        <h2>Add videos or a playlist</h2>
        <p>Paste a YouTube video or playlist link. Playlist videos are added in order to the end of your path.</p>
        <form onSubmit={addVideos}>
          <input
            type="url"
            aria-label="YouTube video or playlist URL"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=... or /playlist?list=..."
            required
          />
          <button type="submit" disabled={busy !== ""}>
            {busy === "add" ? "Adding..." : "Add to path"} <span aria-hidden="true">+</span>
          </button>
        </form>
      </section>
      {error && <p className="inline-feedback" role="alert">{error}</p>}
      {message && <p className="inline-feedback path-success" role="status">{message}</p>}

      <section className="video-list-section learning-path-lessons">
        <div className="video-list-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-dot" /> YOUR ORDERED LESSONS</div>
            <h2>Path videos</h2>
          </div>
          <span>
            {videos.length} {videos.length === 1 ? "video" : "videos"}
            {totalDuration > 0 ? ` · ${durationLabel(totalDuration)} total` : ""}
          </span>
        </div>
        {videos.length === 0 ? (
          <div className="learning-path-empty">Your path is empty. Add a YouTube lesson above to get started.</div>
        ) : (
          <ol className="video-list">
            {videos.map((video, index) => {
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;
              return (
                <li
                  key={video.id}
                  className={`video-list-item learning-path-video-item ${isDragging ? "dragging" : ""} ${isDragOver ? "drag-over" : ""}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={() => {
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className="video-row">
                    <span className="drag-handle" title="Drag to reorder" aria-hidden="true">
                      ⋮⋮
                    </span>
                    <span className="video-index">{String(index + 1).padStart(2, "0")}</span>
                    {video.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={video.thumbnail_url} alt="" className="video-thumbnail" loading="lazy" decoding="async" />
                    ) : (
                      <div className="video-thumbnail video-thumbnail-empty">
                        <span>▶</span>
                      </div>
                    )}
                    <div className="video-row-copy">
                      <p>{video.title}</p>
                      <span>
                        {durationLabel(video.duration_seconds)}
                        {video.embeddable === false && " · Watch on YouTube"}
                      </span>
                    </div>
                    <span className={`video-status video-status-${video.status}`}>
                      {video.status === "completed"
                        ? "Complete"
                        : video.status === "in_progress"
                        ? "In progress"
                        : "Not started"}
                    </span>
                    <div className="learning-path-video-actions">
                      <Link href={`/learning-paths/${pathId}/watch/${video.id}`} aria-label={`Study ${video.title}`}>
                        Study
                      </Link>
                      <button
                        type="button"
                        onClick={() => moveVideo(index, -1)}
                        disabled={index === 0 || busy !== ""}
                        aria-label="Move lesson up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveVideo(index, 1)}
                        disabled={index === videos.length - 1 || busy !== ""}
                        aria-label="Move lesson down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeVideo(video.id)}
                        disabled={busy !== ""}
                        aria-label={`Remove ${video.title}`}
                      >
                        {busy === video.id ? "…" : "×"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="learning-path-danger-card">
        <div>
          <h3>Danger Zone</h3>
          <p>Delete &ldquo;{title}&rdquo; and all its sequenced videos permanently.</p>
        </div>
        <button
          type="button"
          onClick={deletePath}
          disabled={busy !== ""}
          className="learning-path-delete-btn"
        >
          {busy === "delete" ? "Deleting..." : "Delete learning path"}
        </button>
      </div>
    </div>
  );
}
