'use client';

export function IcHamburger({ color = "var(--color-text-strong)" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 12h16M4 18h16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
