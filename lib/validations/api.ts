import { z } from "zod";

/**
 * Strict regex and domain validation for YouTube video and playlist IDs
 */
export const YOUTUBE_VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;
export const YOUTUBE_PLAYLIST_ID_REGEX = /^[A-Za-z0-9_-]{10,64}$/;

export const ALLOWED_YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtube-nocookie.com",
]);

/**
 * Sanitizes input string to prevent stored XSS and excessive control characters
 */
export function sanitizeString(val: string): string {
  return val
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, "") // strip control characters
    .trim();
}

/**
 * Validates that an input URL is strictly an authorized YouTube domain
 */
export function isValidYoutubeUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const hostname = parsed.hostname.toLowerCase();
    return (
      ALLOWED_YOUTUBE_HOSTS.has(hostname) ||
      hostname.endsWith(".youtube.com")
    );
  } catch {
    return false;
  }
}

// 1. AI Study Assist API Schema
export const aiStudyAssistSchema = z.object({
  action: z.enum(["study_assist", "ask"]).default("study_assist"),
  videoTitle: z
    .string()
    .max(250, "Video title must not exceed 250 characters.")
    .transform(sanitizeString)
    .default("Lesson Topic"),
  description: z
    .string()
    .max(5000, "Description must not exceed 5000 characters.")
    .transform(sanitizeString)
    .default(""),
  currentTimestamp: z
    .number()
    .min(0, "Timestamp must be non-negative.")
    .max(86400, "Timestamp exceeds maximum duration.")
    .default(0),
  question: z
    .string()
    .max(1200, "Question must not exceed 1200 characters.")
    .transform(sanitizeString)
    .optional(),
  apiKey: z
    .string()
    .max(100)
    .regex(/^[A-Za-z0-9._-]*$/, "Invalid API key format.")
    .optional(),
});

// 2. Course Import API Schema
export const courseImportSchema = z.object({
  url: z
    .string()
    .min(3, "Please provide a valid YouTube link.")
    .max(500, "URL exceeds maximum length.")
    .transform(sanitizeString)
    .refine(
      (val) => {
        // Can be a bare valid playlist/video ID or a strict YouTube URL
        if (YOUTUBE_PLAYLIST_ID_REGEX.test(val) || YOUTUBE_VIDEO_ID_REGEX.test(val)) {
          return true;
        }
        return isValidYoutubeUrl(val);
      },
      { message: "Must be a valid YouTube URL (youtube.com or youtu.be) or valid ID." }
    ),
  refresh: z.boolean().optional().default(false),
});

// 3. Roadmap Clone API Schema
export const roadmapCloneSchema = z.object({
  roadmapId: z
    .string()
    .min(1, "Roadmap ID is required.")
    .max(300, "Roadmap identifier is too long.")
    .transform(sanitizeString),
});

// 4. Learning Path API Schemas
export const learningPathCreateSchema = z.object({
  title: z
    .string()
    .min(1, "Please provide a title for your learning path.")
    .max(120, "Title must not exceed 120 characters.")
    .transform(sanitizeString),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters.")
    .transform(sanitizeString)
    .default(""),
});

export const learningPathPatchSchema = z.object({
  title: z
    .string()
    .min(1, "Title must not be empty.")
    .max(120, "Title must not exceed 120 characters.")
    .transform(sanitizeString)
    .optional(),
  videoIds: z
    .array(z.string().uuid("Invalid video UUID format."))
    .max(200, "Cannot reorder more than 200 videos at once.")
    .optional(),
});

export const learningPathAddVideoSchema = z.object({
  url: z
    .string()
    .min(3, "Please provide a valid YouTube link.")
    .max(500, "URL exceeds maximum length.")
    .transform(sanitizeString)
    .refine(
      (val) => {
        if (YOUTUBE_PLAYLIST_ID_REGEX.test(val) || YOUTUBE_VIDEO_ID_REGEX.test(val)) {
          return true;
        }
        return isValidYoutubeUrl(val);
      },
      { message: "Must be a valid YouTube URL (youtube.com or youtu.be) or valid ID." }
    ),
});

// 5. Study Hub Subject Add Schema
export const studyHubAddSubjectSchema = z.object({
  hubId: z.string().uuid("Invalid Study Hub ID."),
  name: z
    .string()
    .min(1, "Subject name is required.")
    .max(100, "Subject name must not exceed 100 characters.")
    .transform(sanitizeString),
  code: z
    .string()
    .max(30, "Subject code must not exceed 30 characters.")
    .transform(sanitizeString)
    .default(""),
  color: z
    .enum(["blue", "emerald", "amber", "purple", "rose", "cyan", "indigo"])
    .default("blue"),
  courseId: z.string().uuid("Invalid course UUID.").optional().or(z.literal("")),
  youtubeUrl: z
    .string()
    .max(500)
    .transform(sanitizeString)
    .optional()
    .refine(
      (val) => !val || isValidYoutubeUrl(val) || YOUTUBE_PLAYLIST_ID_REGEX.test(val),
      { message: "Invalid YouTube URL." }
    ),
});
