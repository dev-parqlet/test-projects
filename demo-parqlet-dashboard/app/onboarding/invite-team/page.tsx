"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { TextButton } from "@/components/text-button";
import { inviteMember } from "@/lib/api/members";
import { useEnrollment, withOnboardingToken as nextOnboardingUrl } from "../useEnrollment";
import { useInviteTeamRows, type InviteRow } from "../useInviteTeamRows";

type RowErrors = Record<number, string>;

// ─── Shared SVGs ───────────────────────────────────────────────────────────────

function IcArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M5 12L11 6M5 12L11 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
      <path d="M10 12C10 12.5304 10.2107 13.0391 10.5858 13.4142C10.9609 13.7893 11.4696 14 12 14C12.5304 14 13.0391 13.7893 13.4142 13.4142C13.7893 13.0391 14 12.5304 14 12C14 11.4696 13.7893 10.9609 13.4142 10.5858C13.0391 10.2107 12.5304 10 12 10C11.4696 10 10.9609 10.2107 10.5858 10.5858C10.2107 10.9609 10 11.4696 10 12Z" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12C18.6 16 15.6 18 12 18C8.4 18 5.4 16 3 12C5.4 8 8.4 6 12 6C15.6 6 18.6 8 21 12Z" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcPrivate() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M11.5 21H7C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V13C5 12.4696 5.21071 11.9609 5.58579 11.5858C5.96086 11.2107 6.46957 11 7 11H17C17.5304 11 18.0391 11.2107 18.4142 11.5858C18.7893 11.9609 19 12.4696 19 13V13.5" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 16C11 16.2652 11.1054 16.5196 11.2929 16.7071C11.4804 16.8946 11.7348 17 12 17C12.2652 17 12.5196 16.8946 12.7071 16.7071C12.8946 16.5196 13 16.2652 13 16C13 15.7348 12.8946 15.4804 12.7071 15.2929C12.5196 15.1054 12.2652 15 12 15C11.7348 15 11.4804 15.1054 11.2929 15.2929C11.1054 15.4804 11 15.7348 11 16Z" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11V7C8 5.93913 8.42143 4.92172 9.17157 4.17157C9.92172 3.42143 10.9391 3 12 3C13.0609 3 14.0783 3.42143 14.8284 4.17157C15.5786 4.92172 16 5.93913 16 7V11" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 19L17 21L21 17" stroke="var(--color-accent-1000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcRemove() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4L12 12M12 4L4 12" stroke="var(--color-text-weak)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IcChevronDown({ open }: { open?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ pointerEvents: "none", flexShrink: 0, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }}
    >
      <path d="M4 6L8 10L12 6" stroke="var(--color-text-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 7L5.5 10.5L12 3.5" stroke="var(--color-text-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Custom role dropdown ───────────────────────────────────────────────────────

function RoleSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [hoveredOpt, setHoveredOpt] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", zIndex: open ? 100 : "auto" }}>
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setFocused(true); }}
        onBlur={() => { if (!open) setFocused(false); }}
        style={{
          width: "100%",
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box" as React.CSSProperties["boxSizing"],
          border: `1px solid ${open || focused ? "var(--color-stroke-strong)" : "var(--color-stroke-medium)"}`,
          borderRadius: "var(--radius-8)",
          padding: "0 var(--spacing-12)",
          fontFamily: "var(--font-family-body)",
          fontSize: "var(--font-size-tiny)",
          color: "var(--color-text-strong)",
          lineHeight: "var(--line-height-tiny)",
          fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          background: "var(--color-fill-white)",
          outline: "none",
          cursor: "pointer",
          transition: "border-color 0.12s",
          textAlign: "left" as React.CSSProperties["textAlign"],
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{value}</span>
        <IcChevronDown open={open} />
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          background: "var(--color-fill-white)",
          borderRadius: "var(--radius-12)",
          border: "1px solid var(--color-stroke-medium)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          overflow: "hidden",
          padding: "4px 0",
        }}>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); setFocused(false); }}
              onMouseEnter={() => setHoveredOpt(opt)}
              onMouseLeave={() => setHoveredOpt(null)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: hoveredOpt === opt ? "var(--color-gray-5)" : "none",
                border: "none",
                fontFamily: "var(--font-family-body)",
                fontSize: "var(--font-size-tiny)",
                lineHeight: "var(--line-height-tiny)",
                fontWeight: opt === value
                  ? "var(--font-weight-medium)" as React.CSSProperties["fontWeight"]
                  : "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                color: "var(--color-text-strong)",
                cursor: "pointer",
                textAlign: "left" as React.CSSProperties["textAlign"],
                transition: "background 0.12s",
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{opt}</span>
              {opt === value && <IcCheck />}
            </button>
          ))}
        </div>
      )}
    </div>
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

