"use client";

import React from "react";
import {
  ACH_INSTRUCTIONS,
  formatAddress,
  formatRoutingNumber,
} from "@/lib/ach-instructions";

/**
 * Full ACH bank transfer instructions for the onboarding wizard's
 * "Continue with ACH" step. Renders the receiving account (Mercury via
 * Column N.A.), beneficiary, and the building's remittance reference so
 * the HOA can complete the transfer from their bank portal.
 *
 * The dashboard is fully self-contained for ACH — it does NOT call any
 * Mercury API. The transfer is verified manually by finance once the
 * funds land.
 */

export function AchInstructionsDisplay({
  remittanceReference,
  amount,
}: {
  /** Per-building memo the HOA must put on the wire so we can match it. */
  remittanceReference: string;
  /** Monthly amount to send, formatted as "$500". */
  amount: string;
}) {
  const [copied, setCopied] = React.useState<string | null>(null);

  // Keep the timeout handle so we can clear it on unmount; otherwise the
  // 1.6s "Copied" reset can fire after the component is gone and try to
  // setState on a dead instance, logging a React warning in dev.
  const copyTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
    };
  }, []);

  function copy(value: string, label: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(label);
      if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        setCopied(null);
        copyTimerRef.current = null;
      }, 1600);
    });
  }

  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "column",
        gap:           "var(--spacing-20)",
      }}
    >
      {/* Banner */}
      <div
        style={{
          display:       "flex",
          alignItems:    "flex-start",
          gap:           10,
          padding:       "12px 14px",
          background:    "var(--color-fill-weak)",
          border:        "1px solid var(--color-divider-neutral)",
          borderRadius:  "var(--radius-8)",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          style={{ flexShrink: 0, marginTop: 1 }}
        >
          <circle cx="12" cy="12" r="9" stroke="var(--color-text-weak)" strokeWidth="1.5" />
          <path d="M12 8v1M12 11v5" stroke="var(--color-text-weak)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span
            style={{
              fontFamily: "var(--font-family-body)",
              fontSize:   "var(--font-size-extra-tiny)",
              fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              color:      "var(--color-text-strong)",
              lineHeight: "var(--line-height-extra-tiny)",
            }}
          >
            Send {amount} via ACH from your bank
          </span>
          <span
            style={{
              fontFamily: "var(--font-family-body)",
              fontSize:   "var(--font-size-extra-tiny)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              color:      "var(--color-text-weak)",
              lineHeight: "var(--line-height-extra-tiny)",
            }}
          >
            Parqlet enables your subscription immediately after you submit the ACH method. We verify each transfer manually after the funds arrive and match the required reference.
          </span>
        </div>
      </div>

      {/* Bank details */}
      <DetailBlock label="Beneficiary (recipient)">
        <DetailRow label="Name"    value={ACH_INSTRUCTIONS.beneficiaryName} />
        <DetailRow
          label="Address"
          value={formatAddress(ACH_INSTRUCTIONS.beneficiaryAddress).join("\n")}
          multiline
        />
      </DetailBlock>

      <DetailBlock label="Receiving bank">
        <DetailRow label="Bank"    value={ACH_INSTRUCTIONS.bankName} />
        <DetailRow
          label="Bank address"
          value={formatAddress(ACH_INSTRUCTIONS.bankAddress).join("\n")}
          multiline
        />
        <DetailRow
          label="Routing number (ABA)"
          value={formatRoutingNumber(ACH_INSTRUCTIONS.routingNumber)}
          onCopy={() => copy(ACH_INSTRUCTIONS.routingNumber, "routing")}
          copyHint={copied === "routing" ? "Copied" : "Copy"}
        />
        <DetailRow
          label="Account number"
          value={ACH_INSTRUCTIONS.accountNumber}
          onCopy={() => copy(ACH_INSTRUCTIONS.accountNumber, "account")}
          copyHint={copied === "account" ? "Copied" : "Copy"}
        />
        <DetailRow
          label="Account type"
          value={ACH_INSTRUCTIONS.accountType[0].toUpperCase() + ACH_INSTRUCTIONS.accountType.slice(1)}
        />
      </DetailBlock>

      {/* Remittance reference — most important field */}
      <div
        style={{
          padding:      "var(--spacing-16)",
          background:   "var(--color-fill-accent)",
          borderRadius: "var(--radius-12)",
          display:      "flex",
          flexDirection:"column",
          gap:          6,
        }}
      >
        <span
          style={{
            fontFamily:    "var(--font-family-body)",
            fontSize:      "var(--font-size-extra-tiny)",
            fontWeight:    "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
            // Sits on the fixed brand green background — keep it dark; doesn't invert in dark mode.
            color:         "#222222",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Memo / Reference — REQUIRED
        </span>
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            gap:            12,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-family-heading)",
              fontSize:   "var(--font-size-heading-3)",
              lineHeight: "var(--line-height-heading-3)",
              fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              // Sits on the fixed brand green background — keep it dark; doesn't invert in dark mode.
              color:      "#222222",
              fontFeatureSettings: '"tnum" 1',
            }}
          >
            {remittanceReference}
          </span>
          <button
            type="button"
            onClick={() => copy(remittanceReference, "reference")}
            style={{
              height:        32,
              padding:       "0 var(--spacing-12)",
              background:    "var(--color-fill-white)",
              border:        "1px solid var(--color-stroke-medium)",
              borderRadius:  "var(--radius-8)",
              cursor:        "pointer",
              fontFamily:    "var(--font-family-body)",
              fontSize:      "var(--font-size-extra-tiny)",
              color:         "var(--color-text-strong)",
              whiteSpace:    "nowrap",
              flexShrink:    0,
            }}
          >
            {copied === "reference" ? "Copied" : "Copy"}
          </button>
        </div>
        <span
          style={{
            fontFamily: "var(--font-family-body)",
            fontSize:   "var(--font-size-extra-tiny)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            // Sits on the fixed brand green background — keep it dark; doesn't invert in dark mode.
            color:      "#222222",
            lineHeight: "var(--line-height-extra-tiny)",
          }}
        >
          Include this exact string in the memo/reference field of your bank&apos;s transfer form so we can match the payment to your building.
        </span>
      </div>
    </div>
  );
}

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "column",
        gap:           "var(--spacing-8)",
      }}
    >
      <span
        style={{
          fontFamily:    "var(--font-family-body)",
          fontSize:      "var(--font-size-extra-tiny)",
          fontWeight:    "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
          color:         "var(--color-text-weak)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </span>
      <div
        style={{
          display:       "flex",
          flexDirection: "column",
          gap:           "var(--spacing-8)",
          padding:       "var(--spacing-12) var(--spacing-16)",
          background:    "var(--color-fill-weak)",
          border:        "1px solid var(--color-divider-neutral)",
          borderRadius:  "var(--radius-8)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  multiline = false,
  onCopy,
  copyHint,
}: {
  label:      string;
  value:      string;
  multiline?: boolean;
  onCopy?:    () => void;
  copyHint?:  string;
}) {
  return (
    <div
      style={{
        display:        "flex",
        alignItems:     multiline ? "flex-start" : "center",
        justifyContent: "space-between",
        gap:            12,
        padding:        "var(--spacing-4) 0",
      }}
    >
      <div
        style={{
          display:       "flex",
          flexDirection: "column",
          gap:           2,
          minWidth:      0,
          flex:          1,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-family-body)",
            fontSize:   "var(--font-size-extra-tiny)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            color:      "var(--color-text-weak)",
            lineHeight: "var(--line-height-extra-tiny)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-family-body)",
            fontSize:   "var(--font-size-tiny)",
            fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
            color:      "var(--color-text-strong)",
            lineHeight: multiline ? 1.5 : "var(--line-height-tiny)",
            whiteSpace: multiline ? "pre-line" : undefined,
            fontFeatureSettings: '"tnum" 1',
          }}
        >
          {value}
        </span>
      </div>
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          style={{
            height:        28,
            padding:       "0 var(--spacing-12)",
            background:    "var(--color-fill-white)",
            border:        "1px solid var(--color-stroke-medium)",
            borderRadius:  "var(--radius-8)",
            cursor:        "pointer",
            fontFamily:    "var(--font-family-body)",
            fontSize:      "var(--font-size-extra-tiny)",
            color:         "var(--color-text-strong)",
            whiteSpace:    "nowrap",
            flexShrink:    0,
          }}
        >
          {copyHint ?? "Copy"}
        </button>
      )}
    </div>
  );
}
