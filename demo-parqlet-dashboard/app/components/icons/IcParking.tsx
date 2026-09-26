'use client';

export function IcParking({ color = "var(--color-text-weaker)" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 17L3 17L3 11L5 6L14 6L18 11L19 11C19.53 11 20.04 11.21 20.41 11.59C20.79 11.96 21 12.47 21 13L21 17L19 17M15 17L9 17M3 11L18 11M12 11L12 6"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="7"  cy="17" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="17" cy="17" r="2" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}