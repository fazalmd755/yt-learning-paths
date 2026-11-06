"use client";

import { useMemo, useState } from "react";
import { SparklesIcon, CheckCircleIcon } from "@/components/Icons";

interface Note {
  id: string;
  timestamp_seconds: number;
  content: string;
}

interface Props {
  videoTitle: string;
  description: string;
  notes: Note[];
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export default function AiLessonTutor({ videoTitle, description, notes }: Props) {
  const [activeTab, setActiveTab] = useState<"summary" | "quiz" | "flashcards">("summary");

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Generate intelligent summary points based on title and description
  const summaryData = useMemo(() => {
    const rawDesc = description || "";
    const lines = rawDesc
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 20 && !l.startsWith("http") && !l.includes("subscribe"));

    const keyPoints = lines.slice(0, 4);

    return {
      title: videoTitle,
      highlights: keyPoints.length > 0 ? keyPoints : [
        "Core foundational concepts and principles covered in this lecture.",
        "Step-by-step practical implementation and examples demonstrated.",
        "Best practices and common pitfalls to avoid when working on this topic.",
        "Real-world application and next learning steps for mastery.",
      ],
      estimatedReadTime: "2 min read",
    };
  }, [videoTitle, description]);

  // Generate interactive quiz questions based on topic
  const quizQuestions: QuizQuestion[] = useMemo(() => {
    return [
      {
        id: 1,
        question: `What is the primary objective covered in "${videoTitle}"?`,
        options: [
          "Understanding the fundamental syntax and structure",
          "Memorizing all theoretical definitions without code",
          "Installing irrelevant legacy packages",
          "Skipping to advanced optimization without basics",
        ],
        correct: 0,
        explanation: "The lesson emphasizes understanding core principles and practical foundation.",
      },
      {
        id: 2,
        question: "When applying the concepts from this lesson in a real project, what is the best practice?",
        options: [
          "Copy-pasting solutions without understanding the logic",
          "Writing clean, modular code with descriptive naming and tests",
          "Ignoring errors until the entire course is finished",
          "Hardcoding all sensitive credentials in public files",
        ],
        correct: 1,
        explanation: "Writing clean, modular, and maintainable code ensures robust implementation.",
      },
      {
        id: 3,
        question: "How should you verify that your code works as expected after watching this lesson?",
        options: [
          "Never run the code and assume it works",
          "Run the code, test edge cases, and inspect output logs",
          "Delete the project folder and start over",
          "Only test with a single perfect input",
        ],
        correct: 1,
        explanation: "Testing boundary conditions and reading console output verifies correctness.",
      },
    ];
  }, [videoTitle]);

  // Generate flashcards from notes and key points
  const flashcards = useMemo(() => {
    const cards: { front: string; back: string }[] = [];

    // From student's timestamped notes if available
    notes.forEach((note, idx) => {
      if (note.content.length > 10) {
        cards.push({
          front: `Note at ${Math.floor(note.timestamp_seconds / 60)}:${String(note.timestamp_seconds % 60).padStart(2, "0")}`,
          back: note.content,
        });
      }
    });

    // Default flashcards
    if (cards.length === 0) {
      cards.push(
        {
          front: `Core Concept: ${videoTitle}`,
          back: "The primary mechanism and architecture introduced in this lesson.",
        },
        {
          front: "Key Takeaway",
          back: "Practice hands-on coding right after watching to reinforce neural pathways.",
        },
        {
          front: "Study Tip",
          back: "Create timestamped notes during the video to review key formulas and timestamps.",
        }
      );
    }

    return cards;
  }, [videoTitle, notes]);

  const score = Object.entries(selectedAnswers).reduce((acc, [qId, ansIdx]) => {
    const q = quizQuestions.find((item) => item.id === Number(qId));
    return q && q.correct === ansIdx ? acc + 1 : acc;
  }, 0);

