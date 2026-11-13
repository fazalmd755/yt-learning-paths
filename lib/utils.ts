import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** 3725 -> "1h 2m", 125 -> "2m 5s" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return sec > 0 && m < 5 ? `${m}m ${sec}s` : `${m}m`;
  return `${sec}s`;
}

/** User ke timezone mein aaj ki date, "YYYY-MM-DD" */
export function dateInTz(tz: string, date: Date = new Date()): string {
  try {
    return date.toLocaleDateString("en-CA", { timeZone: tz });
  } catch {
    return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  }
}

/** Aaj tak ke last n dates (purani pehle), user ke timezone mein */
export function lastNDates(n: number, tz: string): string[] {
  const out: string[] = [];
  const now = Date.now();
  for (let i = n - 1; i >= 0; i--) {
    out.push(dateInTz(tz, new Date(now - i * 86_400_000)));
  }
  return out;
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

