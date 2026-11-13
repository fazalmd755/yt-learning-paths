"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme === "light") {
        setTheme("light");
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      } else {
        setTheme("dark");
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      }
    } catch {
      // localStorage not accessible
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);

    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }

    try {
      localStorage.setItem("theme", nextTheme);
    } catch {
      // ignore storage errors
    }
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          "size-[34px] rounded-xl border border-white/10 bg-white/5 opacity-40",
          className
        )}
        aria-hidden="true"
      />
    );
  }

  const isLight = theme === "light";

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      title={isLight ? "Switch to dark theme" : "Switch to light theme"}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      className={cn(
        "theme-toggle-btn relative flex size-[34px] items-center justify-center rounded-xl border transition-colors duration-200 cursor-pointer overflow-hidden",
        isLight
          ? "border-slate-300 bg-slate-100 text-amber-600 hover:bg-slate-200 shadow-sm"
          : "border-white/10 bg-white/5 text-emerald-400 hover:border-emerald-500/40 hover:bg-white/10",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isLight ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <Sun size={17} strokeWidth={2.2} className="text-amber-500" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            <Moon size={16} strokeWidth={2.2} className="text-emerald-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default ThemeToggle;
