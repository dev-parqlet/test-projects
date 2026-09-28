"use client";

import React from "react";

/**
 * A whole-number field with step buttons, bounded by `min`/`max`.
 *
 * It borrows Input's compact shell - same tokens, same focus and error
 * borders - so the two sit next to each other in a form without looking
 * like different controls. The difference is that the value here is a
 * number with an allowed range, so the control can offer the range: the
 * buttons and the arrow keys never leave it, and they disable at the ends
 * instead of silently refusing.
 *
 * Typing is still free-form, because clamping mid-keystroke fights the
 * typist: typing "4" on the way to "40" would jump to the minimum. The
 * caller keeps validating the raw string and showing `error`; the buttons
 * are the part that guarantees a legal value.
 */
interface NumberStepperProps {
  label?:  string;
  value:   string;
  min:     number;
  max:     number;
  step?:   number;
  error?:  string;
  width?:  number | string;
  onChange: (next: string) => void;
}

export function NumberStepper({
  label,
  value,
  min,
  max,
  step = 1,
  error,
  width = 132,
  onChange,
}: NumberStepperProps) {
  const [focused, setFocused] = React.useState(false);

  const current = Number(value);
  const valid = value !== "" && Number.isFinite(current);

  // From an empty or unparseable field, a step lands on the nearest end
  // rather than doing nothing - the button always produces a legal value.
  const stepTo = (delta: number) => {
    const from = valid ? current : delta > 0 ? min - step : max + step;
    const next = Math.min(max, Math.max(min, from + delta));
    onChange(String(next));
  };

  const atMin = valid && current <= min;
  const atMax = valid && current >= max;

  const shell: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    width,
    height: 40,
    boxSizing: "border-box",
    border: `1px solid ${
      error
        ? "var(--color-fill-error)"
        : focused
          ? "var(--color-stroke-strong)"
          : "var(--color-stroke-medium)"
    }`,
    borderRadius: "var(--radius-8)",
    background: "var(--color-fill-white)",
    overflow: "hidden",
    transition: "border-color 0.12s",
  };

  const button = (disabled: boolean): React.CSSProperties => ({
    flex: "0 0 auto",
    width: 34,
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    background: "transparent",
    color: disabled ? "var(--color-text-disabled)" : "var(--color-text-strong)",
    cursor: disabled ? "default" : "pointer",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-body)",
    lineHeight: 1,
    padding: 0,
    userSelect: "none",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
      {label && (
        <label
          style={{
            fontFamily: "var(--font-family-body)",
            fontSize: "var(--font-size-extra-tiny)",
            fontWeight: "var(--font-weight-medium)",
            lineHeight: "var(--line-height-extra-tiny)",
            color: "var(--color-text-strong)",
            marginBottom: "var(--spacing-4)",
            display: "block",
          }}
        >
          {label}
        </label>
      )}

      <div style={shell}>
        <button
          type="button"
          aria-label="Decrease"
          tabIndex={-1}
          disabled={atMin}
          style={button(atMin)}
          onClick={() => stepTo(-step)}
        >
          −
        </button>

        <input
          value={value}
          inputMode="numeric"
          role="spinbutton"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valid ? current : undefined}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              stepTo(step);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              stepTo(-step);
            }
          }}
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            textAlign: "center",
            fontFamily: "var(--font-family-body)",
            fontSize: "var(--font-size-tiny)",
            lineHeight: "var(--line-height-tiny)",
            fontWeight: "var(--font-weight-medium)",
            color: "var(--color-text-strong)",
            padding: 0,
          }}
        />

        <button
          type="button"
          aria-label="Increase"
          tabIndex={-1}
          disabled={atMax}
          style={button(atMax)}
          onClick={() => stepTo(step)}
        >
          +
        </button>
      </div>

      {error && (
        <span
          style={{
            fontFamily: "var(--font-family-body)",
            fontSize: "var(--font-size-extra-tiny)",
            color: "var(--color-fill-error)",
            marginTop: 4,
            display: "block",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
