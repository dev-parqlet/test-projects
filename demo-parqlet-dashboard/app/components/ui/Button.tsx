"use client";

import React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "neutral";
export type ButtonSize = "default" | "small" | "icon-sm" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--color-button-primary)",
    // `--color-button-primary` is the fixed lime-green brand color and does
    // NOT invert in dark mode (see globals.css) — but `--color-text-strong`
    // does, flipping to a near-white that's unreadable on that light-green
    // background. The text needs to stay dark regardless of theme since the
    // background it sits on never changes.
    color: "#222222",
    border: "none",
  },
  secondary: {
    backgroundColor: "var(--color-button-secondary)",
    color: "var(--color-text-strong)",
    border: "1px solid var(--color-stroke-medium)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--color-text-weak)",
    border: "none",
  },
  danger: {
    backgroundColor: "var(--color-fill-error)",
    color: "var(--color-text-white)",
    border: "none",
  },
  outline: {
    backgroundColor: "transparent",
    color: "var(--color-text-strong)",
    border: "1px solid var(--color-stroke-medium)",
  },
  neutral: {
    backgroundColor: "var(--color-button-neutral)",
    color: "var(--color-text-white)",
    border: "none",
  },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  default: {
    height: 56,
    fontSize: "var(--font-size-heading-3)",
    lineHeight: "var(--line-height-heading-3)",
  },
  small: {
    height: 42,
    fontSize: "var(--font-size-body)",
    lineHeight: "var(--line-height-body)",
  },
  "icon-sm": {
    height: 32,
    width: 32,
    padding: "0 6px",
    fontSize: "var(--font-size-tiny)",
  },
  icon: {
    height: 36,
    width: 36,
    padding: "0 8px",
    fontSize: "var(--font-size-tiny)",
  },
};

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ animation: "spin 1s linear infinite" }}
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="28"
        strokeDashoffset="7"
      />
    </svg>
  );
}

export function Button({
  variant = "primary",
  size = "default",
  loading = false,
  disabled = false,
  className = "",
  children,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "0 var(--spacing-16)",
        borderRadius: "var(--radius-8)",
        fontFamily: "var(--font-family-body)",
        fontWeight: "var(--font-weight-regular)",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled && variant !== "neutral" ? 0.5 : 1,
        transition: "background-color 0.12s",
        width: "100%",
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...(isDisabled && variant === "neutral" ? { backgroundColor: "var(--color-gray-60)", color: "var(--color-text-white)" } : {}),
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          const target = e.currentTarget;
          switch (variant) {
            case "primary":
              target.style.backgroundColor = "var(--color-accent-1200)";
              break;
            case "secondary":
              target.style.backgroundColor = "var(--color-fill-weak)";
              break;
            case "ghost":
              target.style.backgroundColor = "rgba(0,0,0,0.05)";
              break;
            case "danger":
              target.style.backgroundColor = "var(--color-red-1000)";
              break;
            case "outline":
              target.style.backgroundColor = "var(--color-fill-weak)";
              target.style.borderColor = "var(--color-stroke-strong)";
              break;
            case "neutral":
              target.style.backgroundColor = "var(--color-gray-100)";
              break;
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyles[variant].backgroundColor as string;
          if (variant === "outline") {
            e.currentTarget.style.borderColor = "var(--color-stroke-medium)";
          }
        }
      }}
    >
      {loading ? (
        <>
          <Spinner />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
