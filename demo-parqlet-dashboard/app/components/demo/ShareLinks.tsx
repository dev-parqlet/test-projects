"use client";

/**
 * Copying a direct link to one of the two demos.
 *
 * The demo is shown by sending it, not by sitting next to someone, and the
 * two products live at different URLs. Asking a salesperson to remember
 * that `?v=apartments` exists, and to notice they are on `/apartments`
 * before they copy the address bar, is how a prospect ends up looking at
 * the wrong dashboard. So the link is a button.
 */

import React, { useState } from "react";

import {
  DEMO_IDENTITIES,
  shareUrl,
  type DemoVariant,
} from "../../lib/demo/variants";

/**
 * navigator.clipboard is unavailable on an insecure origin and can be
 * refused even on a secure one, so there is a fallback. Returning false
 * rather than throwing lets the caller say "copy failed" and show the URL
 * instead of leaving a button that appears to do nothing.
 */
async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      // Off-screen rather than hidden: a display:none textarea cannot be
      // selected, and the selection is what execCommand copies.
      ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function CopyLinkButton({
  variant,
  children,
  style,
}: {
  variant: DemoVariant;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");

  return (
    <button
      type="button"
      title={`Copy the ${DEMO_IDENTITIES[variant].label} link`}
      onClick={async (e) => {
        // Inside the header this sits next to the switcher, which
        // navigates on click. Copying must not also change the page.
        e.preventDefault();
        e.stopPropagation();
        const ok = await copy(shareUrl(variant));
        setState(ok ? "done" : "failed");
        window.setTimeout(() => setState("idle"), 2000);
      }}
      style={{ ...s.btn, ...style }}
    >
      {state === "done" ? "Copied" : state === "failed" ? "Copy failed" : (children ?? "Copy link")}
    </button>
  );
}

/** Both links, side by side. Used on the front door. */
export function ShareLinkList() {
  return (
    <div style={s.list}>
      {(Object.keys(DEMO_IDENTITIES) as DemoVariant[]).map((key) => (
        <div key={key} style={s.row}>
          <span style={s.rowLabel}>{DEMO_IDENTITIES[key].label}</span>
          <CopyLinkButton variant={key} />
        </div>
      ))}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  btn: {
    padding: "4px 10px",
    borderRadius: 6,
    border: "1px solid var(--color-stroke-medium)",
    background: "var(--color-fill-white)",
    color: "var(--color-text-weak)",
    fontSize: 12,
    fontFamily: "inherit",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "8px 12px",
    borderRadius: "var(--radius-8, 8px)",
    background: "var(--color-fill-weak)",
  },
  rowLabel: {
    fontSize: 13,
    color: "var(--color-text-strong)",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};
