"use client";

import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";

/**
 * Skiper UI - Minimal interactive animated link with slide-underline and micro-arrow (Theme-adaptive)
 */
export const SkiperLink = ({
  children,
  href,
  className,
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
}) => {
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex items-center text-sm font-medium text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white transition-colors duration-200",
        "before:pointer-events-none before:absolute before:bottom-0 before:left-0 before:h-[1.5px] before:w-full before:bg-emerald-500 before:content-['']",
        "before:origin-right before:scale-x-0 before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)]",
        "hover:before:origin-left hover:before:scale-x-100",
        className
      )}
    >
      <span>{children}</span>
      <svg
        className="ml-1 size-3.5 -translate-y-0.5 opacity-60 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-1 group-hover:opacity-100"
        fill="none"
        viewBox="0 0 10 10"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M1.004 9.166 9.337.833m0 0v8.333m0-8.333H1.004"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
};

export default SkiperLink;
