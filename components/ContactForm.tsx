"use client";

import { useState } from "react";
import { MailIcon, InstagramIcon, CopyIcon, CheckIcon, ExternalLinkIcon } from "@/components/Icons";

export default function ContactForm() {
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");

  const supportEmail = "contact.watchlify@gmail.com";
  const instagramHandle = "watchlify_";
  const instagramUrl = "https://instagram.com/watchlify_";

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const subjectPrefix =
      category === "bug"
        ? "[Bug Report]"
        : category === "feature"
        ? "[Feature Suggestion]"
        : category === "course"
        ? "[Course / Playlist Issue]"
        : "[General Question]";

    const fullSubject = encodeURIComponent(`${subjectPrefix} Message from ${name || "a Learner"}`);
    const bodyLines = [
      `Name: ${name || "Not provided"}`,
      `User Email: ${email || "Not provided"}`,
      `Category: ${category}`,
      "",
      "Message:",
      message,
      "",
      "---",
      "Sent via Watchlify Support Portal",
    ].join("\n");

    const mailtoUrl = `mailto:${supportEmail}?subject=${fullSubject}&body=${encodeURIComponent(bodyLines)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="contact-workspace-shell">
      {/* Direct Contact Cards */}
      <div className="contact-cards-grid">
        {/* Email Card */}
        <div className="contact-feature-card email-card">
          <div className="contact-card-icon-wrap email">
            <MailIcon size={24} />
          </div>
          <div className="contact-card-content">
            <div className="contact-card-kicker">EMAIL SUPPORT</div>
            <h3 className="contact-card-title">Write to us directly</h3>
            <p className="contact-card-desc">
              For general questions, bug reports, feature requests, or partnerships. We read every single message.
            </p>
            <div className="contact-action-row">
              <a
                href={`mailto:${supportEmail}`}
                className="contact-pill-primary"
                title="Send email via default client"
              >
                <MailIcon size={16} />
                <span>{supportEmail}</span>
              </a>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="contact-copy-btn"
                aria-label="Copy support email address"
                title="Copy email to clipboard"
              >
                {copied ? (
                  <>
                    <CheckIcon size={14} className="text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="contact-meta-hint">
              ⚡ Typical response time: within 24 to 48 hours
            </div>
          </div>
        </div>

        {/* Instagram Card */}
        <div className="contact-feature-card instagram-card">
          <div className="contact-card-icon-wrap instagram">
            <InstagramIcon size={24} />
          </div>
          <div className="contact-card-content">
            <div className="contact-card-kicker">COMMUNITY & UPDATES</div>
            <h3 className="contact-card-title">Follow on Instagram</h3>
            <p className="contact-card-desc">
              Get product updates, study tips, feature releases, and send quick direct messages to our team.
            </p>
            <div className="contact-action-row">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-pill-instagram"
              >
                <InstagramIcon size={16} />
                <span>@{instagramHandle}</span>
                <ExternalLinkIcon size={13} className="ml-1 opacity-70" />
              </a>
            </div>
            <div className="contact-meta-hint">
              💬 DMs open for quick queries and community feedback
            </div>
          </div>
        </div>
      </div>

      {/* Message Composer Form */}
      <div className="contact-form-container">
        <div className="contact-form-header">
          <div className="eyebrow">
            <span className="eyebrow-dot" /> SEND A MESSAGE
          </div>
          <h2>Quick Support Form</h2>
          <p>
            Fill out the form below to compose your message. Clicking send will open your default email client with your details prefilled.
          </p>
        </div>

        <form onSubmit={handleSendMessage} className="contact-form-body">
          <div className="contact-form-row-2">
            <div className="contact-field-group">
              <label htmlFor="contact-name">Your Name</label>
              <input
                id="contact-name"
                type="text"
                placeholder="e.g. Alex Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="contact-input"
              />
            </div>

            <div className="contact-field-group">
              <label htmlFor="contact-email">Your Email Address</label>
              <input
                id="contact-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="contact-input"
              />
            </div>
          </div>

          <div className="contact-field-group">
            <label htmlFor="contact-category">What can we help you with?</label>
            <select
              id="contact-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="contact-select"
            >
              <option value="general">General Question</option>
              <option value="feature">Feature Request / Idea</option>
              <option value="bug">Bug Report / Technical Issue</option>
              <option value="course">Playlist Import Help</option>
              <option value="other">Other Inquiry</option>
            </select>
          </div>

          <div className="contact-field-group">
            <label htmlFor="contact-message">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea
              id="contact-message"
              required
              rows={5}
              placeholder="Tell us what's on your mind, what went wrong, or what you'd love to see on Watchlify..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="contact-textarea"
            />
          </div>

          <div className="contact-form-footer">
            <button type="submit" className="button-primary">
              <MailIcon size={16} />
              <span>Send Message via Email</span>
            </button>
            <span className="contact-privacy-note">
              No spam guaranteed. We only use your email to respond to your inquiry.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
