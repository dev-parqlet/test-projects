'use client';

/**
 * Storage bookings — an isometric box: the outer hexagon of a cube
 * seen corner-on, with the three edges that meet at its front vertex.
 *
 * Replaces the locker-front drawing on 2026-10-21, from the designer's
 * own SVG. The old note here argued against "a cardboard box" as
 * reading like archive or package; the box won anyway, and at 24px a
 * cube silhouette is easier to tell from the calendar and clock icons
 * either side of it than a square with two small handles was.
 *
 * `stroke` comes from the `color` prop rather than the #222222 baked
 * into the source file, so the sidebar's active/inactive tint drives
 * it exactly like every other row. Pasting the hard-coded value would
 * leave this one icon dark when its neighbours lighten.
 */
export function IcStorage({
  color = "var(--color-text-weaker)",
  /**
   * 24 for the sidebar it was drawn for; Settings > Notifications draws
   * its group icons at 20. A prop rather than a second copy of the
   * paths - the viewBox is already 24 either way, so only the rendered
   * box changes.
   */
  size = 24,
}: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <g clipPath="url(#ic-storage-clip)">
        <path
          d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 12L20 7.5"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 12V21"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 12L4 7.5"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        {/*
          The id is namespaced. Two of these render at once - the
          sidebar row and the Settings > Notifications group heading -
          and SVG ids are global to the document, so a bare
          "clip0_3613_38142" from the export would have the second
          instance clipping against the first one's rect.
        */}
        <clipPath id="ic-storage-clip">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
