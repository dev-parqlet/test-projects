"use client";

import React from "react";

/**
 * The dark bar that appears above a table once rows are ticked: "2 spots
 * selected", then the things you can do to them.
 *
 * It takes the table's place in the flow rather than floating over it, so
 * nothing is hidden behind it and the table does not jump sideways under
 * a scrollbar. It is dark because it is modal in spirit - while it is up,
 * the buttons on it act on a selection and not on the page - and the
 * inverted fill is the one thing on the screen that says so without a
 * sentence.
 *
 * `destructive` on an action draws it in the error colour. "Clear" is
 * separate from `actions` because it ends the selection rather than
 * changing anything, and grouping it with the verbs invites the muscle
 * memory that deletes a hundred spots.
 */
export interface BulkAction {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export function BulkActionBar({
  count,
  itemLabel = "item",
  actions,
  onClear,
}: {
  count: number;
  /** Singular; pluralised with an "s". */
  itemLabel?: string;
  actions: BulkAction[];
  onClear: () => void;
}) {
  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-label={`${count} ${itemLabel}${count === 1 ? "" : "s"} selected`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--spacing-16)",
        flexWrap: "wrap",
        padding: "var(--spacing-12) var(--spacing-24)",
        minHeight: 56,
        boxSizing: "border-box",
        borderRadius: "var(--radius-12)",
        background: "var(--color-fill-strong)",
        color: "var(--color-text-white)",
        fontFamily: "var(--font-family-body)",
      }}
    >
      <span
        style={{
          fontSize: "var(--font-size-tiny)",
          lineHeight: "var(--line-height-tiny)",
          fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
        }}
      >
        {count} {itemLabel}
        {count === 1 ? "" : "s"} selected
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", flexWrap: "wrap" }}>
        {actions.map((a) => (
          <BarButton key={a.label} {...a} />
        ))}
        <BarButton label="Clear" onClick={onClear} bare />
      </div>
    </div>
  );
}

function BarButton({
  label,
  onClick,
  destructive,
  disabled,
  bare,
}: BulkAction & { bare?: boolean }) {
  const [hover, setHover] = React.useState(false);
  const color = destructive ? "var(--color-tag-text-expired)" : "var(--color-text-white)";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: 36,
        padding: "0 var(--spacing-16)",
        borderRadius: "var(--radius-8)",
        // A bordered chip on a dark bar needs the border to be a lift of
        // the fill, not a stroke token: the light-theme strokes vanish on
        // #222 and the dark-theme ones are darker than the bar itself.
        border: bare ? "1px solid transparent" : `1px solid ${destructive ? "rgba(231,136,136,0.55)" : "rgba(255,255,255,0.28)"}`,
        background: hover && !disabled ? "rgba(255,255,255,0.12)" : "transparent",
        color,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontFamily: "var(--font-family-body)",
        fontSize: "var(--font-size-tiny)",
        lineHeight: "var(--line-height-tiny)",
        whiteSpace: "nowrap",
        transition: "background 0.12s",
      }}
    >
      {label}
    </button>
  );
}
