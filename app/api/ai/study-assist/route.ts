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
  answer?: string;
}

function cleanMarkdown(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

async function callGemini(prompt: string, apiKey: string, jsonMode = true) {
  // Try gemini-2.0-flash first, fallback to gemini-1.5-flash
  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
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

  throw new Error(lastErrorMessage || "Unable to get response from Gemini API. Please check your Gemini API key.");
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

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "study_assist"); // "study_assist" | "ask"
    const videoTitle = String(body?.videoTitle ?? "Lesson Topic").trim();
    const description = String(body?.description ?? "").trim();
    const currentTimestamp = Number(body?.currentTimestamp ?? 0);
    const userQuestion = String(body?.question ?? "").trim();

    // Check key in order: client-passed key, env GEMINI_API_KEY, env GOOGLE_AI_API_KEY, env GOOGLE_API_KEY
    const clientKey = String(body?.apiKey ?? "").trim();
    const geminiKey =
      clientKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (!geminiKey) {
      return NextResponse.json(
        {
          error: "NO_API_KEY",
          message:
            "Gemini API key is not configured. Add your free Gemini API key to start generating AI summaries, quizzes, and asking doubts.",
        },
        { status: 400 }
      );
    }

    const mins = Math.floor(currentTimestamp / 60);
    const secs = currentTimestamp % 60;
    const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    // Action 1: Ask AI Tutor a specific doubt / question
    if (action === "ask") {
      if (!userQuestion) {
        return NextResponse.json(
          { error: "Please enter a question to ask the AI Tutor." },
          { status: 400 }
        );
      }

      const askPrompt = `You are an expert, encouraging AI Study Tutor in Watchlify.
The student is watching an educational video:
- Title: "${videoTitle}"
- Video Context: "${description.slice(0, 1800)}"
- Current Video Timestamp: ${timeStr}

Student's Doubt / Question:
"${userQuestion}"

Provide a clear, engaging, easy-to-understand response:
1. Direct answer to their question with a clear intuitive explanation.
2. If relevant, include a practical code snippet or real-world example.
3. 1 key memory tip or common mistake to avoid.

Keep the tone helpful, structured in markdown, and concise.`;

      const answerText = await callGemini(askPrompt, geminiKey, false);

      return NextResponse.json({
        answer: answerText,
        timeStr,
      });
    }

    // Action 2: Generate Structured Summary & Real Concept Quizzes
    const studyPrompt = `You are an elite educational AI tutor analyzing this educational video lesson:
Lesson Title: "${videoTitle}"
Description Snippet: "${description.slice(0, 2000)}"
Current player time: ${timeStr}

Task:
1. Generate 3 to 4 crisp, insightful bullet summary points explaining the core technical/academic concepts taught in this specific video.
2. Generate 4 deep-learning Multiple Choice Practice Questions (MCQs) specifically testing understanding of the topics taught in "${videoTitle}".
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

    const rawJson = await callGemini(studyPrompt, geminiKey, true);
    let parsed: any = {};
    try {
      parsed = JSON.parse(cleanMarkdown(rawJson));
    } catch {
      const match = rawJson.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch (e) {
          console.error("Failed to parse Gemini JSON output:", rawJson);
        }
      }
    }

    const bullets: string[] = Array.isArray(parsed?.summaryBullets) ? parsed.summaryBullets : [];
    const mcqs: any[] = Array.isArray(parsed?.mcqs) ? parsed.mcqs : [];

    const markdown = [
      `### 🎯 Key Takeaways (${videoTitle})`,
      ...bullets.map((b) => `- ${b}`),
      "",
      `*Generated at ${timeStr} via Watchlify Gemini AI.*`,
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
        message: err?.message || "Failed to generate AI response. Please verify your Gemini API key.",
      },
      { status: 500 }
    );
  }
}
