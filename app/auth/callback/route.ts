import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const providerErrorCode = searchParams.get("error");
  const providerError = searchParams.get("error_description") ?? providerErrorCode;

  if (providerError) {
    const message = providerErrorCode === "access_denied"
      ? "Google sign-in was cancelled."
      : providerError;
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message.slice(0, 300))}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/dashboard`);
  }
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Sign-in could not be completed. Please try again.")}`);
}
