"use client";

/**
 * This month's savings, on the Condo dashboard.
 *
 * A separate card from <EarningsProgressCard>, not a branch inside it,
 * because the two products lead with different numbers and the card's whole
 * job is which number is largest on the screen.
 *
 *   Apartment  leads with what it EARNED. The bill can reach zero and the
 *              surplus is money withdrawn, so earnings are the headline and
 *              the invoice is the consequence.
 *   Condo      leads with the NEXT INVOICE. A Condo is never paid; the only
 *              thing that changes hands is a smaller bill, and that is the
 *              number a board reads out at a meeting. Leading with
 *              "earnings" invites them to look for money that never arrives.
 *
 * The bar measures the SAVING against the most that is possible, not
 * against the subscription. A Condo's bill stops at a floor, so a full bar
 * means "as cheap as this gets" rather than "free" - drawing it against the
 * subscription would leave it permanently 80% full and looking unfinished
 * at the exact moment the building has done as well as it can.
 *
 * The surplus is a CARRYOVER, shown as a small chip rather than a figure.
 * It is real money and must not vanish, but it is next month's business,
 * and giving it the same weight as the invoice would read as a second
 * amount owed.
 */

import React from "react";
import Link from "next/link";

import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import {
  applyCondoSavings,
  formatMoney,
  savingsBarFill,
} from "../../lib/demo/pricing";

export function SavingsProgressCard({
  earningsCents,
  carriedInCents = 0,
  subscriptionCents,
  floorCents,
  savingsHref,
  dueLabel,
}: {
  /** What resident sharing brought in this month. */
  earningsCents: number;
  /** Unspent savings carried in from earlier months. */
  carriedInCents?: number;
  subscriptionCents: number;
  floorCents: number;
  /** Where "View savings" goes. */
  savingsHref: string;
  /** When the invoice falls due, e.g. "Due Oct 1". */
  dueLabel?: string;
}) {
  const s = applyCondoSavings({
    earningsCents,
    carriedInCents,
    subscriptionCents,
    floorCents,
  });
  const fill = savingsBarFill(s);

  return (
    <Card>
      <div style={st.body}>
        <div style={st.headRow}>
          <span style={st.eyebrow}>This month&rsquo;s savings</span>
          <Link href={savingsHref} style={st.link}>
            View savings
          </Link>
        </div>

        <div style={st.figureRow}>
          <div style={st.headline}>
            <span style={st.label}>Next invoice</span>
            <span style={st.big}>{formatMoney(s.dueCents)}</span>
            <span style={st.bigNote}>
              {dueLabel ? `${dueLabel} · ` : ""}Subscription{" "}
              {formatMoney(s.subscriptionCents)}
            </span>
          </div>
          <div style={st.saved}>
            <span style={st.label}>You saved</span>
            <span style={st.savedValue}>{formatMoney(s.savingsCents)}</span>
            <span style={st.bigNote}>thanks to resident sharing</span>
          </div>
        </div>

        <div style={st.track} role="img" aria-label={`${Math.round(fill * 100)}% of the most you can save`}>
          <div style={{ ...st.fill, width: `${fill * 100}%` }} />
        </div>

        <div style={st.barFoot}>
          {s.atMax ? (
            <span style={st.maxed}>
              <IcCheck /> Max savings reached
            </span>
          ) : (
            <span style={st.footNote}>
              {formatMoney(s.maxSavingsCents - s.savingsCents)} more to reach the max
            </span>
          )}
          <span style={st.footNote}>Minimum bill {formatMoney(s.floorCents)}</span>
        </div>

        <div style={st.divider} />

        <div style={st.barFoot}>
          <span style={st.supporting}>
            <strong style={st.supportingStrong}>{formatMoney(s.availableCents)}</strong> from
            resident sharing this month
          </span>
          {s.carriedOverCents > 0 && (
            /* The app's existing "upcoming" tag, which is already the pale
               blue the design shows - a carryover IS next month's. */
            <Badge variant="upcoming" as="span">
              <span aria-hidden style={st.chipArrow}>&rarr;</span>
              <strong>{formatMoney(s.carriedOverCents)}</strong>
              <span style={st.chipTail}>carries over to next month</span>
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

function IcCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8.5l3.2 3.2L13 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const st: Record<string, React.CSSProperties> = {
  body: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--spacing-12)",
    padding: "var(--spacing-20)",
  },
  headRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--spacing-12)" },
  eyebrow: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-extra-tiny)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--color-text-weak)",
  },
  link: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    color: "var(--color-text-strong)",
    textDecoration: "none",
  },
  figureRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "var(--spacing-16)",
    flexWrap: "wrap",
  },
  headline: { display: "flex", flexDirection: "column", gap: 2, minWidth: 0 },
  saved: { display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end", textAlign: "right", minWidth: 0 },
  label: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
  },
  big: {
    fontFamily: "var(--font-family-heading)",
    fontSize: "var(--font-size-heading-1)",
    lineHeight: "var(--line-height-heading-1)",
    color: "var(--color-text-strong)",
  },
  savedValue: {
    fontFamily: "var(--font-family-heading)",
    fontSize: "var(--font-size-heading-1)",
    lineHeight: "var(--line-height-heading-1)",
    color: "var(--color-text-success)",
  },
  bigNote: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
  },
  track: {
    height: 10,
    borderRadius: 999,
    background: "var(--color-fill-weak)",
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 999, background: "var(--color-button-primary)" },
  barFoot: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--spacing-12)",
    flexWrap: "wrap",
  },
  maxed: {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--spacing-6)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    color: "var(--color-text-success)",
  },
  footNote: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
  },
  divider: { height: 1, background: "var(--color-stroke-medium)" },
  supporting: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
  },
  supportingStrong: { color: "var(--color-text-strong)" },
  chipArrow: { marginRight: "var(--spacing-6)" },
  chipTail: { marginLeft: "var(--spacing-6)" },
};
