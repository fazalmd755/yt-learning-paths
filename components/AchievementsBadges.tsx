"use client";

import { useMemo, useState } from "react";

interface Badge {
  id: string;
  icon: string;
  title: string;
  shortTitle: string;
  description: string;
  current: number;
  target: number;
  unit: string;
}

interface Props {
  streak: number;
  maxStreak?: number;
  finishedCourses: number;
  totalSecondsLearned?: number;
}

export default function AchievementsBadges({
  streak,
  maxStreak = 0,
  finishedCourses,
  totalSecondsLearned = 0,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const bestStreak = Math.max(streak, maxStreak);
  const totalHours = Math.floor(totalSecondsLearned / 3600);

  // Exactly the 5 requested badges
  const badges: Badge[] = useMemo(
    () => [
      {
        id: "streak_30",
        icon: "🔥",
        title: "30-Day Flame",
        shortTitle: "30d Flame",
        description: "Maintain a continuous 30-day learning streak",
        current: bestStreak,
        target: 30,
        unit: "days",
      },
      {
        id: "courses_5",
        icon: "🎓",
        title: "5 Courses Completed",
        shortTitle: "5 Courses",
        description: "Complete 100% of 5 video courses or playlists",
        current: finishedCourses,
        target: 5,
        unit: "courses",
      },
      {
        id: "courses_10",
        icon: "🏆",
        title: "10 Courses Completed",
        shortTitle: "10 Courses",
        description: "Complete 100% of 10 video courses or playlists",
        current: finishedCourses,
        target: 10,
        unit: "courses",
      },
      {
        id: "study_50h",
        icon: "⚡",
        title: "50 Hours Study",
        shortTitle: "50h Study",
        description: "Complete 50 hours of total focused video study time",
        current: totalHours,
        target: 50,
        unit: "hours",
      },
      {
        id: "study_100h",
        icon: "👑",
        title: "100 Hours Study",
        shortTitle: "100h Study",
        description: "Complete 100 hours of total focused video study time",
        current: totalHours,
        target: 100,
        unit: "hours",
      },
    ],
    [bestStreak, finishedCourses, totalHours]
  );

  const unlockedCount = badges.filter((b) => b.current >= b.target).length;

  return (
    <>
      {/* LeetCode-style Badges Widget with Exactly 5 Badges */}
      <div className="leetcode-badges-card">
        <div className="leetcode-badges-header">
          <div className="flex items-center gap-1.5">
            <span className="leetcode-badges-title">Badges</span>
            <span className="leetcode-badges-count">
              {unlockedCount} / {badges.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="leetcode-badges-all-btn"
          >
            Details ↗
          </button>
        </div>

        {/* 5 Badges Grid: Earned are fully unlocked, unearned are locked */}
        <div className="badges-five-grid">
          {badges.map((b) => {
            const isUnlocked = b.current >= b.target;
            const progress = Math.min(100, Math.round((b.current / b.target) * 100));

            return (
              <div
                key={b.id}
                onClick={() => setModalOpen(true)}
                className={`badge-five-item cursor-pointer ${
                  isUnlocked ? "unlocked" : "locked"
                }`}
                title={`${b.title}: ${b.description} (${
                  isUnlocked ? "Unlocked ✓" : `${b.current}/${b.target} ${b.unit}`
                })`}
              >
                <div className="badge-five-icon-wrap">
                  <span className="badge-five-icon">{b.icon}</span>
                  {!isUnlocked && <span className="badge-lock-icon">🔒</span>}
                </div>

                <span className="badge-five-label">{b.shortTitle}</span>

                {isUnlocked ? (
                  <span className="badge-status-tag unlocked">✓</span>
                ) : (
                  <div className="badge-mini-bar" title={`${b.current}/${b.target} ${b.unit}`}>
                    <div
                      className="badge-mini-bar-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Dialog Showing Details of All 5 Badges */}
      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-card leetcode-badges-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <div>
                  <h3 className="text-base font-bold text-white">Achievements & Badges</h3>
                  <p className="text-xs text-zinc-400">
                    {unlockedCount} of {badges.length} badges earned
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xl p-1"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="achievements-modal-list mt-4 flex flex-col gap-3">
              {badges.map((b) => {
                const isUnlocked = b.current >= b.target;
                const progress = Math.min(100, Math.round((b.current / b.target) * 100));

                return (
                  <div
                    key={b.id}
                    className={`achievement-badge-card ${
                      isUnlocked ? "unlocked" : "locked"
                    }`}
                  >
                    <div className="badge-card-top flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="badge-emoji text-2xl">{b.icon}</span>
                        <div>
                          <strong className="badge-title text-sm text-white block">
                            {b.title}
                          </strong>
                          <span className="text-[11px] text-zinc-400">
                            {b.description}
                          </span>
                        </div>
                      </div>

                      {isUnlocked ? (
                        <span className="badge-status-pill unlocked text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                          ✓ Earned
                        </span>
                      ) : (
                        <span className="badge-status-pill locked text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium border border-zinc-700">
                          🔒 {b.current} / {b.target} {b.unit}
                        </span>
                      )}
                    </div>

                    {!isUnlocked && (
                      <div className="badge-progress-track mt-2.5">
                        <div
                          className="badge-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
