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
    <div className="ai-tutor-container space-y-4 pt-1">
      {/* Top Segmented Navigation & Action Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-neutral-200/80 dark:border-white/[0.08]">
        {/* Sleek Segmented Control */}
        <div className="flex items-center rounded-lg bg-neutral-100 dark:bg-zinc-800/80 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === "summary"
                ? "bg-white dark:bg-zinc-900 text-neutral-900 dark:text-zinc-100 shadow-xs font-semibold"
                : "text-neutral-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-200"
            }`}
          >
            Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("quiz")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === "quiz"
                ? "bg-white dark:bg-zinc-900 text-neutral-900 dark:text-zinc-100 shadow-xs font-semibold"
                : "text-neutral-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-200"
            }`}
          >
            Quiz ({mcqs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ask")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === "ask"
                ? "bg-white dark:bg-zinc-900 text-neutral-900 dark:text-zinc-100 shadow-xs font-semibold"
                : "text-neutral-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-200"
            }`}
          >
            Ask Doubt
          </button>
        </div>

        {/* Status / Quick Action */}
        <div className="flex items-center gap-2">
          {saveSuccessMessage && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium animate-fade-in flex items-center gap-1">
              <CheckIcon size={12} />
              {saveSuccessMessage}
            </span>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/[0.05] hover:bg-neutral-200 dark:hover:bg-white/[0.1] px-2.5 py-1 text-xs font-medium text-neutral-800 dark:text-zinc-200 transition disabled:opacity-50"
            title={hasGenerated ? "Regenerate based on current timestamp" : "Generate with AI"}
          >
            <SparklesIcon size={12} className={loading ? "animate-spin text-emerald-500" : "text-emerald-500"} />
            <span>{loading ? "Analyzing..." : hasGenerated ? "Regenerate" : "Generate"}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Key Takeaways */}
      {activeTab === "summary" && (
        <div className="space-y-4 pt-1">
          <div className="space-y-3">
            {summaryBullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed text-neutral-700 dark:text-zinc-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70" />
                <p className="flex-1 font-normal">{bullet}</p>
              </div>
            ))}
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-neutral-100 dark:border-white/5">
            <span className="text-[11px] text-neutral-400 dark:text-zinc-500">
              {hasGenerated ? "Synthesized from video" : "Standard lecture overview"}
            </span>
            <button
              type="button"
              onClick={() => handleSaveToNotes("summary")}
              disabled={savingNote}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-lg transition"
            >
              <CheckCircleIcon size={13} className="text-emerald-500" />
              <span>{savingNote ? "Saving..." : "Save to Notes"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Practice Quiz */}
      {activeTab === "quiz" && (
        <div className="space-y-4 pt-1">
          {showResults && (
            <div className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-zinc-800/40 px-3.5 py-2.5 text-xs">
              <span className="font-semibold text-neutral-900 dark:text-zinc-100">
                Score: {correctCount} of {mcqs.length} correct
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-zinc-400">
                {correctCount === mcqs.length ? "Great job!" : "Review explanations below"}
              </span>
            </div>
          )}

          <div className="space-y-4">
            {mcqs.map((q, qIndex) => {
              const chosen = selectedAnswers[q.id];
              const hasChosen = chosen !== undefined;
              const isCorrect = chosen === q.correct;

              return (
                <div key={q.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-neutral-900 dark:text-zinc-100 leading-relaxed">
                      <span className="text-neutral-400 dark:text-zinc-500 mr-2 font-mono">{qIndex + 1}.</span>
                      {q.question}
                    </p>
                    {showResults && hasChosen && (
                      <span
                        className={`text-[10px] font-semibold shrink-0 ${
                          isCorrect ? "text-emerald-500" : "text-red-400"
                        }`}
                      >
                        {isCorrect ? "Correct ✓" : "Incorrect ✕"}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = chosen === optIdx;
                      let style =
                        "border-neutral-200/80 dark:border-white/[0.06] bg-transparent text-neutral-700 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-white/[0.03]";

                      if (showResults) {
                        if (optIdx === q.correct) {
                          style =
                            "border-emerald-500/50 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-medium";
                        } else if (isSelected && !isCorrect) {
                          style = "border-red-500/50 bg-red-500/10 text-red-900 dark:text-red-300";
                        }
                      } else if (isSelected) {
                        style = "border-emerald-500/60 bg-emerald-500/10 text-neutral-900 dark:text-white font-medium";
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          className={`w-full text-left rounded-lg border px-3.5 py-2.5 text-xs transition flex items-center justify-between ${style}`}
                        >
                          <span className="leading-relaxed">{opt}</span>
                          {isSelected && !showResults && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {showResults && (
                    <p className="text-[11px] text-neutral-600 dark:text-zinc-400 bg-neutral-50 dark:bg-white/[0.02] p-2.5 rounded-lg border border-neutral-200/60 dark:border-white/[0.05] leading-relaxed">
                      <strong className="text-neutral-900 dark:text-zinc-200 font-medium">Why:</strong> {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-white/5">
            <div>
              {!showResults ? (
                <button
                  type="button"
                  onClick={() => setShowResults(true)}
                  disabled={Object.keys(selectedAnswers).length === 0}
                  className="rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 px-3.5 py-1.5 text-xs font-medium transition disabled:opacity-30"
                >
                  Submit Answers
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAnswers({});
                    setShowResults(false);
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white transition"
                >
                  Reset Quiz
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleSaveToNotes("quiz")}
              disabled={savingNote}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-lg transition"
            >
              <CheckCircleIcon size={13} className="text-emerald-500" />
              <span>{savingNote ? "Saving..." : "Save to Notes"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Ask AI Tutor (Doubt Solver) */}
      {activeTab === "ask" && (
        <div className="space-y-3 pt-1">
          {/* Quick suggestions */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              "Explain simply",
              "Code example",
              "Common mistakes",
              "Interview prep",
              "Explain in Hinglish",
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setUserQuestion(chip);
                  handleAskDoubt(chip);
                }}
                disabled={askingAi}
                className="rounded-md border border-neutral-200/80 dark:border-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-white/[0.04] transition disabled:opacity-50"
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
              placeholder="Ask a doubt about this lesson..."
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              className="flex-1 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-zinc-950 px-3 py-2 text-xs text-neutral-900 dark:text-zinc-100 placeholder:text-neutral-400 dark:placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={askingAi || !userQuestion.trim()}
              className="flex items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 px-3.5 py-2 text-xs font-medium transition disabled:opacity-30"
              title="Send question"
            >
              {askingAi ? (
                <SparklesIcon size={13} className="animate-spin" />
              ) : (
                <ArrowRightIcon size={13} />
              )}
            </button>
          </form>

          {/* Chat / Answers Stream */}
          <div className="space-y-3 pt-1">
            {chatMessages.length === 0 && (
              <div className="rounded-xl border border-dashed border-neutral-200 dark:border-white/10 p-5 text-center text-xs text-neutral-500 dark:text-zinc-400">
                Type your question or click a prompt above to get instant explanations.
              </div>
            )}

            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-xl border border-neutral-200/70 dark:border-white/[0.06] bg-neutral-50/60 dark:bg-zinc-900/30 p-3.5 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200/50 dark:border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900 dark:text-zinc-200">
                      Q: {msg.question}
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-zinc-500 font-mono">
                      @{msg.timeStr}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveToNotes("chat", msg)}
                    disabled={savingNote}
                    className="inline-flex items-center gap-1 text-[11px] text-neutral-500 dark:text-zinc-400 hover:text-neutral-800 dark:hover:text-zinc-200"
                  >
                    <CheckCircleIcon size={12} className="text-emerald-500" />
                    <span>Save</span>
                  </button>
                </div>
                <div className="pt-0.5">
                  <CleanAiMessageView text={msg.answer} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
