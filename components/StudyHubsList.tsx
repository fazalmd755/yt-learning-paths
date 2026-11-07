"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  BookOpenIcon,
  CalendarIcon,
  CheckCircleIcon,
  PlayIcon,
  ArrowRightIcon,
  SparklesIcon,
  ShareIcon,
} from "@/components/Icons";
import ShareStudyHubModal from "./ShareStudyHubModal";
import type { HubType, StudyHubSummary } from "@/lib/hubs";
import { formatDuration } from "@/lib/utils";
import ProgressBar from "./ProgressBar";
import { createStudyHub, deleteStudyHub } from "@/app/study-hubs/actions";

type FilterType = "all" | HubType;

const CATEGORY_META: Record<
  HubType,
  { label: string; icon: string; badgeClass: string; placeholder: string }
> = {
  semester: {
    label: "Semester",
    icon: "🎓",
    badgeClass: "hub-badge-semester",
    placeholder: "e.g. 7th Semester - B.Tech CSE",
  },
  class: {
    label: "Class / Grade",
    icon: "🏫",
    badgeClass: "hub-badge-class",
    placeholder: "e.g. Class 12 - Science (PCM)",
  },
  exam: {
    label: "Exam Prep",
    icon: "🎯",
    badgeClass: "hub-badge-exam",
    placeholder: "e.g. GATE CS 2027 or UPSC Prelims",
  },
  custom: {
    label: "Custom Group",
    icon: "📚",
    badgeClass: "hub-badge-custom",
    placeholder: "e.g. Full Stack Web Development",
  },
};

