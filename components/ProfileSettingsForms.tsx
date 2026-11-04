"use client";

import { useActionState } from "react";
import { saveProfileSettings, updatePassword, type SettingsActionState } from "@/app/settings/actions";

const initialState: SettingsActionState = { status: "idle", message: "" };

export default function ProfileSettingsForms({
  email,
  displayName,
  dailyGoalMinutes,
  reminderEnabled,
}: {
  email: string;
  displayName: string;
  dailyGoalMinutes: number;
  reminderEnabled: boolean;
}) {
  const [profileState, profileAction, profilePending] = useActionState(saveProfileSettings, initialState);
  const [passwordState, passwordAction, passwordPending] = useActionState(updatePassword, initialState);

  return (
    <div className="profile-settings-grid">
      <section className="profile-settings-card">
        <div className="profile-settings-heading">
          <span className="profile-settings-icon">◎</span>
          <div><span className="card-kicker">YOUR ACCOUNT</span><h2>Profile & preferences</h2></div>
        </div>
        <form action={profileAction} className="profile-settings-form">
          <label>
            Display name
            <input name="display_name" type="text" defaultValue={displayName} placeholder="What should we call you?" maxLength={80} autoComplete="name" />
          </label>
          <label>
            Email address
            <input type="email" value={email} readOnly aria-describedby="email-help" />
            <small id="email-help">Your sign-in email can’t be changed here.</small>
          </label>
          <div className="profile-settings-divider"><span>LEARNING PREFERENCES</span></div>
          <label>
            Daily learning goal
            <span className="profile-goal-input"><input name="daily_goal_minutes" type="number" min={1} max={600} defaultValue={dailyGoalMinutes} required /><span>minutes per day</span></span>
          </label>
          <label className="profile-reminder-toggle" htmlFor="daily-email-reminders">
            <input id="daily-email-reminders" name="reminder_enabled" type="checkbox" defaultChecked={reminderEnabled} />
            <span><strong>Daily email reminders</strong><small>Get a reminder when you haven’t reached your learning goal.</small></span>
          </label>
          {profileState.message && <p className={`profile-form-message ${profileState.status}`} role={profileState.status === "error" ? "alert" : "status"}>{profileState.message}</p>}
          <button className="profile-save-button" type="submit" disabled={profilePending}>{profilePending ? "Saving..." : "Save profile"}<span aria-hidden="true">→</span></button>
        </form>
      </section>

      <section className="profile-settings-card password-settings-card">
        <div className="profile-settings-heading">
          <span className="profile-settings-icon password-icon">⌑</span>
          <div><span className="card-kicker">ACCOUNT SECURITY</span><h2>Change password</h2></div>
        </div>
        <p className="profile-password-intro">Choose a new password with at least 6 characters.</p>
        <form action={passwordAction} className="profile-settings-form">
          <label>
            New password
            <input name="new_password" type="password" minLength={6} maxLength={128} autoComplete="new-password" required />
          </label>
          <label>
            Confirm new password
            <input name="confirm_password" type="password" minLength={6} maxLength={128} autoComplete="new-password" required />
          </label>
          {passwordState.message && <p className={`profile-form-message ${passwordState.status}`} role={passwordState.status === "error" ? "alert" : "status"}>{passwordState.message}</p>}
          <button className="profile-save-button secondary-save" type="submit" disabled={passwordPending}>{passwordPending ? "Updating..." : "Update password"}<span aria-hidden="true">→</span></button>
        </form>
        <div className="profile-security-note"><span>🔒</span><p>Your password is managed securely by Watchify authentication. It is never shown or stored in this page.</p></div>
      </section>
    </div>
  );
}
