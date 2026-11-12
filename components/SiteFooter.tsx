import Link from "next/link";
import { WatchlifyIcon } from "@/components/BrandLogo";
import { MailIcon, InstagramIcon, ShieldCheckIcon, FileTextIcon, LifeBuoyIcon } from "@/components/Icons";

export default function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-universal-footer" aria-label="Site footer">
      <div className="footer-inner-shell">
        {/* Top grid section */}
        <div className="footer-grid">
          {/* Col 1: Brand & mission */}
          <div className="footer-brand-col">
            <Link href="/" className="brand-link" aria-label="Watchlify Home">
              <WatchlifyIcon size={30} />
              <span className="brand-name">
                Watch<span className="text-gradient-brand">lify</span>
              </span>
            </Link>
            <p className="footer-brand-bio">
              Turn scattered YouTube playlists into organized, distraction-free courses.
              Track your exact progress, take timestamped notes, and build daily study streaks.
            </p>
            <div className="footer-trust-badge">
              <span className="trust-badge-dot" />
              <span>100% Free · No Ads · Open Learning</span>
            </div>
          </div>

          {/* Col 2: Navigation & Learning */}
          <div className="footer-links-col">
            <h3 className="footer-col-title">Learn & Explore</h3>
            <ul className="footer-links-list">
              <li>
                <Link href="/study-hubs">Study Hubs</Link>
              </li>
              <li>
                <Link href="/roadmaps">Curated Roadmaps</Link>
              </li>
              <li>
                <Link href="/syllabus/select">Popular Playlists</Link>
              </li>
              <li>
                <Link href="/planner">Study Planner</Link>
              </li>
              <li>
                <Link href="/dashboard">Student Dashboard</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Trust */}
          <div className="footer-links-col">
            <h3 className="footer-col-title">Trust & Legal</h3>
            <ul className="footer-links-list">
              <li>
                <Link href="/privacy" className="footer-icon-link">
                  <ShieldCheckIcon size={14} className="text-emerald-400" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="footer-icon-link">
                  <FileTextIcon size={14} className="text-sky-400" />
                  <span>Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="footer-icon-link">
                  <LifeBuoyIcon size={14} className="text-amber-400" />
                  <span>Contact & Support</span>
                </Link>
              </li>
              <li>
                <Link href="/#faqs">FAQ</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Social Support */}
          <div className="footer-links-col">
            <h3 className="footer-col-title">Connect & Support</h3>
            <p className="footer-contact-desc">
              Have a question or feedback? We reply directly to learners and educators.
            </p>
            <div className="footer-contact-items">
              <a
                href="mailto:contact.watchlify@gmail.com"
                className="footer-contact-pill"
                title="Send an email to Watchlify support"
              >
                <MailIcon size={15} />
                <span>contact.watchlify@gmail.com</span>
              </a>
              <a
                href="https://instagram.com/watchlify_"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-pill"
                title="Follow Watchlify on Instagram"
              >
                <InstagramIcon size={15} />
                <span>@watchlify_</span>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider" />

        {/* Bottom row */}
        <div className="footer-bottom-row">
          <div className="footer-copyright">
            © {currentYear} Watchlify. Built with intention for curious minds.
          </div>
          <div className="footer-disclaimer">
            Watchlify embeds public videos using YouTube&apos;s standard embed player. YouTube is a trademark of Google LLC.
            Watchlify is an independent open learning tool and is not endorsed by or affiliated with Google LLC.
          </div>
        </div>
      </div>
    </footer>
  );
}
