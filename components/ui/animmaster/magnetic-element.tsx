"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  strength?: number; // Physics strength of magnetic pull
}

/**
 * Animmaster Lib - GSAP Magnetic Cursor Effect
 * 60fps spring physics magnetic element that attracts towards the user's cursor
 */
export function AnimmasterMagnetic({
  children,
  className = "",
  strength = 0.35,
}: MagneticProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = el.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      const deltaX = (clientX - centerX) * strength;
      const deltaY = (clientY - centerY) * strength;

      gsap.to(el, {
        x: deltaX,
        y: deltaY,
        duration: 0.7,
        ease: "power3.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.9,
        ease: "elastic.out(1, 0.4)",
      });
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [strength]);

  return (
    <div ref={elementRef} className={cn("inline-block", className)}>
      {children}
    </div>
  );
}

export default AnimmasterMagnetic;
