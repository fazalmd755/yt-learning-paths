"use client";

import { useRef, useState } from "react";
import { WatchlifyIcon } from "@/components/BrandLogo";

export interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  channelTitle?: string | null;
  userName: string;
  totalLessons: number;
  completedLessons?: number;
  isCompleted: boolean;
}

export function CertificateModal({
  isOpen,
  onClose,
  courseTitle,
  channelTitle,
  userName,
  totalLessons,
  completedLessons = 0,
  isCompleted,
}: CertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [certTheme, setCertTheme] = useState<"auto" | "light" | "dark">("auto");

  if (!isOpen) return null;

  const issueDate = isCompleted
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date())
    : "Upon 100% Completion";

  const certId = isCompleted
    ? `WCH-${Math.abs(courseTitle.split("").reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)).toString(36).toUpperCase().padStart(8, "0")}`
    : "LOCKED-PREVIEW";

  const handlePrint = () => {
    if (!isCompleted) return;
    window.print();
  };

  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="certificate-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="certificate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cert-modal-header no-print">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <strong className="text-slate-900 dark:text-white text-base font-bold">Certificate of Completion</strong>
              {isCompleted ? (
                <span className="cert-unlocked-badge">✓ Verified & Unlocked</span>
              ) : (
                <span className="cert-locked-badge">🔒 Locked Preview</span>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
              {isCompleted
                ? "Congratulations! Your verified certificate is ready to download and share."
                : `Complete all ${totalLessons} lessons to unlock this verified credential & enable PDF download.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCertTheme((prev) => {
                  if (prev === "dark") return "light";
                  if (prev === "light") return "dark";
                  const isCurrentlyLight =
                    typeof document !== "undefined" &&
                    document.documentElement.classList.contains("light");
                  return isCurrentlyLight ? "dark" : "light";
                })
              }
              className="cert-theme-toggle-btn text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
              title="Switch between Classic Ivory and Obsidian Dark certificate styles"
            >
              <span>🎨</span>
              <span>
                {certTheme === "dark"
                  ? "Obsidian Dark"
                  : certTheme === "light"
                  ? "Classic Ivory"
                  : "Switch Style"}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cert-modal-close text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Certificate Canvas */}
        <div
          ref={certRef}
          className={`certificate-frame relative ${
            certTheme === "dark"
              ? "theme-dark"
              : certTheme === "light"
              ? "theme-light"
              : ""
          } ${!isCompleted ? "locked-preview" : ""}`}
        >
          {/* Watermark & Lock Overlay for Incomplete Courses */}
          {!isCompleted && (
            <>
              <div className="cert-watermark-overlay no-print" aria-hidden="true">
                <span className="cert-watermark-text">PREVIEW ONLY • LOCKED • NOT VERIFIED</span>
                <span className="cert-watermark-text">PREVIEW ONLY • LOCKED • NOT VERIFIED</span>
                <span className="cert-watermark-text">PREVIEW ONLY • LOCKED • NOT VERIFIED</span>
              </div>

              <div className="cert-lock-banner no-print">
                <div className="cert-lock-card">
                  <div className="cert-lock-icon-circle">🔒</div>
                  <h3 className="cert-lock-title">CERTIFICATE LOCKED</h3>
                  <p className="cert-lock-desc">
                    You can preview how your certificate will look. Complete all lessons ({completedLessons}/{totalLessons}) to unlock full verified credentials and enable downloading.
                  </p>
                  <div className="cert-lock-progress-track">
                    <div
                      className="cert-lock-progress-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="cert-lock-progress-label">
                    {progressPercent}% Complete ({completedLessons}/{totalLessons} lessons)
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="certificate-inner-border">
            {/* Certificate Header */}
            <div className="certificate-brand-top">
              <WatchlifyIcon size={34} />
              <span className="cert-brand-name">WATCHLIFY</span>
            </div>

            <div className="cert-title-block">
              <span className="cert-pre-title">CERTIFICATE OF ACHIEVEMENT</span>
              <h1 className="cert-main-heading">Proof of Completion</h1>
              <p className="cert-subtext">This is proudly presented to</p>
            </div>

            <div className="cert-recipient-name">
              {userName || "Dedicated Learner"}
            </div>

            <p className="cert-congrats-text">
              for successfully completing all <strong>{totalLessons} lessons</strong> of the structured learning path
            </p>

            <div className="cert-course-name">
              "{courseTitle}"
            </div>

            {channelTitle && (
              <p className="cert-instructor-line">
                Curriculum by <strong>{channelTitle}</strong>
              </p>
            )}

            {/* Certificate Footer */}
            <div className="certificate-footer-grid">
              <div className="cert-footer-col">
                <span className="cert-col-val">{issueDate}</span>
                <span className="cert-col-lbl">DATE ISSUED</span>
              </div>

              <div className="cert-seal-col">
                {isCompleted ? (
                  <div className="cert-gold-seal">
                    <span>★</span>
                    <small>VERIFIED</small>
                  </div>
                ) : (
                  <div className="cert-gold-seal locked" title="Complete course to verify">
                    <span>🔒</span>
                    <small>LOCKED</small>
                  </div>
                )}
              </div>

              <div className="cert-footer-col">
                <span className="cert-col-val font-mono">{certId}</span>
                <span className="cert-col-lbl">CREDENTIAL ID</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="cert-actions-bar no-print">
          {isCompleted ? (
            <>
              <button
                type="button"
                onClick={handlePrint}
                className="cert-print-btn"
                title="Print or Save Certificate as PDF"
              >
                🖨️ Print / Save as PDF
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  `I just completed "${courseTitle}" on @Watchlify! 🎓🔥 Check it out:`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="cert-share-btn"
              >
                Share on X / Twitter
              </a>
            </>
          ) : (
            <div className="cert-locked-action-footer">
              <div className="cert-locked-footer-hint">
                <span className="cert-locked-hint-icon">🔒</span>
                <span className="text-slate-600 dark:text-slate-300">
                  Download is locked until all <strong>{totalLessons} lessons</strong> are marked completed.
                </span>
              </div>
              <button
                type="button"
                disabled
                className="cert-print-btn locked"
                title="Complete course to enable PDF download"
              >
                🔒 Download Locked
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  courseTitle: string;
  channelTitle?: string | null;
  userName: string;
  totalLessons: number;
  completedLessons?: number;
  isCompleted: boolean;
}

export default function CourseCertificate({
  courseTitle,
  channelTitle,
  userName,
  totalLessons,
  completedLessons = 0,
  isCompleted,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`course-certificate-btn ${isCompleted ? "unlocked" : "preview"}`}
        title={isCompleted ? "Claim and download your certificate" : "Preview course certificate (Locked)"}
      >
        <span className="cert-btn-icon">{isCompleted ? "🎓" : "🔒"}</span>
        <span>{isCompleted ? "Claim Certificate of Completion" : "Preview Certificate"}</span>
        {isCompleted ? (
          <span className="cert-unlocked-badge">✓ Unlocked</span>
        ) : (
          <span className="cert-locked-badge">🔒 Locked</span>
        )}
      </button>

      <CertificateModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        courseTitle={courseTitle}
        channelTitle={channelTitle}
        userName={userName}
        totalLessons={totalLessons}
        completedLessons={completedLessons}
        isCompleted={isCompleted}
      />
    </>
  );
}
