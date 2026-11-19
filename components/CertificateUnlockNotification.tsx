"use client";

import { useEffect, useRef, useState } from "react";
import type { CourseSummary } from "@/lib/data";
import HexagonalCertBadge, { BadgeTheme } from "@/components/HexagonalCertBadge";

interface Props {
  course: CourseSummary;
  theme?: BadgeTheme;
  onViewCertificate: () => void;
  onDismiss: () => void;
}

export default function CertificateUnlockNotification({
  course,
  theme = "blue",
  onViewCertificate,
  onDismiss,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Entrance animation trigger
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Confetti particles animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const colors = ["#38bdf8", "#34d399", "#fbbf24", "#f43f5e", "#a855f7", "#ffffff"];
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      vRot: number;
      shape: "rect" | "circle";
      opacity: number;
    }> = [];

    // Spawn 50 celebratory confetti particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: width * 0.18 + (Math.random() - 0.5) * 40,
        y: height * 0.5 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.3) * 6,
        vy: -Math.random() * 7 - 3,
        size: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        shape: Math.random() > 0.4 ? "rect" : "circle",
        opacity: 1,
      });
    }

    let frame = 0;
    const maxFrames = 180; // ~3 seconds at 60fps

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18; // gravity
        p.vx *= 0.98; // air drag
        p.rotation += p.vRot;

        if (frame > 90) {
          p.opacity = Math.max(0, p.opacity - 0.012);
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size * 1.6, p.size * 0.8);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      frame++;
      if (frame < maxFrames) {
        animationId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div
      className={`cert-notification-overlay fixed z-50 bottom-5 right-5 max-w-[460px] w-[calc(100vw-2.5rem)] transition-all duration-500 ease-out ${
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95 pointer-events-none"
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="cert-notification-card relative overflow-hidden rounded-2xl bg-slate-900/95 dark:bg-[#12161f]/95 backdrop-blur-xl border border-amber-400/30 dark:border-amber-400/25 p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.65),0_0_24px_rgba(251,191,36,0.15)] text-white">
        {/* Canvas for celebratory confetti particles */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10 w-full h-full"
        />

        {/* Ambient background glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-gradient-to-br from-amber-500/25 via-blue-500/15 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg transition-colors z-20"
          aria-label="Dismiss notification"
        >
          ✕
        </button>

        <div className="relative z-10 flex items-start gap-4">
          {/* Glowing 3D Metallic Hexagonal Badge */}
          <div className="shrink-0 pt-0.5 animate-bounce-subtle">
            <HexagonalCertBadge
              status="completed"
              percent={100}
              theme={theme}
              size="lg"
            />
          </div>

          {/* Text Content */}
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold tracking-wide uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <span>🎉</span>
                <span>New Certificate Unlocked!</span>
              </span>
            </div>

            <h4
              className="text-sm sm:text-base font-bold text-white truncate mb-1"
              title={course.title}
            >
              {course.title}
            </h4>

            <p className="text-xs text-slate-300 dark:text-zinc-400 leading-relaxed mb-3">
              Congratulations! You've completed 100% of this course and earned your official verified credential.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={onViewCertificate}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/25 hover:shadow-amber-500/40 transition-all flex items-center gap-1.5"
              >
                <span>View Certificate</span>
                <span>🎓 ↗</span>
              </button>

              <button
                type="button"
                onClick={onDismiss}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
