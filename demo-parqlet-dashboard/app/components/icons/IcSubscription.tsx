'use client';

export function IcSubscription({ color = "var(--color-text-weaker)" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="3" stroke={color} strokeWidth="1.5" />
      <line x1="3"  y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.5" />
      <circle cx="7.01" cy="15" r="0.75" fill={color} />
      <line x1="11" y1="15" x2="13" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}