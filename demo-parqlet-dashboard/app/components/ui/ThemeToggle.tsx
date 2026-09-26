"use client";

import { useTheme } from "../context/theme-context";

function IcSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IcMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Light/dark toggle. Placed in Settings (super-admin + HOA); flips
 * `data-theme` on <html> via ThemeProvider, which is all the dark-mode CSS
 * overrides in globals.css key off.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      onClick={toggleTheme}
      style={{
        display: "inline-flex", alignItems: "center", gap: "var(--spacing-8)",
        background: "none", border: "none", padding: 0, cursor: "pointer",
        fontFamily: "var(--font-family-body)",
      }}
    >
      <span style={{ color: isDark ? "var(--color-text-weaker)" : "var(--color-text-strong)", display: "flex" }}>
        <IcSun />
      </span>
      <span
        style={{
          position: "relative",
          width: 40, height: 22,
          borderRadius: "var(--radius-pill)",
          // Matches the "on" color every other toggle in the app uses (see
          // subscription/components/Toggle.tsx) — the brand lime-green
          // accent, not a gray fill.
          background: isDark ? "var(--color-fill-accent)" : "var(--color-stroke-medium)",
          transition: "background 0.15s",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute", top: 2, left: isDark ? 20 : 2,
            width: 18, height: 18, borderRadius: "50%",
            background: "#ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            transition: "left 0.15s",
          }}
        />
      </span>
      <span style={{ color: isDark ? "var(--color-text-strong)" : "var(--color-text-weaker)", display: "flex" }}>
        <IcMoon />
      </span>
    </button>
  );
}
