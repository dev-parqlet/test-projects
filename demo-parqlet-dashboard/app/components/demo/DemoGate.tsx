"use client";

/**
 * The demo's front door.
 *
 * demo.parqlet.com has no accounts, so there is nothing to sign in to — but
 * a visitor still has to say WHICH product they came to see. This stands in
 * for the sign-in screen: two choices, one click, straight into the
 * dashboard.
 *
 * Skipped entirely when the URL already names a product - which /condo/...
 * and /apartment/... always do - so a link sent to an apartment operator
 * opens on their product rather than asking them to pick between two
 * things they have not heard of yet. In practice only `/` ever shows this.
 */

import React, { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import { ShareLinkList } from "./ShareLinks";
import { isUnscopedPath } from "../../lib/demo/product-path";
import {
  DEMO_IDENTITIES,
  hasChosenVariant,
  setVariant,
  type DemoVariant,
} from "../../lib/demo/variants";

export function DemoGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Rendered on the server too, where localStorage does not exist, so the
  // answer has to come from a client-only source without tripping a
  // hydration mismatch. useSyncExternalStore is the sanctioned way to read
  // one: it renders `null` on the server and the real answer on the client,
  // and React reconciles that itself instead of us setting state in an
  // effect and causing a cascading render.
  //
  // `subscribe` is a no-op because the choice cannot change without a full
  // page load - setVariant() navigates rather than re-rendering, precisely
  // so no screen is left holding another building's cached data.
  const decided = useSyncExternalStore<boolean | null>(
    () => () => {},
    () => hasChosenVariant(),
    () => null,
  );

  // A page belonging to neither product has nothing to gate: asking a
  // visitor to choose Condo or Apartments before showing it would be a
  // question about something the page does not use.
  if (isUnscopedPath(pathname)) return <>{children}</>;

  if (decided === null) return null;
  if (decided) return <>{children}</>;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Parqlet</h1>
        <p style={styles.subtitle}>
          A live walkthrough of the dashboard. Pick the one you would like to
          see.
        </p>

        <div style={styles.options}>
          {(Object.keys(DEMO_IDENTITIES) as DemoVariant[]).map((key) => {
            const it = DEMO_IDENTITIES[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setVariant(key)}
                style={styles.option}
              >
                <span style={styles.optionLabel}>{it.label}</span>
                <span style={styles.optionBlurb}>{it.blurb}</span>
              </button>
            );
          })}
        </div>

        {/* Sending the demo is the point of it, so the links are here
            rather than left to be reconstructed from the address bar. */}
        <div style={styles.share}>
          <span style={styles.shareTitle}>Send a direct link</span>
          <ShareLinkList />
        </div>

        <p style={styles.footnote}>
          Everything here is sample data. The two demos live at their own
          addresses and do not link to each other, so a link you send opens
          one product and stays in it.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
    maxWidth: 560,
    background: "var(--color-fill-white)",
    border: "1px solid var(--color-stroke-medium)",
    borderRadius: "var(--radius-16, 16px)",
    padding: 32,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 600,
    color: "var(--color-text-strong)",
  },
  subtitle: {
    margin: "8px 0 24px",
    fontSize: 15,
    lineHeight: "22px",
    color: "var(--color-text-weak)",
  },
  options: { display: "flex", flexDirection: "column", gap: 12 },
  option: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    textAlign: "left",
    width: "100%",
    padding: "16px 18px",
    borderRadius: "var(--radius-12, 12px)",
    border: "1px solid var(--color-stroke-medium)",
    background: "var(--color-fill-white)",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 600,
    color: "var(--color-text-strong)",
  },
  optionBlurb: {
    fontSize: 13,
    lineHeight: "18px",
    color: "var(--color-text-weak)",
  },
  share: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 24,
    paddingTop: 20,
    borderTop: "1px solid var(--color-stroke-medium)",
  },
  shareTitle: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: "var(--color-text-weak)",
  },
  footnote: {
    margin: "24px 0 0",
    fontSize: 12,
    lineHeight: "16px",
    color: "var(--color-text-weak)",
  },
};
