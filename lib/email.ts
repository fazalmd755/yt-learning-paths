/**
 * Watchlify Email Service
 * Handles transactional emails such as Welcome Emails and Study Reminders via Resend.
 */

function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "https://watchlify.online";
}

export interface WelcomeEmailOptions {
  to: string;
  displayName?: string | null;
}

/**
 * Generate high-converting, dark-themed responsive HTML for the welcome email.
 */
export function generateWelcomeEmailHtml({
  displayName,
  siteUrl,
}: {
  displayName?: string | null;
  siteUrl: string;
}): string {
  const firstName = displayName && displayName.trim() ? displayName.trim().split(" ")[0] : "Learner";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Watchlify</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0d11; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0d11; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #13161c; border: 1px solid #222734; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 48px rgba(0, 0, 0, 0.65);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 24px 32px; background: linear-gradient(180deg, #181d27 0%, #13161c 100%); border-bottom: 1px solid #222734;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <img src="${siteUrl}/icon.svg" width="34" height="34" alt="Watchlify" style="display: block; border-radius: 8px; border: 1px solid #222734;" />
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
                      Welcome 🚀
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Greeting -->
          <tr>
            <td style="padding: 36px 32px 28px;">
              <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #f8fafc; line-height: 1.3; letter-spacing: -0.02em;">
                Welcome aboard, ${firstName}! 👋
              </h1>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 24px; color: #94a3b8;">
                The best education in the world is already on YouTube. But regular YouTube is engineered to distract you with endless shorts and recommendations.
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: #cbd5e1;">
                <strong>Watchlify is your distraction-free workspace</strong> — designed to help you turn scattered playlists into structured courses and actually finish what you start.
              </p>

              <!-- Highlight Box: 3 Quick Steps -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px; background-color: #0b0d11; border: 1px solid #222734; border-radius: 12px; padding: 20px;">
                <tr>
                  <td>
                    <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #10b981; font-weight: 800; margin-bottom: 14px;">
                      ✦ 3 Steps to Get Started
                    </span>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                      <tr>
                        <td width="28" style="vertical-align: top; font-size: 16px;">1️⃣</td>
                        <td style="font-size: 14px; line-height: 20px; color: #e2e8f0;">
                          <strong style="color: #ffffff;">Paste any YouTube URL:</strong> Copy a playlist or single video and paste it in your dashboard search bar.
                        </td>
                      </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                      <tr>
                        <td width="28" style="vertical-align: top; font-size: 16px;">2️⃣</td>
                        <td style="font-size: 14px; line-height: 20px; color: #e2e8f0;">
                          <strong style="color: #ffffff;">Take Timestamped Notes:</strong> Click any note to jump directly to that second in the lesson.
                        </td>
                      </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="28" style="vertical-align: top; font-size: 16px;">3️⃣</td>
                        <td style="font-size: 14px; line-height: 20px; color: #e2e8f0;">
                          <strong style="color: #ffffff;">Keep your Streak Alive:</strong> Study just 15 minutes a day to build an unbreakable learning habit.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Primary CTA -->
              <div style="text-align: center; margin: 0 0 16px;">
                <a href="${siteUrl}/dashboard" style="display: inline-block; width: 100%; box-sizing: border-box; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #0b0d11; font-size: 15px; font-weight: 800; text-decoration: none; text-align: center; padding: 15px 24px; border-radius: 10px; box-shadow: 0 4px 18px rgba(16, 185, 129, 0.4); letter-spacing: 0.02em;">
                  Open Your Study Workspace →
                </a>
              </div>
            </td>
          </tr>

          <!-- Value Features Card -->
          <tr>
            <td style="padding: 0 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px dashed #222734; padding-top: 20px;">
                <tr>
                  <td style="font-size: 13px; color: #64748b; line-height: 22px;">
                    🎯 <strong style="color: #94a3b8;">100% Free Forever:</strong> No hidden subscriptions, no credit cards. Just focused learning.
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; line-height: 22px; padding-top: 4px;">
                    📱 <strong style="color: #94a3b8;">Works on Any Device:</strong> Study seamlessly on phone, tablet, or desktop with instant sync.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0b0d11; border-top: 1px solid #222734; text-align: center; font-size: 12px; line-height: 18px; color: #64748b;">
              Have questions or feedback? Reply directly to this email or reach us at
              <a href="mailto:contact.watchlify@gmail.com" style="color: #10b981; text-decoration: none;">contact.watchlify@gmail.com</a>.<br>
              <span style="display: inline-block; margin-top: 8px;">
                <a href="${siteUrl}/dashboard" style="color: #94a3b8; text-decoration: underline; margin: 0 6px;">Dashboard</a> &bull;
                <a href="${siteUrl}/planner" style="color: #94a3b8; text-decoration: underline; margin: 0 6px;">Study Planner</a> &bull;
                <a href="${siteUrl}/study-hubs" style="color: #94a3b8; text-decoration: underline; margin: 0 6px;">Study Hubs</a>
              </span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Sends a welcome email to a new user via Resend.
 * Fails gracefully without throwing an error if configuration is missing.
 */
export async function sendWelcomeEmail({ to, displayName }: WelcomeEmailOptions): Promise<{ success: boolean; error?: string; details?: any }> {
  const resendKey = process.env.RESEND_API_KEY;
  let from = process.env.RESEND_FROM;

  if (!from || from.includes("yourdomain.com")) {
    from = "Watchlify <notifications@watchlify.online>";
  }

  if (!to || !to.includes("@")) {
    return { success: false, error: "Invalid recipient email" };
  }

  if (!resendKey || resendKey.trim() === "") {
    const msg = "RESEND_API_KEY is not configured in environment variables (Vercel / .env).";
    console.warn(`[Welcome Email] ${msg} Skipped sending email to ${to}.`);
    return { success: false, error: msg };
  }

  const siteUrl = getSiteUrl();
  const firstName = displayName && displayName.trim() ? displayName.trim().split(" ")[0] : "there";
  const subject = `Welcome to Watchlify, ${firstName}! 🚀 Your focused study space is ready`;
  const html = generateWelcomeEmailHtml({ displayName, siteUrl });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Welcome Email Error] Resend returned ${res.status}:`, errorText);
      return { success: false, error: `Resend error (${res.status}): ${errorText}` };
    }

    const data = await res.json();
    console.log(`[Welcome Email Sent] To: ${to}, Resend ID: ${data?.id}`);
    return { success: true, details: data };
  } catch (err: any) {
    console.error("[Welcome Email Exception]", err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}

/**
 * Checks if a user hasn't received the welcome email yet.
 * If eligible, sends the email and sets the metadata flag `welcome_email_sent: true`.
 */
export async function handleNewUserWelcome(user: {
  id: string;
  email?: string | null;
  created_at?: string;
  user_metadata?: Record<string, any>;
}) {
  if (!user || !user.id || !user.email) return;

  // 1. If already successfully sent, do nothing
  if (user.user_metadata?.welcome_email_sent) {
    return;
  }

  // 2. Send the welcome email
  const displayName =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "";

  const result = await sendWelcomeEmail({
    to: user.email,
    displayName,
  });

  // 3. ONLY mark as sent if the email was actually successfully delivered by Resend!
  if (result.success) {
    try {
      const { createAdminClient } = await import("@/lib/supabase/server");
      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...(user.user_metadata || {}),
          welcome_email_sent: true,
          welcome_email_sent_at: new Date().toISOString(),
        },
      });
      console.log(`[Welcome Email] Successfully delivered to ${user.email} and flagged.`);
    } catch (err) {
      console.error("[Welcome Email] Could not set welcome_email_sent metadata:", err);
    }
  } else {
    console.warn(`[Welcome Email] Did not set welcome_email_sent flag because delivery failed: ${result.error}`);
  }
}
