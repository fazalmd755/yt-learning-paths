"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedRaysProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Vengeance UI - Animated Rays Background
 * Multi-layer animated aurora gradient rays
 */
export function AnimatedRays({ className = "", children }: AnimatedRaysProps) {
  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.3), transparent)`,
        }}
      />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-[100px] opacity-25"
        style={{
          background: "linear-gradient(135deg, #10b981 0%, #38bdf8 50%, #a855f7 100%)",
        }}
      />
      {children}
    </div>
  );
}

export default AnimatedRays;
