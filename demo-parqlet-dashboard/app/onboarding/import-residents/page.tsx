"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEnrollment, withOnboardingToken as nextOnboardingUrl } from "../useEnrollment";
import { useImportChoice, type ImportChoice } from "../useImportChoice";

// ─── SVGs ──────────────────────────────────────────────────────────────────────

function IcOrganized() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 6L12 10L20 6L12 2Z" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 10L12 14L20 10" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 18L12 22L20 18" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 14L12 18L20 14" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcEye() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M10 12C10 12.5304 10.2107 13.0391 10.5858 13.4142C10.9609 13.7893 11.4696 14 12 14C12.5304 14 13.0391 13.7893 13.4142 13.4142C13.7893 13.0391 14 12.5304 14 12C14 11.4696 13.7893 10.9609 13.4142 10.5858C13.0391 10.2107 11.4696 11.4696 11 11.4696C10 11.4696 10.2107 10.9609 10.5858 10.5858C10.9609 10.2107 11.4696 10 12 10C11.4696 10 10.9609 10.2107 10.5858 10.5858C10.2107 10.9609 10 11.4696 10 12Z" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12C18.6 16 15.6 18 12 18C8.4 18 5.4 16 3 12C5.4 8 8.4 6 12 6C15.6 6 18.6 8 21 12Z" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcPrivate() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M11.5 21H7C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V13C5 12.4696 5.21071 11.9609 5.58579 11.5858C5.96086 11.2107 6.46957 11 7 11H17C17.5304 11 18.0391 11.2107 18.4142 11.5858C18.7893 12.0391 19 12.4696 19 13V13.5" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 16C11 16.2652 11.1054 16.5196 11.2929 16.7071C11.4804 16.8946 11.7348 17 12 17C12.2652 17 12.5196 16.8946 12.7071 16.7071C12.8946 16.5196 13 16.2652 13 16C13 15.7348 12.8946 15.4804 12.7071 15.2929C12.5196 15.1054 12.2652 15 12 15C11.7348 15 11.4804 15.1054 11.2929 15.2929C11.1054 15.4804 11 15.7348 11 16Z" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11V7C8 5.93913 8.42143 4.92172 9.17157 4.17157C9.92172 3.42143 10.9391 3 12 3C13.0609 3 14.0783 3.42143 14.8284 4.17157C15.5786 4.92172 16 5.93913 16 7V11" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 19L17 21L21 17" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M5 12L11 6M5 12L11 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FeatureItem({ icon, label, sublabel }: { icon: React.ReactNode; label: string; sublabel: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--spacing-8)", width: 110 }}>
      <div style={{ width: 24, height: 24, flexShrink: 0 }}>{icon}</div>
      <p style={{ margin: 0, fontFamily: "var(--font-family-body)", textAlign: "center", color: "var(--color-text-white)" }}>
        <span style={{ display: "block", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)", lineHeight: "var(--line-height-tiny)" }}>{label}</span>
        <span style={{ display: "block", fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)", lineHeight: "var(--line-height-extra-tiny)" }}>{sublabel}</span>
      </p>
    </div>
  );
}

function MethodOption({
  selected,
  onSelect,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onSelect(); } }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--spacing-12)",
        padding: "var(--spacing-20)",
        border: `1.5px solid ${selected ? "var(--color-accent-1000)" : "var(--color-stroke-medium)"}`,
        borderRadius: "var(--radius-12)",
        background: selected ? "var(--color-accent-50)" : "var(--color-fill-white)",
        cursor: "pointer",
        outline: "none",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      {/* Radio indicator */}
      <div style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        flexShrink: 0,
        marginTop: 1,
        border: `1.5px solid ${selected ? "var(--color-text-strong)" : "var(--color-stroke-strong)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "border-color 0.15s",
      }}>
        {selected && (
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-text-strong)" }} />
        )}
      </div>
      {/* Copy */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <span style={{
          fontSize: "var(--font-size-body)",
          lineHeight: "var(--line-height-body)",
          fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
          color: "var(--color-text-strong)",
        }}>
          {title}
        </span>
        <span style={{
          fontSize: "var(--font-size-tiny)",
          lineHeight: "var(--line-height-tiny)",
          fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          color: "var(--color-text-weak)",
        }}>
          {description}
        </span>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Step2Page() {
  const router = useRouter();
  useEnrollment();

  const { choice, setChoice } = useImportChoice();
  // Radio's local UI state — seeded from the hook on first render, then
  // re-synced whenever a hydrated `choice` resolves (e.g. after the
  // sessionStorage read in useImportChoice's initialData). Without the
  // effect, a hard refresh on this page would leave the radio on its
  // initial value if the cache hydrated async.
  const [method, setMethod] = React.useState<ImportChoice>(choice ?? "bms");
  useEffect(() => {
    if (choice !== null) setMethod(choice);
  }, [choice]);

  function handleContinue() {
    // Record the bms/upload preference. setChoice writes to QueryClient +
    // sessionStorage and fires the import-preference POST fire-and-forget
    // (failures are swallowed in useImportChoice), so navigation must never
    // wait on it — we don't gate on isPending.
    setChoice(method);
    // Manual upload now happens later on the Settings page, so both choices
    // advance straight to step 3 (invite team).
    router.push(nextOnboardingUrl("/onboarding/invite-team"));
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--color-fill-weak)",
      fontFamily: "var(--font-family-body)",
      display: "flex",
      justifyContent: "center",
    }}>
      <style>{`
        @keyframes ambientA {
          from { opacity: 1;    transform: translate(0px,   0px);   }
          to   { opacity: 0.04; transform: translate(-18px, -14px); }
        }
        @keyframes ambientB {
          from { opacity: 0.04; transform: translate(0px,  0px);  }
          to   { opacity: 1;    transform: translate(18px, 14px); }
        }
        .import-btn-primary:hover:not(:disabled) { background-color: var(--color-accent-1200) !important; }
        @media (max-width: 768px) {
          .import-right-panel { display: none !important; }
          .import-left-col { padding: var(--spacing-24) var(--spacing-16) !important; }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 1440, display: "flex", alignItems: "stretch" }}>

        {/* ── Left column ───────────────────────────────────────────────────── */}
        <div className="import-left-col" style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "var(--spacing-48) var(--spacing-56)",
          minWidth: 0,
        }}>

          {/* Logo + client */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-24)" }}>
            <img
              src="/onboarding/logo-dark.svg"
              alt="Parqlet"
              style={{ display: "block", height: 26, width: "auto", alignSelf: "flex-start", filter: "var(--logo-dark-filter)" }}
            />
          </div>

          {/* Content — vertically centered */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 420 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-32)" }}>

              {/* Back — text link with arrow */}
              <button
                onClick={() => router.push(nextOnboardingUrl("/onboarding/setup-account"))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-8)",
                  alignSelf: "flex-start",
                  background: "none",
                  border: "none",
                  padding: 0,
                  margin: 0,
                  cursor: "pointer",
                  fontFamily: "var(--font-family-body)",
                  fontSize: "var(--font-size-body)",
                  lineHeight: "var(--line-height-body)",
                  fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                  color: "var(--color-text-weak)",
                  transition: "color 0.12s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-strong)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-weak)"; }}
              >
                <IcArrowLeft />
                Back
              </button>

              {/* Step + heading + subcopy */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
                <span style={{
                  fontSize: "var(--font-size-tiny)",
                  lineHeight: "var(--line-height-tiny)",
                  fontWeight: "var(--font-weight-regular)",
                  color: "var(--color-text-weak)",
                }}>
                  Step 2 of 4
                </span>
                <h1 style={{
                  margin: 0,
                  fontSize: "var(--font-size-heading-1)",
                  lineHeight: "var(--line-height-heading-1)",
                  fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                  color: "var(--color-text-strong)",
                  fontFamily: "var(--font-family-heading)",
                }}>
                  Indicate resident import type
                </h1>
                <p style={{
                  margin: 0,
                  fontSize: "var(--font-size-body)",
                  lineHeight: "var(--line-height-body)",
                  fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                  color: "var(--color-text-weak)",
                }}>
                  How would you like to add your resident list? You can change this later.
                </p>
              </div>

              {/* Import method options */}
              <div role="radiogroup" style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)" }}>
                <MethodOption
                  selected={method === "bms"}
                  onSelect={() => setMethod("bms")}
                  title="Connect to your building management system"
                  description="We'll sync your resident list automatically via API or secure file transfer. Our team helps you set this up."
                />
                <MethodOption
                  selected={method === "upload"}
                  onSelect={() => setMethod("upload")}
                  title="Upload a file myself"
                  description="Import your resident list from an Excel (.xlsx) or CSV file. We'll provide a template."
                />
              </div>

              {/* BMS key — moved to the Building Create modal; see
                  app/components/buildings/BuildingCreateModal.tsx */}

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
                {/* Continue — Primary Large, full width */}
                <button
                  className="import-btn-primary"
                  onClick={handleContinue}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: 56,
                    padding: "0 var(--spacing-16)",
                    backgroundColor: "var(--color-button-primary)",
                    border: "none",
                    borderRadius: "var(--radius-8)",
                    cursor: "pointer",
                    fontFamily: "var(--font-family-body)",
                    fontSize: "var(--font-size-heading-3)",
                    lineHeight: "var(--line-height-heading-3)",
                    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                    // Fixed brand color, doesn't invert in dark mode — keep text dark.
                    color: "#222222",
                    transition: "background-color 0.12s",
                  }}
                >
                  Continue
                </button>

                {/* Skip — link text underneath */}
                <button
                  onClick={() => router.push(nextOnboardingUrl("/onboarding/invite-team"))}
                  style={{
                    alignSelf: "center",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontFamily: "var(--font-family-body)",
                    fontSize: "var(--font-size-tiny)",
                    lineHeight: "var(--line-height-tiny)",
                    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                    color: "var(--color-text-weak)",
                    textDecoration: "underline",
                    textUnderlineOffset: 2,
                    transition: "color 0.12s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-strong)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-weak)"; }}
                >
                  I&apos;ll do this later
                </button>
              </div>

            </div>
          </div>

          {/* Legal */}
          <p style={{
            margin: 0,
            fontSize: "var(--font-size-tiny)",
            lineHeight: "var(--line-height-tiny)",
            fontWeight: "var(--font-weight-regular)",
            color: "var(--color-text-weak)",
            maxWidth: 420,
          }}>
            By continuing, you agree to our{" "}
            <a href="https://parqlet-terms-and-privacy.notion.site/Terms-of-Service-35d38574a76480228d7bc194bc23c6de" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-text-link)", fontWeight: "var(--font-weight-medium)", textDecoration: "underline", textUnderlineOffset: 2 }}>
              Terms of Service
            </a>
            {" "}and{" "}
            <a href="https://parqlet-terms-and-privacy.notion.site/Privacy-Policy-35d38574a76480a0be27c1cac5735ebe" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-text-link)", fontWeight: "var(--font-weight-medium)", textDecoration: "underline", textUnderlineOffset: 2 }}>
              Privacy Policy
            </a>
          </p>
        </div>

        {/* ── Right column ─────────────────────────────────────────────────── */}
        <div className="import-right-panel" style={{
          width: 664,
          flexShrink: 0,
          padding: "var(--spacing-48)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: "var(--radius-20)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--color-fill-strong)",
          }}>
            <div style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
              `,
              backgroundSize: "32px 32px",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
            }} />
            <div style={{
              position: "absolute",
              inset: 0,
              background: `
                radial-gradient(ellipse 90% 70% at 0% 100%, #B8C231 0%, transparent 65%),
                radial-gradient(ellipse 90% 70% at 100% 0%, #EA7D0B 0%, transparent 65%)
              `,
              mixBlendMode: "screen",
              opacity: 0.9,
            }} />
            <div style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(20,20,20,1) 30%, rgba(20,20,20,0.68) 100%)",
            }} />
            <div style={{
              position: "absolute", inset: 0, filter: "blur(40px)",
              background: `
                radial-gradient(ellipse 130% 110% at 112% -8%, rgba(20,20,20,0.95) 0%, transparent 58%),
                radial-gradient(ellipse 130% 110% at -12% 108%, rgba(20,20,20,0.95) 0%, transparent 58%)
              `,
              animation: "ambientA 2.2s ease-in-out infinite alternate",
            }} />
            <div style={{
              position: "absolute", inset: 0, filter: "blur(40px)",
              background: `
                radial-gradient(ellipse 130% 110% at -12% -8%, rgba(20,20,20,0.95) 0%, transparent 58%),
                radial-gradient(ellipse 130% 110% at 112% 108%, rgba(20,20,20,0.95) 0%, transparent 58%)
              `,
              animation: "ambientB 2.2s ease-in-out infinite alternate",
            }} />
            <div style={{
              position: "relative", zIndex: 1,
              display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--spacing-96)",
            }}>
              <FeatureItem icon={<IcOrganized />} label="Organized" sublabel="guest parking" />
              <FeatureItem icon={<IcEye />} label="Real-time" sublabel="visibility" />
              <FeatureItem icon={<IcPrivate />} label="Private building" sublabel="environment" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
