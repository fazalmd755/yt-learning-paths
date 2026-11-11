import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, PlayIcon, SparklesIcon, CheckIcon } from "@/components/Icons";
import { WatchlifyIcon } from "@/components/BrandLogo";
import HeroUrlInput from "@/components/HeroUrlInput";

export const metadata: Metadata = {
  title: "Watchlify — Turn YouTube Playlists into Distraction-Free Courses",
  description:
    "Turn scattered YouTube playlists into organized, distraction-free courses. Strip away recommendations, track exact watch progress, take timestamped notes, and finish what you start.",
  alternates: {
    canonical: "/",
  },
};

const highlights = [
  {
    number: "01",
    title: "Zero-Distraction Player",
    subtitle: "No clickbait sidebars, no infinite shorts",
    description:
      "YouTube is built to distract you with recommendations. Watchlify strips away comments, ads, and suggested feeds — leaving only you, your video, and your course syllabus.",
  },
  {
    number: "02",
    title: "Timestamped Notes & AI Tutor",
    subtitle: "Synced to the exact second of the lesson",
    description:
      "Take rich notes tied to video timestamps. Click any timestamp to jump right back to that concept. Stuck on a difficult topic? Ask the AI tutor for an instant explanation.",
  },
  {
    number: "03",
    title: "Curated Paths & Tree Explorer",
    subtitle: "Playlists organized as collapsible folders",
    description:
      "Combine multiple playlists and single videos into custom learning paths. Uses a VS Code-style tree explorer so you can collapse 50-video playlists and sequence your study roadmap.",
  },
  {
    number: "04",
    title: "Auto-Resume & Daily Streaks",
    subtitle: "Never wonder where you left off",
    description:
      "Your exact second is saved per video across devices. Set a daily goal (15–60 min), watch your streak fire grow on the GitHub-style heatmap, and stay consistent with email reminders.",
  },
];

const faqs = [
  {
    q: "Is Watchlify really 100% free?",
    a: "Yes, Watchlify is completely free to use. There are no paywalls, hidden fees, or credit cards required. Just sign in with your Google account and start organizing your learning.",
  },
  {
    q: "Does this replace my YouTube account?",
    a: "No. Watchlify uses YouTube's official embed player. The creators still get their video views, but you get a clean, focused environment free from toxic comments, shorts, and algorithmic rabbit holes.",
  },
  {
    q: "What happens to my study notes?",
    a: "All your notes are tied to the exact second of the video and securely saved in the cloud. You can revisit them anytime, click timestamps to jump back to that moment, or export all notes to Markdown/text for offline revision.",
  },
  {
    q: "Can I combine multiple playlists and standalone videos?",
    a: "Yes! Watchlify's Learning Paths feature lets you create custom sequences. Playlists appear as clean collapsible folders (like folders in VS Code) alongside individual videos, so you can build complete curriculum roadmaps.",
  },
  {
    q: "How does the study streak and daily goal work?",
    a: "You set a daily target (e.g. 15 or 30 minutes). Every time you watch lessons on Watchlify, your active study time is automatically logged. Reach your goal each day to build your streak on the contribution heatmap.",
  },
];

