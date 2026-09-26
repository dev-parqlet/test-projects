"use client";

export type VehicleType = "Compact" | "Standard" | "Large SUV" | "Motorcycle";

export function IcCompactCar({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="16" width="32" height="16" rx="4" stroke={color} strokeWidth="1.5" />
      <rect x="14" y="22" width="6" height="4" rx="1" fill={color} opacity="0.3" />
      <rect x="28" y="22" width="6" height="4" rx="1" fill={color} opacity="0.3" />
      <circle cx="16" cy="36" r="4" stroke={color} strokeWidth="1.5" />
      <circle cx="32" cy="36" r="4" stroke={color} strokeWidth="1.5" />
      <line x1="4" y1="20" x2="8" y2="24" stroke={color} strokeWidth="1.5" />
      <line x1="44" y1="20" x2="40" y2="24" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function IcStandardCar({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="14" width="36" height="18" rx="5" stroke={color} strokeWidth="1.5" />
      <rect x="12" y="20" width="8" height="5" rx="1" fill={color} opacity="0.3" />
      <rect x="28" y="20" width="8" height="5" rx="1" fill={color} opacity="0.3" />
      <circle cx="14" cy="36" r="5" stroke={color} strokeWidth="1.5" />
      <circle cx="34" cy="36" r="5" stroke={color} strokeWidth="1.5" />
      <line x1="3" y1="18" x2="6" y2="22" stroke={color} strokeWidth="1.5" />
      <line x1="45" y1="18" x2="42" y2="22" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function IcLargeSUV({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="4" y="12" width="40" height="20" rx="5" stroke={color} strokeWidth="1.5" />
      <rect x="26" y="8" width="14" height="10" rx="2" stroke={color} strokeWidth="1.5" />
      <rect x="10" y="18" width="8" height="6" rx="1" fill={color} opacity="0.3" />
      <rect x="30" y="18" width="8" height="6" rx="1" fill={color} opacity="0.3" />
      <circle cx="13" cy="36" r="5" stroke={color} strokeWidth="1.5" />
      <circle cx="35" cy="36" r="5" stroke={color} strokeWidth="1.5" />
      <line x1="2" y1="16" x2="4" y2="20" stroke={color} strokeWidth="1.5" />
      <line x1="46" y1="16" x2="44" y2="20" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function IcMotorcycle({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="16" cy="36" r="6" stroke={color} strokeWidth="1.5" />
      <circle cx="34" cy="36" r="6" stroke={color} strokeWidth="1.5" />
      <path d="M16 30l6-18h6l4 8h4" stroke={color} strokeWidth="1.5" fill="none" />
      <path d="M22 12l-4 10h18" stroke={color} strokeWidth="1.5" fill="none" />
      <path d="M28 22l4 8h4" stroke={color} strokeWidth="1.5" />
      <circle cx="8" cy="20" r="2" fill={color} />
      <circle cx="12" cy="16" r="2" fill={color} />
    </svg>
  );
}

export const VEHICLE_ICONS: Record<VehicleType, React.FC<{ color?: string }>> = {
  Compact: IcCompactCar,
  Standard: IcStandardCar,
  "Large SUV": IcLargeSUV,
  Motorcycle: IcMotorcycle,
};

export function IcEVCharge({ color = "#22c55e" }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="7" y="1" width="6" height="7" rx="1" stroke={color} strokeWidth="1.2" />
      <path d="M10 8v5" stroke={color} strokeWidth="1.2" />
      <path d="M8 13h4l-2 4v3l4-5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IcCloseSm({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 3l10 10M13 3L3 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IcCheckSm() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 8L6.5 12L13.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IcCalendarSm({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke={color} strokeWidth="1.2" />
      <line x1="5" y1="1" x2="5" y2="5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11" y1="1" x2="11" y2="5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="2" y1="7" x2="14" y2="7" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

export function IcClockSm({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.2" />
      <path d="M8 5v4l2.5 1.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
