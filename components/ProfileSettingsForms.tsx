"use client";

import { useActionState, useMemo, useState } from "react";
import { saveProfileSettings, type SettingsActionState } from "@/app/settings/actions";
import { computeProfileCompletion } from "@/lib/profile";
import { CheckIcon, SparklesIcon } from "@/components/Icons";

const initialState: SettingsActionState = { status: "idle", message: "" };

const FOCUS_SUGGESTIONS = [
  "GATE CSE 2026",
  "Full-Stack Web Dev",
  "DSA & LeetCode",
  "Machine Learning & AI",
  "System Design",
  "College Semester Exams",
];

export default function ProfileSettingsForms({
  email,
  displayName: initialDisplayName,
  avatarUrl,
  learningFocus: initialFocus,
  collegeOrCompany: initialCollege,
  bio: initialBio,
  dailyGoalMinutes: initialGoal,
  reminderEnabled: initialReminder,
}: {
  email: string;
  displayName: string;
  avatarUrl: string;
  learningFocus: string;
  collegeOrCompany: string;
  bio: string;
  dailyGoalMinutes: number;
  reminderEnabled: boolean;
}) {
  const [profileState, profileAction, profilePending] = useActionState(saveProfileSettings, initialState);

  // Live state for real-time 0-100% progress tracking as the user types
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [learningFocus, setLearningFocus] = useState(initialFocus);
  const [collegeOrCompany, setCollegeOrCompany] = useState(initialCollege);
  const [bio, setBio] = useState(initialBio);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(initialGoal);

  // Live calculation of 0% to 100%
  const completion = useMemo(() => {
    return computeProfileCompletion({
      displayName,
      avatarUrl,
      learningFocus,
      collegeOrCompany,
      bio,
      dailyGoalMinutes,
    });
  }, [displayName, avatarUrl, learningFocus, collegeOrCompany, bio, dailyGoalMinutes]);

  const { percent, isComplete, steps, remainingSteps } = completion;

  return (
    <div className="profile-settings-layout">
      {/* 0 to 100% Profile Progress Overview Card */}
      <section className="profile-progress-hero-card">
        <div className="profile-progress-header">
          <div className="profile-progress-title-block">
            <span className="card-kicker">PROFILE COMPLETION</span>
            <h2>{percent}% Profile Completed</h2>
            <p>
              {isComplete
                ? "🎉 Shaandar! Aapki profile 100% complete ho chuki hai. Aapke recommendations personalized hain."
                : `Fill in the remaining ${remainingSteps.length} ${remainingSteps.length === 1 ? "field" : "fields"} below to reach 100%.`}
            </p>
          </div>

          <div className="profile-progress-circle-wrap">
            <div className={`profile-progress-circle ${isComplete ? "is-100" : ""}`}>
              <span className="profile-progress-circle-number">{percent}%</span>
              <span className="profile-progress-circle-label">{isComplete ? "Complete" : "Progress"}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="profile-progress-main-track">
          <div
            className={`profile-progress-main-fill ${isComplete ? "fill-complete" : ""}`}
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Checklist of 6 Steps */}
        <div className="profile-steps-grid">
          {steps.map((step) => (
            <div
              key={step.key}
              className={`profile-step-pill ${step.done ? "is-done" : "is-pending"}`}
              title={step.description}
            >
              <span className="step-icon">
                {step.done ? <CheckIcon size={12} /> : "○"}
              </span>
              <span className="step-label">{step.label}</span>
              <span className="step-weight">+{step.weight}%</span>
            </div>
          ))}
        </div>
      </section>

      {/* Main Profile Update Form */}
      <section className="profile-settings-card">
        <div className="profile-settings-heading">
          <div className="profile-avatar-preview">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="profile-user-avatar" />
            ) : (
              <span className="profile-user-avatar-placeholder">
                {(displayName || email).charAt(0).toUpperCase()}
              </span>
            )}
            <span className="profile-google-badge" title="Authenticated with Google">G</span>
          </div>
          <div>
            <span className="card-kicker">PERSONAL DETAILS</span>
            <h2>Edit Profile & Study Goals</h2>
          </div>
        </div>

        <form action={profileAction} className="profile-settings-form">
          <div className="profile-form-grid-2">
            <label>
              Full / Display Name <span className="field-badge">+20%</span>
              <input
                name="display_name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                maxLength={80}
                autoComplete="name"
                required
              />
            </label>

            <label>
              Email address <span className="field-badge-subtle">Google Verified</span>
              <input type="email" value={email} readOnly aria-describedby="email-help" className="bg-[#1a1d21] text-[#9ca3af] cursor-not-allowed" />
              <small id="email-help">Google login email cannot be edited.</small>
            </label>
          </div>

          <label>
            Learning Focus / Target Exam <span className="field-badge">+25%</span>
            <input
              name="learning_focus"
              type="text"
              value={learningFocus}
              onChange={(e) => setLearningFocus(e.target.value)}
              placeholder="e.g. GATE CSE, Full-Stack Web Development, DSA"
              maxLength={120}
            />
            {/* Quick Suggestion Chips */}
            <div className="profile-chips-row">
              <span className="text-[11px] text-[#8f959a] mr-1">Quick suggestions:</span>
              {FOCUS_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  className="profile-chip-btn"
                  onClick={() => setLearningFocus(sug)}
                >
                  + {sug}
                </button>
              ))}
            </div>
          </label>

          <div className="profile-form-grid-2">
            <label>
              College / Role / Company <span className="field-badge">+15%</span>
              <input
                name="college_or_company"
                type="text"
                value={collegeOrCompany}
                onChange={(e) => setCollegeOrCompany(e.target.value)}
                placeholder="e.g. B.Tech CS Student / Frontend Dev"
                maxLength={100}
              />
            </label>

            <label>
              Daily Study Goal <span className="field-badge">+10%</span>
              <span className="profile-goal-input">
                <input
                  name="daily_goal_minutes"
                  type="number"
                  min={1}
                  max={600}
                  value={dailyGoalMinutes}
                  onChange={(e) => setDailyGoalMinutes(Number(e.target.value) || 0)}
                  required
                />
                <span>minutes per day</span>
              </span>
            </label>
          </div>

          <label>
            Short Bio / About Yourself <span className="field-badge">+15%</span>
            <textarea
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a little bit about your study path, goals or interests (e.g. Learning backend engineering with Go & Node.js, targeting GATE 2026)."
              maxLength={300}
              rows={3}
              className="profile-textarea"
            />
            <span className="text-[10px] text-right text-[#8f959a] block mt-1">
              {bio.length}/300 characters
            </span>
          </label>

          <div className="profile-settings-divider">
            <span>NOTIFICATIONS</span>
          </div>

          <label className="profile-reminder-toggle" htmlFor="daily-email-reminders">
            <input
              id="daily-email-reminders"
              name="reminder_enabled"
              type="checkbox"
              defaultChecked={initialReminder}
            />
            <span>
              <strong>Daily email reminders</strong>
              <small>Receive a friendly email nudge if you haven’t reached your daily goal by evening.</small>
            </span>
          </label>

          {profileState.message && (
            <p
              className={`profile-form-message ${profileState.status}`}
              role={profileState.status === "error" ? "alert" : "status"}
            >
              {profileState.message}
            </p>
          )}

          <div className="profile-submit-row">
            <button
              className="profile-save-button"
              type="submit"
              disabled={profilePending}
            >
              {profilePending ? "Saving changes..." : "Save Profile Settings"}
              <span aria-hidden="true">→</span>
            </button>

            {isComplete && (
              <span className="profile-complete-toast">
                <SparklesIcon size={14} className="text-amber-400 inline mr-1" />
                Profile 100% Complete!
              </span>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