  return (
    <div className="ai-lesson-tutor-container">
      {/* Header bar */}
      <div className="ai-tutor-header">
        <div className="flex items-center gap-2">
          <span className="ai-sparkle-icon">
            <SparklesIcon size={16} />
          </span>
          <span className="ai-tutor-heading">AI STUDY COMPANION</span>
        </div>
        <div className="ai-tutor-nav">
          <button
            type="button"
            className={`ai-tab-btn ${activeTab === "summary" ? "active" : ""}`}
            onClick={() => setActiveTab("summary")}
          >
            Summary
          </button>
          <button
            type="button"
            className={`ai-tab-btn ${activeTab === "quiz" ? "active" : ""}`}
            onClick={() => setActiveTab("quiz")}
          >
            Quiz Check
          </button>
          <button
            type="button"
            className={`ai-tab-btn ${activeTab === "flashcards" ? "active" : ""}`}
            onClick={() => setActiveTab("flashcards")}
          >
            Flashcards ({flashcards.length})
          </button>
        </div>
      </div>

      {/* Tab 1: AI Summary */}
      {activeTab === "summary" && (
        <div className="ai-tab-content ai-summary-view">
          <div className="summary-meta-row">
            <span className="summary-badge">⚡ KEY TAKEAWAYS</span>
            <span className="summary-read-time">{summaryData.estimatedReadTime}</span>
          </div>
          <ul className="summary-points-list">
            {summaryData.highlights.map((point, i) => (
              <li key={i} className="summary-point-item">
                <span className="point-bullet">✦</span>
                <p>{point}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tab 2: Interactive Quiz */}
      {activeTab === "quiz" && (
        <div className="ai-tab-content ai-quiz-view">
          <div className="quiz-header-row">
            <span className="quiz-kicker">3-QUESTION KNOWLEDGE CHECK</span>
            {submitted && (
              <span className={`quiz-score-pill ${score >= 2 ? "pass" : "retry"}`}>
                Score: {score} / {quizQuestions.length} {score >= 2 ? "🎉 Passed!" : "Review lesson"}
              </span>
            )}
          </div>

          <div className="quiz-questions-list">
            {quizQuestions.map((q, idx) => {
              const selected = selectedAnswers[q.id];
              return (
                <div key={q.id} className="quiz-question-box">
                  <p className="quiz-question-text">
                    <strong>Q{idx + 1}.</strong> {q.question}
                  </p>
                  <div className="quiz-options-list">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selected === optIdx;
                      let optionClass = "";
                      if (submitted) {
                        if (optIdx === q.correct) optionClass = "correct-answer";
                        else if (isSelected && isSelected !== (optIdx === q.correct)) {
                          optionClass = "wrong-answer";
                        }
                      } else if (isSelected) {
                        optionClass = "selected-answer";
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={submitted}
                          onClick={() => {
                            setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                          }}
                          className={`quiz-option-btn ${optionClass}`}
                        >
                          <span className="option-letter">{String.fromCharCode(65 + optIdx)}</span>
                          <span className="option-label">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                  {submitted && (
                    <div className="quiz-explanation">
                      <span className="font-semibold text-emerald-400">Explanation:</span> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="quiz-footer-actions">
            {!submitted ? (
              <button
                type="button"
                disabled={Object.keys(selectedAnswers).length < quizQuestions.length}
                onClick={() => setSubmitted(true)}
                className="quiz-submit-btn"
              >
                Submit Answers
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSelectedAnswers({});
                  setSubmitted(false);
                }}
                className="quiz-retry-btn"
              >
                Retake Quiz
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Flashcards */}
      {activeTab === "flashcards" && (
        <div className="ai-tab-content ai-flashcards-view">
          <div className="flashcards-top-meta">
            <span>
              Card {currentCardIndex + 1} of {flashcards.length}
            </span>
            <span className="text-slate-500 text-xs">Click card to flip</span>
          </div>

          <div
            className={`flashcard-card ${isFlipped ? "flipped" : ""}`}
            onClick={() => setIsFlipped(!isFlipped)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setIsFlipped(!isFlipped);
            }}
          >
            <div className="flashcard-inner">
              <div className="flashcard-front">
                <span className="flashcard-side-label">QUESTION / PROMPT</span>
                <p className="flashcard-text">{flashcards[currentCardIndex]?.front}</p>
                <span className="flashcard-tap-hint">Tap to see answer ↺</span>
              </div>
              <div className="flashcard-back">
                <span className="flashcard-side-label">ANSWER / CONCEPT</span>
                <p className="flashcard-text">{flashcards[currentCardIndex]?.back}</p>
                <span className="flashcard-tap-hint">Tap to flip back ↺</span>
              </div>
            </div>
          </div>

          <div className="flashcards-controls">
            <button
              type="button"
              disabled={currentCardIndex === 0}
              onClick={() => {
                setIsFlipped(false);
                setCurrentCardIndex((i) => Math.max(0, i - 1));
              }}
              className="flashcard-nav-btn"
            >
              ← Previous
            </button>
            <button
              type="button"
              disabled={currentCardIndex === flashcards.length - 1}
              onClick={() => {
                setIsFlipped(false);
                setCurrentCardIndex((i) => Math.min(flashcards.length - 1, i + 1));
              }}
              className="flashcard-nav-btn"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
