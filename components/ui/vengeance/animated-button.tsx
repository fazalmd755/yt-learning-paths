"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "emerald";
  className?: string;
  onClick?: () => void;
}

/**
 * Vengeance UI - Animated Button (Theme-adaptive)
 * Shimmering border glow + moving text shine highlight with smooth spring interaction
 */
export const VengeanceButton: React.FC<AnimatedButtonProps> = ({
  children = "Get Started",
  className = "",
  variant = "emerald",
  ...rest
}) => {
  const bgStyles =
    variant === "emerald"
      ? "bg-emerald-500 text-neutral-950 shadow-[0_0_24px_rgba(16,185,129,0.35)] hover:bg-emerald-400 font-semibold border-emerald-400/40"
      : variant === "primary"
      ? "bg-slate-900 dark:bg-neutral-900 text-white border-slate-800 dark:border-neutral-800"
      : "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border-slate-200 dark:border-white/15 backdrop-blur-md";

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: "spring",
        stiffness: 450,
        damping: 28,
        mass: 0.5,
      }}
      className={cn(
        "group relative inline-flex items-center justify-center px-6 py-3 rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer text-sm tracking-wide",
        bgStyles,
        className
      )}
      {...(rest as HTMLMotionProps<"button">)}
    >
      {/* Dynamic shimmer reflection line */}
      <motion.span
        className="block absolute inset-0 -skew-x-12 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
          width: "40%",
        }}
        initial={{ left: "-60%" }}
        animate={{ left: "140%" }}
        transition={{
          repeat: Infinity,
          duration: 2.4,
          ease: "easeInOut",
          repeatDelay: 1.2,
        }}
      />

      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};

export default VengeanceButton;
