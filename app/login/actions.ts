"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function fail(message: string, path = "/login"): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host && !host.includes("localhost")) {
    return `${proto}://${host}`;
  }
  return (
    h.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

export async function signInWithGoogle(formDataOrNext?: FormData | string) {
  let nextPath = "";
  if (typeof formDataOrNext === "string") {
    nextPath = formDataOrNext;
  } else if (formDataOrNext && typeof (formDataOrNext as FormData).get === "function") {
    nextPath = String((formDataOrNext as FormData).get("next") ?? "");
  }

  const supabase = await createClient();
  const origin = await siteOrigin();
  const callbackUrl =
    nextPath && nextPath.startsWith("/")
      ? `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
      : `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    fail(error.message);
  }

  if (data?.url) {
    redirect(data.url);
  }

  fail("Could not start Google sign-in. Please try again.");
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) fail("Enter both your email and password.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    fail(
      error.code === "email_not_confirmed"
        ? "Please confirm your email using the link we sent before logging in."
        : error.code === "invalid_credentials"
          ? "Email or password is incorrect. Check your details or create an account."
          : error.message
    );
  }
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 6) {
    fail("Enter a valid email and a password with at least 6 characters.", "/signup");
  }

  const supabase = await createClient();
  const origin = await siteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    const message =
      error.code === "signup_disabled"
        ? "New account creation is currently disabled. Please contact the site administrator."
        : error.code === "user_already_exists"
          ? "An account with this email already exists. Log in instead."
        : error.code === "email_address_invalid"
          ? "Please enter a valid email address."
          : error.code === "over_email_send_rate_limit"
            ? "Too many confirmation emails have been requested. Please wait a while and try again."
            : /database error saving new user/i.test(error.message)
              ? "Account creation failed while setting up your profile. Please ask the site administrator to verify the Supabase database schema."
              : error.message;
    fail(message, "/signup");
  }
  if (data.user?.identities?.length === 0) {
    fail("An account with this email already exists. Log in instead.", "/signup");
  }

  if (data.session) redirect("/dashboard");
  redirect(
    `/signup?message=${encodeURIComponent("Your account request was received. Confirm your email before logging in. If the email does not arrive, you can resend it below.")}`
  );
}

export async function resendSignupConfirmation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) fail("Enter the email address you used to sign up.", "/signup");

  const supabase = await createClient();
  const origin = await siteOrigin();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    fail(
      error.code === "over_email_send_rate_limit"
        ? "Too many confirmation emails have been requested. Please wait a while and try again."
        : error.message,
      "/signup"
    );
  }

  redirect(
    `/signup?message=${encodeURIComponent("If this address has a pending signup, a new confirmation email is on its way.")}`
  );
}
