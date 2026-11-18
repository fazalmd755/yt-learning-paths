"use client";

import React from "react";
import { WatchlifyIcon } from "./BrandLogo";

interface LogoLoaderProps {
  /** Optional status text shown below the logo */
  text?: string;
  /** Size of the logo icon in pixels (default: 64) */
  size?: number;
  /** Whether to fill the entire viewport or center within parent container (default: false) */
  fullScreen?: boolean;
  /** Optional custom class name */
  className?: string;
  /** Whether to show the sleek beam loader line (default: true) */
  showBeam?: boolean;
}

export default function LogoLoader({
  text = "Loading...",
  size = 64,
  fullScreen = false,
  className = "",
  showBeam = true,
}: LogoLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={text}
      className={`logo-loader-container ${
        fullScreen
          ? "fixed inset-0 z-50 min-h-screen w-screen bg-[var(--background,#0d1210)]"
          : "relative min-h-[60vh] w-full"
      } flex flex-col items-center justify-center p-6 select-none ${className}`}
    >
      {/* Ambient background glows */}
      <div className="relative flex items-center justify-center" style={{ width: size * 2.2, height: size * 2.2 }}>
        {/* Deep emerald-cyan blurred glow orb */}
        <div
          className="logo-loader-ambient-glow pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.38) 0%, rgba(34, 211, 238, 0.22) 45%, transparent 72%)",
            filter: "blur(28px)",
          }}
          aria-hidden="true"
        />

        {/* Secondary softer outer halo */}
        <div
          className="logo-loader-ambient-halo pointer-events-none absolute -inset-4 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(circle, rgba(143, 199, 58, 0.25) 0%, rgba(16, 185, 129, 0.15) 50%, transparent 75%)",
            filter: "blur(40px)",
          }}
          aria-hidden="true"
        />

        {/* Pulsing Logo Card */}
        <div className="logo-loader-icon-wrapper relative z-10 flex items-center justify-center">
          <div
            className="relative rounded-[22%] p-1 transition-transform"
            style={{
              filter: "drop-shadow(0 0 24px rgba(16, 185, 129, 0.4))",
            }}
          >
            <WatchlifyIcon size={size} transparent={false} />
          </div>
        </div>
      </div>

      {/* Brand title & caption */}
      <div className="relative z-10 mt-5 flex flex-col items-center text-center">
        <div className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-[var(--foreground,#f2f5f3)]">
          <span>Watch</span>
          <span className="text-gradient-brand font-bold">lify</span>
        </div>

        {text && (
          <p className="logo-loader-caption mt-1.5 text-xs font-medium tracking-wide text-[var(--ink-soft,#9eaba3)]">
            {text}
          </p>
        )}

        {/* Modern high-speed gradient beam line */}
        {showBeam && (
          <div className="logo-loader-beam-track mt-4 h-[3px] w-36 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="logo-loader-beam-bar h-full w-full rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