export default function StudyHubsList({
  initialHubs,
}: {
  initialHubs: StudyHubSummary[];
}) {
  const router = useRouter();
  const [hubs, setHubs] = useState<StudyHubSummary[]>(initialHubs);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<HubType>("semester");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sharingHub, setSharingHub] = useState<StudyHubSummary | null>(null);

  const filteredHubs = hubs.filter((hub) =>
    filter === "all" ? true : hub.hubType === filter
  );

  const openModalWithPreset = (type: HubType, defaultTitle: string) => {
    setSelectedType(type);
    setTitle(defaultTitle);
    setDescription("");
    setTargetDate("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please enter a title for this Study Hub.");
      return;
    }
    setErrorMsg("");

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("hub_type", selectedType);
    formData.append("description", description.trim());
    if (targetDate) formData.append("target_date", targetDate);

    startTransition(async () => {
      const result = await createStudyHub(formData);
      if (result.error) {
        setErrorMsg(result.error);
      } else if (result.hubId) {
        setIsModalOpen(false);
        setTitle("");
        setDescription("");
        setTargetDate("");
        router.push(`/study-hubs/${result.hubId}`);
      }
    });
  };

  const handleDelete = async (hubId: string, hubTitle: string) => {
    if (!window.confirm(`Delete "${hubTitle}" and all its subjects?`)) return;
    setDeletingId(hubId);

    startTransition(async () => {
      const res = await deleteStudyHub(hubId);
      if (res.success) {
        setHubs((prev) => prev.filter((h) => h.id !== hubId));
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="study-hubs-container">
      {/* Top Banner */}
      <section className="hub-hero">
        <div className="hub-hero-text">
          <div className="hub-kicker">
            <SparklesIcon size={14} /> ACADEMIC & SUBJECT BUNDLES
          </div>
          <h1>
            Your Study <span>Hubs.</span>
          </h1>
          <p>
            Bundle all subjects for your <strong>College Semester</strong>,{" "}
            <strong>School Class</strong>, or <strong>Exam</strong> in one single screen.
            Switch between subjects with one click whenever you feel like studying.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedType("semester");
            setTitle("");
            setDescription("");
            setTargetDate("");
            setErrorMsg("");
            setIsModalOpen(true);
          }}
          className="hub-primary-btn"
        >
          <span>+</span> Create Study Hub
        </button>
      </section>

      {/* Filter Toolbar */}
      <div className="hub-toolbar">
        <div className="hub-filter-chips">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`hub-filter-chip ${filter === "all" ? "active" : ""}`}
          >
            All Hubs <span>{hubs.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("semester")}
            className={`hub-filter-chip ${filter === "semester" ? "active" : ""}`}
          >
            🎓 Semesters <span>{hubs.filter((h) => h.hubType === "semester").length}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("class")}
            className={`hub-filter-chip ${filter === "class" ? "active" : ""}`}
          >
            🏫 Classes / School <span>{hubs.filter((h) => h.hubType === "class").length}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("exam")}
            className={`hub-filter-chip ${filter === "exam" ? "active" : ""}`}
          >
            🎯 Exam Prep <span>{hubs.filter((h) => h.hubType === "exam").length}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("custom")}
            className={`hub-filter-chip ${filter === "custom" ? "active" : ""}`}
          >
            📚 Custom <span>{hubs.filter((h) => h.hubType === "custom").length}</span>
          </button>
        </div>
      </div>

      {/* Hubs Grid or Empty State */}
      {filteredHubs.length === 0 ? (
        <div className="hub-empty-state">
          <div className="hub-empty-icon">🎓</div>
          <h2>No Study Hubs yet</h2>
          <p>
            Create your first hub for your current semester, school class, or competitive exam.
            Add 3–5 subjects with their YouTube playlists to study peacefully from one place.
          </p>

          <div className="hub-presets-heading">Quick Start Templates:</div>
          <div className="hub-presets-grid">
            <button
              type="button"
              className="hub-preset-card"
              onClick={() => openModalWithPreset("semester", "7th Semester - B.Tech CSE")}
            >
              <span className="preset-icon">🎓</span>
              <div>
                <strong>7th Semester Hub</strong>
                <p>Add 4 college subjects (e.g. ML, Cloud, Security, IoT)</p>
              </div>
            </button>
            <button
              type="button"
              className="hub-preset-card"
              onClick={() => openModalWithPreset("class", "Class 12 - Science (PCM)")}
            >
              <span className="preset-icon">🏫</span>
              <div>
                <strong>Class 12 - Science</strong>
                <p>Physics, Chemistry & Maths in one place</p>
              </div>
            </button>
            <button
              type="button"
              className="hub-preset-card"
              onClick={() => openModalWithPreset("class", "Class 10 - Board Exam Prep")}
            >
              <span className="preset-icon">🏫</span>
              <div>
                <strong>Class 10 - Boards</strong>
                <p>Science, Maths, Social Studies & English</p>
              </div>
            </button>
            <button
              type="button"
              className="hub-preset-card"
              onClick={() => openModalWithPreset("exam", "GATE CS Exam Prep")}
            >
              <span className="preset-icon">🎯</span>
              <div>
                <strong>GATE / Competitive Exam</strong>
                <p>DSA, OS, DBMS, Networks & Compilers</p>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="hub-cards-grid">
          {filteredHubs.map((hub) => {
            const meta = CATEGORY_META[hub.hubType];
            const pct = hub.totalVideos
              ? Math.round((hub.completedVideos / hub.totalVideos) * 100)
              : 0;

            return (
              <div key={hub.id} className="hub-card">
                <div className="hub-card-header">
                  <div className="hub-type-tag-wrap">
                    <span className={`hub-type-badge ${meta.badgeClass}`}>
                      {meta.icon} {meta.label}
                    </span>
                    {hub.targetDate && (
                      <span className="hub-target-date">
                        <CalendarIcon size={12} />
                        {new Date(`${hub.targetDate}T12:00:00`).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <div className="hub-card-header-actions">
                    <button
                      type="button"
                      onClick={() => setSharingHub(hub)}
                      className="hub-share-icon-btn"
                      title="Share Hub with friends"
                    >
                      <ShareIcon size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(hub.id, hub.title)}
                      className="hub-delete-btn"
                      disabled={deletingId === hub.id}
                      title="Delete Hub"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="hub-card-body">
                  <Link href={`/study-hubs/${hub.id}`} className="hub-title-link">
                    <h3>{hub.title}</h3>
                  </Link>
                  {hub.description ? (
                    <p className="hub-desc">{hub.description}</p>
                  ) : (
                    <p className="hub-desc-empty">All subjects in one unified workspace.</p>
                  )}

                  {/* Subject preview pills */}
                  <div className="hub-subject-pills">
                    {hub.subjects.length > 0 ? (
                      hub.subjects.map((sub) => (
                        <span key={sub.id} className={`hub-sub-pill pill-${sub.color}`}>
                          {sub.name}
                        </span>
                      ))
                    ) : (
                      <span className="hub-no-subjects">No subjects added yet</span>
                    )}
                  </div>
                </div>

                <div className="hub-card-footer">
                  <div className="hub-progress-section">
                    <div className="hub-progress-labels">
                      <span>
                        {hub.completedVideos} of {hub.totalVideos} lessons
                      </span>
                      <strong>{pct}% done</strong>
                    </div>
                    <ProgressBar value={pct} />
                  </div>

                  <div className="hub-actions-row">
                    <span className="hub-subject-count">
                      <BookOpenIcon size={14} />
                      {hub.totalSubjects} {hub.totalSubjects === 1 ? "Subject" : "Subjects"}
                    </span>
                    <Link href={`/study-hubs/${hub.id}`} className="hub-open-link">
                      Open Workspace <ArrowRightIcon size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Hub Modal */}
      {isModalOpen && (
        <div className="hub-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="hub-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="hub-modal-header">
              <div>
                <h2>Create New Study Hub</h2>
                <p>Bundle multiple subjects together into one clean workspace.</p>
              </div>
              <button
                type="button"
                className="hub-modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="hub-form">
              {errorMsg && <div className="hub-form-error">{errorMsg}</div>}

              <div className="hub-form-field">
                <label>What is this hub for?</label>
                <div className="hub-type-selector">
                  {(Object.keys(CATEGORY_META) as HubType[]).map((t) => {
                    const c = CATEGORY_META[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        className={`type-select-btn ${selectedType === t ? "active" : ""}`}
                        onClick={() => setSelectedType(t)}
                      >
                        <span className="type-icon">{c.icon}</span>
                        <span className="type-label">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="hub-form-field">
                <label htmlFor="hub-title-input">
                  Hub Title <span className="required-star">*</span>
                </label>
                <input
                  id="hub-title-input"
                  type="text"
                  required
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={CATEGORY_META[selectedType].placeholder}
                  className="hub-input"
                  autoFocus
                />
              </div>

              <div className="hub-form-field">
                <label htmlFor="hub-date-input">Target / Exam Date (Optional)</label>
                <input
                  id="hub-date-input"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="hub-input"
                />
                <span className="field-hint">Helps you track days left until exams.</span>
              </div>

              <div className="hub-form-field">
                <label htmlFor="hub-desc-input">Description / Notes (Optional)</label>
                <input
                  id="hub-desc-input"
                  type="text"
                  maxLength={250}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 4 core subjects + semester lab prep"
                  className="hub-input"
                />
              </div>

              <div className="hub-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="hub-secondary-btn"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hub-primary-btn"
                  disabled={isPending || !title.trim()}
                >
                  {isPending ? "Creating..." : "Create Hub & Add Subjects"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Share Modal */}
      {sharingHub && (
        <ShareStudyHubModal
          hubId={sharingHub.id}
          title={sharingHub.title}
          subjectCount={sharingHub.totalSubjects}
          totalVideos={sharingHub.totalVideos}
          isPublic={sharingHub.isPublic}
          isOpen={true}
          onClose={() => setSharingHub(null)}
        />
      )}
    </div>
  );
}
