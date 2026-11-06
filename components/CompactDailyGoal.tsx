"use client";

import { useState, useTransition } from "react";
import { TargetIcon, CheckIcon } from "@/components/Icons";
import { updateDailyGoal } from "@/app/dashboard/actions";

const PRESETS = [15, 30, 45, 60];

export default function CompactDailyGoal({ initialMinutes }: { initialMinutes: number }) {
  const [goal, setGoal] = useState<number>(initialMinutes);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (minutes: number) => {
    setGoal(minutes);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("daily_goal_minutes", String(minutes));
      await updateDailyGoal(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.set("daily_goal_minutes", String(goal));
      await updateDailyGoal(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="compact-daily-goal">
      <div className="goal-panel-top">
        <div className="flex items-center gap-2">
          <span className="goal-badge-icon">
            <TargetIcon size={15} />
          </span>
          <span className="goal-panel-label">DAILY GOAL</span>
        </div>
        {saved && (
          <span className="goal-saved-pill">
            <CheckIcon size={12} /> Saved
          </span>
        )}
      </div>

      <div className="goal-display-row">
        <div className="goal-value-display">
          <strong className="goal-value-num">{goal}</strong>
          <span className="goal-value-unit">min / day</span>
        </div>
        <p className="goal-panel-hint">Target learning time per day</p>
      </div>

      <div className="goal-presets-row">
        {PRESETS.map((p) => {
          const isActive = goal === p;
          return (
            <button
              key={p}
              type="button"
              disabled={isPending}
              onClick={() => handleSelect(p)}
              className={`goal-preset-btn ${isActive ? "active" : ""}`}
            >
              {p}m
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="goal-custom-form">
        <div className="goal-custom-input-wrap">
          <input
            type="number"
            min={1}
            max={600}
            value={goal}
            onChange={(e) => setGoal(Math.max(1, Math.min(600, Number(e.target.value) || 1)))}
            className="goal-custom-input"
            aria-label="Custom daily goal in minutes"
          />
          <span className="goal-custom-suffix">min</span>
        </div>
        <button
          type="submit"
          disabled={isPending || goal === initialMinutes}
          className="goal-save-btn"
        >
          {isPending ? "..." : "Set"}
        </button>
      </form>
    </div>
  );
}
