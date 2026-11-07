import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const origin = isLocalEnv
    ? requestUrl.origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : requestUrl.origin;

  const code = requestUrl.searchParams.get("code");
  const providerErrorCode = requestUrl.searchParams.get("error");
  const providerError = requestUrl.searchParams.get("error_description") ?? providerErrorCode;

  if (providerError) {
    const message = providerErrorCode === "access_denied"
      ? "Google sign-in was cancelled."
      : providerError;
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message.slice(0, 300))}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const nextParam = requestUrl.searchParams.get("next");
      const dest = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Sign-in could not be completed. Please try again.")}`);
}
