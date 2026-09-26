'use client';

export function IcShield({ color = "var(--color-icon-weak)" }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3L4 6.5V12c0 4.418 3.582 8 8 9 4.418-1 8-4.582 8-9V6.5L12 3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
