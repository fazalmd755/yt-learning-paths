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
  <title>Watchlify Study Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0d11; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0d11; padding: 48px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #13161c; border: 1px solid #222734; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
          
          <!-- Brand Header -->
          <tr>
            <td style="padding: 24px 32px; background: linear-gradient(180deg, #171b24 0%, #13161c 100%); border-bottom: 1px solid #222734;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <img src="${siteUrl}/logo.png" width="34" height="34" alt="Watchlify" style="display: block; border-radius: 8px; border: 1px solid #222734;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                            Watch<span style="color: #10b981;">lify</span>
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; color: #10b981; background-color: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Daily Streak
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px 32px;">
              <h1 style="margin: 0 0 14px; font-size: 22px; font-weight: 700; color: #f8fafc; line-height: 1.3;">
                Don't break your momentum! 🔥
              </h1>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: #94a3b8;">
                You haven't reached your learning goal for today yet. Take a quick study break from distractions and log just <strong style="color: #f8fafc;">${p.daily_goal_minutes} minutes</strong> to keep your streak glowing.
              </p>

              <!-- Progress Target Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px; background-color: #0b0d11; border: 1px solid #222734; border-radius: 12px; padding: 16px 20px;">
                <tr>
                  <td>
                    <span style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600;">
                      Today's Target
                    </span>
                    <span style="font-size: 20px; font-weight: 700; color: #10b981;">
                      ${p.daily_goal_minutes} Minutes
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size: 28px;">🎯</span>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 0 0 12px;">
                <a href="${siteUrl}/dashboard" style="display: inline-block; width: 100%; box-sizing: border-box; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #0b0d11; font-size: 15px; font-weight: 700; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 10px; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);">
                  Continue Learning →
                </a>
              </div>
            </td>
          </tr>

          <!-- Subtle Features Highlight -->
          <tr>
            <td style="padding: 0 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px dashed #222734; padding-top: 20px;">
                <tr>
                  <td style="font-size: 13px; color: #64748b; line-height: 20px;">
                    ✨ Zero YouTube distractions &bull; Auto-saved timestamps &bull; Synced notes
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0b0d11; border-top: 1px solid #222734; text-align: center; font-size: 12px; line-height: 18px; color: #64748b;">
              You're receiving this because Daily Reminders are active on Watchlify.<br>
              Adjust your goals or schedule anytime in your 
              <a href="${siteUrl}/settings" style="color: #10b981; text-decoration: underline;">
                Account Settings
              </a>.
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
