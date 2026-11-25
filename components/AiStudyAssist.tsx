"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SparklesIcon, CheckCircleIcon, CheckIcon, ArrowRightIcon } from "./Icons";
import { createClient } from "@/lib/supabase/client";

interface Props {
  videoId: string;
  videoTitle: string;
  description: string;
  userId?: string;
  onNoteAdded?: () => void;
}

interface MCQ {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface AiChatMessage {
  id: string;
  question: string;
  answer: string;
  timeStr: string;
}

function formatCleanText(raw: string): string {
  if (!raw) return "";
  return raw
    // Remove markdown headers: #, ##, ###, ####
    .replace(/^#{1,6}\s*/gm, "")
    // Remove horizontal separator rules: ---, ***, ___
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Remove ALL asterisks (*, **, ***)
    .replace(/\*+/g, "")
    // Remove all leading dashes
    .replace(/^[-–—]\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderFormattedParagraph(text: string, pKey: number) {
  const clean = formatCleanText(text);
  if (!clean) return null;

  const lines = clean.split("\n");

  return (
    <div key={pKey} className="space-y-1.5">
      {lines.map((line, lIdx) => {
        let trimmed = line.trim();
        if (!trimmed) return null;

        // Check if list item
        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*");
        trimmed = trimmed.replace(/^[•\-*–—\s]+/, "").replace(/\*+/g, "").trim();

        if (!trimmed) return null;

        // Parse inline code
        const parts = trimmed.split(/(`.*?`)/g);

        const renderedLine = parts.map((part, partIdx) => {
          if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
            return (
              <code
                key={partIdx}
                className="rounded bg-neutral-100 dark:bg-zinc-800/90 px-1.5 py-0.5 font-mono text-[11px] text-emerald-800 dark:text-emerald-300 border border-neutral-200 dark:border-white/5"
              >
                {part.slice(1, -1)}
              </code>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={lIdx} className="flex items-start gap-2 pt-0.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              <p className="flex-1 text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed">{renderedLine}</p>
            </div>
          );
        }

        return (
          <p key={lIdx} className="text-xs text-neutral-700 dark:text-zinc-300 leading-relaxed">
            {renderedLine}
          </p>
        );
      })}
    </div>
  );
}

function CleanAiMessageView({ text }: { text: string }) {
  // Split by code fences ```
  const codeBlockRegex = /```([a-zA-Z]*)\n?([\s\S]*?)```/g;
  const blocks: Array<{ type: "code" | "text"; content: string; lang?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: "text", content: text.substring(lastIndex, match.index) });
    }
    blocks.push({ type: "code", content: match[2], lang: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    blocks.push({ type: "text", content: text.substring(lastIndex) });
  }

  return (
    <div className="space-y-2.5">
      {blocks.map((block, idx) => {
        if (block.type === "code") {
          return (
            <div key={idx} className="overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
              {block.lang && (
                <div className="border-b border-white/5 bg-zinc-900/60 px-3 py-1 text-[10px] font-mono text-zinc-400">
                  {block.lang}
                </div>
              )}
              <pre className="p-3 font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed">
                <code>{block.content.trim()}</code>
              </pre>
            </div>
          );
        }

        const paragraphs = block.content.split(/\n\s*\n/);
        return paragraphs.map((para, pIdx) => renderFormattedParagraph(para, idx * 100 + pIdx));
      })}
    </div>
  );
}

export default function AiStudyAssist({
  videoId,
  videoTitle,
  description,
  userId,
  onNoteAdded,
}: Props) {
  const [activeTab, setActiveTab] = useState<"summary" | "quiz" | "ask">("summary");
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [summaryBullets, setSummaryBullets] = useState<string[]>([
    "Foundational concepts, syntax conventions, and architectural flow taught in this lecture.",
    "Step-by-step practical implementation patterns demonstrated by the instructor.",
    "Core optimization techniques, common edge-case caveats, and production best practices.",
  ]);

  const [mcqs, setMcqs] = useState<MCQ[]>([
    {
      id: 1,
      question: `What is the central focus demonstrated in "${videoTitle}"?`,
      options: [
        "Comprehending core architectural mechanics and underlying execution flow",
        "Memorizing syntactical details without practical implementation",
        "Disabling runtime assertions and error handling",
        "Deploying legacy unmaintained modules",
      ],
      correct: 0,
      explanation:
        "The lesson focuses on deep structural comprehension of principles and real-world implementation rather than rote memorization.",
    },
    {
      id: 2,
      question: "When applying the concepts from this video, what is the recommended industry approach?",
      options: [
        "Hardcode configuration values inside core logic",
        "Structure modular, strongly-typed code with clear error boundaries",
        "Suppress console warnings to improve performance",
        "Omit boundary checks if the initial test passes",
      ],
      correct: 1,
      explanation:
        "Modular architecture with resilient error boundaries ensures maintainability and prevents silent failures in production.",
    },
    {
      id: 3,
      question: "How should you effectively validate your code after this lesson?",
      options: [
        "Ship directly to users without local validation",
        "Run automated tests, probe edge cases, and inspect execution logs",
        "Rely entirely on default framework behavior without validation",
        "Rewrite in an unrelated stack",
      ],
      correct: 1,
      explanation:
        "Systematic verification via automated unit tests and boundary assertions ensures reliable runtime stability.",
    },
  ]);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  // Ask AI Tutor state
  const [userQuestion, setUserQuestion] = useState("");
  const [askingAi, setAskingAi] = useState(false);
  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([]);

  // Note save state
  const [savingNote, setSavingNote] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const getPlayerCurrentSeconds = (): number => {
    try {
      const getTime =
        (window as any).__watchlifyGetCurrentTime ||
        (window as any).__watchifyGetCurrentTime;
      return getTime ? Math.max(0, Math.floor(getTime())) : 0;
    } catch {
      return 0;
    }
  };

  // Generate dynamic AI Summary & Quiz
  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setSaveSuccessMessage(null);

    const currentSeconds = getPlayerCurrentSeconds();

    try {
      const res = await fetch("/api/ai/study-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "study_assist",
          videoId,
          videoTitle,
          description,
          currentTimestamp: currentSeconds,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (Array.isArray(data.summaryBullets) && data.summaryBullets.length > 0) {
          const sanitizedBullets = data.summaryBullets.map((b: string) =>
            b.replace(/^[•\-*–—\s]+/, "").replace(/\*+/g, "").replace(/^#{1,6}\s*/, "").trim()
          );
          setSummaryBullets(sanitizedBullets);
        }
        if (Array.isArray(data.mcqs) && data.mcqs.length > 0) {
          setMcqs(data.mcqs);
          setSelectedAnswers({});
          setShowResults(false);
        }
        setHasGenerated(true);
      }
    } catch (err) {
      console.error("AI Assist generation error:", err);
    } finally {
      setLoading(false);
    }
  }, [videoId, videoTitle, description]);

  // Ask AI Tutor a doubt
  const handleAskDoubt = useCallback(async (questionToAsk?: string) => {
    const q = (questionToAsk ?? userQuestion).trim();
    if (!q) return;

    setAskingAi(true);
    const currentSeconds = getPlayerCurrentSeconds();

    try {
      const res = await fetch("/api/ai/study-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ask",
          question: q,
          videoId,
          videoTitle,
          description,
          currentTimestamp: currentSeconds,
        }),
      });

      const data = await res.json().catch(() => ({}));

      const mins = Math.floor(currentSeconds / 60);
      const secs = currentSeconds % 60;
      const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

      const newMsg: AiChatMessage = {
        id: `${Date.now()}`,
        question: q,
        answer: data.answer || "No response received. Please try again.",
        timeStr,
      };

      setChatMessages((prev) => [newMsg, ...prev]);
      setUserQuestion("");
    } catch (err) {
      console.error("Ask AI Error:", err);
    } finally {
      setAskingAi(false);
    }
  }, [userQuestion, videoId, videoTitle, description]);

