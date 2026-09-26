"use client";

export function IcBroadcast({ color = "var(--color-text-weaker)" }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 10v4a1 1 0 0 0 1 1h2l7 4V5L6 9H4a1 1 0 0 0-1 1z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M17 9a3 3 0 0 1 0 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M19.5 6.5a7 7 0 0 1 0 11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
