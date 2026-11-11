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
    const isDismissed =
      sessionStorage.getItem("watchlify_profile_reminder_dismissed") === "true";
    if (percent < 100 && !isDismissed) {
      setDismissed(false);
    }
  }, [percent]);

  if (dismissed || percent >= 100) return null;

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem("watchlify_profile_reminder_dismissed", "true");
  }

  const missingHint = remainingLabels.length > 0 ? remainingLabels[0] : "";

  return (
    <aside className="profile-reminder-pill" aria-label="Profile completion reminder">
      <div className="profile-reminder-pill-left">
        <span className="profile-pill-icon">👤</span>
        <span className="profile-pill-text">
          Profile is <strong>{percent}% complete</strong>
          {missingHint && (
            <span className="profile-pill-hint"> · Add {missingHint} for personalized paths</span>
          )}
        </span>
      </div>

      <div className="profile-reminder-pill-right">
        <div className="profile-pill-progress" aria-hidden="true">
          <div className="profile-pill-progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <Link href="/settings" className="profile-pill-cta">
          Complete now <ArrowRightIcon size={12} className="inline-block ml-0.5" />
        </Link>
        <button
          type="button"
          className="profile-pill-dismiss"
          onClick={dismiss}
          aria-label="Dismiss reminder"
          title="Dismiss for now"
        >
          ×
        </button>
      </div>
    </aside>
  );
}
