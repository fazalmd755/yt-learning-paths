import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { ArrowRightIcon } from "@/components/Icons";
import { resendSignupConfirmation, signInWithGoogle, signup } from "../login/actions";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Join Watchify for free. Turn YouTube playlists into structured learning paths with progress tracking and daily streaks.",
  alternates: {
    canonical: "/signup",
  },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  const showResendConfirmation = Boolean(
    message?.toLowerCase().includes("confirm") || message?.toLowerCase().includes("signup")
  );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="auth-page">
      <section className="auth-aside">
        <span className="auth-aside-mark">✳</span>

        <h1>Make time for<br /><span>what you want to learn.</span></h1>
        <p>Save your learning paths, pick up where you left off, and build a habit that lasts.</p>
        <div className="auth-aside-foot"><span>LEARN WITH INTENTION</span><span>✦ &nbsp; KEEP GOING</span></div>
      </section>

      <section className="auth-form-side">
        <div className="auth-card">
          <h2>Create your account</h2>
          <p className="auth-intro">Free forever. Start learning with intention in 30 seconds.</p>

          {error && <p role="alert" className="auth-message auth-error">{error}</p>}
          {message && <p role="status" className="auth-message auth-success">{message}</p>}

          <form action={signInWithGoogle} className="auth-google-form">
            <GoogleAuthButton label="Sign up with Google" />
          </form>

          <div className="auth-divider" aria-hidden="true">
            <span>or sign up with email</span>
          </div>

          <form className="auth-form">
            <label>Email address<input name="email" type="email" required placeholder="you@example.com" autoComplete="email" /></label>
            <label>Password<input name="password" type="password" required minLength={6} placeholder="At least 6 characters" autoComplete="new-password" /></label>
            <button type="submit" formAction={signup} className="auth-submit">
              Create account <ArrowRightIcon size={14} className="inline-block ml-1" />
            </button>
          </form>

          {showResendConfirmation && (
            <form action={resendSignupConfirmation} className="mt-4 border-t border-[#343a42] pt-4 text-center">
              <p className="text-xs text-[#aeb2b8] mb-2">Didn’t receive the email? Check spam or resend:</p>
              <button type="submit" className="button-text text-xs underline font-semibold text-emerald-400">
                Resend confirmation link
              </button>
            </form>
          )}

          <Link href="/login" className="auth-signup-link">
            Already have an account? <strong>Log in</strong> <ArrowRightIcon size={14} className="inline-block ml-1" />
          </Link>
          <p className="auth-footnote">By signing up you agree to learn with intention and finish your courses.</p>
        </div>
      </section>
    </main>
  );
}
