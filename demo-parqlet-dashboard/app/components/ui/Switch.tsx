"use client";

import React from "react";

/**
 * The pill switch, for a setting that takes effect the moment it moves.
 *
 * A CHECKBOX IS THE WRONG CONTROL for these. A tick box says "this will
 * be true when you submit the form"; a switch says "this is on now".
 * Every feature flag in this app is the second kind - it writes
 * immediately and changes what other people see - and the three that
 * were drawn as tick boxes read as though a Save button were coming.
 *
 * A real `<button role="switch">` rather than a styled checkbox: the
 * semantics are the point here, and a switch is a button that reports
 * `aria-checked`. Space and Enter both toggle it for free, which is what
 * a button gives and a div never would.
 *
 * Three sizes, because the same control appears in a form (md) and in a
 * dense settings row (sm). Nothing else about it changes.
 */
export interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  /** Required when the switch has no visible label beside it. */
  "aria-label"?: string;
  /** Points at the element that names it, when one exists. */
  "aria-labelledby"?: string;
  id?: string;
}

const SIZES = {
  sm: { w: 36, h: 20, knob: 14, pad: 3 },
  md: { w: 44, h: 24, knob: 18, pad: 3 },
} as const;

export function Switch({
  checked,
  onChange,
  disabled = false,
  size = "md",
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: SwitchProps) {
  const s = SIZES[size];
  const [focus, setFocus] = React.useState(false);

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        width: s.w,
        height: s.h,
        padding: 0,
        flexShrink: 0,
        border: "none",
        borderRadius: 999,
        cursor: disabled ? "not-allowed" : "pointer",
        // Lime when on, which is the brand's "this is live" colour
        // everywhere else in the app (the Active badge, the primary
        // button). Off is a neutral grey rather than a red: off is a
        // resting state, not a warning.
        // gray-40, not gray-20: the lighter greys in this palette are
        // page backgrounds, and a track drawn in one disappears into the
        // card behind it, which makes an OFF switch look like no control
        // at all.
        background: checked ? "var(--color-fill-accent)" : "var(--color-gray-40)",
        opacity: disabled ? 0.45 : 1,
        transition: "background-color .18s ease, opacity .18s ease",
        // Drawn rather than relying on the UA ring, which a custom
        // background hides on several of them. Keyboard users need this
        // more than anyone: the control has no other affordance.
        outline: "none",
        boxShadow: focus ? "0 0 0 3px rgba(199,229,31,.45)" : "none",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: checked ? s.w - s.knob - s.pad : s.pad,
          width: s.knob,
          height: s.knob,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,.22)",
          transition: "left .18s ease",
        }}
      />
    </button>
  );
}
