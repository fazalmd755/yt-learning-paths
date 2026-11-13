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
 * High-framerate staggered reveal for hero headings & subheadings
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
    gsap.fromTo(
      chars,
      {
        y: 20,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.025,
        delay,
        ease: "power3.out",
      }
    );
  }, [text, delay]);

  return (
    <span ref={containerRef} className={cn("inline-block overflow-hidden", className)}>
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
