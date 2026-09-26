"use client";

type PolicySection = { heading: string; body: React.ReactNode };

const PRIVACY_SECTIONS: PolicySection[] = [
  {
    heading: "Information We Collect",
    body: (
      <>
        <p>We collect information necessary to operate Parqlet within your building.</p>
        <p>From building management systems (BuildingLink):</p>
        <ul>
          <li>Your name</li>
          <li>Unit number</li>
          <li>Assigned parking spot</li>
          <li>Email address</li>
          <li>Lease expiration date (if applicable)</li>
        </ul>
        <p>From your use of the app:</p>
        <ul>
          <li>Booking activity and logs</li>
          <li>Guest information, including: name and phone number</li>
        </ul>
      </>
    ),
  },
  {
    heading: "How We Use Your Data",
    body: (
      <>
        <p>We use your data to:</p>
        <ul>
          <li>Verify your eligibility to access Parqlet</li>
          <li>Ensure only authorized residents can use the platform</li>
          <li>Enable booking and sharing of parking spots</li>
          <li>Maintain activity logs for operational purposes</li>
          <li>Contact guests in case of parking-related emergencies</li>
        </ul>
        <p>Parqlet is a private, building-only platform. Each building operates in its own secure environment, and only verified residents of that building can access it.</p>
      </>
    ),
  },
  {
    heading: "Data Sharing",
    body: (
      <>
        <p>We may share data with:</p>
        <ul>
          <li>Your HOA or building management</li>
          <li>Service providers that support platform operations</li>
        </ul>
        <p>We do not sell your data.</p>
      </>
    ),
  },
  {
    heading: "Data Retention",
    body: (
      <>
        <p>We retain your data only while your building uses Parqlet as a guest parking service.</p>
        <p>Your data is deleted:</p>
        <ul>
          <li>When your building ends its contract with Parqlet</li>
          <li>When you move out of the building</li>
        </ul>
        <p>We do not retain your data beyond this period.</p>
      </>
    ),
  },
  {
    heading: "Cookies",
    body: <p>We use cookies and analytics tools to improve platform performance and user experience.</p>,
  },
  {
    heading: "Security",
    body: <p>We use encryption and reasonable safeguards to protect your data.</p>,
  },
  {
    heading: "Legal Basis",
    body: (
      <>
        <p>We process your data based on:</p>
        <ul>
          <li>Contractual necessity</li>
          <li>Legitimate interest</li>
          <li>Legal obligations</li>
        </ul>
      </>
    ),
  },
  {
    heading: "International Transfers",
    body: <p>Data may be processed in the United States.</p>,
  },
  {
    heading: "Children",
    body: <p>Parqlet is not intended for individuals under 18.</p>,
  },
  {
    heading: "User Rights",
    body: <p>You may request access, correction, or deletion of your data by contacting: <strong>support@parqlet.com</strong></p>,
  },
  {
    heading: "Governing Law",
    body: <p>This policy is governed by the laws of the State of Texas.</p>,
  },
];

const bodyText: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-family-body)",
  fontSize: "var(--font-size-tiny)",
  color: "var(--color-text-weak)",
  lineHeight: "22px",
};

export function PolicyModal({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "var(--spacing-24)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-fill-white)",
          borderRadius: "var(--radius-16)",
          width: "100%", maxWidth: 600,
          maxHeight: "80vh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 16px 48px rgba(0,0,0,0.16)",
        }}
      >
        {/* Modal header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "var(--spacing-24)",
          borderBottom: "1px solid var(--color-stroke-medium)",
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: "var(--font-size-heading-3)",
            fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
            color: "var(--color-text-strong)",
            fontFamily: "var(--font-family-heading)",
            lineHeight: "var(--line-height-heading-3)",
          }}>
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: "var(--radius-8)",
              color: "var(--color-text-weak)", fontSize: 20, lineHeight: 1,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-fill-weak)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", padding: "var(--spacing-24)", flex: 1 }}>
          {/* Preamble */}
          <p style={{ ...bodyText, marginBottom: "var(--spacing-4)", color: "var(--color-text-weaker)" }}>
            Effective Date: April 21, 2026
          </p>

          {/* Numbered sections */}
          <style>{`
            .policy-body p { margin: 0 0 8px 0; }
            .policy-body ul { margin: 0 0 8px 0; padding-left: 20px; }
            .policy-body li { margin-bottom: 4px; }
          `}</style>
          <div className="policy-body" style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-20)" }}>
            {PRIVACY_SECTIONS.map((section, i) => (
              <div key={i}>
                <p style={{
                  margin: "0 0 var(--spacing-8) 0",
                  fontSize: "var(--font-size-tiny)",
                  fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                  fontFamily: "var(--font-family-body)",
                  lineHeight: "var(--line-height-tiny)",
                  color: "var(--color-text-strong)",
                }}>
                  {i + 1}. {section.heading}
                </p>
                <div style={{ ...bodyText, fontFamily: "var(--font-family-body)" }}>
                  {section.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}