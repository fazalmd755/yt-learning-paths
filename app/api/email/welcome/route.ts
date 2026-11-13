import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Diagnostic & Testing endpoint for Welcome Email.
 *
 * GET /api/email/welcome?test_to=your_email@gmail.com
 * Tests sending directly or inspects configuration status.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const testTo = searchParams.get("test_to") || searchParams.get("email");

  const hasKey = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0);
  const rawFrom = process.env.RESEND_FROM || "(not set, defaulting to Watchlify <onboarding@resend.dev>)";

  if (!testTo) {
    return NextResponse.json({
      status: "info",
      resend_api_key_configured: hasKey,
      resend_from: rawFrom,
      instructions: hasKey
        ? "To test sending an email, visit: /api/email/welcome?test_to=your_email@gmail.com"
        : "RESEND_API_KEY is MISSING in Vercel / .env. Go to Vercel Project Settings -> Environment Variables and add RESEND_API_KEY and RESEND_FROM.",
    });
  }

  // Attempt test email
  const result = await sendWelcomeEmail({
    to: testTo,
    displayName: "Study Champion",
  });

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        resend_api_key_configured: hasKey,
        resend_from: rawFrom,
        error: result.error,
        help: "If domain is not verified on Resend, make sure RESEND_FROM is set to 'Watchlify <onboarding@resend.dev>' or verify your domain at resend.com/domains",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Test welcome email successfully sent to ${testTo}!`,
    details: result.details,
  });
}

/**
 * Trigger welcome email for the logged-in user.
 * POST /api/email/welcome
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const displayName =
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      "";

    const result = await sendWelcomeEmail({
      to: user.email,
      displayName,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send welcome email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Welcome email successfully sent to ${user.email}!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
