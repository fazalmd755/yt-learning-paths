"use client";

import React, { useEffect, useState } from "react";
import LogoLoader from "./LogoLoader";

export default function InitialSplashLoader() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Keep visible briefly on page load/reload, then smoothly fade out
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 650);

    const removeTimer = setTimeout(() => {
      setVisible(false);
    }, 1150);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden={fading}
      className={`fixed inset-0 z-[99999] transition-opacity duration-500 ease-out ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <LogoLoader
        fullScreen
        size={68}
        text="Loading Watchlify..."
      />
    </div>
  );
}
