'use client';

export function IcPerson({ color = "var(--color-icon-weak)" }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4.25" stroke={color} strokeWidth="1.5" />
      <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
