"use client";

import { useState } from "react";
import { useTheme } from "../context/theme-context";

function IcSun() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IcMoon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Icon-only dark-mode toggle for page headers (HOA + super admin). Shows the
 * icon for the mode a click switches TO — moon while light, sun while dark —
 * same convention as most apps. Separate from the Settings page's
 * ThemeToggle switch; both read/write the same ThemeProvider state so they
 * always stay in sync with each other.
 */
export function HeaderThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [hovered, setHovered] = useState(false);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        background: hovered ? "var(--color-fill-weak)" : "none",
        border: "none", cursor: "pointer",
        width: 36, height: 36,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 8, flexShrink: 0,
        color: "var(--color-icon-strong)",
        transition: "background 0.15s",
      }}
    >
      {isDark ? <IcSun /> : <IcMoon />}
    </button>
  );
}
