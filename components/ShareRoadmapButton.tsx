"use client";

import { useState } from "react";
import { ShareIcon, CheckIcon, LinkIcon } from "./Icons";

interface Props {
  roadmapId: string;
  title: string;
  totalDuration?: string;
  lessonCount?: number;
  className?: string;
}

export default function ShareRoadmapButton({
  roadmapId,
  title,
  totalDuration,
  lessonCount,
  className = "",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getPublicUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/roadmap/${roadmapId}`;
    }
    return `https://watchlify.app/roadmap/${roadmapId}`;
  };

  const publicUrl = getPublicUrl();
  const shareText = `Check out this distraction-free roadmap on Watchlify: "${title}"${
    lessonCount ? ` (${lessonCount} lessons${totalDuration ? `, ${totalDuration}` : ""})` : ""
  }`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = publicUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: publicUrl,
        });
      } catch {
        // User cancelled or not supported
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-[#CEF432]/30 bg-[#CEF432]/10 px-3 py-1.5 text-xs font-semibold text-[#CEF432] transition hover:bg-[#CEF432]/20 hover:border-[#CEF432]/50 ${className}`}
        aria-label="Share this roadmap"
      >
        <ShareIcon size={14} />
        <span>Share Roadmap</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0e1017] p-6 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#CEF432]/20 text-[#CEF432]">
                  <ShareIcon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Share this Roadmap</h3>
                  <p className="text-xs text-zinc-400">Anyone with this link can view the syllabus & clone it</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Preview Card */}
            <div className="my-4 rounded-xl border border-white/10 bg-[#141720]/80 p-3.5">
              <div className="flex items-center justify-between text-[11px] text-[#CEF432] font-mono font-semibold">
                <span>WATCHLIFY PUBLIC ROADMAP</span>
                <span>{lessonCount ? `${lessonCount} Lessons` : "Curated Path"}</span>
              </div>
              <h4 className="mt-1 text-sm font-semibold text-zinc-100 line-clamp-1">{title}</h4>
              <p className="mt-1 text-xs text-zinc-400">
                Distraction-free learning syllabus with zero ads, shorts, or algorithmic rabbit holes.
              </p>
            </div>

            {/* Link Copy Box */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-300">Public Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="w-full rounded-lg border border-white/10 bg-[#08080C] px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#CEF432]"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#CEF432] hover:bg-[#dbfa50] px-3.5 py-2 text-xs font-semibold text-[#08080C] transition"
                >
                  {copied ? <CheckIcon size={14} /> : <LinkIcon size={14} />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Social Sharing Pills */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Share directly to</span>
              <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `${shareText} - ${publicUrl}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 rounded-lg border border-white/5 bg-zinc-900/60 p-2 text-zinc-300 transition hover:bg-[#25D366]/20 hover:text-[#25D366] hover:border-[#25D366]/40"
                >
                  <span className="text-base">💬</span>
                  <span className="text-[11px]">WhatsApp</span>
                </a>

                {/* Twitter / X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    shareText
                  )}&url=${encodeURIComponent(publicUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 rounded-lg border border-white/5 bg-zinc-900/60 p-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-white hover:border-zinc-700"
                >
                  <span className="text-base">𝕏</span>
                  <span className="text-[11px]">Twitter</span>
                </a>

                {/* LinkedIn */}
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    publicUrl
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 rounded-lg border border-white/5 bg-zinc-900/60 p-2 text-zinc-300 transition hover:bg-[#0A66C2]/20 hover:text-[#0A66C2] hover:border-[#0A66C2]/40"
                >
                  <span className="text-base">💼</span>
                  <span className="text-[11px]">LinkedIn</span>
                </a>

                {/* Reddit */}
                <a
                  href={`https://reddit.com/submit?url=${encodeURIComponent(
                    publicUrl
                  )}&title=${encodeURIComponent(title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1 rounded-lg border border-white/5 bg-zinc-900/60 p-2 text-zinc-300 transition hover:bg-[#FF4500]/20 hover:text-[#FF4500] hover:border-[#FF4500]/40"
                >
                  <span className="text-base">🤖</span>
                  <span className="text-[11px]">Reddit</span>
                </a>
              </div>
            </div>

            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="text-xs text-zinc-400 underline hover:text-zinc-200"
                >
                  Or use device share sheet
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