const FIELD_BASE: React.CSSProperties = {
  width: "100%",
  height: 40,
  boxSizing: "border-box",
  borderRadius: "var(--radius-8)",
  padding: "12px var(--spacing-12)",
  fontFamily: "var(--font-family-body)",
  fontSize: "var(--font-size-tiny)",
  color: "var(--color-text-strong)",
  lineHeight: "var(--line-height-tiny)",
  fontWeight: "var(--font-weight-regular)",
  background: "var(--color-fill-white)",
  outline: "none",
  transition: "border-color 0.12s",
};

const ROLES = ["Admin", "Lead Concierge", "Concierge", "Security"];

function InviteRowField({
  row,
  isFirst,
  onChange,
  onRemove,
  errorMessage,
}: {
  row: InviteRow;
  isFirst: boolean;
  onChange: (id: number, field: keyof InviteRow, value: string) => void;
  onRemove: (id: number) => void;
  errorMessage?: string;
}) {
  const [emailFocused, setEmailFocused] = React.useState(false);
  const hasError = Boolean(row.emailError) || Boolean(errorMessage);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
      <div style={{ display: "flex", gap: "var(--spacing-8)", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <input
            type="email"
            placeholder="Email"
            value={row.email}
            onChange={(e) => onChange(row.id, "email", e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            style={{
              ...FIELD_BASE,
              border: `1px solid ${
                hasError
                  ? "var(--color-fill-error)"
                  : emailFocused
                  ? "var(--color-stroke-strong)"
                  : "var(--color-stroke-medium)"
              }`,
            }}
          />
        </div>
        <div className="invite-role-col" style={{ width: "180px", flexShrink: 0 }}>
          <RoleSelect
            value={row.role}
            onChange={(v) => onChange(row.id, "role", v)}
            options={ROLES}
          />
        </div>
        <div style={{ width: 24, flexShrink: 0, display: "flex", justifyContent: "center" }}>
          {!isFirst && (
            <button
              onClick={() => onRemove(row.id)}
              style={{
                background: "none",
                border: "none",
                padding: 4,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                borderRadius: "var(--radius-4)",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gray-20)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
              aria-label="Remove row"
            >
              <IcRemove />
            </button>
          )}
        </div>
      </div>
      {errorMessage && (
        <p style={{
          margin: 0,
          fontSize: "var(--font-size-extra-tiny)",
          lineHeight: "var(--line-height-extra-tiny)",
          color: "var(--color-text-error)",
        }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function Step3Page() {
  const router = useRouter();
  const { data: enrollment } = useEnrollment();
  const { rows, setRows, updateRow, removeRow, addRow } = useInviteTeamRows();
  const [globalError, setGlobalError] = React.useState("");
  const [successCount, setSuccessCount] = React.useState<number | null>(null);
  const [rowErrors, setRowErrors] = React.useState<RowErrors>({});
  // Hold the post-send navigation timer so the unmount cleanup effect can
  // cancel it. Without the ref, the "I'll do this later" button's push runs
  // synchronously while the timer fires later and overrides the URL — a race
  // we used to hit before adding this guard.
  const navTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (navTimer.current) clearTimeout(navTimer.current);
  }, []);

  // POST each filled row to /api/members/invite via the existing proxy. We use
  // Promise.allSettled so one bad row doesn't block the others; the per-row
  // outcome is split into successes (rendered in the results block) and
  // failures (rendered as inline row errors).
  const sendInvitesMutation = useMutation({
    mutationFn: async (
      entries: Array<{ id: number; email: string; role: string }>,
    ) => {
      return Promise.allSettled(
        entries.map((e) =>
          inviteMember(e.email, e.role, enrollment?.buildingId, undefined).then(
            (m) => ({
              id: e.id,
              email: e.email,
              enrollmentUrl:
                (m as { enrollmentUrl?: string }).enrollmentUrl ??
                `/onboarding?email=${encodeURIComponent(e.email)}`,
            }),
          ),
        ),
      );
    },
  });

  function handleChange(id: number, field: keyof InviteRow, value: string) {
    updateRow(id, field, value);
    setGlobalError("");
    // Clear any prior per-row error when the user edits a row.
    setRowErrors((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function handleSendAndContinue() {
    const filled = rows.filter((r) => r.email.trim() !== "");

    if (filled.length === 0) {
      // Empty form — nothing to send. Skip directly to the next step. This
      // keeps the wizard a single button regardless of whether the user
      // invited teammates or chose to come back to it later.
      router.push(nextOnboardingUrl("/onboarding/subscription"));
      return;
    }

    const validated = rows.map((r) => ({
      ...r,
      emailError: r.email.trim() !== "" && !isValidEmail(r.email),
    }));
    setRows(validated);

    if (validated.some((r) => r.emailError)) {
      setGlobalError("One or more email addresses are invalid.");
      return;
    }

    setGlobalError("");
    setSuccessCount(null);
    sendInvitesMutation.mutate(
      filled.map((r) => ({ id: r.id, email: r.email.trim(), role: r.role })),
      {
        onSuccess: (results) => {
          const failures: RowErrors = {};
          let successes = 0;
          results.forEach((r, i) => {
            const id = filled[i].id;
            if (r.status === "fulfilled") {
              successes++;
            } else {
              failures[id] = "Couldn't send invite. Please retry.";
            }
          });
          setRowErrors(failures);
          setSuccessCount(successes);
          // Only navigate when at least one invite actually went through. If
          // every row failed, the per-row error banner is the user's signal
          // — moving them forward would hide it and break their retry flow.
          if (successes === 0) {
            setGlobalError("We couldn't send any invites. Check the addresses and retry.");
            return;
          }
          // Brief pause to show "Sent!" before navigating to subscription.
          // Stash the handle in a ref so the unmount cleanup above can cancel
          // it if the user clicks "I'll do this later" in the meantime.
          if (navTimer.current) clearTimeout(navTimer.current);
          navTimer.current = setTimeout(() => {
            router.push(nextOnboardingUrl("/onboarding/subscription"));
          }, 1200);
        },
        onError: () => {
          setGlobalError("We couldn't reach the server. Try again in a moment.");
        },
      },
    );
  }

  const sending = sendInvitesMutation.isPending;
  const hasFilledRows = rows.some((r) => r.email.trim() !== "");
  // The form button is enabled while the mutation isn't in flight. Sending
  // invites requires a known building; routing forward with an empty form
  // doesn't, so only gate on `buildingId` when we actually have rows to send.
  const canContinue = !sending && (!hasFilledRows || !!enrollment?.buildingId);

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
        @media (max-width: 768px) {
          .invite-right-panel { display: none !important; }
          .invite-left-col { padding: var(--spacing-24) var(--spacing-16) !important; }
          .invite-legal { display: none; }
          .invite-role-col { width: 130px !important; }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 1440, display: "flex", alignItems: "stretch" }}>

        {/* ── Left column ───────────────────────────────────────────────────── */}
        <div className="invite-left-col" style={{
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
                onClick={() => router.push(nextOnboardingUrl("/onboarding/import-residents"))}
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
                  Step 3 of 4
                </span>
                <h1 style={{
                  margin: 0,
                  fontSize: "var(--font-size-heading-1)",
                  lineHeight: "var(--line-height-heading-1)",
                  fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                  color: "var(--color-text-strong)",
                  fontFamily: "var(--font-family-heading)",
                }}>
                  Invite your team
                </h1>
                <p style={{
                  margin: 0,
                  fontSize: "var(--font-size-body)",
                  lineHeight: "var(--line-height-body)",
                  fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                  color: "var(--color-text-weak)",
                }}>
                  Add staff who will help manage parking at {enrollment?.buildingName ?? "44 East Avenue"}.
                </p>
              </div>

              {/* Invite rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
                {rows.map((row, i) => (
                  <InviteRowField
                    key={row.id}
                    row={row}
                    isFirst={i === 0}
                    onChange={handleChange}
                    onRemove={removeRow}
                    errorMessage={rowErrors[row.id]}
                  />
                ))}

                {Object.keys(rowErrors).length > 0 && (
                  <p style={{
                    margin: 0,
                    fontSize: "var(--font-size-extra-tiny)",
                    lineHeight: "var(--line-height-extra-tiny)",
                    color: "var(--color-text-error)",
                  }}>
                    {Object.keys(rowErrors).length === 1
                      ? "1 invite couldn't be sent."
                      : `${Object.keys(rowErrors).length} invites couldn't be sent.`}
                  </p>
                )}

                {globalError && (
                  <p style={{
                    margin: 0,
                    fontSize: "var(--font-size-extra-tiny)",
                    lineHeight: "var(--line-height-extra-tiny)",
                    color: "var(--color-text-error)",
                  }}>
                    {globalError}
                  </p>
                )}

                {successCount !== null && successCount > 0 && (
                  <p style={{
                    margin: 0,
                    fontSize: "var(--font-size-extra-tiny)",
                    lineHeight: "var(--line-height-extra-tiny)",
                    color: "var(--color-fill-success)",
                  }}>
                    {successCount} invite{successCount !== 1 ? "s" : ""} sent — taking you to subscription…
                  </p>
                )}

                <div style={{ marginTop: "var(--spacing-4)" }}>
                  <TextButton size="medium" onClick={addRow}>
                    + Add another
                  </TextButton>
                </div>
              </div>

              {/* Actions — single button: send (if any rows) and continue,
                  or just continue (if all rows empty). The user no longer
                  sees the invite URLs on this page; backend invites still
                  fire on Send. */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)", alignItems: "center" }}>
                <button
                  onClick={handleSendAndContinue}
                  disabled={!canContinue}
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
                    cursor: canContinue ? "pointer" : "not-allowed",
                    opacity: canContinue ? 1 : 0.6,
                    fontFamily: "var(--font-family-body)",
                    fontSize: "var(--font-size-heading-3)",
                    lineHeight: "var(--line-height-heading-3)",
                    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                    // Fixed brand color, doesn't invert in dark mode — keep text dark.
                    color: "#222222",
                    transition: "background-color 0.12s",
                  }}
                  onMouseEnter={(e) => { if (canContinue) e.currentTarget.style.backgroundColor = "var(--color-accent-1200)"; }}
                  onMouseLeave={(e) => { if (canContinue) e.currentTarget.style.backgroundColor = "var(--color-button-primary)"; }}
                >
                  {sending
                    ? "Sending…"
                    : hasFilledRows
                      ? "Send invites & continue"
                      : "Continue to subscription"}
                </button>

                <button
                  onClick={() => router.push(nextOnboardingUrl("/onboarding/subscription"))}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontFamily: "var(--font-family-body)",
                    fontSize: "var(--font-size-tiny)",
                    lineHeight: "var(--line-height-tiny)",
                    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                    color: "var(--color-text-strong)",
                    textDecoration: "none",
                    textDecorationSkipInk: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = "underline";
                    e.currentTarget.style.color = "var(--color-gray-90)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = "none";
                    e.currentTarget.style.color = "var(--color-text-strong)";
                  }}
                >
                  I&apos;ll do this later
                </button>
              </div>

            </div>
          </div>

          {/* Legal */}
          <p className="invite-legal" style={{
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
        <div className="invite-right-panel" style={{
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
