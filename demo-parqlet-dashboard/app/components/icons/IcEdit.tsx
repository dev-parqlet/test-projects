/**
 * The edit pencil, for a storage unit the office has already confirmed.
 *
 * ─── THE SAME GLYPH THE SUPER-ADMIN BUILDING PAGE USES ──────────────
 *
 * Lifted from `EditableRow` in web-dashboard's
 * `app/(superadmin)/buildings/[id]/page.tsx`, where it sits beside HOA
 * Contact and Verification Method. Client, 2026-10-21: "we had for
 * SAdmin for building editing, same like here."
 *
 * It was an inline SVG with no component around it, which is why a
 * search for an edit icon found nothing and the first attempt here was
 * a drawn-from-scratch plain pencil. Those are two different marks,
 * and an app that uses both has two ways of saying "edit".
 *
 * `currentColor` by default, like the original - the SA page colours
 * it by setting `color` on the button, and the directory does the
 * same, so the icon inherits whatever the row is doing on hover.
 */
export function IcEdit({
  size = 14,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* The page behind it, open at the corner the pencil rests on. */}
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      {/* The pencil itself, nib to eraser. */}
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
