"use client";

import React from "react";

/**
 * Accessible radio-card group for choosing between credit card and ACH bank
 * transfer during subscription onboarding.
 *
 * Renders a native `<input type="radio">` (visually hidden but focusable)
 * inside each option so screen readers announce the choice and arrow keys
 * cycle through the group. The visible card is a `<label>` styled to match
 * the design system tokens; clicking anywhere on the card toggles the radio.
 *
 * Default: "card" — preserves the existing Stripe flow for HOAs who never
 * ask about ACH. The selector stays a "secondary" visual element (below
 * the plan card) so it doesn't push the existing layout around.
 */

export type PaymentMethodChoice = "card" | "ach";

interface Option {
  value: PaymentMethodChoice;
  title: string;
  subtitle: string;
  badge?: string;
}

const OPTIONS: Option[] = [
  {
    value: "card",
    title: "Credit or debit card",
    subtitle: "Pay monthly automatically. Cancel anytime.",
    badge: "Default",
  },
  {
    value: "ach",
    title: "ACH bank transfer",
    subtitle:
      "Pay by domestic bank transfer. Verified manually after funds arrive.",
  },
];

export function PaymentMethodSelector({
  value,
  onChange,
}: {
  value: PaymentMethodChoice;
  onChange: (next: PaymentMethodChoice) => void;
}) {
  // Group name is stable per render — using a ref id keeps the radio
  // group semantically a single fieldset for screen readers.
  const groupName = React.useId();

  return (
    <fieldset
      style={{
        border:        "none",
        padding:       0,
        margin:        0,
        display:       "flex",
        flexDirection: "column",
        gap:           "var(--spacing-12)",
      }}
    >
      <legend
        style={{
          fontFamily:    "var(--font-family-body)",
          fontSize:      "var(--font-size-extra-tiny)",
          lineHeight:    "var(--line-height-extra-tiny)",
          fontWeight:    "var(--font-weight-medium)",
          color:         "var(--color-text-weak)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom:  "var(--spacing-4)",
        }}
      >
        Payment method
      </legend>
      {OPTIONS.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <label
            key={opt.value}
            htmlFor={`${groupName}-${opt.value}`}
            style={{
              display:        "flex",
              alignItems:     "flex-start",
              gap:            "var(--spacing-12)",
              padding:        "var(--spacing-16)",
              border:         isSelected
                ? "1px solid var(--color-fill-accent)"
                : "1px solid var(--color-divider-neutral)",
              borderRadius:   "var(--radius-12)",
              // Selected and unselected share the same white background so the
              // chosen card doesn't look translucent. Selection is conveyed by
              // the accent-green border (line 91) and the filled inner radio
              // dot (lines 139–148).
              background:     "var(--color-fill-white)",
              cursor:         "pointer",
              transition:     "border-color 0.12s",
              position:       "relative",
            }}
          >
            {/* Visually hidden radio (still focusable) */}
            <input
              id={`${groupName}-${opt.value}`}
              type="radio"
              name={groupName}
              value={opt.value}
              checked={isSelected}
              onChange={() => onChange(opt.value)}
              style={{
                position:       "absolute",
                width:          1,
                height:         1,
                padding:        0,
                margin:         -1,
                overflow:       "hidden",
                clip:           "rect(0,0,0,0)",
                whiteSpace:     "nowrap",
                border:         0,
              }}
            />
            {/* Visible radio dot */}
            <span
              aria-hidden="true"
              style={{
                width:           20,
                height:          20,
                borderRadius:    "50%",
                border:          isSelected
                  ? "1px solid var(--color-fill-accent)"
                  : "1px solid var(--color-divider-neutral)",
                background:      "var(--color-fill-white)",
                flexShrink:      0,
                marginTop:       2,
                position:        "relative",
                boxSizing:       "border-box",
              }}
            >
              {isSelected && (
                <span
                  style={{
                    position:      "absolute",
                    inset:         4,
                    borderRadius:  "50%",
                    background:    "var(--color-icon-strong)",
                  }}
                />
              )}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontFamily: "var(--font-family-body)",
                    fontSize:   "var(--font-size-tiny)",
                    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                    color:      "var(--color-text-strong)",
                    lineHeight: "var(--line-height-tiny)",
                  }}
                >
                  {opt.title}
                </span>
                {opt.badge && (
                  <span
                    style={{
                      fontFamily:    "var(--font-family-body)",
                      fontSize:      10,
                      lineHeight:    1,
                      fontWeight:    "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                      // Fixed brand color, doesn't invert in dark mode — keep text dark.
                      color:         "#222222",
                      background:    "var(--color-fill-accent)",
                      padding:       "3px 7px",
                      borderRadius:  "var(--radius-48)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {opt.badge}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontFamily: "var(--font-family-body)",
                  fontSize:   "var(--font-size-extra-tiny)",
                  fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                  color:      "var(--color-text-weak)",
                  lineHeight: "var(--line-height-extra-tiny)",
                }}
              >
                {opt.subtitle}
              </span>
            </div>
          </label>
        );
      })}
    </fieldset>
  );
}
