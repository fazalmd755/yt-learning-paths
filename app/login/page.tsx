import type { Metadata } from "next";
import Link from "next/link";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { ArrowRightIcon } from "@/components/Icons";
import { login, signInWithGoogle } from "./actions";

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Log in to Watchify to continue your learning paths, check your daily streak, and pick up where you left off.",
  alternates: {
    canonical: "/login",
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  return (
    <main className="auth-page">
      <section className="auth-aside">
        <span className="auth-aside-mark">✳</span>
        <h1>Learn what you love,<br /><span>at your own pace.</span></h1>
        <p>Turn your YouTube playlists into learning paths. Every session saved, every milestone yours.</p>
        <div className="auth-aside-foot"><span>LEARN WITH INTENTION</span><span>KEEP GOING</span></div>
      </section>
      <section className="auth-form-side">
        <div className="auth-card">
          <h2>Log in or sign up</h2>
          <p className="auth-intro">Keep your progress in one place and pick up right where you left off.</p>

          {error && <p role="alert" className="auth-message auth-error">{error}</p>}
          {message && <p role="status" className="auth-message auth-success">{message}</p>}

          <form action={signInWithGoogle} className="auth-google-form">
            <GoogleAuthButton label="Continue with Google" />
          </form>

          <div className="auth-divider" aria-hidden="true">
            <span>or continue with email</span>
          </div>

          <form className="auth-form">
            <label>Email address<input name="email" type="email" required placeholder="you@example.com" autoComplete="email" /></label>
            <label>Password<input name="password" type="password" required minLength={6} placeholder="At least 6 characters" autoComplete="current-password" /></label>
            <button type="submit" formAction={login} className="auth-submit">
              Log in <ArrowRightIcon size={14} className="inline-block ml-1" />
            </button>
          </form>

          <Link href="/signup" className="auth-signup-link">
            New here? <strong>Create an account</strong> <ArrowRightIcon size={14} className="inline-block ml-1" />
          </Link>
          <p className="auth-footnote">Create an account to save your learning paths and progress.</p>
        </div>
      </section>
    </main>
  );
}
