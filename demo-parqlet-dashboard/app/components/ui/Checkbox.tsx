"use client";

import React from "react";

/**
 * The square tick box, for selecting rows and for yes/no fields in a form.
 *
 * A native `<input type="checkbox">` cannot be styled to the brand lime in
 * any browser we care about without `appearance: none`, at which point it
 * is a custom control anyway - so this draws the box itself and keeps a
 * real, visually-hidden input underneath for the keyboard, the label
 * association and the accessibility tree.
 *
 * `indeterminate` is the header-row state: some of this page is selected,
 * not all of it. It has to be set on the DOM node because there is no
 * attribute for it.
 */
export interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Some but not all of the set below is checked. Visual only. */
  indeterminate?: boolean;
  disabled?: boolean;
  label?: React.ReactNode;
  /** For a box with no visible label, e.g. a row-selection cell. */
  "aria-label"?: string;
}

export function Checkbox({
  checked,
  onChange,
  indeterminate = false,
  disabled = false,
  label,
  "aria-label": ariaLabel,
}: CheckboxProps) {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);

  const on = checked || indeterminate;

  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--spacing-8)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
        fontFamily: "var(--font-family-body)",
        fontSize: "var(--font-size-tiny)",
        color: "var(--color-text-strong)",
        userSelect: "none",
      }}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          position: "absolute",
          opacity: 0,
          width: 22,
          height: 22,
          margin: 0,
          cursor: disabled ? "default" : "pointer",
        }}
      />
      <span
        aria-hidden
        style={{
          width: 22,
          height: 22,
          flexShrink: 0,
          borderRadius: "var(--radius-8)",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // The lime is the same colour in both themes, so the tick on it
          // has to stay dark rather than following `--color-text-strong`.
          background: on ? "var(--color-fill-accent)" : "var(--color-fill-white)",
          border: `1px solid ${on ? "var(--color-fill-accent)" : "var(--color-stroke-strong)"}`,
          transition: "background 0.12s, border-color 0.12s",
        }}
      >
        {checked ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8.5L6.2 11.5L13 4.5"
              stroke="var(--color-text-on-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : indeterminate ? (
          <span
            style={{
              width: 10,
              height: 2,
              borderRadius: 1,
              background: "var(--color-text-on-accent)",
            }}
          />
        ) : null}
      </span>
      {label}
    </label>
  );
}
