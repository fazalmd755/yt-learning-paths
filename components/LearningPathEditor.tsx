"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileVideoIcon,
  FolderIcon,
  FolderOpenIcon,
  PlayIcon,
} from "@/components/Icons";

export type LearningPathVideo = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  embeddable: boolean;
  status: string;
  playlist_id?: string | null;
  playlist_title?: string | null;
  playlist_thumbnail_url?: string | null;
  playlist_channel_title?: string | null;
};

export type PathPlaylistGroup = {
  type: "playlist";
  playlistId: string;
  title: string;
  channelTitle?: string | null;
  thumbnailUrl?: string | null;
  videos: { video: LearningPathVideo; originalIndex: number }[];
};

export type PathStandaloneVideo = {
  type: "video";
  video: LearningPathVideo;
  originalIndex: number;
};

export type PathTreeItem = PathPlaylistGroup | PathStandaloneVideo;

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

  // Expanded/collapsed state for playlist folders
  const [expandedPlaylists, setExpandedPlaylists] = useState<Record<string, boolean>>({});

  const totalDuration = videos.reduce((acc, v) => acc + (v.duration_seconds || 0), 0);

  // Group videos into Playlist Folders and Standalone Files
  const treeItems = useMemo<PathTreeItem[]>(() => {
    const items: PathTreeItem[] = [];
    let currentPlaylist: PathPlaylistGroup | null = null;

    videos.forEach((video, index) => {
      if (video.playlist_id) {
        if (currentPlaylist && currentPlaylist.playlistId === video.playlist_id) {
          currentPlaylist.videos.push({ video, originalIndex: index });
        } else {
          if (currentPlaylist) {
            items.push(currentPlaylist);
          }
          currentPlaylist = {
            type: "playlist",
            playlistId: video.playlist_id,
            title: video.playlist_title || "Playlist",
            channelTitle: video.playlist_channel_title,
            thumbnailUrl: video.playlist_thumbnail_url,
            videos: [{ video, originalIndex: index }],
          };
        }
      } else {
        if (currentPlaylist) {
          items.push(currentPlaylist);
          currentPlaylist = null;
        }
        items.push({
          type: "video",
          video,
          originalIndex: index,
        });
      }
    });

    if (currentPlaylist) {
      items.push(currentPlaylist);
    }

    return items;
  }, [videos]);

  const playlistCount = treeItems.filter((i) => i.type === "playlist").length;
  const standaloneCount = treeItems.filter((i) => i.type === "video").length;

  function isPlaylistExpanded(playlistId: string): boolean {
    if (expandedPlaylists[playlistId] !== undefined) {
      return expandedPlaylists[playlistId];
    }
    // Collapsed by default so playlist videos are not dumped down the page
    return false;
  }

  function togglePlaylist(playlistId: string) {
    setExpandedPlaylists((prev) => ({
      ...prev,
      [playlistId]: !isPlaylistExpanded(playlistId),
    }));
  }

  function expandAll() {
    const next: Record<string, boolean> = {};
    for (const item of treeItems) {
      if (item.type === "playlist") {
        next[item.playlistId] = true;
      }
    }
    setExpandedPlaylists(next);
  }

  function collapseAll() {
    const next: Record<string, boolean> = {};
    for (const item of treeItems) {
      if (item.type === "playlist") {
        next[item.playlistId] = false;
      }
    }
    setExpandedPlaylists(next);
  }

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

      const newVideos = result.videos.map((video: Omit<LearningPathVideo, "status">) => ({
        ...video,
        status: "not_started",
      }));
      setVideos((current) => [...current, ...newVideos]);
      setUrl("");

      if (result.kind === "playlist") {
        setMessage(`${result.videos.length} videos added as a playlist folder.`);
        // Keep newly added playlist collapsed or expanded as appropriate
        if (result.playlist?.id) {
          setExpandedPlaylists((prev) => ({ ...prev, [result.playlist.id]: false }));
        }
      } else {
        setMessage("Video added to your learning path.");
      }
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

  async function moveTreeGroup(groupIndex: number, direction: -1 | 1) {
    const targetGroupIndex = groupIndex + direction;
    if (targetGroupIndex < 0 || targetGroupIndex >= treeItems.length) return;

    const currentItem = treeItems[groupIndex];
    const targetItem = treeItems[targetGroupIndex];

    const currentVideos = currentItem.type === "playlist"
      ? currentItem.videos.map((v) => v.video)
      : [currentItem.video];

    const targetVideos = targetItem.type === "playlist"
      ? targetItem.videos.map((v) => v.video)
      : [targetItem.video];

    // Find the range of indices in the original flat array
    const firstCurrentIndex = currentItem.type === "playlist"
      ? currentItem.videos[0].originalIndex
      : currentItem.originalIndex;

    const reordered = [...videos];

    if (direction === -1) {
      // Moving up: place currentVideos before targetVideos
      const insertAt = targetItem.type === "playlist"
        ? targetItem.videos[0].originalIndex
        : targetItem.originalIndex;

      // Extract current videos from array
      const currentIds = new Set(currentVideos.map((v) => v.id));
      const remaining = reordered.filter((v) => !currentIds.has(v.id));
      remaining.splice(insertAt, 0, ...currentVideos);
      await persistOrder(remaining);
    } else {
      // Moving down: place currentVideos after targetVideos
      const currentIds = new Set(currentVideos.map((v) => v.id));
      const remaining = reordered.filter((v) => !currentIds.has(v.id));
      const targetLastIndexInRemaining = remaining.findIndex(
        (v) => v.id === targetVideos[targetVideos.length - 1].id
      );
      remaining.splice(targetLastIndexInRemaining + 1, 0, ...currentVideos);
      await persistOrder(remaining);
    }
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

  async function removePlaylist(group: PathPlaylistGroup) {
    if (
      !window.confirm(
        `Remove playlist "${group.title}" (${group.videos.length} videos) from this path?`
      )
    ) {
      return;
    }
    const idsToRemove = group.videos.map((v) => v.video.id);
    setBusy(`playlist-${group.playlistId}`);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/learning-paths/${pathId}/videos?videoIds=${encodeURIComponent(idsToRemove.join(","))}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not remove playlist.");
      const removeSet = new Set(idsToRemove);
      setVideos((current) => current.filter((v) => !removeSet.has(v.id)));
      setMessage(`Removed playlist "${group.title}".`);
      setTimeout(() => setMessage(""), 2500);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not remove playlist.");
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
        <p>Paste a YouTube video or playlist link. Playlists appear as collapsible folders, while single videos appear as individual items.</p>
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
          <div className="path-tree-heading-stats">
            <span>
              {playlistCount > 0 && `${playlistCount} ${playlistCount === 1 ? "playlist" : "playlists"}`}
              {playlistCount > 0 && standaloneCount > 0 && " · "}
              {standaloneCount > 0 && `${standaloneCount} ${standaloneCount === 1 ? "single video" : "single videos"}`}
              {videos.length > 0 && ` (${videos.length} ${videos.length === 1 ? "lesson" : "lessons"}${totalDuration > 0 ? ` · ${durationLabel(totalDuration)}` : ""})`}
            </span>
            {playlistCount > 0 && (
              <div className="path-tree-toggle-actions">
                <button
                  type="button"
                  className="path-tree-btn-subtle"
                  onClick={expandAll}
                  title="Expand all playlist folders"
                >
                  Expand all
                </button>
                <span>/</span>
                <button
                  type="button"
                  className="path-tree-btn-subtle"
                  onClick={collapseAll}
                  title="Collapse all playlist folders"
                >
                  Collapse all
                </button>
              </div>
            )}
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="learning-path-empty">Your path is empty. Add a YouTube video or playlist above to get started.</div>
        ) : (
          <div className="path-tree-view">
            {treeItems.map((item, groupIndex) => {
              if (item.type === "playlist") {
                const isExpanded = isPlaylistExpanded(item.playlistId);
                const groupDuration = item.videos.reduce((acc, v) => acc + (v.video.duration_seconds || 0), 0);
                const completedInGroup = item.videos.filter((v) => v.video.status === "completed").length;
                const nextVideoInGroup = item.videos.find((v) => v.video.status !== "completed") ?? item.videos[0];
                const isBusyGroup = busy === `playlist-${item.playlistId}`;

                return (
                  <div key={item.playlistId} className={`path-tree-folder ${isExpanded ? "is-expanded" : "is-collapsed"}`}>
                    <div
                      className="path-tree-folder-header"
                      onClick={() => togglePlaylist(item.playlistId)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          togglePlaylist(item.playlistId);
                        }
                      }}
                    >
                      <button
                        type="button"
                        className="path-tree-chevron"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlaylist(item.playlistId);
                        }}
                        aria-label={isExpanded ? "Collapse playlist" : "Expand playlist"}
                      >
                        {isExpanded ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
                      </button>

                      <span className="path-tree-folder-icon" aria-hidden="true">
                        {isExpanded ? (
                          <FolderOpenIcon size={20} className="text-amber-400" />
                        ) : (
                          <FolderIcon size={20} className="text-amber-400" />
                        )}
                      </span>

                      {item.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.thumbnailUrl}
                          alt=""
                          className="path-tree-folder-thumb"
                          loading="lazy"
                        />
                      ) : (
                        <div className="path-tree-folder-thumb path-tree-folder-thumb-empty">
                          <PlayIcon size={12} />
                        </div>
                      )}

                      <div className="path-tree-folder-info">
                        <div className="path-tree-folder-title-row">
                          <strong className="path-tree-folder-title">{item.title}</strong>
                          <span className="path-tree-badge">PLAYLIST</span>
                        </div>
                        <div className="path-tree-folder-meta">
                          {item.channelTitle && <span>{item.channelTitle} · </span>}
                          <span>{item.videos.length} videos</span>
                          {groupDuration > 0 && <span> · {durationLabel(groupDuration)}</span>}
                          <span> · {completedInGroup}/{item.videos.length} completed</span>
                        </div>
                      </div>

                      <div className="path-tree-folder-actions" onClick={(e) => e.stopPropagation()}>
                        {nextVideoInGroup && (
                          <Link
                            href={`/learning-paths/${pathId}/watch/${nextVideoInGroup.video.id}`}
                            className="path-tree-study-btn"
                            aria-label={`Study ${item.title}`}
                          >
                            {completedInGroup === item.videos.length ? "Review" : "Study"}
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => moveTreeGroup(groupIndex, -1)}
                          disabled={groupIndex === 0 || busy !== ""}
                          aria-label="Move playlist up"
                          title="Move entire playlist up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTreeGroup(groupIndex, 1)}
                          disabled={groupIndex === treeItems.length - 1 || busy !== ""}
                          aria-label="Move playlist down"
                          title="Move entire playlist down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removePlaylist(item)}
                          disabled={busy !== ""}
                          aria-label={`Remove playlist ${item.title}`}
                          title="Remove entire playlist"
                          className="path-tree-remove-btn"
                        >
                          {isBusyGroup ? "…" : "×"}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="path-tree-folder-children">
                        <ol className="path-tree-children-list">
                          {item.videos.map(({ video, originalIndex }, innerIdx) => {
                            const isDragging = draggedIndex === originalIndex;
                            const isDragOver = dragOverIndex === originalIndex;

                            return (
                              <li
                                key={video.id}
                                className={`path-tree-child-item learning-path-video-item ${isDragging ? "dragging" : ""} ${isDragOver ? "drag-over" : ""}`}
                                draggable
                                onDragStart={() => handleDragStart(originalIndex)}
                                onDragOver={(e) => handleDragOver(e, originalIndex)}
                                onDragEnd={() => {
                                  setDraggedIndex(null);
                                  setDragOverIndex(null);
                                }}
                                onDrop={(e) => handleDrop(e, originalIndex)}
                              >
                                <div className="video-row">
                                  <span className="drag-handle" title="Drag to reorder" aria-hidden="true">
                                    ⋮⋮
                                  </span>
                                  <span className="path-tree-file-icon" aria-hidden="true" title="Video lesson">
                                    <FileVideoIcon size={16} />
                                  </span>
                                  <span className="video-index">{String(innerIdx + 1).padStart(2, "0")}</span>
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
                                      onClick={() => moveVideo(originalIndex, -1)}
                                      disabled={originalIndex === 0 || busy !== ""}
                                      aria-label="Move lesson up"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveVideo(originalIndex, 1)}
                                      disabled={originalIndex === videos.length - 1 || busy !== ""}
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
                      </div>
                    )}
                  </div>
                );
              }

              // Standalone Video (File style)
              const { video, originalIndex } = item;
              const isDragging = draggedIndex === originalIndex;
              const isDragOver = dragOverIndex === originalIndex;

              return (
                <div
                  key={video.id}
                  className={`path-tree-standalone-file learning-path-video-item ${isDragging ? "dragging" : ""} ${isDragOver ? "drag-over" : ""}`}
                  draggable
                  onDragStart={() => handleDragStart(originalIndex)}
                  onDragOver={(e) => handleDragOver(e, originalIndex)}
                  onDragEnd={() => {
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDrop={(e) => handleDrop(e, originalIndex)}
                >
                  <div className="video-row">
                    <span className="drag-handle" title="Drag to reorder" aria-hidden="true">
                      ⋮⋮
                    </span>
                    <span className="path-tree-file-icon" aria-hidden="true" title="Standalone video lesson">
                      <FileVideoIcon size={18} />
                    </span>
                    <span className="video-index">{String(originalIndex + 1).padStart(2, "0")}</span>
                    {video.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={video.thumbnail_url} alt="" className="video-thumbnail" loading="lazy" decoding="async" />
                    ) : (
                      <div className="video-thumbnail video-thumbnail-empty">
                        <span>▶</span>
                      </div>
                    )}
                    <div className="video-row-copy">
                      <div className="flex items-center gap-2">
                        <p>{video.title}</p>
                        <span className="path-tree-file-badge">SINGLE VIDEO</span>
                      </div>
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
                        onClick={() => moveTreeGroup(groupIndex, -1)}
                        disabled={groupIndex === 0 || busy !== ""}
                        aria-label="Move lesson up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTreeGroup(groupIndex, 1)}
                        disabled={groupIndex === treeItems.length - 1 || busy !== ""}
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
                </div>
              );
            })}
          </div>
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
