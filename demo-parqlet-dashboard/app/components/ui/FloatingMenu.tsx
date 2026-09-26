"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders its children into a `document.body` portal, fixed-positioned
 * against `anchorRef`'s current screen position. Table row "⋮" menus that
 * render via `position: absolute` inside a `TableScroll` get clipped —
 * `overflowX: auto` forces the paired Y axis to `auto` too (CSS spec), so a
 * menu opened near the bottom of a scrolled table is cut off. A portal
 * escapes that ancestor's clipping box entirely instead of just repositioning
 * within it.
 */
const VIEWPORT_MARGIN = 8;

export function FloatingMenu({
  anchorRef,
  onClose,
  align = "end",
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  align?: "start" | "end";
  children: React.ReactNode;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number } | null>(null);

  // Two passes, both through this same effect (re-triggered by its own
  // `pos` write, converging after one extra pass):
  //   1. Menu isn't mounted yet, so its real width/height is unknown —
  //      guess "open below, keep the requested align" the trigger.
  //   2. Now that the guess caused it to mount, measure its actual size.
  //      If "open below" would run past the bottom of the viewport, flip
  //      it above the trigger instead — same idea horizontally: a menu
  //      wider than the space between the anchor and the near edge (e.g.
  //      an `align="end"` menu whose anchor sits close to the left edge
  //      on a narrow/mobile viewport) gets pinned to the viewport margin
  //      instead of extending off-screen. The portal already stops an
  //      ancestor's overflow from clipping it; without this it just
  //      painted past the edge of the screen instead.
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();

    if (!menuRef.current) {
      setPos(
        align === "end"
          ? { top: rect.bottom + 4, right: window.innerWidth - rect.right }
          : { top: rect.bottom + 4, left: rect.left }
      );
      return;
    }

    const menuRect = menuRef.current.getBoundingClientRect();
    const overflowsBottom = rect.bottom + 4 + menuRect.height > window.innerHeight;
    const top = overflowsBottom ? Math.max(4, rect.top - menuRect.height - 4) : rect.bottom + 4;

    let left: number | undefined;
    let right: number | undefined;
    if (align === "end") {
      const naturalLeft = rect.right - menuRect.width;
      left = naturalLeft < VIEWPORT_MARGIN ? VIEWPORT_MARGIN : undefined;
      right = left == null ? window.innerWidth - rect.right : undefined;
    } else {
      const naturalRight = rect.left + menuRect.width;
      right = naturalRight > window.innerWidth - VIEWPORT_MARGIN ? VIEWPORT_MARGIN : undefined;
      left = right == null ? rect.left : undefined;
    }

    setPos((p) => {
      if (p && p.top === top && p.left === left && p.right === right) return p;
      return { top, left, right };
    });
  }, [anchorRef, align, pos]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    }
    // Closing on scroll/resize (rather than re-measuring) keeps this simple —
    // these menus are short-lived, click-to-open affordances, not menus a
    // user expects to track the trigger while scrolling past it.
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose, anchorRef]);

  if (!pos) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: pos.top,
        ...(pos.left != null ? { left: pos.left } : {}),
        ...(pos.right != null ? { right: pos.right } : {}),
        zIndex: 3000,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
