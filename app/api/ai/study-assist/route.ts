import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { aiStudyAssistSchema } from "@/lib/validations/api";

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
  answer?: string;
}

function cleanMarkdown(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function cleanAiAnswerText(raw: string): string {
  if (!raw) return "";
  return raw
    // Remove markdown headers: #, ##, ###, ####
    .replace(/^#{1,6}\s+/gm, "")
    // Remove horizontal separator rules: ---, ***, ___
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Standardize bullet points
    .replace(/\*+/g, "")
    .replace(/^[-–—]\s*/gm, "")
    .replace(/[-–—]{2,}/g, " ")
    // Clean excessive empty lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * 1. Google Gemini
 */
async function callGemini(prompt: string, apiKey: string, jsonMode = true): Promise<string> {
  const models = [
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ];
  let lastErrorMessage = "";

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload: any = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
        },
      };

      if (jsonMode) {
        payload.generationConfig.responseMimeType = "application/json";
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message || res.statusText;
        lastErrorMessage = `${model} error (${res.status}): ${errMsg}`;
        console.warn(`Gemini model ${model} failed:`, errMsg);
      }
    } catch (e: any) {
      lastErrorMessage = e?.message || "Network error contacting Gemini API";
      console.warn(`Error calling Gemini with ${model}:`, e);
    }
  }

  throw new Error(lastErrorMessage || "Unable to get response from Gemini API.");
}

/**
 * 2. 100% Free AI Provider (No API key needed!)
 */
