"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightIcon } from "@/components/Icons";

type Props = {
  percent: number;
  remainingLabels: string[];
};

export default function ProfileReminderBanner({ percent, remainingLabels }: Props) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Only show if not complete and not dismissed in this session
    const isDismissed =
      sessionStorage.getItem("watchlify_profile_reminder_dismissed") === "true" ||
      sessionStorage.getItem("watchify_profile_reminder_dismissed") === "true";
    if (percent < 100 && !isDismissed) {
      setDismissed(false);
    }
  }, [percent]);

  if (dismissed || percent >= 100) return null;

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem("watchlify_profile_reminder_dismissed", "true");
  }

  return (
    <aside className="profile-reminder-banner" aria-label="Profile completion reminder">
      <div className="profile-reminder-content">
        <div className="profile-reminder-badge-col">
          <div className="profile-reminder-icon-wrap" aria-hidden="true">
            <span>👤</span>
          </div>
        </div>

        <div className="profile-reminder-body">
          <div className="profile-reminder-title-row">
            <strong>Complete your profile ({percent}% done)</strong>
            <span className="profile-reminder-chip">REMINDER</span>
          </div>
          <p>
            Apni profile complete kariye taaki aapke courses aur study recommendations personalize ho sakein.
            {remainingLabels.length > 0 && (
              <span className="profile-reminder-missing">
                {" "}Baki hai: {remainingLabels.slice(0, 3).join(", ")}
                {remainingLabels.length > 3 ? " aur anya..." : "."}
              </span>
            )}
          </p>

          <div className="profile-reminder-progress-track">
            <div
              className="profile-reminder-progress-fill"
              style={{ width: `${percent}%` }}
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        <div className="profile-reminder-actions">
          <Link href="/settings" className="profile-reminder-cta">
            Complete profile ({percent}%) <ArrowRightIcon size={14} className="inline-block ml-1" />
          </Link>
          <button
            type="button"
            className="profile-reminder-dismiss"
            onClick={dismiss}
            aria-label="Dismiss reminder for now"
            title="Dismiss for now"
          >
            ×
          </button>
        </div>
      </div>
    </aside>
  );
}
