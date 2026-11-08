"use client";

import React, { useId } from "react";

type WatchlifyIconProps = {
  className?: string;
  size?: number;
  transparent?: boolean;
};

export function WatchlifyIcon({
  className = "",
  size = 32,
  transparent = false,
}: WatchlifyIconProps) {
  const rawId = useId();
  const gradId = `watchlify-g-${rawId.replace(/:/g, "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="80"
          y1="100"
          x2="440"
          y2="400"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#10B981" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      {!transparent && <rect width="512" height="512" rx="112" fill="#0B0D10" />}
      <g transform="translate(0,14)">
        {/* W = two open book pages meeting at the spine */}
        <path
          d="M96 150 L176 366 L256 226 L336 366 L416 150"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="44"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Play button rising from the spine */}
        <path
          d="M236 100 L236 172 L294 136 Z"
          fill={`url(#${gradId})`}
          stroke={`url(#${gradId})`}
          strokeWidth="14"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

type WatchlifyLogoProps = {
  className?: string;
  iconSize?: number;
  showText?: boolean;
};

export function WatchlifyLogo({
  className = "",
  iconSize = 30,
  showText = true,
}: WatchlifyLogoProps) {
  return (
    <div
      className={`watchlify-brand-logo ${className}`}
      style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}
    >
      <WatchlifyIcon size={iconSize} />
      {showText && (
        <span className="brand-name">
          Watch<span className="text-gradient-brand">lify</span>
        </span>
      )}
    </div>
  );
}
