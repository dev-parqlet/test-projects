'use client';

export function IcClose({ size = 24, color = "var(--color-text-strong)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M6 18L18 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
