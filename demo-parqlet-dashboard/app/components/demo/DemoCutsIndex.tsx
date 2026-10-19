"use client";

/**
 * The demo's front door: every link we hand out, in one place.
 *
 * demo.parqlet.com has no accounts, so there is nothing to sign in to.
 * What a visitor needs instead is to say WHICH cut they came to see,
 * and what a salesperson needs is a page they can copy a link off
 * mid-call without reading it out of the address bar first.
 *
 * Six rows, not two. The Condo rows are the same building and the same
 * mock corpus; the prefix only decides which optional features their
 * screens draw. Written out in `DEMO_CUTS` rather than generated from
 * the flag combinations, even though the parser accepts all eight - the
 * three nobody asked for would be three more links to explain.
 */

import React, { useState } from "react";
import Link from "next/link";

import { DEMO_CUTS, cutUrl, type DemoCut } from "../../lib/demo/variants";

/**
 * navigator.clipboard is unavailable on an insecure origin and can be
 * refused even on a secure one, so there is a fallback. Returning false
 * rather than throwing lets the button say "Copy failed" instead of
 * appearing to do nothing.
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

function CopyButton({ path }: { path: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  return (
    <button
      type="button"
      title="Copy this link"
      onClick={async (e) => {
        // The whole row is a link, so copying must not also navigate.
        e.preventDefault();
        e.stopPropagation();
        const ok = await copy(cutUrl(path));
        setState(ok ? "done" : "failed");
        window.setTimeout(() => setState("idle"), 2000);
      }}
      style={s.copy}
    >
      {state === "done" ? "Copied" : state === "failed" ? "Copy failed" : "Copy link"}
    </button>
  );
}

function Row({ cut }: { cut: DemoCut }) {
  return (
    <div style={s.row}>
      {/* A full page load, not a client navigation: every screen caches
          building-scoped data through react-query, and swapping the cut
          underneath them would leave one configuration's nav beside
          another's table for a moment. In front of a prospect that reads
          as a bug. */}
      <Link href={cut.path} prefetch={false} style={s.rowMain}>
        <span style={s.rowLabel}>{cut.label}</span>
        <span style={s.rowBlurb}>{cut.blurb}</span>
        <span style={s.rowPath}>{cut.path}</span>
      </Link>
      <CopyButton path={cut.path} />
    </div>
  );
}

export function DemoCutsIndex() {
  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Parqlet</h1>
        <p style={s.subtitle}>
          A live walkthrough of the dashboard, on sample data. Each link opens
          one configuration and stays in it.
        </p>

        <div style={s.list}>
          {DEMO_CUTS.map((cut) => (
            <Row key={cut.path} cut={cut} />
          ))}
        </div>

        <p style={s.footnote}>
          The Condo links are the same building with different features
          switched on. You can also flip Long-term parking and Storage from
          Settings once you are inside - the address bar follows, so whatever
          you copy from it opens exactly what you were looking at.
        </p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "var(--color-fill-weak)",
    fontFamily: "var(--font-family-body)",
  },
  card: {
    width: "100%",
    maxWidth: 640,
    background: "var(--color-fill-white)",
    border: "1px solid var(--color-stroke-medium)",
    borderRadius: "var(--radius-16, 16px)",
    padding: 32,
    boxSizing: "border-box",
  },
  title: { margin: 0, fontSize: 28, fontWeight: 600, color: "var(--color-text-strong)" },
  subtitle: {
    margin: "8px 0 24px",
    fontSize: 15,
    lineHeight: "22px",
    color: "var(--color-text-weak)",
  },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    borderRadius: "var(--radius-12, 12px)",
    border: "1px solid var(--color-stroke-medium)",
    background: "var(--color-fill-white)",
  },
  rowMain: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    flex: 1,
    minWidth: 0,
    textDecoration: "none",
  },
  rowLabel: { fontSize: 16, fontWeight: 600, color: "var(--color-text-strong)" },
  rowBlurb: { fontSize: 13, lineHeight: "18px", color: "var(--color-text-weak)" },
  rowPath: {
    fontSize: 12,
    color: "var(--color-text-weaker, #999)",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  copy: {
    padding: "6px 12px",
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
  footnote: {
    margin: "24px 0 0",
    fontSize: 12,
    lineHeight: "17px",
    color: "var(--color-text-weak)",
  },
};
