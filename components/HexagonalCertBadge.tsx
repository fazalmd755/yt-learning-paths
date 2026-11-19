"use client";

import React, { useId } from "react";

export type BadgeTheme = "blue" | "green" | "gold" | "purple";
export type BadgeStatus = "completed" | "in-progress" | "locked";
export type BadgeSize = "sm" | "md" | "lg" | "xl";

interface HexagonalCertBadgeProps {
  status?: BadgeStatus;
  percent?: number;
  theme?: BadgeTheme;
  size?: BadgeSize;
  className?: string;
  animateHover?: boolean;
}

const SIZE_CONFIG = {
  sm: { width: 34, height: 39 },
  md: { width: 48, height: 55 },
  lg: { width: 68, height: 78 },
  xl: { width: 92, height: 106 },
};

export default function HexagonalCertBadge({
  status = "completed",
  percent = 100,
  theme = "blue",
  size = "lg",
  className = "",
  animateHover = true,
}: HexagonalCertBadgeProps) {
  const uid = useId().replace(/:/g, "_");
  const dimensions = SIZE_CONFIG[size] || SIZE_CONFIG.lg;

  // Resolve effective status
  const isCompleted = status === "completed" || percent >= 100;
  const isLocked = status === "locked" || percent <= 0;
  const isInProgress = !isCompleted && !isLocked;

  // Theme color maps for the inner glowing core
  const themeGradients = {
    blue: {
      light: "#60a5fa",
      main: "#2563eb",
      dark: "#1d4ed8",
      deep: "#0f172a",
      glow: "rgba(37, 99, 235, 0.45)",
    },
    green: {
      light: "#a3e635",
      main: "#65a30d",
      dark: "#4d7c0f",
      deep: "#142805",
      glow: "rgba(101, 163, 13, 0.45)",
    },
    gold: {
      light: "#fde047",
      main: "#d97706",
      dark: "#b45309",
      deep: "#291503",
      glow: "rgba(217, 119, 6, 0.45)",
    },
    purple: {
      light: "#c084fc",
      main: "#7e22ce",
      dark: "#6b21a8",
      deep: "#1e0b36",
      glow: "rgba(126, 34, 206, 0.45)",
    },
  };

  const activeTheme = themeGradients[theme] || themeGradients.blue;

  // Outer Hexagon SVG Path with smoothly rounded corners
  const hexPath =
    "M 46 7.5 Q 50 5 54 7.5 L 89 25.5 Q 93 28 93 32 L 93 80 Q 93 84 89 86.5 L 54 104.5 Q 50 107 46 104.5 L 11 86.5 Q 7 84 7 80 L 7 32 Q 7 28 11 25.5 Z";

  // Inner hex cutout path (smaller inset for clipping interior)
  const hexInnerPath =
    "M 46 9.5 Q 50 7.5 54 9.5 L 87 27 Q 90 29 90 33 L 90 79 Q 90 83 87 85 L 54 102.5 Q 50 104.5 46 102.5 L 13 85 Q 10 83 10 79 L 10 33 Q 10 29 13 27 Z";

  return (
    <div
      className={`hex-badge-container relative inline-block select-none ${
        animateHover ? "hex-badge-hoverable" : ""
      } ${className}`}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        filter: isCompleted
          ? `drop-shadow(0 6px 14px ${activeTheme.glow}) drop-shadow(0 2px 4px rgba(0,0,0,0.5))`
          : "drop-shadow(0 4px 10px rgba(0,0,0,0.45))",
      }}
    >
      <svg
        viewBox="0 0 100 115"
        width="100%"
        height="100%"
        className="w-full h-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          {/* Metallic Wireframe Rim Gradient (Brushed Steel & Specular Chrome) */}
          <linearGradient id={`metalRim_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="18%" stopColor="#e2e8f0" />
            <stop offset="38%" stopColor="#94a3b8" />
            <stop offset="60%" stopColor="#64748b" />
            <stop offset="82%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Locked / Muted Titanium Rim Gradient */}
          <linearGradient id={`titaniumRim_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="25%" stopColor="#64748b" />
            <stop offset="65%" stopColor="#475569" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Wireframe metallic gradient for emblem & accents */}
          <linearGradient id={`metalWire_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#cbd5e1" />
            <stop offset="70%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          {/* Inner Core Radial Glow */}
          <radialGradient id={`coreGlow_${uid}`} cx="50%" cy="54%" r="65%">
            <stop offset="0%" stopColor={activeTheme.light} />
            <stop offset="38%" stopColor={activeTheme.main} />
            <stop offset="75%" stopColor={activeTheme.dark} />
            <stop offset="100%" stopColor={activeTheme.deep} />
          </radialGradient>

          {/* In-Progress Amber/Orange Glow */}
          <radialGradient id={`progressGlow_${uid}`} cx="50%" cy="54%" r="65%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="45%" stopColor="#d97706" />
            <stop offset="85%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#1f1305" />
          </radialGradient>

          {/* Clip path to bound inside the hexagon */}
          <clipPath id={`hexClip_${uid}`}>
            <path d={hexInnerPath} />
          </clipPath>
        </defs>

        {/* 1. Base dark background plate */}
        <path
          d={hexPath}
          fill={isCompleted ? "#181a1f" : "#131518"}
        />

        {/* 2. Interior Artwork based on status */}
        <g clipPath={`url(#hexClip_${uid})`}>
          {isCompleted && (
            <>
              {/* Central Glowing Medallion Core (No numbers!) */}
              <circle
                cx="50"
                cy="56"
                r="27"
                fill={`url(#coreGlow_${uid})`}
              />

              {/* Concentric metallic ring accent */}
              <circle
                cx="50"
                cy="56"
                r="25.5"
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1"
                strokeDasharray="3 2"
              />

              {/* 3D Metallic Graduation Mortarboard Emblem */}
              {/* Diamond Cap Top */}
              <polygon
                points="50,33 77,44 50,55 23,44"
                fill="rgba(15,23,42,0.65)"
                stroke={`url(#metalWire_${uid})`}
                strokeWidth="3.2"
                strokeLinejoin="round"
              />

              {/* Cap Skullcap Base */}
              <path
                d="M 34 50 L 34 62 Q 50 71 66 62 L 66 50"
                fill="none"
                stroke={`url(#metalWire_${uid})`}
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Tassel drapery & tassel bead */}
              <path
                d="M 50 44 Q 65 46 73 53 L 75 66"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="75" cy="68" r="2" fill="#f1f5f9" />

              {/* Verified Certificate Ribbon / Star Accent below Cap */}
              <polygon
                points="50,71 52.2,76 57.5,76 53.2,79.5 54.8,84.5 50,81.5 45.2,84.5 46.8,79.5 42.5,76 47.8,76"
                fill="#fbbf24"
                stroke="#ffffff"
                strokeWidth="0.8"
                style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.8))" }}
              />

              {/* Tiny crest laurel wings flanking the star */}
              <path
                d="M 33 76 Q 40 82 45 80 M 67 76 Q 60 82 55 80"
                fill="none"
                stroke={`url(#metalWire_${uid})`}
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity="0.85"
              />
            </>
          )}

          {isInProgress && (
            <>
              {/* In-Progress State: Circular Progress Gauge (NO 50 or 100 numbers!) */}
              <circle
                cx="50"
                cy="56"
                r="24"
                fill={`url(#progressGlow_${uid})`}
                opacity="0.75"
              />

              {/* Progress Ring Track */}
              <circle
                cx="50"
                cy="56"
                r="21"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="3.2"
              />

              {/* Progress Ring Fill */}
              <circle
                cx="50"
                cy="56"
                r="21"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3.2"
                strokeDasharray="131.95"
                strokeDashoffset={131.95 - (131.95 * Math.min(100, Math.max(0, percent))) / 100}
                strokeLinecap="round"
                transform="rotate(-90 50 56)"
              />

              {/* Center Graduation Cap Outline in Progress */}
              <polygon
                points="50,42 66,48 50,54 34,48"
                fill="none"
                stroke={`url(#metalWire_${uid})`}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M 40 52 L 40 59 Q 50 64 60 59 L 60 52"
                fill="none"
                stroke={`url(#metalWire_${uid})`}
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              {/* Small Lock or Progress Indicator below cap */}
              <circle cx="50" cy="72" r="3" fill="#f59e0b" />
            </>
          )}

          {isLocked && (
            <>
              {/* Locked State: Dark Titanium Wireframe Padlock */}
              <circle
                cx="50"
                cy="56"
                r="22"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1.5"
                strokeDasharray="2 3"
              />

              {/* Padlock Shackle */}
              <path
                d="M 42 50 L 42 43 A 8 8 0 0 1 58 43 L 58 50"
                fill="none"
                stroke={`url(#titaniumRim_${uid})`}
                strokeWidth="2.8"
                strokeLinecap="round"
              />

              {/* Padlock Body */}
              <rect
                x="37"
                y="50"
                width="26"
                height="20"
                rx="3.5"
                fill="#1e2229"
                stroke={`url(#titaniumRim_${uid})`}
                strokeWidth="2.4"
              />

              {/* Keyhole */}
              <circle cx="50" cy="58" r="2.2" fill="#94a3b8" />
              <path d="M 49.2 58 L 50.8 58 L 51.5 64 L 48.5 64 Z" fill="#94a3b8" />
            </>
          )}
        </g>

        {/* 3. Outer Hexagon Metallic Wireframe Rim */}
        <path
          d={hexPath}
          fill="none"
          stroke={isCompleted ? `url(#metalRim_${uid})` : `url(#titaniumRim_${uid})`}
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 4. Top-Left Specular Chrome Reflection Highlight */}
        <path
          d="M 14 26 L 46 7.5 Q 50 5 54 7.5 L 75 18"
          fill="none"
          stroke="#ffffff"
          strokeWidth={isCompleted ? "1.6" : "0.9"}
          strokeLinecap="round"
          opacity={isCompleted ? 0.9 : 0.4}
        />
      </svg>
    </div>
  );
}
