"use client";

import { useState } from "react";
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

export default function AiStudyAssist({
  videoId,
  videoTitle,
  description,
  userId,
  onNoteAdded,
}: Props) {
  const [activeTab, setActiveTab] = useState<"summary" | "quiz">("summary");
  const [loading, setLoading] = useState(false);
  const [summaryBullets, setSummaryBullets] = useState<string[]>([
    "Core conceptual architecture and foundational principles introduced in this lecture.",
    "Practical code walk-through and step-by-step implementation logic demonstrated.",
    "Execution flow optimization and industry best practices for robust applications.",
  ]);
  const [mcqs, setMcqs] = useState<MCQ[]>([
    {
      id: 1,
      question: `What is the primary objective covered in "${videoTitle}"?`,
      options: [
        "Mastering the underlying mechanics and execution flow",
        "Memorizing syntactical definitions without applying them",
        "Disabling compiler warnings and test validations",
        "Using legacy deprecated APIs in production",
      ],
      correct: 0,
      explanation:
        "The lesson emphasizes deep comprehension of foundational mechanics, structure, and execution patterns over superficial memorization.",
    },
    {
      id: 2,
      question: "When applying the concepts from this lesson in a real project, what is the best practice?",
      options: [
        "Hardcode dynamic variables for faster compilation",
        "Write modular, testable logic with proper error boundaries and explicit typing",
        "Avoid logging errors so user experience is not disrupted",
        "Skip boundary condition checks if the happy path runs once",
      ],
      correct: 1,
      explanation:
        "Modular architecture with comprehensive error boundaries ensures scalability and prevents silent runtime failures.",
    },
    {
      id: 3,
      question: "How should you effectively validate your code after completing this video segment?",
      options: [
        "Deploy directly to production without local test verification",
        "Run automated unit tests, inspect network/console logs, and stress test boundary cases",
        "Assume external libraries will handle all edge cases automatically",
        "Rewrite the entire logic in an unfamiliar language",
      ],
      correct: 1,
      explanation:
        "Systematic verification via test assertions, edge-case probing, and log inspection ensures stability.",
    },
  ]);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  // Save to notes state
  const [savingNote, setSavingNote] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Generate fresh study assist
  const handleGenerate = async () => {
    setLoading(true);
    setSaveSuccessMessage(null);
    try {
      const getTime =
        (window as any).__watchlifyGetCurrentTime ||
        (window as any).__watchifyGetCurrentTime;
      const currentSeconds = getTime ? Math.floor(getTime()) : 0;

      const res = await fetch("/api/ai/study-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          videoTitle,
          description,
          currentTimestamp: currentSeconds,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.summaryBullets) setSummaryBullets(data.summaryBullets);
        if (data.mcqs) {
          setMcqs(data.mcqs);
          setSelectedAnswers({});
          setShowResults(false);
        }
      }
    } catch (err) {
      console.error("AI Assist generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Save to Timestamped Notes
  const handleSaveToNotes = async (type: "summary" | "quiz") => {
    if (!userId) {
      setSaveSuccessMessage("Sign in with Google to save notes!");
      setTimeout(() => setSaveSuccessMessage(null), 3000);
      return;
    }

    setSavingNote(true);
    setSaveSuccessMessage(null);

    try {
      const getTime =
        (window as any).__watchlifyGetCurrentTime ||
        (window as any).__watchifyGetCurrentTime;
      const currentSeconds = getTime ? Math.max(0, Math.floor(getTime())) : 0;
      const mins = Math.floor(currentSeconds / 60);
      const secs = currentSeconds % 60;
      const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

      let content = "";
      if (type === "summary") {
        content = [
          `💡 **AI Quick Summary (${timeStr})**`,
          ...summaryBullets.map((b) => `• ${b}`),
        ].join("\n");
      } else {
        content = [
          `📝 **AI Practice Quiz (${timeStr})**`,
          ...mcqs.map(
            (m, idx) =>
              `${idx + 1}. ${m.question}\n   *Answer:* ${m.options[m.correct]}\n   *Why:* ${m.explanation}`
          ),
        ].join("\n\n");
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
    <section className="ai-tutor-container mt-4 rounded-xl border border-white/10 bg-zinc-900/60 p-4 md:p-5 backdrop-blur-md">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <SparklesIcon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-zinc-100">
              AI Study Assist
            </h3>
            <p className="text-xs text-zinc-400">
              Instant 3-bullet summary & self-check quiz for this lesson
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
          >
            <SparklesIcon size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Analyzing..." : "Regenerate for this segment"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-3 flex items-center gap-2 border-b border-white/5 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("summary")}
          className={`rounded-md px-3 py-1 text-xs font-medium transition ${
            activeTab === "summary"
              ? "bg-white/10 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          3-Bullet Summary
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("quiz")}
          className={`rounded-md px-3 py-1 text-xs font-medium transition ${
            activeTab === "quiz"
              ? "bg-white/10 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Practice Quiz (3 MCQs)
        </button>

        {saveSuccessMessage && (
          <span className="ml-auto inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300 animate-fade-in">
            <CheckIcon size={12} />
            {saveSuccessMessage}
          </span>
        )}
      </div>

      {/* Tab 1: 3-Bullet Summary */}
      {activeTab === "summary" && (
        <div className="mt-3 space-y-3">
          <div className="space-y-2">
            {summaryBullets.map((bullet, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-zinc-950/40 p-3 text-xs text-zinc-300 leading-relaxed"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">
                  {idx + 1}
                </span>
                <p className="flex-1">{bullet}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zinc-400">
              Captures key takeaways at the current video timestamp.
            </span>
            <button
              type="button"
              onClick={() => handleSaveToNotes("summary")}
              disabled={savingNote}
              className="flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              <CheckCircleIcon size={14} className="text-emerald-400" />
              {savingNote ? "Saving..." : "Save to My Notes (1-Click)"}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Practice Quiz (3 MCQs) */}
      {activeTab === "quiz" && (
        <div className="mt-3 space-y-4">
          {showResults && (
            <div
              className={`rounded-lg border p-3 flex items-center justify-between gap-3 ${
                correctCount === mcqs.length
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : correctCount > 0
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                  : "border-red-500/40 bg-red-500/10 text-red-300"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">
                  {correctCount === mcqs.length ? "🎉" : correctCount > 0 ? "⚡" : "📚"}
                </span>
                <div>
                  <p className="text-xs font-semibold">
                    Score: {correctCount} / {mcqs.length} correct
                  </p>
                  <p className="text-[11px] opacity-80">
                    {correctCount === mcqs.length
                      ? "Awesome job! You nailed all questions for this lesson."
                      : "Review the explanations below to solidify the concept."}
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
                className="rounded-lg border border-white/5 bg-zinc-950/40 p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-200">
                    Q{qIndex + 1}: {q.question}
                  </span>
                  {showResults && hasChosen && (
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        isCorrect
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  )}
                </div>

                <div className="mt-2.5 space-y-1.5">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = chosen === optIdx;
                    let optionStyle =
                      "border-white/5 bg-zinc-900/40 text-zinc-300 hover:border-white/20";

                    if (showResults) {
                      if (optIdx === q.correct) {
                        optionStyle =
                          "border-emerald-500/50 bg-emerald-500/10 text-emerald-300";
                      } else if (isSelected && !isCorrect) {
                        optionStyle =
                          "border-red-500/50 bg-red-500/10 text-red-300";
                      }
                    } else if (isSelected) {
                      optionStyle =
                        "border-emerald-500 bg-emerald-500/10 text-white";
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`w-full text-left rounded-md border p-2 text-xs transition flex items-center justify-between ${optionStyle}`}
                      >
                        <span>{opt}</span>
                        {isSelected && !showResults && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {showResults && (
                  <p className="mt-2 rounded bg-zinc-900/60 p-2 text-[11px] text-zinc-400">
                    💡 <strong className="text-zinc-300">Explanation:</strong>{" "}
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
            <div className="flex items-center gap-2">
              {!showResults ? (
                <button
                  type="button"
                  onClick={() => setShowResults(true)}
                  disabled={Object.keys(selectedAnswers).length === 0}
                  className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-black transition hover:bg-emerald-400 disabled:opacity-40"
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
                  className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700"
                >
                  Reset Quiz
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleSaveToNotes("quiz")}
              disabled={savingNote}
              className="flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              <CheckCircleIcon size={14} className="text-emerald-400" />
              {savingNote ? "Saving..." : "Save Quiz to Notes (1-Click)"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
