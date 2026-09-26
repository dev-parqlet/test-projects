"use client";

import { useState } from "react";
import { IcClose } from "../icons/IcClose";
import { IcChevronRight } from "../icons/IcChevronRight";
import { StarRating } from "./StarRating";

const FAQS = [
  {
    q: "How do I add or remove a resident?",
    a: "Go to the Resident Directory page and tap 'Add Resident' to invite someone new, or tap the resident's row and select 'Remove' to offboard them. Removed residents immediately lose access to the app.",
  },
  {
    q: "How do I trigger a data sync?",
    a: "Open the Parking page and look for the 'Sync Data' button in the top-right area. This triggers an on-demand sync with your connected property management system (e.g. Yardi, BuildingLink). A change summary will appear after the sync completes.",
  },
  {
    q: "What happens when a booking expires?",
    a: "When a booking window ends, both the booking resident and the spot owner receive an automated push notification confirming expiry. The spot is released back into the availability pool. The resident can also send a one-time reminder if they believe the spot is still occupied.",
  },
  {
    q: "How do I resend an invitation to a resident?",
    a: "In Resident Directory, find the resident and tap their row. You'll see a 'Resend Invitation' option. This sends a new invite email with a unique onboarding link. Previous links are automatically invalidated.",
  },
  {
    q: "Who do I contact if a resident is having trouble with the app?",
    a: "For app-level issues your residents can't resolve on their own, email us at support@parqlet.com with the resident's unit number and a brief description of the issue. Our team typically responds within one business day.",
  },
];

const ISSUE_TYPES = ["Resident Access", "Booking Issue", "Data Sync", "Billing", "Other"];