  // Listen for global watchlify-open-ai-tutor trigger
  useEffect(() => {
    const handler = (e: any) => {
      const detail = e.detail || {};
      if (detail.subTab && ["summary", "quiz", "ask"].includes(detail.subTab)) {
        setActiveTab(detail.subTab);
      }
      if (detail.action === "quiz") {
        setActiveTab("quiz");
        if (!hasGenerated && !loading) {
          handleGenerate();
        }
      } else if (detail.action === "ask" || detail.question) {
        setActiveTab("ask");
        if (detail.question) {
          setUserQuestion(detail.question);
          handleAskDoubt(detail.question);
        }
      } else if (detail.action === "summary") {
        setActiveTab("summary");
        if (!hasGenerated && !loading) {
          handleGenerate();
        }
      }
    };

    window.addEventListener("watchlify-open-ai-tutor", handler);
    return () => window.removeEventListener("watchlify-open-ai-tutor", handler);
  }, [hasGenerated, loading, handleGenerate, handleAskDoubt]);

  // 1-Click Save to Timestamped Notes
  const handleSaveToNotes = async (type: "summary" | "quiz" | "chat", chatItem?: AiChatMessage) => {
    if (!userId) {
      setSaveSuccessMessage("Sign in with Google to save notes!");
      setTimeout(() => setSaveSuccessMessage(null), 3000);
      return;
    }

    setSavingNote(true);
    setSaveSuccessMessage(null);

    try {
      const currentSeconds = getPlayerCurrentSeconds();
      const mins = Math.floor(currentSeconds / 60);
      const secs = currentSeconds % 60;
      const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

      let content = "";
      if (type === "summary") {
        content = [
          `💡 **AI Core Takeaways (${timeStr})**`,
          ...summaryBullets.map((b) => `• ${b}`),
        ].join("\n");
      } else if (type === "quiz") {
        content = [
          `📝 **AI Practice Quiz (${timeStr})**`,
          ...mcqs.map(
            (m, idx) =>
              `${idx + 1}. ${m.question}\n   *Answer:* ${m.options[m.correct]}\n   *Why:* ${m.explanation}`
          ),
        ].join("\n\n");
      } else if (type === "chat" && chatItem) {
        content = [
          `💬 **Q&A with AI Tutor (${chatItem.timeStr})**`,
          `**Q:** ${chatItem.question}`,
          "",
          `**A:** ${formatCleanText(chatItem.answer)}`,
        ].join("\n");
      }

      const supabase = createClient();
      const { error } = await supabase.from("video_notes").insert({
        user_id: userId,
        video_id: videoId,
        timestamp_seconds: currentSeconds,
        content: content.slice(0, 4900),
      });

      if (error) throw error;

      setSaveSuccessMessage(`Saved to notes at ${timeStr} 📌`);
      onNoteAdded?.();
      setTimeout(() => setSaveSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error("Failed to save note:", err);
      setSaveSuccessMessage(err.message || "Failed to save note.");
      setTimeout(() => setSaveSuccessMessage(null), 3500);
    } finally {
      setSavingNote(false);
    }
  };

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const correctCount = mcqs.filter((q) => selectedAnswers[q.id] === q.correct).length;

  return (
    <section className="ai-tutor-container mt-4 rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-zinc-900/70 p-4 md:p-5 shadow-sm backdrop-blur-md">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <SparklesIcon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-wide text-neutral-900 dark:text-zinc-100">
                AI Study Assistant
              </h3>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-400">
                AI Powered
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-zinc-400">
              Instant video summaries, practice quizzes, and 24/7 doubt resolution
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300 px-3.5 py-1.5 text-xs font-semibold shadow-xs transition hover:bg-emerald-100 dark:hover:bg-emerald-500/25 disabled:opacity-50"
        >
          <SparklesIcon size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Analyzing Video..." : hasGenerated ? "Regenerate AI Content" : "Generate with AI"}
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-3 flex items-center gap-1.5 border-b border-neutral-200 dark:border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("summary")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === "summary"
              ? "bg-neutral-900 text-white dark:bg-emerald-500 dark:text-zinc-950 shadow-sm"
              : "text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-zinc-200"
          }`}
        >
          💡 Key Takeaways
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("quiz")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === "quiz"
              ? "bg-neutral-900 text-white dark:bg-emerald-500 dark:text-zinc-950 shadow-sm"
              : "text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-zinc-200"
          }`}
        >
          📝 Practice Quiz ({mcqs.length} MCQs)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ask")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === "ask"
              ? "bg-neutral-900 text-white dark:bg-emerald-500 dark:text-zinc-950 shadow-sm"
              : "text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-zinc-200"
          }`}
        >
          💬 Ask AI Tutor
        </button>

        {saveSuccessMessage && (
          <span className="ml-auto inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300 animate-fade-in">
            <CheckIcon size={12} />
            {saveSuccessMessage}
          </span>
        )}
      </div>

      {/* Tab 1: Key Takeaways */}
      {activeTab === "summary" && (
        <div className="mt-3 space-y-3">
          {!hasGenerated && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <SparklesIcon size={14} />
                  <span>Personalized AI Takeaways</span>
                </p>
                <p className="text-[11px] text-neutral-600 dark:text-zinc-400 mt-0.5">
                  Generate instant, AI-extracted key highlights from this lesson.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <SparklesIcon size={12} className={loading ? "animate-spin" : ""} />
                <span>{loading ? "Generating..." : "Generate AI Takeaways"}</span>
              </button>
            </div>
          )}

          <div className="space-y-2">
            {summaryBullets.map((bullet, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-neutral-200/80 dark:border-white/5 bg-neutral-50/70 dark:bg-zinc-950/40 p-3.5 text-xs text-neutral-800 dark:text-zinc-300 leading-relaxed shadow-xs transition hover:border-emerald-500/30"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-[10px] font-bold text-emerald-800 dark:text-emerald-400">
                  {idx + 1}
                </span>
                <p className="flex-1 font-medium leading-relaxed">{bullet}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-neutral-500 dark:text-zinc-400">
              Captures key takeaways at the current video segment.
            </span>
            <button
              type="button"
              onClick={() => handleSaveToNotes("summary")}
              disabled={savingNote}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-zinc-200 shadow-xs transition hover:bg-neutral-50 dark:hover:bg-zinc-700 disabled:opacity-50"
            >
              <CheckCircleIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>{savingNote ? "Saving..." : "Save to My Notes (1-Click)"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Practice Quiz */}
      {activeTab === "quiz" && (
        <div className="mt-3 space-y-4">
          {!hasGenerated && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <SparklesIcon size={14} />
                  <span>Lesson Comprehension Quiz</span>
                </p>
                <p className="text-[11px] text-neutral-600 dark:text-zinc-400 mt-0.5">
                  Test your understanding with 3 smart MCQs generated specifically for this lesson.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <SparklesIcon size={12} className={loading ? "animate-spin" : ""} />
                <span>{loading ? "Generating Quiz..." : "Generate AI Quiz"}</span>
              </button>
            </div>
          )}

          {showResults && (
            <div
              className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 ${
                correctCount === mcqs.length
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  : correctCount > 0
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                  : "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-300"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">
                  {correctCount === mcqs.length ? "🎉" : correctCount > 0 ? "⚡" : "📚"}
                </span>
                <div>
                  <p className="text-xs font-bold">
                    Score: {correctCount} / {mcqs.length} correct
                  </p>
                  <p className="text-[11px] opacity-80">
                    {correctCount === mcqs.length
                      ? "Awesome job! You completely mastered the concepts in this lesson."
                      : "Review the explanations below to reinforce your understanding."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {mcqs.map((q, qIndex) => {
            const chosen = selectedAnswers[q.id];
            const hasChosen = chosen !== undefined;
            const isCorrect = chosen === q.correct;

            return (
              <div
                key={q.id}
                className="rounded-xl border border-neutral-200 dark:border-white/5 bg-neutral-50/60 dark:bg-zinc-950/40 p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-neutral-900 dark:text-zinc-100">
                    Q{qIndex + 1}: {q.question}
                  </span>
                  {showResults && hasChosen && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isCorrect
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400"
                          : "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
                      }`}
                    >
                      {isCorrect ? "Correct ✓" : "Incorrect ✕"}
                    </span>
                  )}
                </div>

                <div className="mt-2.5 space-y-1.5">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = chosen === optIdx;
                    let optionStyle =
                      "border-neutral-200 dark:border-white/5 bg-white dark:bg-zinc-900/40 text-neutral-800 dark:text-zinc-300 hover:border-neutral-300 dark:hover:border-white/20";

                    if (showResults) {
                      if (optIdx === q.correct) {
                        optionStyle =
                          "border-emerald-500/60 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300 font-semibold";
                      } else if (isSelected && !isCorrect) {
                        optionStyle =
                          "border-red-500/60 bg-red-50 text-red-900 dark:bg-red-500/15 dark:text-red-300";
                      }
                    } else if (isSelected) {
                      optionStyle =
                        "border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/15 dark:text-white font-semibold";
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`w-full text-left rounded-xl border p-2.5 text-xs transition flex items-center justify-between shadow-2xs ${optionStyle}`}
                      >
                        <span>{opt}</span>
                        {isSelected && !showResults && (
                          <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {showResults && (
                  <p className="mt-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-900/60 p-2.5 text-[11px] text-neutral-700 dark:text-zinc-300 border border-neutral-200 dark:border-white/5 leading-relaxed">
                    💡 <strong className="text-neutral-900 dark:text-zinc-100">Explanation:</strong>{" "}
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-200 dark:border-white/5">
            <div className="flex items-center gap-2">
              {!showResults ? (
                <button
                  type="button"
                  onClick={() => setShowResults(true)}
                  disabled={Object.keys(selectedAnswers).length === 0}
                  className="rounded-full bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 px-4 py-1.5 text-xs font-bold text-white dark:text-black shadow-xs transition disabled:opacity-40"
                >
                  Check Answers
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAnswers({});
                    setShowResults(false);
                  }}
                  className="rounded-full bg-neutral-200 dark:bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-neutral-800 dark:text-zinc-200 transition hover:bg-neutral-300 dark:hover:bg-zinc-700"
                >
                  Reset Quiz
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleSaveToNotes("quiz")}
              disabled={savingNote}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-zinc-200 shadow-xs transition hover:bg-neutral-50 dark:hover:bg-zinc-700 disabled:opacity-50"
            >
              <CheckCircleIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>{savingNote ? "Saving..." : "Save Quiz to Notes (1-Click)"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Ask AI Tutor (Doubt Solver) */}
      {activeTab === "ask" && (
        <div className="mt-3 space-y-3">
          {/* Quick suggestions */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-neutral-500 dark:text-zinc-500">Quick prompts:</span>
            {[
              "Explain simply 💡",
              "Practical code example 💻",
              "Common mistakes to avoid ⚠️",
              "Interview questions 🎯",
              "Explain in Hinglish 🇮🇳",
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setUserQuestion(chip);
                  handleAskDoubt(chip);
                }}
                disabled={askingAi}
                className="rounded-full border border-neutral-200 dark:border-white/10 bg-white dark:bg-zinc-800/60 px-2.5 py-1 text-[11px] font-medium text-neutral-700 dark:text-zinc-300 shadow-2xs transition hover:border-emerald-500/40 hover:bg-neutral-50 dark:hover:bg-zinc-700 hover:text-neutral-900 dark:hover:text-white disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Question Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskDoubt();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about this video..."
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              className="flex-1 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-zinc-950 px-3.5 py-2 text-xs text-neutral-900 dark:text-zinc-100 placeholder:text-neutral-400 dark:placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 shadow-xs"
            />
            <button
              type="submit"
              disabled={askingAi || !userQuestion.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-500 dark:hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-white dark:text-black shadow-xs transition disabled:opacity-40"
            >
              {askingAi ? (
                <>
                  <SparklesIcon size={13} className="animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <span>Ask</span>
                  <ArrowRightIcon size={12} />
                </>
              )}
            </button>
          </form>

          {/* Chat / Answers Stream */}
          <div className="space-y-3 pt-2">
            {chatMessages.length === 0 && (
              <div className="rounded-xl border border-dashed border-neutral-300 dark:border-white/10 p-5 text-center text-xs text-neutral-500 dark:text-zinc-400 bg-neutral-50/50 dark:bg-transparent">
                Have a doubt about this lesson? Ask the AI Tutor above or click any quick prompt!
              </div>
            )}

            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-xl border border-neutral-200/80 dark:border-white/5 bg-white dark:bg-zinc-950/60 p-4 space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900 dark:text-zinc-200 text-xs">
                      💬 Q: {msg.question}
                    </span>
                    <span className="rounded-full bg-neutral-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 dark:text-zinc-400">
                      @{msg.timeStr}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveToNotes("chat", msg)}
                    disabled={savingNote}
                    className="flex items-center gap-1 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 px-2.5 py-1 text-[11px] font-medium text-neutral-700 dark:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-white/10"
                  >
                    <CheckCircleIcon size={12} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Save to Notes</span>
                  </button>
                </div>
                <div className="pt-1">
                  <CleanAiMessageView text={msg.answer} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
