"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  youtubePlaylistId: string;
};

export default function SyncPlaylistButton({ youtubePlaylistId }: Props) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  const isPlaylist = !youtubePlaylistId.startsWith("video_");

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    setMessage("");

    try {
      const url = isPlaylist
        ? `https://www.youtube.com/playlist?list=${youtubePlaylistId}`
        : `https://www.youtube.com/watch?v=${youtubePlaylistId.replace(/^video_/, "")}`;

      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, refresh: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync playlist.");

      setMessage("Synced! ✓");
      router.refresh();
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(err?.message || "Sync failed.");
      setTimeout(() => setMessage(""), 4000);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="sync-playlist-wrapper">
      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        className="sync-playlist-btn"
        title="Check YouTube for new or updated videos in this playlist"
      >
        <span className={`sync-playlist-icon ${syncing ? "syncing" : ""}`} aria-hidden="true">
          ↻
        </span>
        <span>{syncing ? "Syncing..." : "Sync latest videos"}</span>
      </button>
      {message && <span className="sync-playlist-status">{message}</span>}
    </div>
  );
}
