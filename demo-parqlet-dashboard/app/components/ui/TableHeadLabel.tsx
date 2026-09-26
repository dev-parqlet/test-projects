"use client";

import { useWindowWidth } from "../hooks/useWindowSize";

/**
 * Shared table header-cell label. Wraps onto a second line rather than
 * ellipsis-truncating — a truncated header ("BOOKED S…") gives no way to
 * recover the full column name without a hover/tap, and on mobile (no
 * hover) that meant some headers were never fully readable at all.
 * Font size steps down below 640px so more columns fit before scrolling
 * kicks in.
 */
export function TableHeadLabel({
  children,
  style,
}: {
  children: string;
  style?: React.CSSProperties;
}) {
  const width = useWindowWidth();
  const isMobile = width < 640;

  return (
    <span
      style={{
        display: "block",
        whiteSpace: "normal",
        wordBreak: "break-word",
        fontSize: isMobile ? "10px" : "var(--font-size-uppercase)",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
