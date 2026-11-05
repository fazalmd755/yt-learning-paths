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

export default function CourseLibrary({ courses, initialQuery = "" }: { courses: CourseSummary[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<Filter>("all");
  useEffect(() => setQuery(initialQuery), [initialQuery]);
  const counts = useMemo(() => ({
    all: courses.length,
    in_progress: courses.filter((course) => course.completedVideos > 0 && course.completedVideos < course.totalVideos).length,
    not_started: courses.filter((course) => course.completedVideos === 0).length,
    completed: courses.filter((course) => course.totalVideos > 0 && course.completedVideos === course.totalVideos).length,
  }), [courses]);

  const visibleCourses = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return courses.filter((course) => {
      const matchesQuery = !needle || `${course.title} ${course.channelTitle ?? ""}`.toLocaleLowerCase().includes(needle);
      const matchesFilter = filter === "all"
        || (filter === "in_progress" && course.completedVideos > 0 && course.completedVideos < course.totalVideos)
        || (filter === "not_started" && course.completedVideos === 0)
        || (filter === "completed" && course.totalVideos > 0 && course.completedVideos === course.totalVideos);
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
              {item.label}<span>{counts[item.id]}</span>
            </button>
          ))}
        </div>
        <label className="course-search">
          <SearchIcon size={15} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search courses or channels..."
            aria-label="Search courses or channels"
          />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
        </label>
      </div>

      {visibleCourses.length === 0 ? (
        <div className="library-empty">
          <SearchIcon size={32} className="library-empty-icon" />
          <strong>{courses.length ? "No courses match your search" : "Your library is ready"}</strong>
          <p>{courses.length ? "Try a different search term or filter." : "Add a YouTube playlist link above to start your first structured path."}</p>
        </div>
      ) : (
        <div className="course-grid">
          {visibleCourses.map((course) => {
            const pct = course.totalVideos ? Math.round((course.completedVideos / course.totalVideos) * 100) : 0;
            const complete = course.totalVideos > 0 && course.completedVideos === course.totalVideos;
            return (
              <div key={course.id} className="course-card-shell">
                <Link href={`/courses/${course.id}`} className="course-card">
                  <div className="course-art">
                    {course.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.thumbnailUrl} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <div className="course-art-placeholder">
                        <PlayIcon size={28} />
                      </div>
                    )}
                    <span className={`course-status ${complete ? "course-status-done" : ""}`}>
                      {complete ? "✓ Complete" : pct > 0 ? "In progress" : "Not started"}
                    </span>
                    <span className="course-art-arrow" aria-hidden="true">
                      <ArrowRightIcon size={14} />
                    </span>
                  </div>
                  <div className="course-card-body">
                    <p className="course-channel">{course.channelTitle || "YouTube course"}</p>
                    <h3>{course.title}</h3>
                    <div className="course-progress-meta">
                      <span>{course.completedVideos} / {course.totalVideos} videos</span>
                      <strong>{pct}%</strong>
                    </div>
                    <ProgressBar value={pct} className="course-progress" />
                    <div className="course-card-footer">
                      <span>{formatDuration(Math.max(0, course.totalSeconds - course.completedSeconds))} left</span>
                      <span>{complete ? "Review course" : "Continue"} <ArrowRightIcon size={12} className="inline-block ml-1" /></span>
                    </div>
                  </div>
                </Link>
                <form action={removeCourse} className="course-card-remove">
                  <input type="hidden" name="courseId" value={course.id} />
                  <button type="submit" className="course-remove-button" aria-label={`Remove ${course.title} from your library`}>
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
