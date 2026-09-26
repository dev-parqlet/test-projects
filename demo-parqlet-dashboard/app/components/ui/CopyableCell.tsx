"use client";

import { useState } from "react";

/**
 * Wraps table-cell content (or any inline text) so clicking it copies the
 * given `value` to the clipboard and shows a brief "Copied!" tooltip. Used
 * across table cells (names, emails, IDs, addresses, etc.) so users can
 * grab a value without manually selecting text — especially useful on
 * mobile where text selection inside a cramped table row is painful.
 *
 * Pass the exact string to copy via `value`; `children` is what's rendered
 * (usually the same text, already truncated/styled by the caller).
 */
export function CopyableCell({
  value,
  children,
  style,
  disabled,
}: {
  value: string | null | undefined;
  children: React.ReactNode;
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const canCopy = !disabled && !!value;

  async function handleClick(e: React.MouseEvent) {
    if (!canCopy) return;
    // Capture-phase + preventDefault so this reliably wins over any Link/anchor
    // this cell sits inside (or wraps): a bubble-phase stopPropagation() alone
    // can run too late to stop a Next.js <Link>'s own onClick (which may have
    // already fired and navigated) or too early to stop the browser's native
    // href navigation (which isn't cancelled by stopPropagation, only by
    // preventDefault). Intercepting on the capture phase stops the event
    // before it ever reaches a nested Link, and preventDefault blocks the
    // native default action of an ancestor Link.
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value as string);
    } catch {
      const el = document.createElement("textarea");
      el.value = value as string;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      try { document.execCommand("copy"); } catch { /* no-op */ }
      document.body.removeChild(el);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <span
      onClickCapture={handleClick}
      title={canCopy && !copied ? "Click to copy" : undefined}
      style={{
        position: "relative",
        cursor: canCopy ? "pointer" : "inherit",
        // Table cells render this as a flex item (each row's `cell()` helper
        // wraps content in a `display:flex` div). Flex items default to
        // `min-width: auto`, which refuses to shrink below the CONTENT's
        // natural width — so a long value (e.g. a long email) ignores its
        // column's allocated width entirely and bleeds into the next
        // column, overriding whatever ellipsis/truncation the caller's own
        // inner span sets up. minWidth:0 lets this shrink to fit; maxWidth
        // caps it so it can't grow past the column either. Callers with a
        // real reason to size differently (e.g. resident-row's fixed-width
        // name cells) can still override via `style`.
        minWidth: 0,
        maxWidth: "100%",
        ...style,
      }}
    >
      {/* className only (no inline font-size here) so the mobile override in
          globals.css — which uses !important to reach past each cell's own
          inline fontSize — can shrink it; see .copyable-cell-body rule. */}
      <span className="copyable-cell-body">{children}</span>
      {copied && (
        <span
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
            background: "var(--color-fill-strong)", color: "var(--color-text-white)",
            padding: "4px 8px", borderRadius: "var(--radius-8)",
            fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
            zIndex: 60, pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          Copied!
        </span>
      )}
    </span>
  );
}
