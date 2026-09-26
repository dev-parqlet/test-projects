"use client";

import React from "react";
import {
  ACH_INSTRUCTIONS,
  formatAddress,
  formatRoutingNumber,
  maskAccountNumber,
} from "@/lib/ach-instructions";

/**
 * Pending-review state shown after an HOA submits the ACH flow.
 *
 * Renders the full bank instructions with the per-building remittance
 * reference and a single primary CTA — "Go to dashboard" — because the
 * subscription is in `pending_review` and will only flip to Active once
 * finance matches the funds in Mercury (no client-side verification).
 */

export function AchPendingReview({
  remittanceReference,
  amount,
  onGoToDashboard,
}: {
  remittanceReference: string;
  amount:               string;
  onGoToDashboard:      () => void;
}) {
  return (
    <div
      style={{
        minHeight:        "100vh",
        backgroundColor:  "var(--color-fill-weak)",
        fontFamily:       "var(--font-family-body)",
        display:          "flex",
        justifyContent:   "center",
      }}
    >
      <div
        style={{
          width:        "100%",
          maxWidth:     560,
          padding:      "var(--spacing-48) var(--spacing-24)",
          display:      "flex",
          flexDirection:"column",
          gap:          "var(--spacing-32)",
        }}
      >
        {/* Status header */}
        <div
          style={{
            display:       "flex",
            flexDirection: "column",
            gap:           "var(--spacing-12)",
            alignItems:    "flex-start",
          }}
        >
          <span
            style={{
              display:       "inline-flex",
              alignItems:    "center",
              gap:           6,
              padding:       "4px 10px",
              background:    "var(--color-fill-weak)",
              border:        "1px solid var(--color-divider-neutral)",
              borderRadius:  "var(--radius-48)",
              fontFamily:    "var(--font-family-body)",
              fontSize:      "var(--font-size-extra-tiny)",
              color:         "var(--color-text-strong)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            <span
              style={{
                width:        8,
                height:       8,
                borderRadius: "50%",
                background:   "var(--color-fill-warning, #f59e0b)",
              }}
              aria-hidden="true"
            />
            Pending manual review
          </span>
          <h1
            style={{
              margin:     0,
              fontSize:   "var(--font-size-heading-1)",
              lineHeight: "var(--line-height-heading-1)",
              fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              color:      "var(--color-text-strong)",
              fontFamily: "var(--font-family-heading)",
            }}
          >
            Send {amount} via ACH to activate
          </h1>
          <p
            style={{
              margin:     0,
              fontSize:   "var(--font-size-body)",
              lineHeight: "var(--line-height-body)",
              color:      "var(--color-text-weak)",
            }}
          >
            Use the bank details below to send your first payment from your HOA&apos;s bank account. Your subscription becomes active as soon as finance matches the transfer.
          </p>
        </div>

        {/* Remittance reference (highlighted) */}
        <div
          style={{
            padding:      "var(--spacing-16) var(--spacing-20)",
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
            Reference / Memo
          </span>
          <span
            style={{
              fontFamily:           "var(--font-family-heading)",
              fontSize:             "var(--font-size-heading-2)",
              lineHeight:           "var(--line-height-heading-2)",
              fontWeight:           "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              // Sits on the fixed brand green background — keep it dark; doesn't invert in dark mode.
              color:                "#222222",
              fontFeatureSettings:  '"tnum" 1',
            }}
          >
            {remittanceReference}
          </span>
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
            Include this exact string in the memo / reference field of your bank&apos;s transfer form.
          </span>
        </div>

        {/* Bank details */}
        <div
          style={{
            display:       "flex",
            flexDirection: "column",
            gap:           "var(--spacing-12)",
            padding:       "var(--spacing-20)",
            background:    "var(--color-fill-white)",
            border:        "1px solid var(--color-divider-neutral)",
            borderRadius:  "var(--radius-12)",
          }}
        >
          <Row label="Beneficiary"  value={ACH_INSTRUCTIONS.beneficiaryName} />
          <Row
            label="Beneficiary address"
            value={formatAddress(ACH_INSTRUCTIONS.beneficiaryAddress).join(", ")}
          />
          <Row label="Bank"         value={ACH_INSTRUCTIONS.bankName} />
          <Row
            label="Bank address"
            value={formatAddress(ACH_INSTRUCTIONS.bankAddress).join(", ")}
          />
          <Row
            label="Routing number (ABA)"
            value={formatRoutingNumber(ACH_INSTRUCTIONS.routingNumber)}
          />
          <Row
            label="Account number"
            value={maskAccountNumber(ACH_INSTRUCTIONS.accountNumber, 4)}
          />
          <Row
            label="Account type"
            value={ACH_INSTRUCTIONS.accountType[0].toUpperCase() + ACH_INSTRUCTIONS.accountType.slice(1)}
          />
          <Row label="Amount"       value={amount} />
        </div>

        {/* CTA */}
        <div
          style={{
            display:       "flex",
            flexDirection: "column",
            gap:           "var(--spacing-12)",
            alignItems:    "center",
          }}
        >
          <button
            type="button"
            onClick={onGoToDashboard}
            style={{
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              width:           "100%",
              maxWidth:        360,
              height:          56,
              padding:         "0 var(--spacing-24)",
              backgroundColor: "var(--color-button-primary)",
              border:          "none",
              borderRadius:    "var(--radius-8)",
              cursor:          "pointer",
              fontFamily:      "var(--font-family-body)",
              fontSize:        "var(--font-size-heading-3)",
              // Fixed brand color, doesn't invert in dark mode — keep text dark.
              color:           "#222222",
            }}
          >
            Go to dashboard
          </button>
          <span
            style={{
              fontFamily:    "var(--font-family-body)",
              fontSize:      "var(--font-size-extra-tiny)",
              color:         "var(--color-text-weak)",
              lineHeight:    "var(--line-height-extra-tiny)",
              textAlign:     "center",
              maxWidth:      360,
            }}
          >
            You can review transfer status any time on the Subscription page.
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display:        "flex",
        flexDirection:  "column",
        gap:            2,
      }}
    >
      <span
        style={{
          fontFamily:    "var(--font-family-body)",
          fontSize:      "var(--font-size-extra-tiny)",
          fontWeight:    "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          color:         "var(--color-text-weak)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily:          "var(--font-family-body)",
          fontSize:            "var(--font-size-tiny)",
          fontWeight:          "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
          color:               "var(--color-text-strong)",
          lineHeight:          "var(--line-height-tiny)",
          fontFeatureSettings: '"tnum" 1',
        }}
      >
        {value}
      </span>
    </div>
  );
}

