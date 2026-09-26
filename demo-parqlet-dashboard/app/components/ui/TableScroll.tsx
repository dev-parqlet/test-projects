"use client";

/**
 * Wraps the hand-rolled flex-row "tables" used across the superadmin pages
 * (Buildings, Alerts, Revenue, Credits, Sync, Access Management, Residents,
 * Tickets, superadmin overview). Those tables size columns with flex-basis
 * ratios and `minWidth: 0`, which lets text overflow into neighboring
 * columns once the viewport gets narrower than the content needs — this is
 * what causes header/cell text to visually collide on mobile instead of
 * wrapping or clipping cleanly.
 *
 * Enforcing a minimum content width and scrolling horizontally below it
 * keeps every column at a legible size on any screen, matching the same
 * overflow-x pattern already used by the shared shadcn `Table` component.
 */
export function TableScroll({
  children,
  minWidth = 640,
}: {
  children: React.ReactNode;
  minWidth?: number;
}) {
  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <div style={{ minWidth }}>{children}</div>
    </div>
  );
}
