"use client";

export function IcBuildings({ color = "var(--color-text-weaker)" }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="11" height="15" rx="1.5" stroke={color} strokeWidth="1.5" />
      <path d="M14 10h4a2 2 0 0 1 2 2v9H14" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 10h4M7 13.5h4M7 17h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}