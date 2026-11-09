"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import CourseLessonScheduleButton from "./CourseLessonScheduleButton";
import { PlayIcon, SearchIcon } from "./Icons";
import { formatDuration } from "@/lib/utils";

export interface CourseLessonItem {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  duration_seconds?: number;
  embeddable?: boolean;
  status: "completed" | "in_progress" | "not_started" | string;
  originalIndex: number;
}

interface Props {
  courseId: string;
  courseTitle: string;
  userId: string;
  lessons: CourseLessonItem[];
}

export default function CourseLessonList({
  courseId,
  courseTitle,
  userId,
  lessons,
}: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");

  const completedCount = useMemo(
    () => lessons.filter((l) => l.status === "completed").length,
    [lessons]
  );
  const pendingCount = lessons.length - completedCount;

  const filteredLessons = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lessons.filter((lesson) => {
      // Status filter
      if (statusFilter === "completed" && lesson.status !== "completed") return false;
      if (statusFilter === "pending" && lesson.status === "completed") return false;

      // Query filter
      if (q && !lesson.title.toLowerCase().includes(q)) return false;

      return true;
    });
  }, [lessons, query, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-zinc-900/40 p-3 backdrop-blur-sm">
        {/* Search input */}
        <div className="relative flex-1">
          <SearchIcon
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons by topic or keyword..."
            className="w-full rounded-lg border border-white/10 bg-zinc-950/60 pl-9 pr-8 py-2 text-xs md:text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              statusFilter === "all"
                ? "bg-white/15 text-white shadow-sm"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            All ({lessons.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              statusFilter === "pending"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("completed")}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              statusFilter === "completed"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* Lesson List */}
      {filteredLessons.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-zinc-900/30 p-8 text-center text-zinc-400">
          <p className="text-sm">No lessons match your search criteria.</p>
          {(query || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
              }}
              className="mt-3 inline-flex items-center rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <ol className="video-list">
          {filteredLessons.map((v) => (
            <li key={v.id} className="video-list-item">
              <div className="video-row">
                <Link href={`/watch/${courseId}/${v.id}`} className="video-row-link">
                  <span className="video-index">
                    {String(v.originalIndex + 1).padStart(2, "0")}
                  </span>
                  {v.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.thumbnail_url}
                      alt=""
                      className="video-thumbnail"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="video-thumbnail video-thumbnail-empty">
                      <PlayIcon size={16} />
                    </div>
                  )}
                  <div className="video-row-copy">
                    <p>{v.title}</p>
                    <span>
                      {formatDuration(v.duration_seconds ?? 0)}
                      {v.embeddable === false && " · Watch on YouTube"}
                    </span>
                  </div>
                </Link>
                <div className="video-row-actions">
                  <CourseLessonScheduleButton
                    userId={userId}
                    videoTitle={v.title}
                    courseTitle={courseTitle}
                    watchUrl={`/watch/${courseId}/${v.id}`}
                  />
                  <Link
                    href={`/watch/${courseId}/${v.id}`}
                    className={`video-status video-status-${v.status}`}
                  >
                    {v.status === "completed"
                      ? "Complete"
                      : v.status === "in_progress"
                      ? "In progress"
                      : "Not started"}
                  </Link>
                  <Link
                    href={`/watch/${courseId}/${v.id}`}
                    className="video-row-arrow"
                    aria-hidden="true"
                  >
                    →
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
