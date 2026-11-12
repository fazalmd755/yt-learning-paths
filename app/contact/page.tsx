import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import SiteFooter from "@/components/SiteFooter";
import { LifeBuoyIcon, CheckCircleIcon } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Contact & Support",
  description:
    "Get in touch with the Watchlify team. Email us at contact.watchlify@gmail.com or connect via Instagram @watchlify_ for help, feedback, and questions.",
  alternates: {
    canonical: "/contact",
  },
};

const supportFaqs = [
  {
    q: "Is Watchlify really 100% free?",
    a: "Yes! Watchlify is completely free to use. There are no subscriptions, payment gateways, or credit card requirements. Just sign in with your Google account and organize your courses.",
  },
  {
    q: "How do I import a YouTube playlist into a course?",
    a: "Copy any public or unlisted YouTube playlist URL and paste it into the search/import bar on the homepage or dashboard. Watchlify will automatically fetch lesson titles, order them into a curriculum, and set up your progress tracker.",
  },
  {
    q: "Are my study notes and streaks safe if I switch devices?",
    a: "Yes. When you sign in with Google, your courses, video timestamps, notes, and study streaks are securely synchronized in cloud storage via Supabase, so you can continue learning on your laptop, tablet, or phone.",
  },
  {
    q: "A video says 'Playback on other websites has been disabled by the video owner'. What does this mean?",
    a: "Occasionally, a YouTube creator configures a specific video to disable third-party embedding. Because Watchlify strictly complies with YouTube's official player policies, such videos cannot be embedded. In those cases, Watchlify provides a direct link to watch that lesson on YouTube.",
  },
  {
    q: "How quickly do you reply to support emails?",
    a: "We personally read and respond to emails sent to contact.watchlify@gmail.com typically within 24 to 48 hours. For quick community questions, you can also send a direct message on Instagram @watchlify_.",
  },
];

export default function ContactPage() {
  return (
    <div className="contact-page-shell">
      <main className="contact-main-content">
        {/* Header Section */}
        <header className="contact-hero-header">
          <div className="eyebrow">
            <LifeBuoyIcon size={14} className="text-amber-400" />
            <span>SUPPORT & COMMUNITY</span>
          </div>
          <h1 className="contact-hero-title">
            How can we <span className="text-gradient-brand">help your learning?</span>
          </h1>
          <p className="contact-hero-subtitle">
            Whether you found a bug, want to request a new feature, have a question about your study streaks, or just want to say hi — we&apos;d love to hear from you.
          </p>

          <div className="contact-badges-row">
            <div className="contact-badge-item">
              <CheckCircleIcon size={14} className="text-emerald-400" />
              <span>Fast Human Support</span>
            </div>
            <div className="contact-badge-item">
              <CheckCircleIcon size={14} className="text-emerald-400" />
              <span>100% Free Service</span>
            </div>
            <div className="contact-badge-item">
              <CheckCircleIcon size={14} className="text-emerald-400" />
              <span>Community-Driven</span>
            </div>
          </div>
        </header>

        {/* Contact Form & Direct Action Cards */}
        <ContactForm />

        {/* FAQ Section */}
        <section className="contact-faq-section">
          <div className="section-heading text-center">
            <div className="eyebrow">
              <span className="eyebrow-dot" /> COMMON QUESTIONS
            </div>
            <h2>Quick Answers</h2>
            <p>Find answers to the most common questions before reaching out.</p>
          </div>

          <div className="contact-faq-grid">
            {supportFaqs.map((faq, idx) => (
              <div key={idx} className="contact-faq-card">
                <h3>{faq.q}</h3>
                <p>{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Links Banner */}
        <section className="contact-cta-banner">
          <div>
            <h3>Ready to get back to focused studying?</h3>
            <p>Jump right back into your course playlist or explore community roadmaps.</p>
          </div>
          <div className="cta-banner-buttons">
            <Link href="/dashboard" className="button-primary">
              Open Dashboard
            </Link>
            <Link href="/study-hubs" className="button-text">
              Browse Study Hubs <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Universal Footer */}
      <SiteFooter />
    </div>
  );
}
