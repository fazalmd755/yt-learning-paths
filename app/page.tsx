import Link from "next/link";
import { ArrowRightIcon, PlayIcon, SparklesIcon } from "@/components/Icons";

const highlights = [
  {
    icon: "01",
    title: "Turn playlists into paths",
    description: "Transform any YouTube playlist into a clean, organized course.",
  },
  {
    icon: "02",
    title: "Pick up where you left off",
    description: "Your progress is saved for every video, so you can jump right back in.",
  },
  {
    icon: "03",
    title: "Build a daily learning habit",
    description: "Set a daily goal, grow your streak, and celebrate showing up consistently.",
  },
];

export default function Home() {
  return (
    <main>
      <section className="hero-shell">
        <div className="hero-content">
          <div className="pixel-badge">
            <span className="pixel-badge-dot" /> AI-POWERED STUDY TRACKER
          </div>
          <h1 className="hero-display-title">
            <span className="hero-display-line">LEARN ON YOUTUBE</span>
            <span className="hero-display-pixel">WATCHIFY</span>
            <span className="hero-display-line hero-display-accent">FINISH WHAT YOU START</span>
          </h1>
          <p className="hero-copy">
            Turn scattered playlists into a personal learning plan. Track your progress,
            reach your daily goal, and finish what you started.
          </p>
          <div className="hero-actions">
            <Link href="/login" className="button-primary">
              Create your learning path <ArrowRightIcon size={16} className="inline-block ml-1" />
            </Link>
            <a href="#how-it-works" className="button-text">How it works <span aria-hidden="true">↓</span></a>
          </div>
          <div className="home-quick-links">
            <Link href="/syllabus/select">See my playlists <span aria-hidden="true">↗</span></Link>
            <Link href="/planner">Plan your week <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="hero-proof">
            <div className="proof-mark" aria-hidden="true"><span>▶</span></div>
            <p><strong>Same videos.</strong> A better way to learn.</p>
          </div>
        </div>

        <div className="preview-wrap" aria-label="Learning dashboard preview">
          <div className="preview-glow" />
          <div className="preview-card">
            <div className="preview-topline">
              <div className="preview-brand"><span className="mini-logo">W</span> WATCHIFY</div>
              <span className="preview-avatar">A</span>
            </div>
            <div className="preview-greeting">TODAY · YOUR STUDY SPACE</div>
            <h2>Make today a learning day.</h2>
            <div className="preview-metrics">
              <div className="preview-metric">
                <span className="metric-icon lime-icon">✦</span>
                <div><strong>18 <small>/ 25 min</small></strong><span>DAILY GOAL</span></div>
              </div>
              <div className="preview-metric">
                <span className="metric-icon orange-icon">↗</span>
                <div><strong>7 days</strong><span>CURRENT STREAK</span></div>
              </div>
            </div>
            <div className="preview-course-label"><span>CONTINUE LEARNING</span><span>01 / 12</span></div>
            <div className="preview-course">
              <div className="preview-thumbnail"><span>✳</span><small>DESIGN</small></div>
              <div className="preview-course-info">
                <strong>Design systems from scratch</strong>
                <span>Figma & UI fundamentals</span>
                <div className="preview-progress"><i /></div>
                <small>8 videos left · 2h 40m</small>
              </div>
              <span className="preview-play" aria-hidden="true">▶</span>
            </div>
            <div className="preview-week">
              <span>YOUR WEEK</span>
              <div>{["M", "T", "W", "T", "F", "S", "S"].map((day, i) => <i key={`${day}-${i}`} className={i < 4 ? "active" : ""}>{day}</i>)}</div>
            </div>
          </div>
          <div className="floating-note"><span>✦</span><div><strong>Small steps.</strong><small>Big momentum.</small></div></div>
        </div>
        <div className="hero-index">LEARN AT YOUR OWN PACE <span>—</span> 01 / 03</div>
      </section>

      <section id="how-it-works" className="how-section">
        <div className="section-heading">
          <div><h2>Getting started is easy.<br /><span>Keeping it going is easier.</span></h2></div>
          <p>From one link to a new skill, every small step counts.</p>
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
          <h2 className="hero-display-title">
            <span className="hero-display-line" style={{ fontSize: "clamp(34px, 5.5vw, 62px)" }}>THIS TIME,</span>
            <span className="hero-display-pixel" style={{ fontSize: "clamp(30px, 4.8vw, 54px)" }}>YOU WILL FINISH</span>
            <span className="hero-display-line hero-display-accent" style={{ fontSize: "clamp(34px, 5.5vw, 62px)" }}>THE COURSE</span>
          </h2>
        </div>
        <Link href="/login" className="button-primary">Let’s get started <ArrowRightIcon size={16} className="inline-block ml-1" /></Link>
      </section>
      <footer className="home-footer"><Link href="/" className="brand-link"><span className="brand-mark">W</span> Watchify</Link><span>Made for curious minds.</span><div><Link href="/syllabus/select">My playlists</Link><Link href="/planner">Planner</Link></div></footer>
    </main>
  );
}
