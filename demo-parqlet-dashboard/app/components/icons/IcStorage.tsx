'use client';

/**
 * Storage bookings — a locker/cage front: an outer case, a horizontal
 * divider and a handle on each door.
 *
 * Drawn to sit with the set it lives in rather than imported from
 * anywhere: 24x24 box, 1.5 stroke, square-ish geometry with the same
 * rounded joins as IcBookings and IcSubscription, and `currentColor`
 * via a `color` prop so the sidebar's active/inactive tint drives it
 * exactly like every other row.
 *
 * Deliberately NOT a cardboard box, which is the obvious choice and
 * reads as "archive" or "package" next to a nav item about parking.
 */
export function IcStorage({ color = "var(--color-text-weaker)" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="1.5" />
      <line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="1.5" />
      <line x1="9.5" y1="8" x2="14.5" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9.5" y1="16" x2="14.5" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
