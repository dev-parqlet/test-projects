'use client';

export function IcQuestion({ color = "var(--color-icon-weak)" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <path d="M10 9.5C10 8.4 10.9 7.5 12 7.5C13.1 7.5 14 8.4 14 9.5C14 10.3 13.5 11 12.8 11.4L12 11.9V13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="15.5" r="0.75" fill={color} />
    </svg>
  );
}
