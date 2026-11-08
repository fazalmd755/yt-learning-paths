"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Props = {
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  streak: number;
  goalMinutes: number;
  todayMinutes: number;
  remindersEnabled: boolean;
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.2 4.2" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function FlameIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="flame-fire-svg"
      fill="none"
    >
      <defs>
        <linearGradient id="header-fire-outer-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="25%" stopColor="#ea580c" />
          <stop offset="60%" stopColor="#f97316" />
          <stop offset="90%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <linearGradient id="header-fire-inner-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>
        <filter id="header-fire-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#f97316" floodOpacity="0.6" />
        </filter>
      </defs>
      <path
        d="M12.2 22c4.2 0 7-2.9 7-7.1 0-3.1-1.6-5.3-4.1-8.1-.1 2-1.1 3.2-2.2 3.7.4-3.8-1.2-7.2-4.8-9.5.5 4-1 6.1-2.4 8.3-1.1 1.7-1.8 3.3-1.8 5.4 0 4.3 3.2 7.3 8.3 7.3Z"
        fill="url(#header-fire-outer-grad)"
        filter="url(#header-fire-glow)"
      />
      <path
        d="M12.1 19.3c1.8 0 3-1.2 3-3.1 0-1.2-.7-2.3-1.8-3.4-.2 1.1-.7 1.6-1.5 2-.1-1.5-.8-2.6-2-3.5.1 1.7-.9 2.6-1.2 4.1-.5 2.2.9 3.9 3.5 3.9Z"
        fill="url(#header-fire-inner-grad)"
      />
    </svg>
  );
}

export default function SiteHeader({
  email,
  displayName,
  avatarUrl,
  streak,
  goalMinutes,
  todayMinutes,
  remindersEnabled,
}: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const notifWrapRef = useRef<HTMLDivElement>(null);
  const profileWrapRef = useRef<HTMLDivElement>(null);
  const goalReached = todayMinutes >= goalMinutes;
  const remaining = Math.max(0, goalMinutes - todayMinutes);
  const accountName = displayName.trim() || email;
  const initial = accountName.trim().charAt(0).toUpperCase() || "U";
  const showAvatar = Boolean(avatarUrl && !imageError);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // Close popovers when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        searchOpen &&
        searchWrapRef.current &&
        !searchWrapRef.current.contains(target)
      ) {
        setSearchOpen(false);
      }

      if (
        notificationsOpen &&
        notifWrapRef.current &&
        !notifWrapRef.current.contains(target)
      ) {
        setNotificationsOpen(false);
      }

      if (
        profileOpen &&
        profileWrapRef.current &&
        !profileWrapRef.current.contains(target)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchOpen, notificationsOpen, profileOpen]);

  return (
    <div className={`header-actions ${searchOpen ? "search-open" : ""}`}>
      {/* Search — wrapped in ref div so click-outside works */}
      <div ref={searchWrapRef} style={{ display: "contents" }}>
        {searchOpen && (
          <form action="/dashboard#courses" method="get" className="header-search-form">
            <SearchIcon />
            <input
              ref={searchRef}
              name="search"
              type="search"
              placeholder="Search your courses..."
              aria-label="Search your courses"
              onKeyDown={(event) => {
                if (event.key === "Escape") setSearchOpen(false);
              }}
            />
            <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search">
              Esc
            </button>
          </form>
        )}
        <button
          type="button"
          className={`header-icon-button ${searchOpen ? "header-icon-active" : ""}`}
          aria-label={searchOpen ? "Close search" : "Search courses"}
          aria-expanded={searchOpen}
          onClick={() => {
            setSearchOpen((open) => !open);
            setNotificationsOpen(false);
            setProfileOpen(false);
          }}
        >
          <SearchIcon />
        </button>
      </div>

      {/* Notifications */}
      <div ref={notifWrapRef} className="header-action-wrap">
        <button
          type="button"
          className="header-icon-button"
          aria-label="Notifications"
          aria-expanded={notificationsOpen}
          onClick={() => {
            setNotificationsOpen((open) => !open);
            setSearchOpen(false);
            setProfileOpen(false);
          }}
        >
          <BellIcon />
          {!goalReached && <span className="header-alert-dot" />}
        </button>
        {notificationsOpen && (
          <div className="header-popover notification-popover">
            <div className="popover-heading">
              <span>Notifications</span>
              <span className={`notification-state ${goalReached ? "notification-done" : ""}`}>
                {goalReached ? "GOAL REACHED" : "DAILY GOAL"}
              </span>
            </div>
            <div className="notification-item">
              <span className={`notification-icon ${goalReached ? "notification-icon-done" : ""}`}>
                {goalReached ? "✓" : "✦"}
              </span>
              <div>
                <strong>
                  {goalReached ? "Daily goal complete" : "Your learning goal is waiting"}
                </strong>
                <p>
                  {goalReached
                    ? `You've reached your ${goalMinutes}-minute goal today. Great work!`
                    : `${remaining} ${remaining === 1 ? "minute" : "minutes"} left to reach your ${goalMinutes}-minute goal.`}
                </p>
              </div>
            </div>
            <div className="popover-footer">
              <span>
                {remindersEnabled ? "Daily email reminders are on" : "Daily email reminders are off"}
              </span>
              <Link href="/settings" onClick={() => setNotificationsOpen(false)}>
                View settings <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      <Link
        href="/dashboard"
        className="header-streak header-streak-fire"
        aria-label={`${streak}-day learning streak`}
        title={`${streak}-day learning streak`}
      >
        <FlameIcon size={19} />
        <span className="streak-count">{streak}</span>
      </Link>

      {/* Profile */}
      <div ref={profileWrapRef} className="header-action-wrap">
        <button
          type="button"
          className={`header-avatar-button ${showAvatar ? "has-avatar-img" : ""}`}
          aria-label="Open account menu"
          aria-expanded={profileOpen}
          onClick={() => {
            setProfileOpen((open) => !open);
            setSearchOpen(false);
            setNotificationsOpen(false);
          }}
        >
          {showAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl!}
              alt={accountName}
              className="header-avatar-img"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            <span>{initial}</span>
          )}
          <i />
        </button>
        {profileOpen && (
          <div className="header-popover profile-popover">
            <div className="profile-popover-user-row">
              {showAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl!}
                  alt=""
                  className="profile-popover-avatar-img"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="profile-popover-avatar-placeholder">
                  {initial}
                </div>
              )}
              <div className="profile-popover-user-meta">
                {displayName.trim() && <div className="profile-display-name">{displayName}</div>}
                <div className="profile-email">{email}</div>
              </div>
            </div>
            <div className="profile-popover-divider" />
            <Link href="/dashboard" onClick={() => setProfileOpen(false)}>
              My learning
            </Link>
            <Link href="/settings" onClick={() => setProfileOpen(false)}>
              Profile settings
            </Link>
            <form action="/auth/signout" method="post">
              <button>Log out</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
