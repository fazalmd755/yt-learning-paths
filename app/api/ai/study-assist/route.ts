import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface StudyAssistResponse {
  title: string;
  summaryBullets: string[];
  mcqs: Array<{
    id: number;
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }>;
  markdown: string;
}

function cleanMarkdown(raw: string): string {
  return raw.replace(/```json/gi, "").replace(/```/g, "").trim();
}

/**
 * Intelligent context-based fallback when Gemini API key is not provided or rate limited.
 */
function generateContextualFallback(
  videoTitle: string,
  description: string,
  currentTimestamp: number
): StudyAssistResponse {
  const cleanDesc = (description || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 25 &&
        !l.toLowerCase().includes("subscribe") &&
        !l.toLowerCase().includes("http") &&
        !l.toLowerCase().includes("instagram") &&
        !l.toLowerCase().includes("twitter")
    );

  const bullet1 =
    cleanDesc[0] ||
    `Core conceptual architecture and foundational principles introduced in "${videoTitle}".`;
  const bullet2 =
    cleanDesc[1] ||
    "Practical code walk-through and step-by-step implementation logic demonstrated in this segment.";
  const bullet3 =
    cleanDesc[2] ||
    "Edge-case handling, execution flow optimization, and industry best practices for robust applications.";

  const summaryBullets = [bullet1, bullet2, bullet3];

  const mins = Math.floor(currentTimestamp / 60);
  const secs = currentTimestamp % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const mcqs = [
    {
      id: 1,
      question: `What is the primary technical objective discussed in "${videoTitle}"?`,
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
      question: `When implementing the patterns shown around [${timeStr}], what is the recommended production practice?`,
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
  ];

  const markdown = [
    `### 🎯 3-Bullet Summary (${videoTitle})`,
    `- **Architecture**: ${summaryBullets[0]}`,
    `- **Implementation**: ${summaryBullets[1]}`,
    `- **Optimization & Best Practice**: ${summaryBullets[2]}`,
    "",
    "### 💡 Key Takeaway",
    `Saved from player assist at **${timeStr}**. Review these core concepts before moving to the next module.`,
  ].join("\n");

  return {
    title: videoTitle,
    summaryBullets,
    mcqs,
    markdown,
  };
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to use AI Study Assist." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const videoTitle = String(body?.videoTitle ?? "Lesson Topic").trim();
    const description = String(body?.description ?? "").trim();
    const currentTimestamp = Number(body?.currentTimestamp ?? 0);
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // If Gemini API Key is available, prompt Gemini for high-precision structured analysis
    if (geminiKey) {
      try {
        const prompt = `You are Watchlify's expert AI Study Assistant.
Analyze this YouTube educational video:
Title: "${videoTitle}"
Description snippet: "${description.slice(0, 1500)}"
Current player timestamp: ${currentTimestamp} seconds.

Generate:
1. Exactly 3 crisp, high-value bullet summary points explaining the core technical concepts.
2. Exactly 3 multiple-choice practice questions (MCQs) testing understanding of this specific topic. Each MCQ must have 4 clear options, the index of the correct answer (0, 1, 2, or 3), and a concise explanation.

Return ONLY a valid JSON object matching this schema:
{
  "summaryBullets": ["bullet 1", "bullet 2", "bullet 3"],
  "mcqs": [
    {
      "id": 1,
      "question": "Question text...",
      "options": ["A", "B", "C", "D"],
      "correct": 0,
      "explanation": "Why option A is correct..."
    }
  ]
}`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(cleanMarkdown(rawText));
            if (
              Array.isArray(parsed.summaryBullets) &&
              parsed.summaryBullets.length >= 3 &&
              Array.isArray(parsed.mcqs) &&
              parsed.mcqs.length >= 3
            ) {
              const mins = Math.floor(currentTimestamp / 60);
              const secs = currentTimestamp % 60;
              const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

              const markdown = [
                `### 🎯 3-Bullet Summary (${videoTitle})`,
                `- ${parsed.summaryBullets[0]}`,
                `- ${parsed.summaryBullets[1]}`,
                `- ${parsed.summaryBullets[2]}`,
                "",
                `*Generated at ${timeStr} via Watchlify AI Study Assist.*`,
              ].join("\n");

              return NextResponse.json({
                title: videoTitle,
                summaryBullets: parsed.summaryBullets.slice(0, 3),
                mcqs: parsed.mcqs.slice(0, 3),
                markdown,
              });
            }
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini study assist API fallback active:", geminiErr);
      }
    }

    // Fallback to contextual generator
    const fallbackData = generateContextualFallback(videoTitle, description, currentTimestamp);
    return NextResponse.json(fallbackData);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to generate AI study assist." },
      { status: 500 }
    );
  }
}
