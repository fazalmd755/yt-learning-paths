"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  PlayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SparklesIcon,
} from "@/components/Icons";
import type { CourseSummary } from "@/lib/data";
import type { HubSubjectSummary, StudyHubSummary, HubType } from "@/lib/hubs";
import { formatDuration } from "@/lib/utils";
import ProgressBar from "./ProgressBar";
import {
  addSubjectToHub,
  removeSubjectFromHub,
  updateStudyHub,
  deleteStudyHub,
} from "@/app/study-hubs/actions";

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

const COLOR_OPTIONS = [
  { id: "purple", label: "Purple", hex: "#8b5cf6" },
  { id: "blue", label: "Blue", hex: "#3b82f6" },
  { id: "emerald", label: "Green", hex: "#10b981" },
  { id: "amber", label: "Amber", hex: "#f59e0b" },
  { id: "rose", label: "Rose", hex: "#f43f5e" },
  { id: "cyan", label: "Cyan", hex: "#06b6d4" },
];

export default function StudyHubWorkspace({
  hub,
  userCourses,
}: {
  hub: StudyHubSummary;
  userCourses: CourseSummary[];
}) {
  const router = useRouter();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [expandedLectures, setExpandedLectures] = useState<Record<string, boolean>>({});

  // Add Subject Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectColor, setSubjectColor] = useState("purple");
  const [sourceType, setSourceType] = useState<"library" | "url">("library");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [addError, setAddError] = useState("");

  // Edit Hub Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(hub.title);
  const [editType, setEditType] = useState<HubType>(hub.hubType);
  const [editDesc, setEditDesc] = useState(hub.description);
  const [editDate, setEditDate] = useState(hub.targetDate || "");
  const [editError, setEditError] = useState("");

  const [isPending, startTransition] = useTransition();

  const toggleLectures = (subId: string) => {
    setExpandedLectures((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }));
  };

  const daysUntilExam = useMemo(() => {
    if (!hub.targetDate) return null;
    const target = new Date(`${hub.targetDate}T12:00:00`).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [hub.targetDate]);

  const overallPct = hub.totalVideos
    ? Math.round((hub.completedVideos / hub.totalVideos) * 100)
    : 0;

  const visibleSubjects =
    selectedSubjectId === "all"
      ? hub.subjects
      : hub.subjects.filter((s) => s.id === selectedSubjectId);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      setAddError("Please provide a subject name.");
      return;
    }
    if (sourceType === "library" && !selectedCourseId) {
      setAddError("Please select an enrolled course from your library.");
      return;
    }
    if (sourceType === "url" && !youtubeUrl.trim()) {
      setAddError("Please paste a valid YouTube playlist or video link.");
      return;
    }
    setAddError("");

    const formData = new FormData();
    formData.append("hub_id", hub.id);
    formData.append("name", subjectName.trim());
    formData.append("code", subjectCode.trim());
    formData.append("color", subjectColor);
    if (sourceType === "library") {
      formData.append("course_id", selectedCourseId);
    } else {
      formData.append("youtube_url", youtubeUrl.trim());
    }

    startTransition(async () => {
      const res = await addSubjectToHub(formData);
      if (res.error) {
        setAddError(res.error);
      } else {
        setIsAddModalOpen(false);
        setSubjectName("");
        setSubjectCode("");
        setSelectedCourseId("");
        setYoutubeUrl("");
        router.refresh();
      }
    });
  };

  const handleRemoveSubject = async (subjectId: string, name: string) => {
    if (!window.confirm(`Remove subject "${name}" from this hub?`)) return;

    startTransition(async () => {
      await removeSubjectFromHub(subjectId, hub.id);
      router.refresh();
    });
  };

  const handleEditHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setEditError("Title cannot be empty.");
      return;
    }
    setEditError("");

    const formData = new FormData();
    formData.append("hub_id", hub.id);
    formData.append("title", editTitle.trim());
    formData.append("hub_type", editType);
    formData.append("description", editDesc.trim());
    if (editDate) formData.append("target_date", editDate);

    startTransition(async () => {
      const res = await updateStudyHub(formData);
      if (res.error) {
        setEditError(res.error);
      } else {
        setIsEditModalOpen(false);
        router.refresh();
      }
    });
  };

  const handleDeleteHub = async () => {
    if (!window.confirm(`Delete "${hub.title}" completely?`)) return;

    startTransition(async () => {
      const res = await deleteStudyHub(hub.id);
      if (res.success) {
        router.push("/study-hubs");
      }
    });
  };

  return (
    <div className="study-hub-workspace">
      {/* Breadcrumb Navigation */}
      <div className="workspace-breadcrumb">
        <Link href="/study-hubs" className="crumb-back">
          ← All Study Hubs
        </Link>
        <span className="crumb-separator">/</span>
        <span className="crumb-current">{hub.title}</span>
      </div>

      {/* Main Hub Header Card */}
      <section className="workspace-header-card">
        <div className="header-info-col">
          <div className="hub-meta-badges">
            <span className="workspace-type-badge">
              {hub.hubType === "semester"
                ? "🎓 Semester Hub"
                : hub.hubType === "class"
                ? "🏫 Class Hub"
                : hub.hubType === "exam"
                ? "🎯 Exam Prep Hub"
                : "📚 Custom Hub"}
            </span>

            {daysUntilExam !== null && (
              <span
                className={`workspace-countdown ${
                  daysUntilExam <= 7 ? "countdown-urgent" : ""
                }`}
              >
                <CalendarIcon size={13} />
                {daysUntilExam > 0
                  ? `${daysUntilExam} days until exam`
                  : daysUntilExam === 0
                  ? "Exam is today!"
                  : `Exam was ${Math.abs(daysUntilExam)} days ago`}
              </span>
            )}
          </div>

          <h1 className="workspace-title">{hub.title}</h1>
          {hub.description ? (
            <p className="workspace-desc">{hub.description}</p>
          ) : (
            <p className="workspace-desc-empty">
              All subjects and playlists grouped for focused learning.
            </p>
          )}

          <div className="workspace-quick-actions">
            <button
              type="button"
              onClick={() => {
                setSubjectName("");
                setSubjectCode("");
                setSubjectColor(COLOR_OPTIONS[hub.subjects.length % COLOR_OPTIONS.length].id);
                setSourceType(userCourses.length > 0 ? "library" : "url");
                setSelectedCourseId(userCourses[0]?.id || "");
                setYoutubeUrl("");
                setAddError("");
                setIsAddModalOpen(true);
              }}
              className="workspace-add-btn"
            >
              <span>+</span> Add Subject
            </button>
            <button
              type="button"
              onClick={() => {
                setEditTitle(hub.title);
                setEditType(hub.hubType);
                setEditDesc(hub.description);
                setEditDate(hub.targetDate || "");
                setEditError("");
                setIsEditModalOpen(true);
              }}
              className="workspace-secondary-btn"
            >
              Edit Hub
            </button>
            <button
              type="button"
              onClick={handleDeleteHub}
              className="workspace-danger-btn"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Overall Progress Widget */}
        <div className="header-stats-widget">
          <div className="stat-widget-top">
            <span className="widget-label">OVERALL PROGRESS</span>
            <span className="widget-pct">{overallPct}%</span>
          </div>

          <ProgressBar value={overallPct} />

          <div className="widget-details-grid">
            <div className="widget-detail-item">
              <span className="detail-number">{hub.totalSubjects}</span>
              <span className="detail-name">Subjects</span>
            </div>
            <div className="widget-detail-item">
              <span className="detail-number">
                {hub.completedVideos}/{hub.totalVideos}
              </span>
              <span className="detail-name">Lectures</span>
            </div>
            <div className="widget-detail-item">
              <span className="detail-number">{formatDuration(hub.completedSeconds)}</span>
              <span className="detail-name">Learned</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Subject Switcher Tabs */}
      {hub.subjects.length > 0 && (
        <section className="subject-switcher-bar">
          <span className="switcher-label">Switch Subject:</span>
          <div className="switcher-pills">
            <button
              type="button"
              onClick={() => setSelectedSubjectId("all")}
              className={`switcher-pill ${selectedSubjectId === "all" ? "active" : ""}`}
            >
              All Subjects <span>{hub.subjects.length}</span>
            </button>
            {hub.subjects.map((sub) => {
              const subPct = sub.totalVideos
                ? Math.round((sub.completedVideos / sub.totalVideos) * 100)
                : 0;
              const colorTheme = COLOR_MAP[sub.color] || COLOR_MAP.blue;

              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`switcher-pill ${
                    selectedSubjectId === sub.id ? "active" : ""
                  }`}
                  style={{
                    borderLeftColor: colorTheme.bar,
                    borderLeftWidth: "3px",
                  }}
                >
                  <span className="pill-dot" style={{ backgroundColor: colorTheme.bar }} />
                  {sub.name}
                  <span className="pill-pct">{subPct}%</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty Subjects View */}
      {hub.subjects.length === 0 ? (
        <div className="subjects-empty-card">
          <div className="empty-book-icon">📚</div>
          <h2>No subjects added yet to {hub.title}</h2>
          <p>
            Add your semester or class subjects (e.g. <em>Machine Learning</em>,{" "}
            <em>Cloud Computing</em>, <em>Physics</em>, <em>Maths</em>). Link each subject
            to a YouTube playlist so you can study all of them in one place!
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="workspace-add-btn"
          >
            <span>+</span> Add Your First Subject
          </button>
        </div>
      ) : (
        /* Subjects Grid */
        <div className="hub-subjects-grid">
          {visibleSubjects.map((sub) => {
            const subPct = sub.totalVideos
              ? Math.round((sub.completedVideos / sub.totalVideos) * 100)
              : 0;
            const isDone = sub.totalVideos > 0 && sub.completedVideos === sub.totalVideos;
            const colorTheme = COLOR_MAP[sub.color] || COLOR_MAP.blue;
            const isDrawerOpen = Boolean(expandedLectures[sub.id]);

            return (
              <div
                key={sub.id}
                className="subject-card"
                style={{
                  borderTop: `4px solid ${colorTheme.bar}`,
                }}
              >
                {/* Subject Header */}
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
                      {sub.code ? `${sub.code} • ` : ""}
                      {sub.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(sub.id, sub.name)}
                    className="subject-remove-btn"
                    title="Remove subject from hub"
                  >
                    ×
                  </button>
                </div>

                {/* Playlist Art & Details */}
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
                    <span
                      className={`subject-status-pill ${
                        isDone ? "status-done" : subPct > 0 ? "status-progress" : ""
                      }`}
                    >
                      {isDone ? "✓ Completed" : subPct > 0 ? "In Progress" : "Not Started"}
                    </span>
                  </div>

                  <div className="subject-meta-text">
                    <h3 className="subject-playlist-title">
                      {sub.playlistTitle || "No playlist linked"}
                    </h3>
                    <p className="subject-channel-name">
                      {sub.channelTitle || "Custom study collection"}
                    </p>
                  </div>
                </div>

                {/* Progress Bar & Stats */}
                <div className="subject-progress-box">
                  <div className="subject-stats-row">
                    <span>
                      {sub.completedVideos} of {sub.totalVideos} lectures watched
                    </span>
                    <strong>{subPct}%</strong>
                  </div>
                  <div className="custom-progress-track">
                    <div
                      className="custom-progress-fill"
                      style={{
                        width: `${subPct}%`,
                        backgroundColor: colorTheme.bar,
                      }}
                    />
                  </div>
                  <div className="subject-time-row">
                    <span>
                      <ClockIcon size={12} /> {formatDuration(sub.completedSeconds)} watched
                    </span>
                    <span>Total: {formatDuration(sub.totalSeconds)}</span>
                  </div>
                </div>

                {/* Action Row: Resume / Start Study */}
                <div className="subject-action-box">
                  {sub.courseId && sub.continueVideoId ? (
                    <Link
                      href={`/watch/${sub.courseId}/${sub.continueVideoId}`}
                      className="subject-resume-btn"
                      style={{ backgroundColor: colorTheme.bar }}
                    >
                      <PlayIcon size={15} />
                      <span>
                        {sub.completedVideos === 0
                          ? "Start Studying"
                          : sub.continueVideoTitle
                          ? `Resume: ${sub.continueVideoTitle.slice(0, 32)}...`
                          : "Resume Next Lesson"}
                      </span>
                    </Link>
                  ) : sub.courseId ? (
                    <Link
                      href={`/courses/${sub.courseId}`}
                      className="subject-resume-btn"
                      style={{ backgroundColor: colorTheme.bar }}
                    >
                      <PlayIcon size={15} />
                      <span>View Course</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSubjectName(sub.name);
                        setSubjectCode(sub.code);
                        setSubjectColor(sub.color);
                        setIsAddModalOpen(true);
                      }}
                      className="subject-resume-btn"
                      style={{ backgroundColor: "#64748b" }}
                    >
                      Attach YouTube Playlist
                    </button>
                  )}

                  {/* Toggle Lecture Drawer Button */}
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
                        All Lectures ({sub.lectures.length})
                      </span>
                      <span className="toggle-hint">
                        {isDrawerOpen ? "Hide syllabus" : "Show syllabus"}
                      </span>
                    </button>
                  )}
                </div>

                {/* Expandable Lecture Syllabus Drawer */}
                {isDrawerOpen && sub.lectures && sub.lectures.length > 0 && (
                  <div className="subject-lectures-drawer">
                    <div className="drawer-header">
                      <span>Syllabus & Lecture List</span>
                      <span>Click any lecture to jump in</span>
                    </div>
                    <div className="drawer-list">
                      {sub.lectures.map((lec, idx) => (
                        <Link
                          key={lec.id}
                          href={
                            sub.courseId ? `/watch/${sub.courseId}/${lec.id}` : "#"
                          }
                          className={`drawer-item ${lec.isCompleted ? "lecture-done" : ""}`}
                        >
                          <span className="lecture-index">#{idx + 1}</span>
                          <span className="lecture-title">{lec.title}</span>
                          <span className="lecture-dur">
                            {formatDuration(lec.durationSeconds)}
                          </span>
                          <span className="lecture-check">
                            {lec.isCompleted ? "✓" : "○"}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Subject Modal */}
      {isAddModalOpen && (
        <div className="hub-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="hub-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="hub-modal-header">
              <div>
                <h2>Add Subject to {hub.title}</h2>
                <p>Link a YouTube playlist for this subject.</p>
              </div>
              <button
                type="button"
                className="hub-modal-close"
                onClick={() => setIsAddModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="hub-form">
              {addError && <div className="hub-form-error">{addError}</div>}

              <div className="hub-form-row">
                <div className="hub-form-field flex-2">
                  <label htmlFor="subject-name-input">
                    Subject Name <span className="required-star">*</span>
                  </label>
                  <input
                    id="subject-name-input"
                    type="text"
                    required
                    maxLength={100}
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="e.g. Machine Learning, Physics, DBMS"
                    className="hub-input"
                    autoFocus
                  />
                </div>

                <div className="hub-form-field flex-1">
                  <label htmlFor="subject-code-input">Code (Optional)</label>
                  <input
                    id="subject-code-input"
                    type="text"
                    maxLength={20}
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    placeholder="e.g. CS701"
                    className="hub-input"
                  />
                </div>
              </div>

              {/* Color Theme Selector */}
              <div className="hub-form-field">
                <label>Subject Color Tag</label>
                <div className="color-picker-row">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSubjectColor(c.id)}
                      className={`color-pick-circle ${
                        subjectColor === c.id ? "selected" : ""
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Playlist Selection Tabs */}
              <div className="hub-form-field">
                <label>Link YouTube Playlist</label>
                <div className="source-tabs">
                  <button
                    type="button"
                    onClick={() => setSourceType("library")}
                    className={`source-tab ${sourceType === "library" ? "active" : ""}`}
                  >
                    From My Playlists ({userCourses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType("url")}
                    className={`source-tab ${sourceType === "url" ? "active" : ""}`}
                  >
                    Paste YouTube Link
                  </button>
                </div>

                {sourceType === "library" ? (
                  userCourses.length > 0 ? (
                    <div className="library-dropdown-wrap">
                      <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="hub-select"
                        required
                      >
                        <option value="">Select a playlist from your library...</option>
                        {userCourses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} ({c.totalVideos} videos • {c.channelTitle || "YouTube"})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="no-courses-notice">
                      <p>You don't have any playlists in your library yet.</p>
                      <button
                        type="button"
                        onClick={() => setSourceType("url")}
                        className="quiet-link"
                      >
                        Paste a YouTube playlist link instead →
                      </button>
                    </div>
                  )
                ) : (
                  <div className="url-input-wrap">
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/playlist?list=..."
                      className="hub-input"
                      required
                    />
                    <span className="field-hint">
                      Paste any public YouTube playlist link. We'll automatically import and track it!
                    </span>
                  </div>
                )}
              </div>

              <div className="hub-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="hub-secondary-btn"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hub-primary-btn"
                  disabled={isPending || !subjectName.trim()}
                >
                  {isPending ? "Adding..." : "Add Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hub Modal */}
      {isEditModalOpen && (
        <div className="hub-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="hub-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="hub-modal-header">
              <div>
                <h2>Edit Study Hub</h2>
                <p>Update title, category, or target exam date.</p>
              </div>
              <button
                type="button"
                className="hub-modal-close"
                onClick={() => setIsEditModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditHub} className="hub-form">
              {editError && <div className="hub-form-error">{editError}</div>}

              <div className="hub-form-field">
                <label htmlFor="edit-title-input">Hub Title</label>
                <input
                  id="edit-title-input"
                  type="text"
                  required
                  maxLength={120}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="hub-input"
                />
              </div>

              <div className="hub-form-field">
                <label htmlFor="edit-date-input">Target / Exam Date (Optional)</label>
                <input
                  id="edit-date-input"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="hub-input"
                />
              </div>

              <div className="hub-form-field">
                <label htmlFor="edit-desc-input">Description (Optional)</label>
                <input
                  id="edit-desc-input"
                  type="text"
                  maxLength={250}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="hub-input"
                />
              </div>

              <div className="hub-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="hub-secondary-btn"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hub-primary-btn"
                  disabled={isPending || !editTitle.trim()}
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
