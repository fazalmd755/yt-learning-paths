import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { FileTextIcon, MailIcon, InstagramIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the Terms of Service for using Watchlify, an open, distraction-free study workspace for YouTube courses and playlists.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsOfServicePage() {
  const lastUpdated = "November 12, 2026";

  return (
    <div className="legal-page-shell">
      <main className="legal-content-container">
        {/* Header */}
        <header className="legal-header">
          <div className="eyebrow">
            <FileTextIcon size={14} className="text-sky-400" />
            <span>LEGAL & POLICIES</span>
          </div>
          <h1 className="legal-title">Terms of Service</h1>
          <p className="legal-meta">
            Last updated: <strong>{lastUpdated}</strong> · Effective immediately
          </p>
        </header>

        {/* TL;DR Callout Box */}
        <div className="legal-highlight-box">
          <div className="highlight-box-title">
            <span>⚡ Summary in Plain English (TL;DR)</span>
          </div>
          <ul className="highlight-box-list">
            <li>
              <strong>Free Educational Service:</strong> Watchlify is completely free to use. There are no fees, credit card requirements, or payment gateways.
            </li>
            <li>
              <strong>Educational Tool:</strong> Watchlify provides an interface to organize publicly accessible YouTube playlists into structured study courses.
            </li>
            <li>
              <strong>YouTube Compliance:</strong> All video content is owned by its respective creators and streamed via official YouTube embed players.
            </li>
            <li>
              <strong>Respect & Security:</strong> Do not abuse the service or attempt unauthorized access. Your study data and notes remain yours.
            </li>
          </ul>
        </div>

        {/* Article Body */}
        <article className="legal-article">
          <section className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using <strong>Watchlify</strong> (accessible at{" "}
              <Link href="/" className="legal-link">
                https://watchlify.online
              </Link>
              ), you agree to be bound by these Terms of Service (&quot;Terms&quot;) and all applicable laws and regulations.
              If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Description of the Service</h2>
            <p>
              Watchlify is an online study platform designed to transform scattered YouTube playlists and educational videos into distraction-free, trackable courses. Key features include:
            </p>
            <ul>
              <li>Organizing YouTube playlists into sequenced modules and lessons.</li>
              <li>Saving video playback progress down to the exact second across devices.</li>
              <li>Creating timestamped study notes and bookmarks tied to specific moments in lessons.</li>
              <li>Setting daily study targets, maintaining consistency streaks, and generating weekly study plans.</li>
              <li>Curating learning roadmaps and collaborative study hubs.</li>
            </ul>
            <p>
              <strong>100% Free Access:</strong> Watchlify is provided completely free of charge. We do not require payment gateway transactions, subscriptions, or credit card billing to use the service.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. YouTube Content & Intellectual Property</h2>
            <p>
              Watchlify does not host, store, download, or re-transmit any video or audio files. All video playback occurs via the official YouTube embedded player in accordance with the{" "}
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="legal-link"
              >
                YouTube Terms of Service
              </a>
              .
            </p>
            <ul>
              <li>
                All copyrights, trademarks, video content, channel branding, and audio rights remain the exclusive property of their respective creators and YouTube / Google LLC.
              </li>
              <li>
                Watchlify does not bypass YouTube video restrictions, geoblocks, or publisher-disabled embed settings.
              </li>
              <li>
                YouTube is a registered trademark of Google LLC. Watchlify is an independent open learning productivity workspace and is not affiliated with, sponsored by, or endorsed by Google LLC or YouTube.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. User Accounts & Security</h2>
            <p>
              To access personalized study features (such as saving course progress, writing notes, and maintaining streaks), you may sign in using your Google account via our authentication provider (Supabase).
            </p>
            <ul>
              <li>You are responsible for maintaining the security of your Google account credentials.</li>
              <li>You agree to notify us immediately of any unauthorized use of your account.</li>
              <li>You must provide accurate, non-misleading profile information.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. User-Generated Content & Notes</h2>
            <p>
              Any notes, timestamps, custom syllabus hierarchies, or study roadmap descriptions created by you remain your property.
            </p>
            <ul>
              <li>
                By submitting notes or study roadmap details, you grant Watchlify a limited license to store, format, and display that content solely for the purpose of operating the service for you.
              </li>
              <li>
                You may export your notes at any time in standard text or Markdown format.
              </li>
              <li>
                You agree not to post or share content that is illegal, defamatory, infringing on intellectual property, or harmful to other users.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Acceptable Use Policy</h2>
            <p>When using Watchlify, you agree NOT to:</p>
            <ul>
              <li>Attempt to scrape, reverse engineer, decompile, or extract source code from the platform.</li>
              <li>Interfere with, damage, or disrupt the integrity or performance of the servers, databases, or networks.</li>
              <li>Use automated scripts, bots, or scrapers to generate artificial views, streaks, or database queries.</li>
              <li>Impersonate any person, brand, educator, or entity.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Disclaimer of Warranties</h2>
            <p>
              Watchlify is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis, without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
            <p>
              We do not warrant that the service will be uninterrupted, error-free, completely secure, or that YouTube will maintain the availability of specific videos or playlists embedded on the site.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, in no event shall Watchlify, its creators, or contributors be liable for any direct, indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service, including data loss or study interruption.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate access to our service immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms. You may also stop using the service and request account deletion at any time.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Changes to These Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. Any changes will be posted on this page with an updated &quot;Last updated&quot; date. By continuing to access or use our service after revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Contact Information</h2>
            <p>
              If you have any questions or comments regarding these Terms of Service, please contact us:
            </p>
            <div className="legal-contact-card">
              <div className="contact-line">
                <MailIcon size={16} />
                <span>
                  Email:{" "}
                  <a href="mailto:contact.watchlify@gmail.com" className="legal-link">
                    contact.watchlify@gmail.com
                  </a>
                </span>
              </div>
              <div className="contact-line">
                <InstagramIcon size={16} />
                <span>
                  Instagram:{" "}
                  <a
                    href="https://instagram.com/watchlify_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="legal-link"
                  >
                    @watchlify_
                  </a>
                </span>
              </div>
            </div>
          </section>
        </article>
      </main>

      {/* Universal Footer */}
      <SiteFooter />
    </div>
  );
}
