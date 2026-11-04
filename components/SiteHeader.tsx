"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Props = {
  email: string;
  displayName: string;
  streak: number;
  goalMinutes: number;
  todayMinutes: number;
  remindersEnabled: boolean;
};

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>;
}

function BellIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>;
}

function FlameIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.2 22c4.2 0 7-2.9 7-7.1 0-3.1-1.6-5.3-4.1-8.1-.1 2-1.1 3.2-2.2 3.7.4-3.8-1.2-7.2-4.8-9.5.5 4-1 6.1-2.4 8.3-1.1 1.7-1.8 3.3-1.8 5.4 0 4.3 3.2 7.3 8.3 7.3Z" /><path d="M12.1 19.3c1.8 0 3-1.2 3-3.1 0-1.2-.7-2.3-1.8-3.4-.2 1.1-.7 1.6-1.5 2-.1-1.5-.8-2.6-2-3.5.1 1.7-.9 2.6-1.2 4.1-.5 2.2.9 3.9 3.5 3.9Z" /></svg>;
}

export default function SiteHeader({ email, displayName, streak, goalMinutes, todayMinutes, remindersEnabled }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const goalReached = todayMinutes >= goalMinutes;
  const remaining = Math.max(0, goalMinutes - todayMinutes);
  const accountName = displayName.trim() || email;
  const initial = accountName.trim().charAt(0).toUpperCase() || "U";

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  return (
    <div className={`header-actions ${searchOpen ? "search-open" : ""}`}>
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
          <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search">Esc</button>
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

      <div className="header-action-wrap">
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
            <div className="popover-heading"><span>Notifications</span><span className={`notification-state ${goalReached ? "notification-done" : ""}`}>{goalReached ? "GOAL REACHED" : "DAILY GOAL"}</span></div>
            <div className="notification-item">
              <span className={`notification-icon ${goalReached ? "notification-icon-done" : ""}`}>{goalReached ? "✓" : "✦"}</span>
              <div>
                <strong>{goalReached ? "Daily goal complete" : "Your learning goal is waiting"}</strong>
                <p>{goalReached ? `You've reached your ${goalMinutes}-minute goal today. Great work!` : `${remaining} ${remaining === 1 ? "minute" : "minutes"} left to reach your ${goalMinutes}-minute goal.`}</p>
              </div>
            </div>
            <div className="popover-footer">
              <span>{remindersEnabled ? "Daily email reminders are on" : "Daily email reminders are off"}</span>
              <Link href="/settings" onClick={() => setNotificationsOpen(false)}>View settings <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        )}
      </div>

      <Link href="/dashboard" className="header-streak" aria-label={`${streak}-day learning streak`}>
        <FlameIcon /><span>{streak}</span>
      </Link>

      <div className="header-action-wrap">
        <button
          type="button"
          className="header-avatar-button"
          aria-label="Open account menu"
          aria-expanded={profileOpen}
          onClick={() => {
            setProfileOpen((open) => !open);
            setSearchOpen(false);
            setNotificationsOpen(false);
          }}
        >
          <span>{initial}</span><i />
        </button>
        {profileOpen && (
          <div className="header-popover profile-popover">
            {displayName.trim() && <div className="profile-display-name">{displayName}</div>}
            <div className="profile-email">{email}</div>
            <Link href="/dashboard" onClick={() => setProfileOpen(false)}>My learning</Link>
            <Link href="/settings" onClick={() => setProfileOpen(false)}>Profile settings</Link>
            <form action="/auth/signout" method="post"><button>Log out</button></form>
          </div>
        )}
      </div>
    </div>
  );
}
