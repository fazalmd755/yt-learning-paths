"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkiperCardProps {
  children: React.ReactNode;
  className?: string;
  badge?: string;
}

/**
 * Skiper UI - Dynamic spotlight cursor-follow card (Theme-adaptive)
 */
export function SkiperCard({ children, className = "", badge }: SkiperCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={cn(
        "relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-900/70 p-6 backdrop-blur-md overflow-hidden transition-colors duration-200 shadow-sm dark:shadow-none text-slate-900 dark:text-slate-100",
        className
      )}
    >
      {/* Dynamic spotlight tracking the mouse */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.12), transparent 70%)`,
        }}
      />
      {badge && (
        <span className="inline-block text-[11px] font-semibold tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300/60 dark:border-emerald-500/30 px-2.5 py-1 rounded-full mb-3 uppercase">
          {badge}
        </span>
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export default SkiperCard;
