"use client";

import { useState, useTransition } from "react";
import { CheckIcon, LinkIcon, ShareIcon } from "@/components/Icons";
import { toggleHubPublic } from "@/app/study-hubs/actions";

interface Props {
  hubId: string;
  title: string;
  subjectCount: number;
  totalVideos: number;
  isPublic?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareStudyHubModal({
  hubId,
  title,
  subjectCount,
  totalVideos,
  isPublic = true,
  isOpen,
  onClose,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [currentPublic, setCurrentPublic] = useState(isPublic);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/study-hubs/share/${hubId}`
      : `https://watchlify.app/study-hubs/share/${hubId}`;

  const shareText = `Check out this Study Hub on Watchlify: "${title}" (${subjectCount} subjects, ${totalVideos} lectures). You can clone it into your own account with 1-click!`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.createElement("input");
      input.value = publicUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Study Hub: ${title}`,
          text: shareText,
          url: publicUrl,
        });
      } catch {
        // user dismissed
      }
    }
  };

  const handleTogglePublic = async () => {
    const nextState = !currentPublic;
    setCurrentPublic(nextState);
    startTransition(async () => {
      await toggleHubPublic(hubId, nextState);
    });
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${shareText}\n\n${publicUrl}`
  )}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
    publicUrl
  )}&text=${encodeURIComponent(shareText)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(publicUrl)}`;

  return (
    <div className="hub-modal-overlay" onClick={onClose}>
      <div className="hub-modal-content share-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="hub-modal-header">
          <div>
            <h2>Share Study Hub</h2>
            <p>Send this hub to friends or classmates so they can add it to their account.</p>
          </div>
          <button type="button" className="hub-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="share-modal-body">
          {/* Hub Summary Preview */}
          <div className="share-hub-preview">
            <span className="preview-icon">🎓</span>
            <div className="preview-text">
              <strong>{title}</strong>
              <span>
                {subjectCount} {subjectCount === 1 ? "Subject" : "Subjects"} • {totalVideos} lectures
              </span>
            </div>
          </div>

          {/* Copy Link Input */}
          <div className="share-link-group">
            <label>Shareable Link</label>
            <div className="share-link-input-row">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="hub-input share-url-input"
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`hub-primary-btn copy-btn ${copied ? "copied" : ""}`}
              >
                {copied ? (
                  <>
                    <CheckIcon size={14} /> Copied!
                  </>
                ) : (
                  <>
                    <LinkIcon size={14} /> Copy
                  </>
                )}
              </button>
            </div>
            <span className="field-hint">
              Anyone with this link can view the syllabus and clone all subjects into their account with 1 click.
            </span>
          </div>

          {/* Quick Share Apps */}
          <div className="share-apps-row">
            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="share-app-btn share-native"
              >
                <ShareIcon size={16} /> Share via Device
              </button>
            )}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="share-app-btn share-whatsapp"
            >
              WhatsApp
            </a>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="share-app-btn share-telegram"
            >
              Telegram
            </a>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="share-app-btn share-x"
            >
              X / Twitter
            </a>
          </div>

          {/* Public Sharing Setting Toggle */}
          <div className="share-toggle-row">
            <div>
              <strong>Public Access</strong>
              <p>Allow anyone with the link to view and clone this hub.</p>
            </div>
            <label className="switch-label">
              <input
                type="checkbox"
                checked={currentPublic}
                onChange={handleTogglePublic}
                disabled={isPending}
              />
              <span className="switch-slider" />
            </label>
          </div>
        </div>

        <div className="hub-modal-footer">
          <button type="button" onClick={onClose} className="hub-secondary-btn">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
