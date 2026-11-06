import type { Metadata } from "next";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { signInWithGoogle } from "./actions";

export const metadata: Metadata = {
  title: "Log In",
  description:
    "Log in to Watchlify with Google to continue your learning paths, check your daily streak, and pick up where you left off.",
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
          <h2>Welcome to Watchlify</h2>
          <p className="auth-intro">Sign in with your Google account to access your courses, streak, and personalized learning paths.</p>

          {error && <p role="alert" className="auth-message auth-error">{error}</p>}
          {message && <p role="status" className="auth-message auth-success">{message}</p>}

          <form action={signInWithGoogle} className="auth-google-form mt-4">
            <GoogleAuthButton label="Continue with Google" />
          </form>

          <div className="auth-google-benefits">
            <div className="benefit-item">
              <span className="benefit-star">✦</span>
              <span><strong>Instant 1-Click Access:</strong> No passwords to remember or reset.</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-star">✦</span>
              <span><strong>Google Verified & Safe:</strong> Your learning data and progress stay completely secure.</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-star">✦</span>
              <span><strong>Sync Across Devices:</strong> Resume watching and study planning on any screen.</span>
            </div>
          </div>

          <p className="auth-footnote">Watchlify exclusively uses Google Authentication for safe, hassle-free sign in.</p>
        </div>
      </section>
    </main>
  );
}
