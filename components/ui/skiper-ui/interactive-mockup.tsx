"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface InteractiveMockupProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Skiper UI x Animmaster 3D Perspective Tilt Card
 * Smooth gyro/mouse perspective tilt with spring dampening
 */
export function InteractiveMockup({ children, className = "" }: InteractiveMockupProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for high framerate physics
  const springX = useSpring(x, { stiffness: 220, damping: 24 });
  const springY = useSpring(y, { stiffness: 220, damping: 24 });

  const rotateX = useTransform(springY, [-0.5, 0.5], ["9deg", "-9deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-9deg", "9deg"]);

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
    const mouseY = (e.clientY - rect.top) / rect.height - 0.5;

    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div
      style={{ perspective: 1200 }}
      className="w-full flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        ref={ref}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale: 1.015 }}
        transition={{ duration: 0.2 }}
        className={cn("w-full transition-shadow duration-300", className)}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default InteractiveMockup;
