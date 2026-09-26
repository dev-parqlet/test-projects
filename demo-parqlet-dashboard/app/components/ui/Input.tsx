"use client";

import React from "react";

export type InputVariant = "default" | "compact" | "uppercase-label";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "style"> {
  label?: string;
  error?: string;
  className?: string;
  variant?: InputVariant;
  style?: React.CSSProperties;
}

export function Input({
  label,
  error,
  className = "",
  variant = "default",
  style: customStyle,
  ...props
}: InputProps) {
  const [focused, setFocused] = React.useState(false);

  const isCompact = variant === "compact";
  const isUppercaseLabel = variant === "uppercase-label";

  const inputStyle: React.CSSProperties = {
    flex: isCompact ? undefined : 1,
    minWidth: isCompact ? undefined : 0,
    width: isCompact ? (customStyle?.width ?? "100%") : "100%",
    height: isCompact ? 40 : undefined,
    boxSizing: "border-box",
    border: `1px solid ${
      error ? "var(--color-fill-error)" : focused ? "var(--color-stroke-strong)" : "var(--color-stroke-medium)"
    }`,
    borderRadius: "var(--radius-8)",
    padding: isCompact ? "0 var(--spacing-12)" : "8px var(--spacing-12)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-strong)",
    lineHeight: "var(--line-height-tiny)",
    fontWeight: "var(--font-weight-medium)",
    background: "var(--color-fill-white)",
    outline: "none",
    transition: "border-color 0.12s",
    ...customStyle,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }} className={className}>
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
            ...(isUppercaseLabel ? {
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--color-text-weak)",
            } : {}),
          }}
        >
          {label}
        </label>
      )}
      <input
        {...props}
        style={inputStyle}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
      />
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