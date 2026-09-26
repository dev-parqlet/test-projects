"use client";

// ─── Sort icon ────────────────────────────────────────────────────────────────

export function IcSort({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  const up   = active && dir === "asc"  ? "var(--color-text-strong)" : "var(--color-stroke-strong)";
  const down = active && dir === "desc" ? "var(--color-text-strong)" : "var(--color-stroke-strong)";
  return (
    <svg width="9" height="11" viewBox="0 0 12 14" fill="none" style={{ flexShrink: 0 }}>
      <path d="M2 5l4-4 4 4"  stroke={up}   strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 9l4 4 4-4"  stroke={down} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Checkbox component ───────────────────────────────────────────────────────

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
}) {
  // Tokens from Parqlet Library "Checkbox" component (Size=Small):
  //   Default  — Fill/White (#fff), Stroke/Medium (#e7e4e0), Spacing/4 radius (4px)
  //   Selected — Fill/Strong (#222), no border, Icon/White checkmark (#fff)
  const filled = checked || indeterminate;
  return (
    <button
      onClick={onChange}
      style={{
        width: 16, height: 16, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: filled ? "var(--color-fill-strong)" : "var(--color-fill-white)",
        border: filled ? "none" : "1px solid var(--color-stroke-medium)",
        borderRadius: "var(--radius-4)",
        cursor: "pointer",
        padding: 0,
        transition: "background 0.1s, border-color 0.1s",
      }}
    >
      {indeterminate && !checked && (
        /* Indeterminate — dash, Icon/White */
        <svg width="8" height="2" viewBox="0 0 8 2" fill="none">
          <path d="M1 1h6" stroke="var(--color-icon-inverse)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      {checked && (
        /* Selected — checkmark, Icon/White */
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4l3 3 5-6" stroke="var(--color-icon-inverse)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

export function IcSearch() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7.25" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
      <path d="M16.5 16.5L21 21" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IcChevronDown({ color = "var(--color-icon-weak)" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IcCross({ color = "var(--color-icon-weak)" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M7 7l10 10M17 7L7 17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IcPhone({ color = "var(--color-icon-weak)" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 4H9L11 9L8.5 10.5C9.57096 12.6715 11.3285 14.429 13.5 15.5L15 13L20 15V19C20 19.5304 19.7893 20.0391 19.4142 20.4142C19.0391 20.7893 18.5304 21 18 21C14.0993 20.763 10.4202 19.0669 7.65683 16.3032C4.89348 13.5395 3.19732 9.86016 2.96 5.96C2.96 5.42956 3.17071 4.92085 3.54579 4.54578C3.92086 4.1707 4.42957 3.96 4.96 3.96L5 4Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}