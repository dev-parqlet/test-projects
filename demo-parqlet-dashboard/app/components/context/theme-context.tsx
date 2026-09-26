"use client";

/**
 * Theme (light/dark) provider. Persists the choice to localStorage and sets
 * `data-theme` on <html>, which is what globals.css's dark-mode CSS-variable
 * overrides key off. No component styling changes needed elsewhere — every
 * inline style in this app already reads colors via `var(--color-*)`
 * (see app/tokens.css + app/components/colors.ts), so redefining those
 * variables under `html[data-theme="dark"]` re-themes the whole app.
 */
import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";
const STORAGE_KEY = "parqlet_theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The inline script in layout.tsx already set the correct data-theme
  // attribute (and thus the correct colors) before first paint, to avoid a
  // flash of the wrong theme. Read that same source of truth here so this
  // provider's state matches what's already on screen.
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setThemeState(current === "dark" ? "dark" : "light");
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    applyTheme(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // localStorage may be unavailable (private mode, quota) — theme just
      // won't persist across reloads, not worth surfacing an error for.
    }
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
