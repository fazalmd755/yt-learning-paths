import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { ArrowRightIcon } from "@/components/Icons";
import { resendSignupConfirmation, signInWithGoogle, signup } from "../login/actions";

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
          <p className="auth-intro">One account keeps all your courses and learning progress together.</p>

          {error && <p role="alert" className="auth-message auth-error">{error}</p>}
          {message && <p role="status" className="auth-message auth-success">{message}</p>}

          <form action={signInWithGoogle} className="auth-google-form">
            <GoogleAuthButton label="Sign up with Google" />
          </form>

          <div className="auth-divider" aria-hidden="true">
            <span>or sign up with email</span>
          </div>
          {showResendConfirmation && (
            <form action={resendSignupConfirmation} className="resend-confirmation-form">
              <label htmlFor="resend-email">Didn’t receive the email? Send it again.</label>
              <div>
                <input id="resend-email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
                <button type="submit">Resend</button>
              </div>
            </form>
          )}

          <form action={signup} className="auth-form">
            <label htmlFor="signup-email">Email address<input id="signup-email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" /></label>
            <label htmlFor="signup-password">Password<input id="signup-password" name="password" type="password" required minLength={6} placeholder="At least 6 characters" autoComplete="new-password" /></label>
            <button type="submit" className="auth-submit">Create account <ArrowRightIcon size={14} className="inline-block ml-1" /></button>
          </form>

          <p className="auth-footnote">Already have an account? <Link href="/login">Log in</Link></p>
        </div>
      </section>
    </main>
  );
}
