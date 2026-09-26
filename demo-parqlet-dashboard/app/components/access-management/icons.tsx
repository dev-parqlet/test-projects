// Shared icons used by the Access Management page.
// IcChevronDown and IcClose are imported directly from ../icons in components that need them.

export function IcSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7.25" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
      <path d="M16.5 16.5L21 21" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IcEllipsis({ color = "var(--color-icon-weak)" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="5"  cy="12" r="1.25" fill={color} />
      <circle cx="12" cy="12" r="1.25" fill={color} />
      <circle cx="19" cy="12" r="1.25" fill={color} />
    </svg>
  );
}

export function IcChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 12L6 8l4-4" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IcChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 12l4-4-4-4" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IcPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IcSmallCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 8L6.5 12L13.5 4" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IcLoading() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
      <circle cx="12" cy="12" r="10" stroke="var(--color-stroke-medium)" strokeWidth="2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--color-accent-primary)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
