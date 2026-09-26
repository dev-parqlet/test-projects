'use client';

export function IcNotification({ color = "var(--color-text-weak)" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M10 5.5C7.79 6.24 6 8.22 6 10.5V14L4 17H20L18 14V10.5C18 8.22 16.21 6.24 14 5.5M10 5.5C10.1 4.37 10.95 3.5 12 3.5C13.05 3.5 13.9 4.37 14 5.5"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M9 17V18C9 19.66 10.34 21 12 21C13.66 21 15 19.66 15 18V17"
        stroke={color} strokeWidth="1.5" strokeLinecap="round"
      />
    </svg>
  );
}
