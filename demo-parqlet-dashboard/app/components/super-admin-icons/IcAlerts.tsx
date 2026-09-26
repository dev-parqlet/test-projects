"use client";

export function IcAlerts({ color = "var(--color-text-weaker)" }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3C8.13 3 5 6.13 5 10v7H4v2h16v-2h-1v-7c0-3.87-3.13-7-7-7z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 0 0 4 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}