export function HelpDrawer({ onClose }: { onClose: () => void }) {
  const [openFaq,             setOpenFaq]             = useState<number | null>(null);
  const [issueType,           setIssueType]           = useState(ISSUE_TYPES[0]);
  const [subject,             setSubject]             = useState("");
  const [description,         setDescription]         = useState("");
  const [ticketSubmitted,     setTicketSubmitted]     = useState(false);
  const [rating,              setRating]              = useState(0);
  const [feedbackText,        setFeedbackText]        = useState("");
  const [feedbackSubmitted,   setFeedbackSubmitted]   = useState(false);
  const [dropdownOpen,        setDropdownOpen]        = useState(false);

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box" as const,
    background: "var(--color-fill-white)",
    border: "1px solid var(--color-stroke-medium)",
    borderRadius: "var(--radius-8)",
    padding: "10px 12px",
    fontSize: "var(--font-size-tiny)",
    lineHeight: "var(--line-height-tiny)",
    color: "var(--color-text-strong)",
    fontFamily: "var(--font-family-body)",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "var(--font-size-extra-tiny)",
    color: "var(--color-text-weak)",
    fontFamily: "var(--font-family-body)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    display: "block",
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  };

  const sectionHeading: React.CSSProperties = {
    fontSize: "var(--font-size-tiny)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    color: "var(--color-text-strong)",
    fontFamily: "var(--font-family-body)",
    lineHeight: "var(--line-height-tiny)",
    marginBottom: 12,
  };

  function handleTicketSubmit() {
    if (!subject.trim() || !description.trim()) return;
    setTicketSubmitted(true);
    setSubject(""); setDescription(""); setIssueType(ISSUE_TYPES[0]);
    setTimeout(() => setTicketSubmitted(false), 3000);
  }

  function handleFeedbackSubmit() {
    if (!rating) return;
    setFeedbackSubmitted(true);
    setRating(0); setFeedbackText("");
    setTimeout(() => setFeedbackSubmitted(false), 3000);
  }

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .help-drawer-inner { animation: slideInRight 0.22s cubic-bezier(0.22,1,0.36,1); }
        .help-select:focus { border-color: var(--color-text-accent) !important; }
        .help-input:focus  { border-color: var(--color-text-accent) !important; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.28)", zIndex: 500 }}
      />

      {/* Drawer */}
      <div
        className="help-drawer-inner"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: 420, maxWidth: "100vw",
          background: "var(--color-fill-white)",
          zIndex: 501,
          display: "flex", flexDirection: "column",
          boxShadow: "-2px 0 24px rgba(0,0,0,0.10)",
          fontFamily: "var(--font-family-body)",
        }}
      >
        {/* Drawer header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", height: 64, borderBottom: "1px solid var(--color-stroke-medium)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: "var(--font-size-body)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", lineHeight: "var(--line-height-body)" }}>
            Help &amp; Support
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}
          >
            <IcClose />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 32 }}>

          {/* ── 1. FAQ ── */}
          <section>
            <p style={sectionHeading}>FAQ</p>
            <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-12)", overflow: "hidden" }}>
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? "1px solid var(--color-stroke-medium)" : "none" }}>
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "14px 16px", background: "none", border: "none", cursor: "pointer",
                        textAlign: "left" as const, gap: 8,
                      }}
                    >
                      <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", lineHeight: "var(--line-height-tiny)", fontFamily: "var(--font-family-body)", fontWeight: isOpen ? "var(--font-weight-medium)" : "var(--font-weight-regular)" as React.CSSProperties["fontWeight"] }}>
                        {faq.q}
                      </span>
                      <span style={{ flexShrink: 0, transition: "transform 0.18s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", display: "flex" }}>
                        <IcChevronRight />
                      </span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: "0 16px 14px", fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", lineHeight: "var(--line-height-tiny)", fontFamily: "var(--font-family-body)" }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <div style={{ borderTop: "1px solid var(--color-stroke-medium)" }} />

          {/* ── 2. Submit a Support Ticket ── */}
          <section>
            <p style={sectionHeading}>Submit a Support Ticket</p>
            {ticketSubmitted ? (
              <div style={{ background: "var(--color-tag-active)", borderRadius: "var(--radius-8)", padding: "12px 14px", fontSize: "var(--font-size-tiny)", color: "var(--color-tag-text-active)", fontFamily: "var(--font-family-body)" }}>
                ✓ Ticket submitted. We'll get back to you within one business day.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Issue type */}
                <div>
                  <span style={labelStyle}>Issue Type</span>
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setDropdownOpen((o) => !o)}
                      style={{ ...inputStyle, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                    >
                      <span>{issueType}</span>
                      <span style={{ display: "flex", transition: "transform 0.15s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                    </button>
                    {dropdownOpen && (
                      <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 10, overflow: "hidden" }}>
                        {ISSUE_TYPES.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => { setIssueType(opt); setDropdownOpen(false); }}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 12px", background: opt === issueType ? "var(--color-gray-5)" : "none", border: "none", cursor: "pointer", fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", textAlign: "left" as const }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gray-5)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = opt === issueType ? "var(--color-gray-5)" : "none"; }}
                          >
                            {opt}
                            {opt === issueType && <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 8L6.5 12L13.5 4" stroke="var(--color-text-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <span style={labelStyle}>Subject</span>
                  <input
                    className="help-input"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of the issue"
                    style={inputStyle}
                  />
                </div>

                {/* Description */}
                <div>
                  <span style={labelStyle}>Description</span>
                  <textarea
                    className="help-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue in detail…"
                    rows={4}
                    style={{ ...inputStyle, resize: "none" as const }}
                  />
                </div>

                <button
                  onClick={handleTicketSubmit}
                  disabled={!subject.trim() || !description.trim()}
                  style={{
                    background: subject.trim() && description.trim() ? "var(--color-button-neutral)" : "var(--color-gray-60)",
                    color: "var(--color-text-white)",
                    border: "none", borderRadius: "var(--radius-8)",
                    height: 42, padding: "0 var(--spacing-16)",
                    fontSize: "var(--font-size-body)",
                    lineHeight: "var(--line-height-body)",
                    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                    fontFamily: "var(--font-family-body)",
                    cursor: subject.trim() && description.trim() ? "pointer" : "default",
                    alignSelf: "flex-start",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (subject.trim() && description.trim()) e.currentTarget.style.background = "var(--color-gray-90)"; }}
                  onMouseLeave={(e) => { if (subject.trim() && description.trim()) e.currentTarget.style.background = "var(--color-button-neutral)"; }}
                >
                  Submit ticket
                </button>
              </div>
            )}
          </section>

          <div style={{ borderTop: "1px solid var(--color-stroke-medium)" }} />

          {/* ── 3. Send Feedback ── */}
          <section>
            <p style={sectionHeading}>Send Feedback</p>
            {feedbackSubmitted ? (
              <div style={{ background: "var(--color-tag-active)", borderRadius: "var(--radius-8)", padding: "12px 14px", fontSize: "var(--font-size-tiny)", color: "var(--color-tag-text-active)", fontFamily: "var(--font-family-body)" }}>
                ✓ Thanks for your feedback!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <span style={labelStyle}>How would you rate your experience?</span>
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <div>
                  <span style={labelStyle}>Tell us more (optional)</span>
                  <textarea
                    className="help-input"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="What's working well, or what could be better?"
                    rows={3}
                    style={{ ...inputStyle, resize: "none" as const }}
                  />
                </div>
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={!rating}
                  style={{
                    background: rating ? "var(--color-button-neutral)" : "var(--color-gray-60)",
                    color: "var(--color-text-white)",
                    border: "none", borderRadius: "var(--radius-8)",
                    height: 42, padding: "0 var(--spacing-16)",
                    fontSize: "var(--font-size-body)",
                    lineHeight: "var(--line-height-body)",
                    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                    fontFamily: "var(--font-family-body)",
                    cursor: rating ? "pointer" : "default",
                    alignSelf: "flex-start",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (rating) e.currentTarget.style.background = "var(--color-gray-90)"; }}
                  onMouseLeave={(e) => { if (rating) e.currentTarget.style.background = "var(--color-button-neutral)"; }}
                >
                  Submit feedback
                </button>
              </div>
            )}
          </section>

          <div style={{ borderTop: "1px solid var(--color-stroke-medium)" }} />

          {/* ── 4. Contact ── */}
          <section style={{ paddingBottom: 8 }}>
            <p style={sectionHeading}>Contact</p>
            <p style={{ margin: 0, fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", lineHeight: "var(--line-height-tiny)", fontFamily: "var(--font-family-body)" }}>
              Still need help? Email us at{" "}
              <a
                href="mailto:hello@parqlet.com"
                style={{ color: "var(--color-text-strong)", textDecoration: "underline", textUnderlineOffset: 2 }}
              >
                hello@parqlet.com
              </a>
            </p>
          </section>

        </div>
      </div>
    </>
  );
}