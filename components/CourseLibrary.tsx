"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { removeCourse } from "@/app/dashboard/actions";
import { ArrowRightIcon, PlayIcon, SearchIcon } from "@/components/Icons";
import type { CourseSummary } from "@/lib/data";
import { formatDuration } from "@/lib/utils";
import ProgressBar from "./ProgressBar";

type Filter = "all" | "in_progress" | "not_started" | "completed";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All courses" },
  { id: "in_progress", label: "In progress" },
  { id: "not_started", label: "Not started" },
  { id: "completed", label: "Complete" },
];

export default function CourseLibrary({
  courses,
  initialQuery = "",
}: {
  courses: CourseSummary[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<Filter>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  const counts = useMemo(
    () => ({
      all: courses.length,
      in_progress: courses.filter(
        (course) => course.completedVideos > 0 && course.completedVideos < course.totalVideos
      ).length,
      not_started: courses.filter((course) => course.completedVideos === 0).length,
      completed: courses.filter(
        (course) => course.totalVideos > 0 && course.completedVideos === course.totalVideos
      ).length,
    }),
    [courses]
  );

  const visibleCourses = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return courses.filter((course) => {
      const matchesQuery =
        !needle ||
        `${course.title} ${course.channelTitle ?? ""}`.toLocaleLowerCase().includes(needle);
      const matchesFilter =
        filter === "all" ||
        (filter === "in_progress" &&
          course.completedVideos > 0 &&
          course.completedVideos < course.totalVideos) ||
        (filter === "not_started" && course.completedVideos === 0) ||
        (filter === "completed" &&
          course.totalVideos > 0 &&
          course.completedVideos === course.totalVideos);
      return matchesQuery && matchesFilter;
    });
  }, [courses, filter, query]);

  return (
    <section className="course-library">
      <div className="library-toolbar">
        <div className="filter-list" aria-label="Course status filter">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              aria-pressed={filter === item.id}
              className={`filter-chip ${filter === item.id ? "filter-chip-active" : ""}`}
            >
              {item.label}
              <span>{counts[item.id]}</span>
            </button>
          ))}
        </div>

        <div className="library-toolbar-right">
          <label className="course-search">
            <SearchIcon size={14} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search courses..."
              aria-label="Search courses or channels"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                ×
              </button>
            )}
          </label>

          {/* View mode toggle */}
          <div className="view-mode-toggle" aria-label="View mode">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`view-mode-btn ${viewMode === "grid" ? "active" : ""}`}
              title="Grid view"
              aria-label="Grid view"
            >
              ⊞
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`view-mode-btn ${viewMode === "list" ? "active" : ""}`}
              title="Compact list view"
              aria-label="Compact list view"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {visibleCourses.length === 0 ? (
        <div className="library-empty">
          <SearchIcon size={28} className="library-empty-icon" />
          <strong>{courses.length ? "No courses match your search" : "Your library is ready"}</strong>
          <p>
            {courses.length
              ? "Try a different search term or filter."
              : "Paste any YouTube playlist or video link above to start your first course."}
          </p>
        </div>
      ) : viewMode === "list" ? (
        /* Compact List View */
        <div className="course-list-view">
          {visibleCourses.map((course) => {
            const pct = course.totalVideos
              ? Math.round((course.completedVideos / course.totalVideos) * 100)
              : 0;
            const complete =
              course.totalVideos > 0 && course.completedVideos === course.totalVideos;

            return (
              <div key={course.id} className="course-list-item">
                <Link href={`/courses/${course.id}`} className="course-list-link">
                  <div className="course-list-art">
                    {course.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.thumbnailUrl} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <div className="course-list-placeholder">
                        <PlayIcon size={16} />
                      </div>
                    )}
                    <span className={`course-list-status ${complete ? "done" : ""}`}>
                      {complete ? "✓" : `${pct}%`}
                    </span>
                  </div>

                  <div className="course-list-info">
                    <span className="course-list-channel">
                      {course.channelTitle || "YouTube"}
                    </span>
                    <h3 className="course-list-title" title={course.title}>
                      {course.title}
                    </h3>
                  </div>

                  <div className="course-list-progress-col">
                    <div className="course-list-meta">
                      <span>
                        {course.completedVideos}/{course.totalVideos} videos
                      </span>
                      <span>
                        {formatDuration(
                          Math.max(0, course.totalSeconds - course.completedSeconds)
                        )}{" "}
                        left
                      </span>
                    </div>
                    <ProgressBar value={pct} className="course-progress" />
                  </div>

                  <div className="course-list-action">
                    <span>{complete ? "Review" : "Continue"}</span>
                    <ArrowRightIcon size={12} />
                  </div>
                </Link>

                <form action={removeCourse} className="course-list-remove-form">
                  <input type="hidden" name="courseId" value={course.id} />
                  <button
                    type="submit"
                    className="course-list-remove-btn"
                    title={`Remove ${course.title}`}
                    aria-label={`Remove ${course.title}`}
                  >
                    ×
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact Grid View */
        <div className="course-grid">
          {visibleCourses.map((course) => {
            const pct = course.totalVideos
              ? Math.round((course.completedVideos / course.totalVideos) * 100)
              : 0;
            const complete =
              course.totalVideos > 0 && course.completedVideos === course.totalVideos;
            return (
              <div key={course.id} className="course-card-shell">
                <Link href={`/courses/${course.id}`} className="course-card">
                  <div className="course-art">
                    {course.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.thumbnailUrl} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <div className="course-art-placeholder">
                        <PlayIcon size={24} />
                      </div>
                    )}
                    <span className={`course-status ${complete ? "course-status-done" : ""}`}>
                      {complete ? "✓ Complete" : pct > 0 ? "In progress" : "Not started"}
                    </span>
                    <span className="course-art-arrow" aria-hidden="true">
                      <ArrowRightIcon size={13} />
                    </span>
                  </div>
                  <div className="course-card-body">
                    <p className="course-channel">{course.channelTitle || "YouTube course"}</p>
                    <h3>{course.title}</h3>
                    <div className="course-progress-meta">
                      <span>
                        {course.completedVideos} / {course.totalVideos} videos
                      </span>
                      <strong>{pct}%</strong>
                    </div>
                    <ProgressBar value={pct} className="course-progress" />
                    <div className="course-card-footer">
                      <span>
                        {formatDuration(
                          Math.max(0, course.totalSeconds - course.completedSeconds)
                        )}{" "}
                        left
                      </span>
                      <span>
                        {complete ? "Review course" : "Continue"}{" "}
                        <ArrowRightIcon size={11} className="inline-block ml-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
                <form action={removeCourse} className="course-card-remove">
                  <input type="hidden" name="courseId" value={course.id} />
                  <button
                    type="submit"
                    className="course-remove-button"
                    aria-label={`Remove ${course.title} from your library`}
                  >
                    Remove
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