export default function Home() {
  return (
    <main className="home-shell">
      {/* Hero Section */}
      <section className="hero-shell">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" /> FOCUSED STUDY WORKSPACE · ZERO DISTRACTIONS
          </div>
          <h1 className="hero-title">
            <span>The world&apos;s best education is on YouTube.</span>
            <span className="hero-accent-line"> The worst distractions are too.</span>
          </h1>
          <p className="hero-copy">
            Watchlify strips away clickbait recommendations, infinite shorts, and algorithmic rabbit holes.
            Paste any playlist URL to turn it into an ad-free, trackable course with timestamped notes,
            auto-resume at the exact second, and daily study streaks.
          </p>

          {/* Frictionless Try-It-Now URL Input */}
          <HeroUrlInput />

          <div className="hero-actions">
            <Link href="/login" className="button-primary">
              Start learning for free with Google <ArrowRightIcon size={16} className="inline-block ml-1" />
            </Link>
            <a href="#comparison" className="button-text">
              See the difference <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className="hero-trust-bullets">
            <span><CheckIcon size={14} className="text-emerald-400 inline mr-1" /> 100% Free forever</span>
            <span><CheckIcon size={14} className="text-emerald-400 inline mr-1" /> No credit card needed</span>
            <span><CheckIcon size={14} className="text-emerald-400 inline mr-1" /> Zero algorithmic traps</span>
          </div>

          <div className="home-quick-links">
            <Link href="/syllabus/select">Explore playlists <span aria-hidden="true">↗</span></Link>
            <Link href="/planner">Plan your week <span aria-hidden="true">↗</span></Link>
          </div>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="preview-wrap" aria-label="Learning dashboard preview">
          <div className="preview-glow" />
          <div className="preview-card">
            <div className="preview-topline">
              <div className="preview-brand">
                <WatchlifyIcon size={20} /> Watchlify
              </div>
              <span className="preview-avatar">A</span>
            </div>
            <div className="preview-greeting">TODAY · YOUR STUDY SPACE</div>
            <h2>Make today a learning day.</h2>
            <div className="preview-metrics">
              <div className="preview-metric">
                <span className="metric-icon emerald-icon">✦</span>
                <div>
                  <strong>18 <small>/ 25 min</small></strong>
                  <span>DAILY GOAL</span>
                </div>
              </div>
              <div className="preview-metric">
                <span className="metric-icon fire-icon">🔥</span>
                <div>
                  <strong>7 days</strong>
                  <span>CURRENT STREAK</span>
                </div>
              </div>
            </div>
            <div className="preview-course-label">
              <span>CONTINUE LEARNING</span>
              <span>04 / 12</span>
            </div>
            <div className="preview-course">
              <div className="preview-thumbnail">
                <span>✳</span>
                <small>DESIGN</small>
              </div>
              <div className="preview-course-info">
                <strong>Design systems from scratch</strong>
                <span>Figma & UI fundamentals</span>
                <div className="preview-progress"><i /></div>
                <small>8 videos left · 2h 40m</small>
              </div>
              <span className="preview-play" aria-hidden="true">▶</span>
            </div>
            <div className="preview-week">
              <span>THIS WEEK</span>
              <div>
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                  <i key={`${day}-${i}`} className={i < 4 ? "active" : ""}>
                    {day}
                  </i>
                ))}
              </div>
            </div>
          </div>
          <div className="floating-note">
            <span>✦</span>
            <div>
              <strong>Small daily steps.</strong>
              <small>Unstoppable momentum.</small>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section: YouTube Native vs Watchlify */}
      <section id="comparison" className="home-comparison-section">
        <div className="section-heading text-center">
          <div className="eyebrow"><span className="eyebrow-dot" /> THE PROBLEM & THE SOLUTION</div>
          <h2>
            Why learning on regular YouTube fails.<br />
            <span>And how Watchlify fixes it.</span>
          </h2>
          <p>YouTube is optimized to keep you watching random videos. Watchlify is built to help you finish courses.</p>
        </div>

        <div className="comparison-grid">
          {/* Side A: Regular YouTube */}
          <div className="comparison-card comparison-youtube">
            <div className="comparison-card-header">
              <span className="comparison-card-badge comparison-badge-red">REGULAR YOUTUBE</span>
              <h3>Built to distract you</h3>
              <p>Designed by algorithms to maximize watch time, not course completion.</p>
            </div>
            <ul className="comparison-list">
              <li>
                <span className="comparison-cross">✕</span>
                <div>
                  <strong>Clickbait recommendations</strong>
                  <p>Sidebar packed with distracting videos and infinite shorts.</p>
                </div>
              </li>
              <li>
                <span className="comparison-cross">✕</span>
                <div>
                  <strong>Loses your exact timestamp</strong>
                  <p>Easy to lose your place in a 40-video series when switching devices.</p>
                </div>
              </li>
              <li>
                <span className="comparison-cross">✕</span>
                <div>
                  <strong>No timestamped notes</strong>
                  <p>Forced to write notes in a separate app without video synchronization.</p>
                </div>
              </li>
              <li>
                <span className="comparison-cross">✕</span>
                <div>
                  <strong>Zero habit accountability</strong>
                  <p>No study streaks, no daily goals, and no gentle nudges to keep going.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Side B: Watchlify */}
          <div className="comparison-card comparison-watchlify comparison-watchify">
            <div className="comparison-card-header">
              <span className="comparison-card-badge comparison-badge-green">WATCHLIFY WORKSPACE</span>
              <h3>Built to finish courses</h3>
              <p>A distraction-free, dedicated environment optimized for deep learning.</p>
            </div>
            <ul className="comparison-list">
              <li>
                <span className="comparison-check">✓</span>
                <div>
                  <strong>Pure syllabus view</strong>
                  <p>Zero recommendations, zero comments, zero shorts. Only your lesson sequence.</p>
                </div>
              </li>
              <li>
                <span className="comparison-check">✓</span>
                <div>
                  <strong>Exact second auto-resume</strong>
                  <p>Picks up right where you paused, on any device, automatically.</p>
                </div>
              </li>
              <li>
                <span className="comparison-check">✓</span>
                <div>
                  <strong>Synced timestamp notes & AI tutor</strong>
                  <p>Click any note to jump to that second. Ask AI tutor when you get stuck.</p>
                </div>
              </li>
              <li>
                <span className="comparison-check">✓</span>
                <div>
                  <strong>Daily streaks & email reminders</strong>
                  <p>Set a daily goal (15 min+), track consistency, and build an unbreakable habit.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Concrete Highlights Section */}
      <section id="features" className="how-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-dot" /> EVERYTHING YOU NEED TO FINISH</div>
            <h2>
              Structured learning.<br />
              <span>Zero friction.</span>
            </h2>
          </div>
          <p>Every tool in Watchlify is designed around one goal: helping you complete what you start.</p>
        </div>

        <div className="feature-grid-v2">
          {highlights.map((item) => (
            <article key={item.number} className="feature-card-v2">
              <span className="feature-number-v2">{item.number}</span>
              <div className="feature-card-content">
                <h3>{item.title}</h3>
                <small className="feature-subtitle">{item.subtitle}</small>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Target Audience / Use Cases */}
      <section className="home-usecases-section">
        <div className="section-heading text-center">
          <div className="eyebrow"><span className="eyebrow-dot" /> WHO IT IS BUILT FOR</div>
          <h2>Made for serious self-directed learners</h2>
        </div>
        <div className="usecases-grid">
          <div className="usecase-card">
            <span className="usecase-icon">🎯</span>
            <h3>GATE & Competitive Exams</h3>
            <p>Turn 60-video GATE, JEE, or CS semester crash course playlists into structured roadmaps with daily progress tracking.</p>
          </div>
          <div className="usecase-card">
            <span className="usecase-icon">💻</span>
            <h3>Programmers & Developers</h3>
            <p>Study full-stack frameworks, DSA, and complex architecture series with code-friendly timestamped notes.</p>
          </div>
          <div className="usecase-card">
            <span className="usecase-icon">📚</span>
            <h3>College & Lifelong Learners</h3>
            <p>Replace chaotic bookmarks and unorganized browser tabs with a clean, personal course library.</p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section (Boosts SEO & Answers Objections) */}
      <section id="faqs" className="home-faq-section">
        <div className="section-heading text-center">
          <div className="eyebrow"><span className="eyebrow-dot" /> FREQUENTLY ASKED QUESTIONS</div>
          <h2>Got questions? We have answers.</h2>
          <p>Everything you need to know about learning on Watchlify.</p>
        </div>

        <div className="faq-container">
          {faqs.map((faq, index) => (
            <details key={index} className="faq-item" open={index === 0}>
              <summary className="faq-question">
                <span>{faq.q}</span>
                <span className="faq-chevron" aria-hidden="true">⌄</span>
              </summary>
              <div className="faq-answer">
                <p>{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="closing-cta">
        <div>
          <h2 className="closing-cta-title">
            <span>This time,</span>
            <span className="text-gradient-brand"> you will finish the course.</span>
          </h2>
          <p className="closing-cta-sub">
            Join learners who study with intention on Watchlify. Free forever with your Google account.
          </p>
        </div>
        <Link href="/login" className="button-primary">
          Start learning for free with Google <ArrowRightIcon size={16} className="inline-block ml-1" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-brand">
          <Link href="/" className="brand-link" aria-label="Watchlify Home">
            <WatchlifyIcon size={28} />
            <span className="brand-name">
              Watch<span className="text-gradient-brand">lify</span>
            </span>
          </Link>
          <span>Turn scattered YouTube playlists into distraction-free courses.</span>
        </div>
        <div className="home-footer-links">
          <Link href="/syllabus/select">Playlists</Link>
          <Link href="/planner">Planner</Link>
          <Link href="/settings">Settings</Link>
        </div>
      </footer>
    </main>
  );
}
