"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpenIcon, ArrowRightIcon, PlayIcon, ShareIcon } from "@/components/Icons";
import type { CuratedTrack } from "@/lib/roadmaps";

const CATEGORIES = [
  { id: "all", label: "All Paths" },
  { id: "webdev", label: "🌐 Web Dev" },
  { id: "python", label: "🐍 Python & AI" },
  { id: "dsa", label: "⚡ DSA & LeetCode" },
  { id: "design", label: "🎨 UI/UX Design" },
  { id: "mobile", label: "📱 Mobile Apps" },
];

export default function RoadmapsClient({ tracks }: { tracks: CuratedTrack[] }) {
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  const filteredTracks = tracks.filter((track) => {
    const matchesCat = selectedCat === "all" || track.category === selectedCat;
    const matchesSearch =
      searchQuery.trim() === "" ||
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleEnroll = async (track: CuratedTrack) => {
    setLoadingTrackId(track.id);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: track.playlistUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/courses/${data.courseId}`);
      } else {
        const err = await res.json();
        alert(err.error || "Could not add course. Please try again.");
      }
    } catch {
      alert("Failed to enroll in roadmap. Please check your internet connection.");
    } finally {
      setLoadingTrackId(null);
    }
  };

  return (
    <div className="roadmaps-content-wrap">
      {/* Search & Filter Toolbar */}
      <div className="roadmaps-toolbar">
        <div className="roadmaps-search-box">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracks by skill, keyword, or creator..."
            className="roadmaps-search-input"
          />
        </div>

        <div className="roadmaps-cat-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.id)}
              className={`roadmap-cat-pill ${selectedCat === cat.id ? "active" : ""}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Roadmaps */}
      <div className="roadmaps-grid">
        {filteredTracks.map((track) => {
          const isLoading = loadingTrackId === track.id;

          return (
            <article key={track.id} className="roadmap-card">
              <div className="roadmap-card-top">
                <span className="roadmap-level-tag">{track.level}</span>
                <span className="roadmap-stats-meta">
                  {track.lessonCount} lessons · {track.estimatedHours}
                </span>
              </div>

              <h2 className="roadmap-card-title">{track.title}</h2>
              <p className="roadmap-creator">by {track.creator}</p>
              <p className="roadmap-desc">{track.description}</p>

              <div className="roadmap-tags-wrap">
                {track.tags.map((tag) => (
                  <span key={tag} className="roadmap-tag">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="roadmap-card-footer flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/5">
                <Link
                  href={`/roadmap/${track.id}`}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition"
                >
                  <BookOpenIcon size={14} />
                  <span>Syllabus & Share</span>
                </Link>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleEnroll(track)}
                  className="roadmap-enroll-btn"
                >
                  {isLoading ? (
                    "Adding to library..."
                  ) : (
                    <>
                      Add to Library <ArrowRightIcon size={14} />
                    </>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {filteredTracks.length === 0 && (
        <div className="roadmaps-empty">
          <p>No roadmaps match your search. Try different keywords or clear your filter.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedCat("all");
              setSearchQuery("");
            }}
            className="button-text underline text-emerald-400"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
}
