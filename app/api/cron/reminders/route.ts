import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { dateInTz } from "@/lib/utils";

export const dynamic = "force-dynamic";

function isAuthorizedCron(authHeader: string | null, secret: string | undefined): boolean {
  if (!secret || secret === "change-me") return false;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  try {
    const a = Buffer.from(token, "utf-8");
    const b = Buffer.from(secret, "utf-8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Roz ek baar chalta hai (vercel.json). Jinhone aaj ka goal poora nahi kiya
 * aur reminder on rakha hai, unhe email bhejta hai.
 * Vercel Cron apne aap "Authorization: Bearer $CRON_SECRET" bhejta hai.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!isAuthorizedCron(authHeader, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!resendKey || !from) {
    return NextResponse.json({ skipped: "RESEND_API_KEY / RESEND_FROM are not configured." });
  }

  const admin = createAdminClient();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, timezone, daily_goal_minutes")
    .eq("reminder_enabled", true)
    .limit(500); // MVP limit: bade scale par batching/queue chahiye
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  let sent = 0;

  for (const p of profiles ?? []) {
    const today = dateInTz(p.timezone);
    const { data: act } = await admin
      .from("daily_activity")
      .select("seconds_learned")
      .eq("user_id", p.id)
      .eq("activity_date", today)
      .maybeSingle();

    if ((act?.seconds_learned ?? 0) >= p.daily_goal_minutes * 60) continue;

    const { data: u } = await admin.auth.admin.getUserById(p.id);
    const email = u?.user?.email;
    if (!email) continue;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: email,
        subject: `${p.daily_goal_minutes} minutes left to reach today's goal`,
        html: `<p>You haven't reached your learning goal for today yet. Spend just ${p.daily_goal_minutes} minutes learning to keep your streak going.</p><p><a href="${siteUrl}/dashboard">Continue learning</a></p>`,
      }),
    });
    if (res.ok) sent += 1;
  }

  return NextResponse.json({ checked: profiles?.length ?? 0, sent });
}
