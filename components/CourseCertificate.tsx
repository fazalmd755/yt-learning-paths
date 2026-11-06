"use client";

import { useRef, useState } from "react";
import { CheckCircleIcon } from "@/components/Icons";
import { WatchlifyIcon } from "@/components/BrandLogo";

interface Props {
  courseTitle: string;
  channelTitle?: string | null;
  userName: string;
  totalLessons: number;
  isCompleted: boolean;
}

export default function CourseCertificate({
  courseTitle,
  channelTitle,
  userName,
  totalLessons,
  isCompleted,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const issueDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const certId = `WCH-${Math.abs(courseTitle.split("").reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)).toString(36).toUpperCase().padStart(8, "0")}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`course-certificate-btn ${isCompleted ? "unlocked" : "preview"}`}
        title={isCompleted ? "Claim your certificate" : "Preview course certificate"}
      >
        <span className="cert-btn-icon">🎓</span>
        <span>{isCompleted ? "Claim Certificate of Completion" : "Preview Certificate"}</span>
        {isCompleted && <span className="cert-unlocked-badge">✓ Unlocked</span>}
      </button>

      {isOpen && (
        <div className="certificate-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div
            className="certificate-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cert-modal-header no-print">
              <div>
                <strong className="text-white text-base">Certificate of Completion</strong>
                <p className="text-slate-400 text-xs mt-0.5">
                  {isCompleted
                    ? "Congratulations on completing this course!"
                    : "Complete all lessons to unlock your verified credential."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="cert-modal-close"
              >
                ✕
              </button>
            </div>

            {/* Certificate Canvas */}
            <div ref={certRef} className="certificate-frame">
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
                    <div className="cert-gold-seal">
                      <span>★</span>
                      <small>VERIFIED</small>
                    </div>
                  </div>

                  <div className="cert-footer-col">
                    <span className="cert-col-val font-mono">{certId}</span>
                    <span className="cert-col-lbl">CREDENTIAL ID</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="cert-actions-bar no-print">
              <button
                type="button"
                onClick={handlePrint}
                className="cert-print-btn"
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}
