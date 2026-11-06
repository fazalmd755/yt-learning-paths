"use client";

import { useEffect, useState } from "react";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if dismissed previously
    if (typeof window !== "undefined" && localStorage.getItem("watchify_pwa_dismissed") === "true") {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("watchify_pwa_dismissed", "true");
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="pwa-install-banner no-print">
      <div className="pwa-banner-content">
        <span className="pwa-banner-icon">📱</span>
        <div className="pwa-banner-text">
          <strong>Install Watchify App</strong>
          <span>Study with zero distractions directly from your home screen.</span>
        </div>
      </div>
      <div className="pwa-banner-actions">
        <button type="button" onClick={handleInstall} className="pwa-install-btn">
          Install App
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="pwa-dismiss-btn"
          aria-label="Dismiss app install"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
