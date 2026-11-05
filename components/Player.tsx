"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRightIcon, CalendarIcon, CheckCircleIcon } from "./Icons";
import ScheduleLessonModal from "./ScheduleLessonModal";
import { createClient } from "@/lib/supabase/client";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type Props = {
  userId: string;
  courseId: string | null;
  videoId: string; // videos.id (uuid)
  youtubeId: string;
  durationSeconds: number;
  startAt: number;
  embeddable: boolean;
  initialStatus: string;
  nextHref: string | null;
  videoTitle?: string;
  courseTitle?: string;
};

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

let ytPromise: Promise<any> | null = null;
function loadYT(): Promise<any> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!ytPromise) {
    ytPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve(window.YT);
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    });
  }
  return ytPromise;
}

export default function Player({
  userId,
  courseId,
  videoId,
  youtubeId,
  durationSeconds,
  startAt,
  embeddable,
  initialStatus,
  nextHref,
  videoTitle = "Lesson",
  courseTitle = "Course",
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const accRef = useRef(0); // unsaved ACTUAL play time (seconds)
  const lastTickRef = useRef(0);
  const playingRef = useRef(false);
  const [status, setStatus] = useState(initialStatus);

  // Enhancements: Playback speed, autoplay next, shortcuts modal, schedule modal
  const [speed, setSpeed] = useState(1);
  const [autoplayNext, setAutoplayNext] = useState(false);
  const autoplayNextRef = useRef(autoplayNext);
  autoplayNextRef.current = autoplayNext;

  const [autoplayCountdown, setAutoplayCountdown] = useState<number | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  useEffect(() => {
    try {
      const savedSpeed = localStorage.getItem("watchify_speed");
      if (savedSpeed && SPEEDS.includes(Number(savedSpeed))) {
        setSpeed(Number(savedSpeed));
      }
      const savedAutoplay = localStorage.getItem("watchify_autoplay_next");
      if (savedAutoplay !== null) {
        setAutoplayNext(savedAutoplay === "true");
      }
    } catch {}
  }, []);

  const changeSpeed = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    try {
      localStorage.setItem("watchify_speed", String(newSpeed));
    } catch {}
    const p = playerRef.current;
    if (p && typeof p.setPlaybackRate === "function") {
      p.setPlaybackRate(newSpeed);
    }
  }, []);

  const toggleAutoplay = useCallback(() => {
    setAutoplayNext((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("watchify_autoplay_next", String(next));
      } catch {}
      return next;
    });
  }, []);

  // Countdown handler for autoplay next
  useEffect(() => {
    if (autoplayCountdown === null) return;
    if (autoplayCountdown <= 0) {
      if (nextHref) router.push(nextHref);
      return;
    }
    const timer = setTimeout(() => {
      setAutoplayCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [autoplayCountdown, nextHref, router]);

  const position = () => {
    const p = playerRef.current;
    return p && typeof p.getCurrentTime === "function" ? Math.floor(p.getCurrentTime()) : 0;
  };

  const tick = useCallback(() => {
    const now = Date.now();
    accRef.current += Math.min((now - lastTickRef.current) / 1000, 2);
    lastTickRef.current = now;
  }, []);

  const flush = useCallback(
    async (force: boolean) => {
      const seconds = Math.floor(accRef.current);
      if (seconds === 0 && !force) return;
      accRef.current -= seconds;
      const { error } = await supabase.rpc("save_progress", {
        p_video_id: videoId,
        p_position: position(),
        p_seconds: seconds,
        p_duration: durationSeconds,
      });
      if (error) accRef.current += seconds;
      else if (seconds > 0) setStatus((s) => (s === "not_started" ? "in_progress" : s));
    },
    [supabase, videoId, durationSeconds]
  );

  const markComplete = useCallback(async () => {
    const { error } = await supabase.from("video_progress").upsert(
      {
        user_id: userId,
        video_id: videoId,
        status: "completed",
        completed_at: new Date().toISOString(),
        last_position: position(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,video_id" }
    );
    if (!error) setStatus("completed");
  }, [supabase, userId, videoId]);

  useEffect(() => {
    if (!embeddable) return;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    loadYT().then((YT) => {
      if (cancelled || !mountRef.current) return;
      const el = document.createElement("div");
      mountRef.current.appendChild(el);

      playerRef.current = new YT.Player(el, {
        videoId: youtubeId,
        width: "100%",
        height: "100%",
        playerVars: { start: startAt, rel: 0, playsinline: 1 },
        events: {
          onReady: (e: any) => {
            const savedSpeed = Number(localStorage.getItem("watchify_speed") || "1");
            if (savedSpeed && typeof e.target.setPlaybackRate === "function") {
              e.target.setPlaybackRate(savedSpeed);
            }
          },
          onStateChange: (e: any) => {
            const S = YT.PlayerState;
            if (e.data === S.PLAYING) {
              playingRef.current = true;
              lastTickRef.current = Date.now();
              if (courseId) {
                supabase
                  .from("user_courses")
                  .update({ last_video_id: videoId })
                  .eq("id", courseId)
                  .then(() => {});
              }
            } else {
              if (playingRef.current) tick();
              playingRef.current = false;
              if (e.data === S.PAUSED || e.data === S.ENDED) flush(true);
              if (e.data === S.ENDED) {
                markComplete();
                if (autoplayNextRef.current && nextHref) {
                  setAutoplayCountdown(5);
                }
              }
            }
          },
        },
      });

      interval = setInterval(() => {
        if (!playingRef.current) return;
        tick();
        if (accRef.current >= 10) flush(false);
      }, 1000);
    });

    if (typeof window !== "undefined") {
      (window as any).__watchifyGetCurrentTime = () => position();
      (window as any).__watchifySeekTo = (sec: number) => {
        const p = playerRef.current;
        if (p && typeof p.seekTo === "function") {
          p.seekTo(Math.max(0, sec), true);
        }
      };
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }
      if (e.key === "Escape") {
        setShowShortcuts(false);
        setAutoplayCountdown(null);
        return;
      }

      const p = playerRef.current;
      if (!p || typeof p.getPlayerState !== "function") return;

      if (e.code === "Space" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        const s = p.getPlayerState();
        if (s === 1) {
          p.pauseVideo();
        } else {
          p.playVideo();
        }
      } else if (e.code === "ArrowLeft" || e.key === "j" || e.key === "J") {
        e.preventDefault();
        p.seekTo(Math.max(0, position() - 5), true);
      } else if (e.code === "ArrowRight" || e.key === "l" || e.key === "L") {
        e.preventDefault();
        p.seekTo(position() + 5, true);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        if (typeof p.isMuted === "function") {
          if (p.isMuted()) p.unMute();
          else p.mute();
        }
      } else if (e.key === ">" || (e.shiftKey && e.key === ".")) {
        e.preventDefault();
        const currentIndex = SPEEDS.indexOf(speed);
        if (currentIndex < SPEEDS.length - 1) {
          changeSpeed(SPEEDS[currentIndex + 1]);
        }
      } else if (e.key === "<" || (e.shiftKey && e.key === ",")) {
        e.preventDefault();
        const currentIndex = SPEEDS.indexOf(speed);
        if (currentIndex > 0) {
          changeSpeed(SPEEDS[currentIndex - 1]);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);

    const onHide = () => {
      if (document.visibilityState === "hidden") {
        if (playingRef.current) tick();
        flush(true);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("keydown", onKeyDown);
      if (typeof window !== "undefined") {
        delete (window as any).__watchifyGetCurrentTime;
        delete (window as any).__watchifySeekTo;
      }
      if (playingRef.current) tick();
      flush(true);
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embeddable, youtubeId, videoId, courseId, nextHref, changeSpeed]);

  return (
    <div className="player-container">
      {/* Autoplay Countdown Overlay */}
      {autoplayCountdown !== null && nextHref && (
        <div className="autoplay-countdown-banner">
          <div className="autoplay-countdown-info">
            <span className="autoplay-spinner" />
            <span>
              Next lesson starting in <strong>{autoplayCountdown}s</strong>...
            </span>
          </div>
          <div className="autoplay-countdown-buttons">
            <button
              type="button"
              onClick={() => {
                setAutoplayCountdown(null);
                router.push(nextHref);
              }}
              className="autoplay-now-btn"
            >
              Play Now →
            </button>
            <button
              type="button"
              onClick={() => setAutoplayCountdown(null)}
              className="autoplay-cancel-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {embeddable ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black" ref={mountRef} />
      ) : (
        <div className="watch-embed-fallback">
          <p>
            The video owner does not allow embedding. Watch it on YouTube, then return here to mark
            it complete.
          </p>
          <a
            href={`https://www.youtube.com/watch?v=${youtubeId}`}
            target="_blank"
            rel="noreferrer"
            className="watch-youtube-button"
          >
            Watch on YouTube
          </a>
        </div>
      )}

      {/* Main Player Action Bar */}
      <div className="player-action-bar">
        <div className="player-action-left">
          {status === "completed" ? (
            <span className="watch-complete-badge">
              <CheckCircleIcon size={14} className="inline-block mr-1 text-lime" /> Complete
            </span>
          ) : (
            <button onClick={markComplete} className="watch-mark-complete">
              Mark as complete
            </button>
          )}

          {nextHref && (
            <Link href={nextHref} className="watch-next-button">
              Next video <ArrowRightIcon size={13} className="inline-block ml-1" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setShowSchedule(true)}
            className="player-schedule-btn"
            title="Schedule this lesson in your study planner"
          >
            <CalendarIcon size={14} /> Schedule
          </button>
        </div>

        <div className="player-action-right">
          {/* Speed Selector */}
          <div className="player-speed-picker">
            <span className="player-speed-label">Speed:</span>
            <div className="player-speed-options">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => changeSpeed(s)}
                  className={`player-speed-btn ${speed === s ? "player-speed-btn-active" : ""}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Autoplay Next Toggle */}
          <button
            type="button"
            onClick={toggleAutoplay}
            className={`player-autoplay-toggle ${autoplayNext ? "player-autoplay-active" : ""}`}
            title={autoplayNext ? "Autoplay next lesson is ON" : "Autoplay next lesson is OFF"}
          >
            <span className="player-autoplay-indicator" />
            <span>Autoplay</span>
          </button>

          {/* Shortcuts Help Button */}
          <button
            type="button"
            onClick={() => setShowShortcuts(true)}
            className="player-shortcuts-modal-btn"
            title="Keyboard shortcuts (?)"
            aria-label="View keyboard shortcuts"
          >
            ?
          </button>
        </div>
      </div>

      <div className="player-shortcuts-hint">
        <span><kbd>Space</kbd> Play/Pause</span>
        <span><kbd>←</kbd> <kbd>→</kbd> Seek 5s</span>
        <span><kbd>&lt;</kbd> <kbd>&gt;</kbd> Speed</span>
        <span><kbd>M</kbd> Mute</span>
        <span><kbd>?</kbd> All Shortcuts</span>
      </div>

      {/* Keyboard Shortcuts Dialog */}
      {showShortcuts && (
        <div className="shortcuts-modal-backdrop" onClick={() => setShowShortcuts(false)}>
          <div className="shortcuts-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-modal-header">
              <h3>Keyboard Shortcuts</h3>
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                className="shortcuts-modal-close"
              >
                ✕
              </button>
            </div>
            <div className="shortcuts-modal-grid">
              <div className="shortcut-row">
                <span>Play / Pause</span>
                <span><kbd>Space</kbd> or <kbd>K</kbd></span>
              </div>
              <div className="shortcut-row">
                <span>Rewind 5 seconds</span>
                <span><kbd>←</kbd> or <kbd>J</kbd></span>
              </div>
              <div className="shortcut-row">
                <span>Fast-forward 5 seconds</span>
                <span><kbd>→</kbd> or <kbd>L</kbd></span>
              </div>
              <div className="shortcut-row">
                <span>Increase Playback Speed</span>
                <span><kbd>&gt;</kbd> (Shift + .)</span>
              </div>
              <div className="shortcut-row">
                <span>Decrease Playback Speed</span>
                <span><kbd>&lt;</kbd> (Shift + ,)</span>
              </div>
              <div className="shortcut-row">
                <span>Mute / Unmute</span>
                <span><kbd>M</kbd></span>
              </div>
              <div className="shortcut-row">
                <span>Toggle Shortcuts Help</span>
                <span><kbd>?</kbd></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Lesson Modal */}
      <ScheduleLessonModal
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        userId={userId}
        videoTitle={videoTitle}
        watchUrl={typeof window !== "undefined" ? window.location.pathname : `/watch/${courseId}/${videoId}`}
        courseTitle={courseTitle}
      />
    </div>
  );
}
