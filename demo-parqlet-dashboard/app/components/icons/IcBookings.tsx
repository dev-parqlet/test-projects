'use client';

export function IcBookings({ color = "var(--color-text-weaker)" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="4.75" y="5.75" width="14.5" height="14.5" rx="1.25" stroke={color} strokeWidth="1.5" />
      <line x1="8"  y1="3" x2="8"  y2="7"  stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="3" x2="16" y2="7"  stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5"  y1="11" x2="19" y2="11" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}