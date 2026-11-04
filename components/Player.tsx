"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
};

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
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const accRef = useRef(0); // abhi tak ka unsaved ACTUAL play time (seconds)
  const lastTickRef = useRef(0);
  const playingRef = useRef(false);
  const [status, setStatus] = useState(initialStatus);

  const position = () => {
    const p = playerRef.current;
    return p && typeof p.getCurrentTime === "function" ? Math.floor(p.getCurrentTime()) : 0;
  };

  const tick = useCallback(() => {
    const now = Date.now();
    // Ek tick mein max 2s: tab throttle ho to bhi time inflate nahi hoga
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
      if (error) accRef.current += seconds; // agli baar dobara try hoga
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
              if (e.data === S.ENDED) markComplete();
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
      if (playingRef.current) tick();
      flush(true);
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embeddable, youtubeId, videoId, courseId]);

  return (
    <div>
      {embeddable ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black" ref={mountRef} />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg border border-stone-300 bg-white p-6 text-center">
          <p className="text-sm text-stone-700">
            The video owner does not allow embedding. Watch it on YouTube, then return here to mark
            it complete.
          </p>
          <a
            href={`https://www.youtube.com/watch?v=${youtubeId}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            Watch on YouTube
          </a>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {status === "completed" ? (
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">Complete ✓</span>
        ) : (
          <button
            onClick={markComplete}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-100"
          >
            Mark as complete
          </button>
        )}
        {nextHref && (
          <Link
            href={nextHref}
            className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
          >
            Next video →
          </Link>
        )}
      </div>
    </div>
  );
}
