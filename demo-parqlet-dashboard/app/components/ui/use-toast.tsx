"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * The confirmation that something worked, bottom-centre, gone in four
 * seconds.
 *
 * Lifted out of the Subscription page, which had the only copy, because
 * every screen that quietly changes something behind a modal needs the
 * same reassurance and the alternative was a third copy of the same forty
 * lines. `AlertToast` is NOT this: it is bound to `RealtimeAlert` and
 * carries severity theming, which a "Spot 204 added" has no use for.
 *
 * Returns the node rather than portalling it, so the caller decides where
 * in its tree the fixed element lives.
 */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((text: string) => {
    setMsg(text);
    // Cleared first, or a second toast inherits the first one's deadline
    // and vanishes early.
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 4000);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const node = msg ? (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: "var(--spacing-32)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--color-fill-strong)",
        color: "var(--color-text-white)",
        padding: "var(--spacing-12) var(--spacing-24)",
        borderRadius: "var(--radius-12)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
        fontFamily: "var(--font-family-body)",
        fontSize: "var(--font-size-tiny)",
        fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
        zIndex: 3000,
        maxWidth: "calc(100vw - 32px)",
        textAlign: "center",
      }}
    >
      {msg}
    </div>
  ) : null;

  return { show, node };
}
