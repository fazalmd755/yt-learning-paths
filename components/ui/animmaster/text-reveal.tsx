"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

/**
 * Animmaster Lib - GSAP Kinetic Character Reveal
 * Text starts fully rendered and visible in DOM, then smoothly animates in on mount
 */
export function AnimmasterTextReveal({
  text,
  className = "",
  delay = 0.1,
}: TextRevealProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chars = el.querySelectorAll(".anim-char");
    if (!chars.length) return;

    gsap.from(chars, {
      y: 10,
      opacity: 0,
      duration: 0.5,
      stagger: 0.02,
      delay,
      ease: "power2.out",
    });
  }, [text, delay]);

  return (
    <span ref={containerRef} className={cn("inline-block", className)}>
      {text.split("").map((char, index) => (
        <span
          key={`${char}-${index}`}
          className="anim-char inline-block"
          style={{ whiteSpace: char === " " ? "pre" : "normal" }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

export default AnimmasterTextReveal;
