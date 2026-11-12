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
function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "https://www.watchlify.online";
}

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

  const siteUrl = getSiteUrl();
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
        subject: `🔥 Keep your streak alive! ${p.daily_goal_minutes} mins left today`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px; border-bottom: 1px solid #27272a;">
              <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Watch<span style="color: #f97316;">lify</span>
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #ffffff;">Don't lose your study streak! 🔥</h2>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 24px; color: #a1a1aa;">
                You haven't reached your learning goal for today yet. Just <strong>${p.daily_goal_minutes} minutes</strong> of focused learning is all it takes to keep your daily momentum going.
              </p>
              
              <div style="margin: 28px 0;">
                <a href="${siteUrl}/dashboard" style="display: inline-block; background-color: #f97316; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);">
                  Continue Learning →
                </a>
              </div>

              <p style="margin: 24px 0 0; font-size: 13px; color: #71717a;">
                Watch YouTube tutorials distraction-free, organize notes, and hit your milestones on Watchlify.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #121215; border-top: 1px solid #27272a; font-size: 12px; color: #71717a; text-align: center;">
              You received this because daily study reminders are enabled on your account.<br>
              You can adjust this anytime in your <a href="${siteUrl}/settings" style="color: #f97316; text-decoration: none;">Account Settings</a>.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      }),
    });
    if (res.ok) sent += 1;
  }

  return NextResponse.json({ checked: profiles?.length ?? 0, sent });
}
