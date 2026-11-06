import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { signInWithGoogle } from "../login/actions";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Join Watchify with Google for free. Turn YouTube playlists into structured learning paths with progress tracking and daily streaks.",
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
          <p className="auth-intro">Free forever. Start learning with your Google account in 10 seconds.</p>

          {error && <p role="alert" className="auth-message auth-error">{error}</p>}
          {message && <p role="status" className="auth-message auth-success">{message}</p>}

          <form action={signInWithGoogle} className="auth-google-form mt-4">
            <GoogleAuthButton label="Sign up with Google" />
          </form>

          <div className="auth-google-benefits">
            <div className="benefit-item">
              <span className="benefit-star">✦</span>
              <span><strong>Free forever:</strong> Unlimited learning paths and progress tracking.</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-star">✦</span>
              <span><strong>1-Click Google sign-up:</strong> No passwords to create or remember.</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-star">✦</span>
              <span><strong>Distraction-free:</strong> Watch YouTube lessons without algorithmic rabbit holes.</span>
            </div>
          </div>

          <p className="auth-footnote">By continuing with Google, you agree to learn with intention and complete your goals.</p>
        </div>
      </section>
    </main>
  );
}
