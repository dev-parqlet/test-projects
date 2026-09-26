"use client";

import { useState } from "react";
import { IcClose } from "../icons";
import { colors } from "../ui/chart-utils";

interface DocumentModalProps {
  title: string;
  onClose: () => void;
}

export function DocumentModal({ title, onClose }: DocumentModalProps) {
  const isPrivacy = title === "Privacy Policy";
  const sections = isPrivacy
    ? [
        { heading: "Information We Collect", body: "We collect information you provide directly to us when you create an account, use our services, or communicate with us. This includes your name, email address, unit number, parking spot details, and any other information you choose to provide." },
        { heading: "How We Use Your Information", body: "We use the information we collect to operate, maintain, and improve our services, process bookings and credit transactions, send you technical notices and administrative messages, and respond to your comments and questions." },
        { heading: "Information Sharing", body: "We do not share your personal information with third parties except as described in this policy. We may share information with vendors and service providers who assist in our operations, when required by law, or to protect the rights and safety of our users." },
        { heading: "Data Retention", body: "We retain personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required or permitted by law. Booking records and consent logs are retained for a minimum of 36 months for HOA audit compliance." },
        { heading: "Security", body: "We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. All data is encrypted in transit and at rest using industry-standard protocols." },
        { heading: "Cookies and Tracking", body: "We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or indicate when a cookie is being sent." },
        { heading: "Your Rights", body: "You have the right to access, update, or delete the information we hold about you. You may also object to processing, request restriction, or request portability of your data. Contact your HOA administrator to exercise these rights." },
        { heading: "Changes to This Policy", body: "We may update this Privacy Policy from time to time. We will notify you of any changes by updating the date at the top of this policy and, where appropriate, notifying you by email." },
        { heading: "Contact Us", body: "If you have any questions about this Privacy Policy, please contact your building's HOA administrator or reach out to the Parqlet support team through the platform." },
      ]
    : [
        { heading: "Acceptance of Terms", body: "By accessing or using the Parqlet platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform. Your continued use constitutes acceptance of any updates." },
        { heading: "Eligibility", body: "You must be a verified resident of a Parqlet-enabled building to create an account. Your email address must be registered in the HOA's resident database. Parqlet reserves the right to verify eligibility at any time." },
        { heading: "Platform Use", body: "You agree to use the platform only for lawful purposes and in accordance with these Terms. You may not use the platform in any way that violates applicable law, infringes the rights of others, or interferes with the proper functioning of the service." },
        { heading: "Credit Economy", body: "Credits are non-transferable, building-specific, and have no cash value. Parqlet reserves the right to modify the credit system at any time with reasonable notice. Credits may not be sold, traded, or transferred between accounts." },
        { heading: "Booking Obligations", body: "Residents who book guest parking spots are responsible for their guests' conduct. By confirming a booking, you accept financial responsibility for any damages or violations caused by your guest, as disclosed in the Guest Liability Consent modal." },
        { heading: "Spot Sharing", body: "Spot sharing is voluntary. By listing your spot, you agree to make it available during the specified windows. Parqlet does not guarantee bookings or credit earnings. Spot owners must ensure their spot is free during shared windows." },
        { heading: "Limitation of Liability", body: "To the fullest extent permitted by law, Parqlet shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform or any booking-related dispute between residents." },
        { heading: "Termination", body: "Parqlet may terminate or suspend your account at any time, with or without cause, with or without notice. Upon termination, your right to use the platform will immediately cease and any unused credits will be forfeited." },
        { heading: "Governing Law", body: "These Terms shall be governed by and construed in accordance with the laws of the State of Texas, without regard to its conflict of law provisions." },
      ];

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--spacing-24)",
      }}
    >
      <div
        style={{
          background: "var(--color-fill-white)",
          borderRadius: "var(--radius-24)",
          width: 600,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "var(--font-family-body)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 28px 20px",
            borderBottom: "1px solid var(--color-stroke-medium)",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "var(--font-size-body)",
              fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              color: "var(--color-text-strong)",
              lineHeight: "var(--line-height-body)",
            }}
          >
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              color: "var(--color-icon-strong)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div
          style={{
            overflowY: "auto",
            flex: 1,
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {sections.map((s) => (
            <div key={s.heading} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontSize: "var(--font-size-tiny)",
                  fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                  color: "var(--color-text-strong)",
                  lineHeight: "var(--line-height-tiny)",
                }}
              >
                {s.heading}
              </span>
              <span
                style={{
                  fontSize: "var(--font-size-tiny)",
                  fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                  color: "var(--color-text-weak)",
                  lineHeight: "var(--line-height-tiny)",
                }}
              >
                {s.body}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}