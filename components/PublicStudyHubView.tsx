"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  PlayIcon,
  ShareIcon,
  SparklesIcon,
} from "@/components/Icons";
import type { StudyHubSummary } from "@/lib/hubs";
import { formatDuration } from "@/lib/utils";
import ShareStudyHubModal from "./ShareStudyHubModal";
import { cloneStudyHub } from "@/app/study-hubs/actions";

const COLOR_MAP: Record<
  string,
  { bg: string; text: string; border: string; bar: string }
> = {
  blue: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", bar: "#3b82f6" },
  purple: { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe", bar: "#8b5cf6" },
  emerald: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0", bar: "#10b981" },
  amber: { bg: "#fffbeb", text: "#b45309", border: "#fde68a", bar: "#f59e0b" },
  rose: { bg: "#fff1f2", text: "#be123c", border: "#fecdd3", bar: "#f43f5e" },
  cyan: { bg: "#ecfeff", text: "#0e7490", border: "#a5f3fc", bar: "#06b6d4" },
};

export default function PublicStudyHubView({
  hub,
  currentUser,
}: {
  hub: StudyHubSummary;
  currentUser: { id: string; email?: string } | null;
}) {
  const router = useRouter();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [expandedLectures, setExpandedLectures] = useState<Record<string, boolean>>({});
  const [cloneError, setCloneError] = useState("");
  const [isPending, startTransition] = useTransition();

  const toggleLectures = (subId: string) => {
    setExpandedLectures((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }));
  };

  const handleClone = async () => {
    if (!currentUser) {
      router.push(`/login?next=/study-hubs/share/${hub.id}`);
      return;
    }

    setCloneError("");
    startTransition(async () => {
      const res = await cloneStudyHub(hub.id);
      if (res.error) {
        setCloneError(res.error);
      } else if (res.newHubId) {
        router.push(`/study-hubs/${res.newHubId}`);
      }
    });
  };

  return (
    <div className="public-hub-shell">
      {/* Top Banner & Breadcrumb */}
      <div className="public-hub-topbar">
        <div className="topbar-left">
          <span className="shared-badge">
            <SparklesIcon size={13} /> SHARED STUDY HUB
          </span>
          <span className="hub-category-pill">
            {hub.hubType === "semester"
              ? "🎓 Semester Bundle"
              : hub.hubType === "class"
              ? "🏫 Class Bundle"
              : hub.hubType === "exam"
              ? "🎯 Exam Prep Bundle"
              : "📚 Study Bundle"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsShareOpen(true)}
          className="hub-secondary-btn share-top-btn"
        >
          <ShareIcon size={14} /> Share Hub
        </button>
      </div>

      {/* Main Hero Card */}
      <section className="public-hub-hero">
        <div className="public-hero-copy">
          <h1 className="public-hero-title">{hub.title}</h1>
          {hub.description ? (
            <p className="public-hero-desc">{hub.description}</p>
          ) : (
            <p className="public-hero-desc">
              All subjects and YouTube playlists organized into a single study screen.
            </p>
          )}

          <div className="public-hero-meta">
            <span className="meta-item">
              <BookOpenIcon size={15} />
              <strong>{hub.totalSubjects}</strong> {hub.totalSubjects === 1 ? "Subject" : "Subjects"}
            </span>
            <span className="meta-item">
              <PlayIcon size={15} />
              <strong>{hub.totalVideos}</strong> Lectures
            </span>
            <span className="meta-item">
              <ClockIcon size={15} />
              <strong>{formatDuration(hub.totalSeconds)}</strong> Total Duration
            </span>
            {hub.targetDate && (
              <span className="meta-item">
                <CalendarIcon size={15} />
                Target Exam:{" "}
                <strong>
                  {new Date(`${hub.targetDate}T12:00:00`).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong>
              </span>
            )}
          </div>
        </div>

        {/* 1-Click Save to My Hubs Card */}
        <div className="public-hero-action-card">
          <div className="action-card-header">
            <h3>Study this in Watchlify</h3>
            <p>
              Clone all {hub.totalSubjects} subjects into your account to track video progress, build daily streaks, and take notes.
            </p>
          </div>

          {cloneError && <div className="hub-form-error">{cloneError}</div>}

          {hub.isOwner ? (
            <Link href={`/study-hubs/${hub.id}`} className="hub-primary-btn hero-cta-btn">
              Open in My Workspace <ArrowRightIcon size={15} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleClone}
              disabled={isPending}
              className="hub-primary-btn hero-cta-btn"
            >
              <span>+</span>
              {isPending
                ? "Cloning Subjects..."
                : currentUser
                ? "Add to My Study Hubs"
                : "Sign in to Save this Hub"}
            </button>
          )}

          <div className="action-card-perks">
            <span>✓ Distraction-free player</span>
            <span>✓ Auto progress tracking</span>
            <span>✓ Switch subjects anytime</span>
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="public-subjects-section">
        <div className="section-title-row">
          <div>
            <h2>Subjects in this Hub ({hub.subjects.length})</h2>
          </div>
          <span className="section-side-note">
            Browse playlists and lectures included in this bundle.
          </span>
        </div>

        <div className="hub-subjects-grid">
          {hub.subjects.map((sub, idx) => {
            const colorTheme = COLOR_MAP[sub.color] || COLOR_MAP.blue;
            const isDrawerOpen = Boolean(expandedLectures[sub.id]);

            return (
              <div
                key={sub.id}
                className="subject-card"
                style={{ borderTop: `4px solid ${colorTheme.bar}` }}
              >
                {/* Subject Head */}
                <div className="subject-card-head">
                  <div className="subject-tag-row">
                    <span
                      className="subject-color-tag"
                      style={{
                        backgroundColor: colorTheme.bg,
                        color: colorTheme.text,
                        borderColor: colorTheme.border,
                      }}
                    >
                      {sub.code ? `${sub.code} • ` : `Subject #${idx + 1} • `}
                      {sub.name}
                    </span>
                  </div>
                </div>

                {/* Playlist Art & Title */}
                <div className="subject-playlist-preview">
                  <div className="subject-art-wrap">
                    {sub.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sub.thumbnailUrl}
                        alt=""
                        className="subject-art-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="subject-art-fallback">
                        <PlayIcon size={24} />
                      </div>
                    )}
                    <span className="subject-status-pill">
                      {sub.totalVideos} videos
                    </span>
                  </div>

                  <div className="subject-meta-text">
                    <h3 className="subject-playlist-title">
                      {sub.playlistTitle || sub.name}
                    </h3>
                    <p className="subject-channel-name">
                      {sub.channelTitle || "YouTube Playlist"}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="subject-progress-box">
                  <div className="subject-stats-row">
                    <span>{sub.totalVideos} lectures</span>
                    <span>Total duration: {formatDuration(sub.totalSeconds)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="subject-action-box">
                  {sub.lectures && sub.lectures.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleLectures(sub.id)}
                      className="subject-lectures-toggle"
                    >
                      <span>
                        {isDrawerOpen ? (
                          <ChevronDownIcon size={14} />
                        ) : (
                          <ChevronRightIcon size={14} />
                        )}
                        View Syllabus ({sub.lectures.length} lectures)
                      </span>
                      <span className="toggle-hint">
                        {isDrawerOpen ? "Hide" : "Expand"}
                      </span>
                    </button>
                  )}
                </div>

                {/* Syllabus Drawer */}
                {isDrawerOpen && sub.lectures && sub.lectures.length > 0 && (
                  <div className="subject-lectures-drawer">
                    <div className="drawer-header">
                      <span>Lectures</span>
                      <span>Duration</span>
                    </div>
                    <div className="drawer-list">
                      {sub.lectures.map((lec, lIdx) => (
                        <div key={lec.id} className="drawer-item">
                          <span className="lecture-index">#{lIdx + 1}</span>
                          <span className="lecture-title">{lec.title}</span>
                          <span className="lecture-dur">
                            {formatDuration(lec.durationSeconds)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Share Modal */}
      <ShareStudyHubModal
        hubId={hub.id}
        title={hub.title}
        subjectCount={hub.totalSubjects}
        totalVideos={hub.totalVideos}
        isPublic={hub.isPublic}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
}
