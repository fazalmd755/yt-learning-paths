"use client";

import { useState } from "react";

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
  const [expanded, setExpanded] = useState(false);

  const badges: Badge[] = [
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
  ];

  const unlockedCount = badges.filter((b) => b.current >= b.target).length;

  return (
    <div className="achievements-compact-container">
      <div className="achievements-compact-header">
        <div className="achievements-compact-left">
          <span className="achievements-compact-trophy">🏆</span>
          <span className="achievements-compact-label">Achievements</span>
          <span className="achievements-counter">
            {unlockedCount} / {badges.length}
          </span>
          {/* Quick preview of unlocked or next badge */}
          <div className="achievements-preview-pills">
            {badges.slice(0, 3).map((b) => {
              const isUnlocked = b.current >= b.target;
              return (
                <span
                  key={b.id}
                  className={`achievement-pill ${isUnlocked ? "unlocked" : "locked"}`}
                  title={`${b.title}: ${b.description} (${b.current}/${b.target} ${b.unit})`}
                >
                  {b.icon} {b.title}
                </span>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="achievements-compact-toggle"
          aria-expanded={expanded}
        >
          {expanded ? "Collapse ▲" : "View All Badges ▼"}
        </button>
      </div>

      {expanded && (
        <div className="achievements-grid mt-3">
          {badges.map((b) => {
            const isUnlocked = b.current >= b.target;
            const progress = Math.min(100, Math.round((b.current / b.target) * 100));

            return (
              <div
                key={b.id}
                className={`achievement-badge-card ${isUnlocked ? "unlocked" : "locked"}`}
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
      )}
    </div>
  );
}
