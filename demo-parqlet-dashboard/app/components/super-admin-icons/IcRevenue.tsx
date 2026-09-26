"use client";

export function IcRevenue({ color = "var(--color-text-weaker)" }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="14" rx="2.5" stroke={color} strokeWidth="1.5" />
      <path d="M2 10h20" stroke={color} strokeWidth="1.5" />
      <circle cx="7" cy="15" r="1.25" fill={color} />
      <path d="M11 15h6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}