"use client";

import { useMemo, useState } from "react";

interface Badge {
  id: string;
  icon: string;
  title: string;
  description: string;
  current: number;
  target: number;
  unit: string;
}

interface Props {
  streak: number;
  totalActiveDays: number;
  completedVideos: number;
  totalCourses: number;
  finishedCourses: number;
}

export default function AchievementsBadges({
  streak,
  totalActiveDays,
  completedVideos,
  totalCourses,
  finishedCourses,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const badges: Badge[] = useMemo(
    () => [
      {
        id: "streak_7",
        icon: "🔥",
        title: "7-Day Flame",
        description: "Build a consistent 7-day learning streak",
        current: streak,
        target: 7,
        unit: "days",
      },
      {
        id: "first_course",
        icon: "🎓",
        title: "First Finisher",
        description: "Complete 100% of any video course",
        current: finishedCourses,
        target: 1,
        unit: "course",
      },
      {
        id: "curator",
        icon: "📚",
        title: "Library Curator",
        description: "Add 3 or more courses to your library",
        current: totalCourses,
        target: 3,
        unit: "courses",
      },
      {
        id: "active_14",
        icon: "⚡",
        title: "Momentum",
        description: "Log learning activity across 14 days",
        current: totalActiveDays,
        target: 14,
        unit: "days",
      },
      {
        id: "lessons_15",
        icon: "🚀",
        title: "Fast Learner",
        description: "Complete 15 video lessons",
        current: completedVideos,
        target: 15,
        unit: "lessons",
      },
      {
        id: "mastery_50",
        icon: "👑",
        title: "Course Master",
        description: "Complete 50 video lessons",
        current: completedVideos,
        target: 50,
        unit: "lessons",
      },
    ],
    [streak, finishedCourses, totalCourses, totalActiveDays, completedVideos]
  );

  const unlockedBadges = useMemo(
    () => badges.filter((b) => b.current >= b.target),
    [badges]
  );
  const unlockedCount = unlockedBadges.length;

  // Recent or featured badge: either highest unlocked badge or first badge to unlock
  const featuredBadge = useMemo(() => {
    if (unlockedBadges.length > 0) {
      return {
        badge: unlockedBadges[unlockedBadges.length - 1],
        isUnlocked: true,
      };
    }
    return {
      badge: badges[0],
      isUnlocked: false,
    };
  }, [unlockedBadges, badges]);

  return (
    <>
      {/* LeetCode-style Badges Widget */}
      <div className="leetcode-badges-card">
        <div className="leetcode-badges-header">
          <div className="flex items-center gap-1.5">
            <span className="leetcode-badges-title">Badges</span>
            <span className="leetcode-badges-count">{unlockedCount}</span>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="leetcode-badges-all-btn"
          >
            All Badges ↗
          </button>
        </div>

        {/* Featured Badge Spotlight */}
        <div
          className="leetcode-featured-badge-row cursor-pointer"
          onClick={() => setModalOpen(true)}
          title="Click to view all badges"
        >
          <div
            className={`leetcode-badge-circle ${
              featuredBadge.isUnlocked ? "unlocked" : "locked"
            }`}
          >
            <span className="leetcode-badge-emoji">{featuredBadge.badge.icon}</span>
          </div>

          <div className="leetcode-featured-info">
            <strong className="leetcode-featured-name">
              {featuredBadge.badge.title}
            </strong>
            <span className="leetcode-featured-caption">
              {featuredBadge.isUnlocked
                ? "Most Recent Badge"
                : `${featuredBadge.badge.current}/${featuredBadge.badge.target} ${featuredBadge.badge.unit} to unlock`}
            </span>
          </div>
        </div>

        {/* Mini Preview of other Badges */}
        <div className="leetcode-badges-tray">
          {badges.map((b) => {
            const isUnlocked = b.current >= b.target;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setModalOpen(true)}
                className={`leetcode-tray-icon ${isUnlocked ? "unlocked" : "locked"}`}
                title={`${b.title}: ${b.description} (${isUnlocked ? "Unlocked ✓" : `${b.current}/${b.target}`})`}
              >
                {b.icon}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal Dialog for All Badges */}
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
                    {unlockedCount} of {badges.length} badges unlocked
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

            <div className="achievements-grid mt-4">
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
                    <div className="badge-card-top">
                      <span className="badge-emoji">{b.icon}</span>
                      {isUnlocked ? (
                        <span className="badge-status-pill unlocked">✓ Unlocked</span>
                      ) : (
                        <span className="badge-status-pill locked">
                          {b.current} / {b.target} {b.unit}
                        </span>
                      )}
                    </div>

                    <strong className="badge-title">{b.title}</strong>
                    <p className="badge-desc">{b.description}</p>

                    {!isUnlocked && (
                      <div className="badge-progress-track">
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
