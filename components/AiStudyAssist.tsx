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

interface AiChatMessage {
  id: string;
  question: string;
  answer: string;
  timeStr: string;
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
  const handleGenerate = async () => {
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
          setSummaryBullets(data.summaryBullets);
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
  };

  // Ask AI Tutor a doubt
  const handleAskDoubt = async (questionToAsk?: string) => {
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
  };

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
          `**A:** ${chatItem.answer}`,
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
    <section className="ai-tutor-container mt-4 rounded-xl border border-white/10 bg-zinc-900/70 p-4 md:p-5 backdrop-blur-md">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <SparklesIcon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-wide text-zinc-100">
                AI Study Assistant
              </h3>
              <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                AI Powered
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Instant video summaries, practice quizzes, and 24/7 doubt resolution
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50"
        >
          <SparklesIcon size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Analyzing Video..." : hasGenerated ? "Regenerate AI Content" : "Generate with AI"}
        </button>
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
          💡 Key Takeaways
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
          📝 Practice Quiz ({mcqs.length} MCQs)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ask")}
          className={`rounded-md px-3 py-1 text-xs font-medium transition ${
            activeTab === "ask"
              ? "bg-white/10 text-white"
              : "text-zinc-400 hover:text-zinc-200"
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

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-zinc-400">
              Captures key takeaways at the current video segment.
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

      {/* Tab 2: Practice Quiz */}
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

      {/* Tab 3: Ask AI Tutor (Doubt Solver) */}
      {activeTab === "ask" && (
        <div className="mt-3 space-y-3">
          {/* Quick suggestions */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-zinc-500">Quick prompts:</span>
            {[
              "Explain this simply 💡",
              "Practical code examples 💻",
              "Common mistakes to avoid ⚠️",
              "Interview questions on this 🎯",
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setUserQuestion(chip);
                  handleAskDoubt(chip);
                }}
                disabled={askingAi}
                className="rounded-full border border-white/10 bg-zinc-800/60 px-2.5 py-1 text-[11px] text-zinc-300 transition hover:bg-zinc-700 hover:text-white disabled:opacity-50"
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
              className="flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={askingAi || !userQuestion.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-black transition hover:bg-emerald-400 disabled:opacity-40"
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
              <div className="rounded-lg border border-dashed border-white/10 p-5 text-center text-xs text-zinc-500">
                Have a doubt about this lesson? Ask the AI Tutor above or click any quick prompt!
              </div>
            )}

            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-lg border border-white/5 bg-zinc-950/60 p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-200 text-xs">
                      💬 Q: {msg.question}
                    </span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                      @{msg.timeStr}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveToNotes("chat", msg)}
                    disabled={savingNote}
                    className="flex items-center gap-1 rounded bg-white/5 px-2 py-1 text-[11px] text-zinc-300 hover:bg-white/10 hover:text-white"
                  >
                    <CheckCircleIcon size={12} className="text-emerald-400" />
                    <span>Save to Notes</span>
                  </button>
                </div>
                <div className="whitespace-pre-wrap text-xs text-zinc-300 leading-relaxed font-sans">
                  {msg.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
