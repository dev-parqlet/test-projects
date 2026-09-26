"use client";

export function IcBookings({ color = "var(--color-text-weaker)" }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
