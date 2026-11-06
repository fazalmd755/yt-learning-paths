"use client";

import { useEffect, useRef, useState } from "react";
import { PlayIcon } from "@/components/Icons";

type TimerMode = "work" | "shortBreak" | "longBreak";

const MODE_TIMES: Record<TimerMode, number> = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export default function PomodoroTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(MODE_TIMES.work);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const totalTime = MODE_TIMES[mode];
  const progressPercent = Math.round(((totalTime - timeLeft) / totalTime) * 100);

  // Web Audio chime generator
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {}
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      playChime();
      if (mode === "work") {
        const nextSessions = completedSessions + 1;
        setCompletedSessions(nextSessions);
        if (nextSessions % 4 === 0) {
          setMode("longBreak");
          setTimeLeft(MODE_TIMES.longBreak);
        } else {
          setMode("shortBreak");
          setTimeLeft(MODE_TIMES.shortBreak);
        }
      } else {
        setMode("work");
        setTimeLeft(MODE_TIMES.work);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, completedSessions]);

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(MODE_TIMES[newMode]);
    setIsRunning(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="pomodoro-widget">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="pomodoro-toggle-btn"
          title="Open Focus Timer"
          aria-label="Open Focus Timer"
        >
          <span className="pomodoro-icon">⏱</span>
          <span className="pomodoro-time-preview">{timeFormatted}</span>
          {isRunning && <span className="pomodoro-live-dot" />}
        </button>
      ) : (
        <div className="pomodoro-card">
          <div className="pomodoro-card-header">
            <div className="flex items-center gap-2">
              <span className="pomodoro-card-icon">⏱</span>
              <strong className="pomodoro-title">FOCUS TIMER</strong>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="pomodoro-close-btn"
              aria-label="Close Focus Timer"
            >
              ✕
            </button>
          </div>

          <div className="pomodoro-mode-tabs">
            <button
              type="button"
              className={`pomodoro-tab ${mode === "work" ? "active" : ""}`}
              onClick={() => switchMode("work")}
            >
              Study 25m
            </button>
            <button
              type="button"
              className={`pomodoro-tab ${mode === "shortBreak" ? "active" : ""}`}
              onClick={() => switchMode("shortBreak")}
            >
              Break 5m
            </button>
            <button
              type="button"
              className={`pomodoro-tab ${mode === "longBreak" ? "active" : ""}`}
              onClick={() => switchMode("longBreak")}
            >
              Long 15m
            </button>
          </div>

          <div className="pomodoro-display">
            <div className="pomodoro-big-time">{timeFormatted}</div>
            <span className="pomodoro-status-text">
              {mode === "work"
                ? isRunning
                  ? "Stay in deep focus"
                  : "Ready to focus"
                : "Rest your eyes & stretch"}
            </span>
            <div className="pomodoro-progress-bar">
              <div
                className="pomodoro-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="pomodoro-actions">
            <button
              type="button"
              onClick={() => setIsRunning(!isRunning)}
              className={`pomodoro-btn-main ${isRunning ? "running" : ""}`}
            >
              {isRunning ? "Pause" : "Start Focus"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRunning(false);
                setTimeLeft(MODE_TIMES[mode]);
              }}
              className="pomodoro-btn-reset"
            >
              Reset
            </button>
          </div>

          <div className="pomodoro-footer">
            <span>Sessions completed: <strong>{completedSessions}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
