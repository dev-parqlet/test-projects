"use client";

import React from "react";

import { Switch } from "./Switch";

/**
 * One feature flag, as a row: what it is, what it does, and whether it
 * is on.
 *
 * The shape every feature-flag console settled on, and for a reason -
 * a flag is three facts and somebody scanning a list needs all three.
 * The name alone is not enough ("Storage" does what?), and a tick box
 * with a label beside it gives no room for the second line.
 *
 * `description` is what CHANGES when this moves, not what the feature
 * is for. An admin flipping it is asking "what will my building see
 * tomorrow", and the honest answer is a list of screens.
 *
 * `unavailableReason` greys the control out and says why, rather than
 * hiding it. A control that is absent reads as a feature that does not
 * exist; one that is disabled with a sentence reads as a feature this
 * building cannot have, which is the true thing.
 */
export interface FeatureToggleProps {
  title: string;
  description: React.ReactNode;
  checked: boolean;
  onChange: (next: boolean) => void;
  /** In flight. The switch holds its position rather than bouncing. */
  isPending?: boolean;
  /** Present means the switch cannot move, and this says why. */
  unavailableReason?: string;
  /** The last row in a card has no rule under it. */
  last?: boolean;
  size?: "sm" | "md";
}

export function FeatureToggle({
  title,
  description,
  checked,
  onChange,
  isPending = false,
  unavailableReason,
  last = false,
  size = "md",
}: FeatureToggleProps) {
  const disabled = isPending || !!unavailableReason;
  const labelId = React.useId();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "var(--spacing-24)",
        padding: "var(--spacing-16) var(--spacing-24)",
        borderBottom: last ? "none" : "1px solid var(--color-stroke-medium)",
        fontFamily: "var(--font-family-body)",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", flexWrap: "wrap" }}>
          <span
            id={labelId}
            style={{
              fontSize: "var(--font-size-tiny)",
              fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              color: "var(--color-text-strong)",
            }}
          >
            {title}
          </span>
          {/* The state in words as well as in the switch's position.
              A switch alone is read wrong often enough that every
              console that ships one also prints the word. */}
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 999,
              fontSize: "var(--font-size-extra-tiny)",
              lineHeight: "var(--line-height-extra-tiny)",
              background: checked ? "var(--color-tag-active)" : "var(--color-gray-20)",
              color: checked ? "var(--color-tag-text-active)" : "var(--color-text-weak)",
              whiteSpace: "nowrap",
            }}
          >
            {checked ? "Enabled" : "Disabled"}
          </span>
        </div>

        <div
          style={{
            marginTop: 3,
            fontSize: "var(--font-size-extra-tiny)",
            lineHeight: 1.5,
            color: "var(--color-text-weak)",
            maxWidth: "52ch",
          }}
        >
          {description}
        </div>

        {unavailableReason && (
          <div
            style={{
              marginTop: 6,
              fontSize: "var(--font-size-extra-tiny)",
              lineHeight: 1.5,
              color: "var(--color-text-weaker)",
            }}
          >
            {unavailableReason}
          </div>
        )}
      </div>

      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        size={size}
        aria-labelledby={labelId}
      />
    </div>
  );
}
