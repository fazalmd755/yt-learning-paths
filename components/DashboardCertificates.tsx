"use client";

import { useMemo, useState } from "react";
import type { CourseSummary } from "@/lib/data";
import { CertificateModal } from "@/components/CourseCertificate";

interface Props {
  courses: CourseSummary[];
  userName?: string;
}

export default function DashboardCertificates({ courses, userName = "Learner" }: Props) {
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [activeCourse, setActiveCourse] = useState<CourseSummary | null>(null);

  const completedCourses = useMemo(
    () => courses.filter((c) => c.completedVideos === c.totalVideos && c.totalVideos > 0),
    [courses]
  );

  const inProgressCourses = useMemo(
    () =>
      courses
        .filter((c) => c.completedVideos < c.totalVideos && c.totalVideos > 0)
        .sort((a, b) => b.completedVideos / b.totalVideos - a.completedVideos / a.totalVideos),
    [courses]
  );

  const earnedCount = completedCourses.length;
  const totalCourses = courses.length;

  // The featured certificate to display on the main card (latest completed, or closest in-progress)
  const featuredEarned = completedCourses[0] ?? null;
  const featuredInProgress = inProgressCourses[0] ?? null;

  return (
    <>
      {/* LeetCode-style Certificates Card (replaces Badges widget) */}
      <div className="leetcode-badges-card leetcode-certificates-card">
        <div className="leetcode-badges-header">
          <div className="flex items-center gap-1.5">
            <span className="text-base" aria-hidden="true">🎓</span>
            <span className="leetcode-badges-title">Certificates</span>
            <span
              className={`leetcode-badges-count ${
                earnedCount > 0 ? "cert-count-earned" : ""
              }`}
            >
              {earnedCount} {earnedCount === 1 ? "Earned" : "Earned"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDetailsModalOpen(true)}
            className="leetcode-badges-all-btn"
            title="View all course certificates"
          >
            {totalCourses > 0 ? `All (${totalCourses}) ↗` : "Details ↗"}
          </button>
        </div>

        {/* LeetCode-style Compact Content */}
        {earnedCount > 0 && featuredEarned ? (
          <div className="flex-1 flex flex-col justify-between">
            {/* Featured Earned Certificate Mini Badge */}
            <div
              onClick={() => setActiveCourse(featuredEarned)}
              className="leetcode-featured-badge-row cursor-pointer group"
              title={`Click to view & download certificate for "${featuredEarned.title}"`}
            >
              <div className="leetcode-badge-circle unlocked cert-medallion-circle">
                <span className="leetcode-badge-emoji">🎓</span>
                <span className="cert-verified-star" title="Verified Credential">★</span>
              </div>
              <div className="leetcode-featured-info">
                <div className="flex items-center gap-1">
                  <span className="leetcode-featured-name" title={featuredEarned.title}>
                    {featuredEarned.title}
                  </span>
                </div>
                <span className="leetcode-featured-caption text-emerald-400 font-medium">
                  ✓ Verified Certificate • 100% Completed
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-amber-300 transition-colors">
                  Click to view & download ↗
                </span>
              </div>
            </div>

            {/* Tray of other certificates / in-progress badges */}
            <div className="leetcode-badges-tray">
              {courses.slice(0, 5).map((c) => {
                const isFinished = c.completedVideos === c.totalVideos && c.totalVideos > 0;
                const pct = c.totalVideos > 0 ? Math.round((c.completedVideos / c.totalVideos) * 100) : 0;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCourse(c)}
                    className={`leetcode-tray-icon ${
                      isFinished ? "unlocked" : "locked"
                    }`}
                    title={`${c.title} (${
                      isFinished ? "100% Completed - Certificate Unlocked" : `${pct}% completed - Locked`
                    })`}
                  >
                    <span>{isFinished ? "🎓" : "🔒"}</span>
                  </button>
                );
              })}
              {courses.length > 5 && (
                <button
                  type="button"
                  onClick={() => setDetailsModalOpen(true)}
                  className="leetcode-tray-icon more-btn"
                  title="View all certificates"
                >
                  +{courses.length - 5}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            {/* Empty / In-Progress State (LeetCode-style locked badge) */}
            <div
              onClick={() => (featuredInProgress ? setActiveCourse(featuredInProgress) : setDetailsModalOpen(true))}
              className="leetcode-featured-badge-row cursor-pointer group"
              title={
                featuredInProgress
                  ? `In Progress: "${featuredInProgress.title}" (Click to preview locked certificate)`
                  : "Complete 100% of any course to earn your verified certificate"
              }
            >
              <div className="leetcode-badge-circle locked">
                <span className="leetcode-badge-emoji">📜</span>
                <span className="cert-lock-sub-icon">🔒</span>
              </div>
              <div className="leetcode-featured-info">
                {featuredInProgress ? (
                  <>
                    <span className="leetcode-featured-name" title={featuredInProgress.title}>
                      {featuredInProgress.title}
                    </span>
                    <span className="leetcode-featured-caption text-amber-400/90 font-medium">
                      🔒 In Progress ({featuredInProgress.completedVideos}/{featuredInProgress.totalVideos} lessons)
                    </span>
                    <span className="text-[10px] text-slate-400 group-hover:text-amber-300 transition-colors">
                      Click to preview locked certificate ↗
                    </span>
                  </>
                ) : (
                  <>
                    <span className="leetcode-featured-name">
                      No Certificates Yet
                    </span>
                    <span className="leetcode-featured-caption">
                      Complete 100% of a course to earn
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Tray showing in-progress locked badges or helper tip */}
            {inProgressCourses.length > 0 ? (
              <div className="leetcode-badges-tray">
                {inProgressCourses.slice(0, 5).map((c) => {
                  const pct = c.totalVideos > 0 ? Math.round((c.completedVideos / c.totalVideos) * 100) : 0;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveCourse(c)}
                      className="leetcode-tray-icon locked"
                      title={`${c.title} (${pct}% completed - Locked Preview)`}
                    >
                      <span>🔒</span>
                    </button>
                  );
                })}
                {inProgressCourses.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setDetailsModalOpen(true)}
                    className="leetcode-tray-icon more-btn"
                    title="View all course certificates"
                  >
                    +{inProgressCourses.length - 5}
                  </button>
                )}
              </div>
            ) : (
              <div className="pt-2 border-t border-white/5">
                <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 text-center">
                  Finish all lessons in a course to unlock your credentials
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details Modal showing all certificates and progress */}
      {detailsModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setDetailsModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-card leetcode-badges-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Course Certificates
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {earnedCount} of {totalCourses} certificates earned
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white text-xl p-1"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="achievements-modal-list mt-4 flex flex-col gap-3">
              {courses.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl block mb-2">📜</span>
                  <p className="text-sm text-slate-300 font-medium">No courses added yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Add a YouTube playlist or course to start learning and earning certificates.
                  </p>
                </div>
              ) : (
                courses.map((c) => {
                  const isFinished = c.completedVideos === c.totalVideos && c.totalVideos > 0;
                  const pct = c.totalVideos > 0 ? Math.round((c.completedVideos / c.totalVideos) * 100) : 0;

                  return (
                    <div
                      key={c.id}
                      className={`achievement-badge-card cert-item-card ${
                        isFinished ? "unlocked" : "locked"
                      }`}
                    >
                      <div className="badge-card-top flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`cert-item-icon-box ${isFinished ? "unlocked" : "locked"}`}>
                            <span>{isFinished ? "🎓" : "🔒"}</span>
                          </div>
                          <div className="min-w-0">
                            <strong className="badge-title text-sm text-slate-900 dark:text-white block truncate">
                              {c.title}
                            </strong>
                            <span className="text-[11px] text-slate-500 dark:text-zinc-400 block truncate">
                              {c.channelTitle ? `By ${c.channelTitle} · ` : ""}
                              {c.completedVideos} of {c.totalVideos} lessons completed
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isFinished ? (
                            <span className="badge-status-pill unlocked text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-400/40">
                              ✓ Earned
                            </span>
                          ) : (
                            <span className="badge-status-pill locked text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400/90 font-medium border border-amber-500/20">
                              🔒 {pct}%
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setActiveCourse(c);
                              setDetailsModalOpen(false);
                            }}
                            className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                              isFinished
                                ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                            }`}
                          >
                            {isFinished ? "View Certificate ↗" : "Preview (Locked) ↗"}
                          </button>
                        </div>
                      </div>

                      {!isFinished && (
                        <div className="badge-progress-track mt-2.5">
                          <div
                            className="badge-progress-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Standalone Full Certificate View / Preview Modal */}
      {activeCourse && (
        <CertificateModal
          isOpen={true}
          onClose={() => setActiveCourse(null)}
          courseTitle={activeCourse.title}
          channelTitle={activeCourse.channelTitle}
          userName={userName}
          totalLessons={activeCourse.totalVideos}
          completedLessons={activeCourse.completedVideos}
          isCompleted={activeCourse.completedVideos === activeCourse.totalVideos && activeCourse.totalVideos > 0}
        />
      )}
    </>
  );
}