async function callFreeAI(prompt: string, jsonMode = true): Promise<string> {
  const url = "https://text.pollinations.ai/";
  const payload = {
    messages: [
      {
        role: "system",
        content: jsonMode
          ? "You are an expert AI tutor. Return ONLY valid JSON with no markdown formatting or commentary."
          : "You are an encouraging, expert technical AI study tutor. Provide structured, clear, and easy-to-understand explanations in Markdown.",
      },
      { role: "user", content: prompt },
    ],
    model: "openai",
    jsonMode: jsonMode,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Free AI service returned HTTP ${res.status}`);
  }

  return await res.text();
}

/**
 * 3. Intelligent Topic-Grounded Fallback (zero downtime guarantee)
 */
function generateContextualFallback(
  videoTitle: string,
  description: string,
  timeStr: string
): { summaryBullets: string[]; mcqs: any[] } {
  const lines = description
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 20 &&
        !l.toLowerCase().includes("subscribe") &&
        !l.toLowerCase().includes("http") &&
        !l.toLowerCase().includes("instagram") &&
        !l.toLowerCase().includes("twitter")
    );

  const b1 = lines[0] || `Mastering core architecture and execution fundamentals for "${videoTitle}".`;
  const b2 = lines[1] || `Practical code implementation patterns and module structuring demonstrated around ${timeStr}.`;
  const b3 = lines[2] || `Best practices, edge-case mitigation, and production deployment considerations.`;

  return {
    summaryBullets: [b1, b2, b3],
    mcqs: [
      {
        id: 1,
        question: `What is the primary technical objective demonstrated in "${videoTitle}"?`,
        options: [
          "Understanding underlying execution flow and architectural principles",
          "Rote memorization of syntax without practical application",
          "Disabling runtime checks and assertions",
          "Using deprecated legacy APIs in production",
        ],
        correct: 0,
        explanation: "The lesson emphasizes deep conceptual mechanics and production-grade implementation over superficial memorization.",
      },
      {
        id: 2,
        question: `When applying patterns from this lesson, what is the recommended engineering practice?`,
        options: [
          "Hardcode parameters directly inside business logic",
          "Structure modular, strongly-typed code with clear error boundaries",
          "Suppress console errors to disguise runtime issues",
          "Skip boundary validation if the happy path runs once",
        ],
        correct: 1,
        explanation: "Modular structure combined with explicit error boundaries ensures maintainability and prevents unexpected crashes in production.",
      },
      {
        id: 3,
        question: `How should you validate your understanding of this topic?`,
        options: [
          "Deploy directly to production without testing",
          "Write automated unit tests, inspect execution logs, and probe boundary cases",
          "Assume third-party libraries handle all domain logic",
          "Avoid running the code locally",
        ],
        correct: 1,
        explanation: "Rigorous testing and boundary probing ensures the implementation meets production reliability standards.",
      },
    ],
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
        { error: "Please log in to use AI Study Assist." },
        { status: 401 }
      );
    }

    // 1. Production Rate Limiting (10 requests per minute per user, 15 per IP)
    const clientIp = getClientIp(req);
    const [userLimit, ipLimit] = await Promise.all([
      checkRateLimit(`ai:user:${user.id}`, 10, 60),
      checkRateLimit(`ai:ip:${clientIp}`, 15, 60),
    ]);

    if (!userLimit.success || !ipLimit.success) {
      const retryAfter = Math.max(userLimit.reset, ipLimit.reset) - Math.floor(Date.now() / 1000);
      return NextResponse.json(
        {
          error: "TOO_MANY_REQUESTS",
          message: "You have exceeded the AI request limit. Please wait a moment before asking again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, retryAfter)),
            "X-RateLimit-Limit": String(userLimit.limit),
            "X-RateLimit-Remaining": String(userLimit.remaining),
            "X-RateLimit-Reset": String(userLimit.reset),
          },
        }
      );
    }

    // 2. Strict Payload Validation with Zod
    const rawBody = await req.json().catch(() => null);
    const parsedResult = aiStudyAssistSchema.safeParse(rawBody);

    if (!parsedResult.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: parsedResult.error.issues[0]?.message || "Invalid request payload.",
        },
        { status: 400 }
      );
    }

    const {
      action,
      videoTitle,
      description,
      currentTimestamp,
      question: userQuestion = "",
      apiKey: clientKey,
    } = parsedResult.data;

    // Key hierarchy: server env GEMINI_API_KEY -> client passed key
    const geminiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      clientKey ||
      "";

    const mins = Math.floor(currentTimestamp / 60);
    const secs = currentTimestamp % 60;
    const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    // Helper to call Gemini first, then free AI fallback
    const callAI = async (prompt: string, jsonMode: boolean): Promise<string> => {
      if (geminiKey) {
        try {
          return await callGemini(prompt, geminiKey, jsonMode);
        } catch (e) {
          console.warn("Gemini call failed, routing to free AI:", e);
        }
      }

      // Free AI engine (zero API key required)
      return await callFreeAI(prompt, jsonMode);
    };

    // Action 1: Ask AI Tutor a doubt
    if (action === "ask") {
      if (!userQuestion) {
        return NextResponse.json(
          { error: "Please enter a question to ask the AI Tutor." },
          { status: 400 }
        );
      }

      const askPrompt = `You are a friendly, expert AI Study Tutor in Watchlify.
The student is watching an educational video:
- Title: "${videoTitle}"
- Video Context: "${description.slice(0, 1800)}"
- Current Video Timestamp: ${timeStr}

Student's Question:
"${userQuestion}"

Formatting Rules:
- Write in clean, conversational prose without any markdown formatting symbols.
- NEVER use asterisks (NO '*', NO '**'). Do not use asterisks for bold or lists.
- NEVER use dashes (NO '-'). Do not use dash symbols.
- NEVER use hash symbols (NO '#', NO '##', NO '###').
- NEVER use divider lines (NO '---', NO '***').
- Use numbered points (1., 2., 3.) if listing steps.
- Provide a direct answer, a short practical example, and 1 important tip. Keep it crisp.`;

      let answerText = "";
      try {
        answerText = await callAI(askPrompt, false);
      } catch (e) {
        console.warn("AI Ask failed:", e);
        answerText = `Quick Guidance for "${videoTitle}":\n\nRegarding: ${userQuestion}\n\n• Core Concept: Make sure you understand the foundational architecture and flow demonstrated around ${timeStr}.\n• Best Practice: Keep code modular, test edge cases, and avoid hardcoding values.\n• Pro Tip: Try running the code locally to reinforce your understanding!`;
      }

      return NextResponse.json({
        answer: cleanAiAnswerText(answerText),
        timeStr,
      });
    }

    // Action 2: Generate Structured Summary & Real Concept Quizzes
    const studyPrompt = `You are an elite educational AI tutor analyzing this educational video lesson:
Lesson Title: "${videoTitle}"
Description Snippet: "${description.slice(0, 2000)}"
Current player time: ${timeStr}

Task:
1. Generate 3 to 4 crisp, insightful bullet summary points explaining the core technical concepts taught in this specific video.
2. Generate 3 to 4 deep-learning Multiple Choice Practice Questions (MCQs) specifically testing understanding of the topics taught in "${videoTitle}".
Each question MUST:
- Test conceptual understanding, not trivial trivia.
- Have 4 plausible options.
- State the 0-indexed correct option (0, 1, 2, or 3).
- Provide a clear, educational explanation of why the correct option is right.

Return ONLY a valid JSON object matching this schema:
{
  "summaryBullets": [
    "Core architecture/concept 1...",
    "Implementation technique 2...",
    "Best practice or optimization 3..."
  ],
  "mcqs": [
    {
      "id": 1,
      "question": "Clear technical question...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Why Option A is correct..."
    }
  ]
}`;

    let bullets: string[] = [];
    let mcqs: any[] = [];

    try {
      const rawOutput = await callAI(studyPrompt, true);
      let parsed: any = {};
      try {
        parsed = JSON.parse(cleanMarkdown(rawOutput));
      } catch {
        const match = rawOutput.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      }

      if (Array.isArray(parsed?.summaryBullets) && parsed.summaryBullets.length > 0) {
        bullets = parsed.summaryBullets;
      }
      if (Array.isArray(parsed?.mcqs) && parsed.mcqs.length > 0) {
        mcqs = parsed.mcqs;
      }
    } catch (e) {
      console.warn("AI Study Assist failed, generating fallback:", e);
    }

    // Fallback if needed
    if (bullets.length === 0 || mcqs.length === 0) {
      const fb = generateContextualFallback(videoTitle, description, timeStr);
      if (bullets.length === 0) bullets = fb.summaryBullets;
      if (mcqs.length === 0) mcqs = fb.mcqs;
    }

    const markdown = [
      `### 🎯 Key Takeaways (${videoTitle})`,
      ...bullets.map((b) => `- ${b}`),
      "",
      `*Generated at ${timeStr} via Watchlify AI.*`,
    ].join("\n");

    return NextResponse.json({
      title: videoTitle,
      summaryBullets: bullets,
      mcqs,
      markdown,
    });
  } catch (err: any) {
    console.error("AI Study Assist Route Error:", err);
    return NextResponse.json(
      {
        error: "AI_ERROR",
        message: err?.message || "Failed to generate AI response.",
      },
      { status: 500 }
    );
  }
}
