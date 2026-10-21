/**
 * A pencil, for a storage unit the office has already confirmed.
 *
 * The directory's Storage column shows one of three things: two action
 * icons while a claim is waiting, this pencil once it is approved, or
 * N/A when the resident has none. So the pencil's job is to say "this
 * is settled, and you can still change it" without looking like
 * another decision to make - which is why it is a single quiet glyph
 * beside the number rather than a button.
 *
 * Drawn to sit with the set: 24x24 box, 1.5 stroke, rounded joins, and
 * `color` driving the stroke exactly like IcCheck and IcReject.
 */
export function IcEdit({
  size = 24,
  color = "var(--color-text-weak)",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* The body of the pencil, nib to eraser. */}
      <path
        d="M4 20h4L18.5 9.5a2.121 2.121 0 0 0-3-3L5 17v3Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* The ferrule line, so the shape reads as a pencil at 16px and
          not as a plain diagonal. */}
      <path
        d="M13.5 8.5l3 3"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
