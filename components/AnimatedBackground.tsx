"use client";

import React from "react";

export default function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="app-background-layer"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* 1. Refined Sleek Tech Grid with smooth radial fade */}
      <div
        className="tech-grid-overlay"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 85% 65% at 50% 25%, black 35%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 65% at 50% 25%, black 35%, transparent 85%)",
        }}
      />

      {/* 2. Top Center Spotlight Beam (Illuminating navbar & hero) */}
      <div
        className="anim-spotlight"
        style={{
          position: "absolute",
          top: "-180px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "950px",
          height: "550px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.35) 0%, rgba(56, 189, 248, 0.15) 40%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* 3. Floating Animated Emerald Orb (Drifting on the left) */}
      <div
        className="anim-orb-left"
        style={{
          position: "absolute",
          top: "80px",
          left: "5%",
          width: "650px",
          height: "650px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.34) 0%, rgba(5, 150, 105, 0.12) 45%, transparent 70%)",
          filter: "blur(95px)",
        }}
      />

      {/* 4. Floating Animated Cyan Orb (Drifting on the right) */}
      <div
        className="anim-orb-right"
        style={{
          position: "absolute",
          top: "100px",
          right: "5%",
          width: "660px",
          height: "660px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, rgba(37, 99, 235, 0.12) 45%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      {/* 5. Center Radiant Glow (Between sections) */}
      <div
        className="anim-orb-center"
        style={{
          position: "absolute",
          top: "260px",
          left: "40%",
          width: "580px",
          height: "580px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.28) 0%, rgba(56, 189, 248, 0.12) 40%, transparent 70%)",
          filter: "blur(85px)",
        }}
      />

      {/* 6. Subtle Mid-Page Ambient Aura for scrolling down */}
      <div
        className="anim-orb-lower"
        style={{
          position: "absolute",
          top: "820px",
          left: "25%",
          width: "720px",
          height: "520px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(56, 189, 248, 0.2) 0%, rgba(16, 185, 129, 0.1) 45%, transparent 70%)",
          filter: "blur(110px)",
        }}
      />
    </div>
  );
}
