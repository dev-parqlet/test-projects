'use client';

export function IcDashboard({ color = "var(--color-text-accent)" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <g transform="translate(3,3)">
        <rect x="1.5"   y="1.5"   width="5.83" height="7.5"  rx="0.83" stroke={color} strokeWidth="1.5" />
        <rect x="10.67" y="1.5"   width="5.83" height="4.17" rx="0.83" stroke={color} strokeWidth="1.5" />
        <rect x="1.5"   y="12.33" width="5.83" height="4.17" rx="0.83" stroke={color} strokeWidth="1.5" />
        <rect x="10.67" y="9"     width="5.83" height="7.5"  rx="0.83" stroke={color} strokeWidth="1.5" />
      </g>
    </svg>
  );
}