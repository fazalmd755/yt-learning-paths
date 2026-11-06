import Link from "next/link";
import { ArrowRightIcon, PlayIcon, SparklesIcon } from "@/components/Icons";

const highlights = [
  {
    icon: "01",
    title: "Turn playlists into paths",
    description: "Transform any YouTube playlist into a clean, distraction-free syllabus.",
  },
  {
    icon: "02",
    title: "Pick up where you left off",
    description: "Your progress is automatically saved per video so you never lose your place.",
  },
  {
    icon: "03",
    title: "Build a daily study habit",
    description: "Set a daily goal, watch your streak grow, and celebrate consistent progress.",
  },
];

export default function Home() {
  return (
    <main>
      <section className="hero-shell">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" /> Focused Study Workspace
          </div>
          <h1 className="hero-title">
            <span>Learn on YouTube.</span>
            <span className="hero-accent-line">Finish what you start.</span>
          </h1>
          <p className="hero-copy">
            Turn scattered video playlists into structured, trackable courses. Set your daily goal,
            take notes with timestamps, and build real momentum.
          </p>
          <div className="hero-actions">
            <Link href="/login" className="button-primary">
              Start learning for free <ArrowRightIcon size={16} className="inline-block ml-1" />
            </Link>
            <a href="#how-it-works" className="button-text">
              See how it works <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="home-quick-links">
            <Link href="/syllabus/select">Explore playlists <span aria-hidden="true">↗</span></Link>
            <Link href="/planner">Plan your week <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="hero-proof">
            <div className="proof-mark" aria-hidden="true"><span>▶</span></div>
            <p><strong>The same videos you love.</strong> A far better way to learn.</p>
          </div>
        </div>

        <div className="preview-wrap" aria-label="Learning dashboard preview">
          <div className="preview-glow" />
          <div className="preview-card">
            <div className="preview-topline">
              <div className="preview-brand">
                <span className="mini-logo">W</span> Watchify
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
              <span>01 / 12</span>
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
        <div className="hero-index">LEARN WITH INTENTION <span>—</span> 01 / 03</div>
      </section>

      <section id="how-it-works" className="how-section">
        <div className="section-heading">
          <div>
            <h2>
              Getting started is easy.<br />
              <span>Keeping it going is even easier.</span>
            </h2>
          </div>
          <p>From one link to a finished skill, every focused session moves you forward.</p>
        </div>
        <div className="feature-grid">
          {highlights.map((item) => (
            <article key={item.icon} className="feature-card">
              <span className="feature-number">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="feature-arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="closing-cta">
        <div>
          <h2 className="closing-cta-title">
            <span>This time,</span>
            <span className="text-gradient-brand"> you will finish the course.</span>
          </h2>
          <p className="closing-cta-sub">Join learners who study with intention on Watchify.</p>
        </div>
        <Link href="/login" className="button-primary">
          Get started for free <ArrowRightIcon size={16} className="inline-block ml-1" />
        </Link>
      </section>

      <footer className="home-footer">
        <Link href="/" className="brand-link">
          <span className="brand-mark">W</span> Watchify
        </Link>
        <span>Built for curious minds and lifelong learners.</span>
        <div>
          <Link href="/syllabus/select">My playlists</Link>
          <Link href="/planner">Planner</Link>
        </div>
      </footer>
    </main>
  );
}
