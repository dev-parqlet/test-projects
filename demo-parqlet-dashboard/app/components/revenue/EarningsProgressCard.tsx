"use client";

/**
 * This month's earnings, on the dashboard.
 *
 * The one card that answers the question an operator actually opens the
 * dashboard with: is this thing paying for itself yet? So it leads with
 * the earnings, shows them eating the subscription, and names what is
 * left - rather than making them open Revenue to find out.
 *
 * The two products end that sentence differently, and the card must not
 * blur them:
 *
 *   Apartment  The bill can reach zero and the surplus is a PAYOUT, money
 *              the building withdraws. So it shows a payout figure, and
 *              nags for a bank account when there is money waiting and
 *              nowhere to send it.
 *   Condo      The bill stops at a floor and the building is never paid
 *              out - a Condo's surplus is additional revenue against next
 *              month. Showing it a "payout" would promise a transfer that
 *              does not exist, so it gets neither the word nor the banner.
 *
 * It shares <OffsetBar> with the Revenue page on purpose. The bar is the
 * same claim in both places, and an operator who has seen one should
 * recognise the other; a second bar drawn slightly differently reads as a
 * second, disagreeing number.
 */

import React from "react";
import Link from "next/link";

import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { OffsetBar } from "./index";
import { applyOffset, formatMoney } from "../../lib/demo/pricing";
import { earningsBreakdown } from "../../lib/demo/earnings-breakdown";

export function EarningsProgressCard({
  product,
  earningsCents,
  subscriptionCents,
  floorCents,
  revenueHref,
  payoutNote,
  bankConnected = false,
  onConnectBank,
}: {
  product: "condo" | "apartment";
  earningsCents: number;
  subscriptionCents: number;
  floorCents: number;
  /** Where "View earnings" goes - the product's own Revenue page. */
  revenueHref: string;
  /** When the surplus is paid, e.g. "Sent Oct 1". Apartments only. */
  payoutNote?: string;
  bankConnected?: boolean;
  onConnectBank?: () => void;
}) {
  const offset = applyOffset({ subscriptionCents, earningsCents, floorCents });
  const sources = earningsBreakdown(product, earningsCents);
  const isApartment = product === "apartment";

  const coveredPct =
    subscriptionCents <= 0
      ? 100
      : Math.round((offset.appliedCents / subscriptionCents) * 100);

  // A Condo is never paid out, so its surplus is named for what it is.
  const surplusLabel = isApartment ? "Payout" : "Extra earned";
  const surplusNote = isApartment
    ? offset.surplusCents > 0
      ? (payoutNote ?? "Awaiting a bank account")
      : "Nothing to pay out yet"
    : "On top of your bill";

  // Only worth nagging when there is money with nowhere to go.
  const needsBank = isApartment && !bankConnected && offset.surplusCents > 0;

  return (
    <Card>
      <div style={s.body}>
        <div style={s.headRow}>
          <span style={s.eyebrow}>This month&rsquo;s earnings</span>
          <Link href={revenueHref} style={s.link}>
            View earnings
          </Link>
        </div>

        <div style={s.figureRow}>
          <div style={s.headline}>
            <span style={s.big}>{formatMoney(earningsCents)}</span>
            <span style={s.bigNote}>earned</span>
          </div>
          <div style={s.surplus}>
            <span style={s.surplusLabel}>{surplusLabel}</span>
            <span style={s.surplusValue}>{formatMoney(offset.surplusCents)}</span>
            <span style={s.surplusNote}>{surplusNote}</span>
          </div>
        </div>

        <span style={s.line}>
          Subscription <strong>{formatMoney(subscriptionCents)}</strong> ·{" "}
          <strong style={{ color: "var(--color-tag-text-active)" }}>
            Covered {coveredPct}%
          </strong>{" "}
          · Next invoice <strong>{formatMoney(offset.dueCents)}</strong>
        </span>

        <OffsetBar
          offset={offset}
          compact
          floorLabel={`Your bill stops at ${formatMoney(floorCents)}`}
        />

        {sources.length > 0 && (
          <div style={s.chips}>
            {sources.map((src) => (
              <span key={src.id} style={s.chip}>
                {src.label} <strong>{formatMoney(src.cents)}</strong>
              </span>
            ))}
          </div>
        )}

        {needsBank && (
          <div style={s.banner}>
            <span style={s.bannerIcon} aria-hidden>
              <IcBank />
            </span>
            <span style={s.bannerText}>
              You&rsquo;re earning more than your subscription. Connect a bank
              account to receive payouts.
            </span>
            <Button
              variant="secondary"
              size="small"
              style={{ width: "auto", whiteSpace: "nowrap" }}
              onClick={onConnectBank}
            >
              Set up payouts
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function IcBank() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10 2.5 17.5 6.5H2.5L10 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M4.5 9v5M8 9v5M12 9v5M15.5 9v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M2.5 17h15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const s: Record<string, React.CSSProperties> = {
  body: { display: "flex", flexDirection: "column", gap: "var(--spacing-16)" },
  headRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--spacing-16)" },
  eyebrow: {
    fontSize: "var(--font-size-extra-tiny)",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--color-text-weak)",
  },
  link: {
    fontSize: "var(--font-size-tiny)",
    fontWeight: 600,
    color: "var(--color-text-strong)",
    textDecoration: "none",
  },
  figureRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "var(--spacing-16)",
    flexWrap: "wrap",
  },
  headline: { display: "flex", alignItems: "baseline", gap: "var(--spacing-8)" },
  big: {
    fontSize: "var(--font-size-heading-1)",
    lineHeight: 1.1,
    fontFamily: "var(--font-family-heading)",
    color: "var(--color-text-strong)",
  },
  bigNote: { fontSize: "var(--font-size-body)", color: "var(--color-text-weak)" },
  surplus: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 },
  surplusLabel: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" },
  surplusValue: {
    fontSize: "var(--font-size-heading-2)",
    lineHeight: 1.1,
    fontFamily: "var(--font-family-heading)",
    color: "var(--color-text-strong)",
  },
  surplusNote: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" },
  line: { fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" },
  chips: { display: "flex", gap: "var(--spacing-8)", flexWrap: "wrap" },
  chip: {
    padding: "6px var(--spacing-12)",
    borderRadius: 999,
    background: "var(--color-fill-weak)",
    fontSize: "var(--font-size-extra-tiny)",
    color: "var(--color-text-weak)",
    whiteSpace: "nowrap",
  },
  banner: {
    display: "flex",
    alignItems: "center",
    gap: "var(--spacing-12)",
    padding: "var(--spacing-12) var(--spacing-16)",
    borderRadius: "var(--radius-8)",
    background: "var(--color-blue-50)",
    color: "var(--color-text-strong)",
  },
  bannerIcon: { display: "flex", flexShrink: 0, color: "var(--color-text-weak)" },
  bannerText: { flex: 1, fontSize: "var(--font-size-tiny)", lineHeight: 1.5, minWidth: 200 },
};
