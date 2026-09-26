'use client';

export function IcUser({ color = "var(--color-text-weak)" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.33" stroke={color} strokeWidth="1.67" />
      <path
        d="M9.58 9.5C9.78 8.94 10.16 8.47 10.67 8.17C11.18 7.88 11.78 7.77 12.36 7.87C12.94 7.97 13.47 8.27 13.85 8.72C14.23 9.17 14.44 9.74 14.44 10.33C14.44 12 11.94 12.83 11.94 12.83"
        stroke={color} strokeWidth="1.67" strokeLinecap="round"
      />
      <circle cx="11.94" cy="16.17" r="0.83" fill={color} />
    </svg>
  );
}
