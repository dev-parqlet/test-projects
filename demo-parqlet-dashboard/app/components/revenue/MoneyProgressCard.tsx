"use client";

/**
 * This month's money, on either dashboard.
 *
 * ONE card, both products. There used to be two - <SavingsProgressCard>
 * for Condos and <EarningsProgressCard> for Apartments - each with its own
 * headline, its own bar and its own way of listing where the money came
 * from. They were answering the same question in two visual languages, and
 * an operator who had seen one did not recognise the other.
 *
 * The question is always: what did this month's activity take off my bill,
 * and what happens to the rest? Three columns, in the order it is asked:
 *
 *   Saved on subscription   What came off. The number in green, because it
 *                           is the one the building is being sold.
 *   Next invoice            What is actually owed, with the undiscounted
 *                           figure struck through beside it. Striking it
 *                           rather than captioning it is deliberate: the
 *                           saving only means something against the price
 *                           that would otherwise have been paid.
 *   Carryover / Payout      What the bill could not absorb.
 *
 * The third column is where the products genuinely differ, and it is the
 * ONLY place they do:
 *
 *   Condo      A Condo is never paid. Its bill stops at a $100 floor and
 *              the remainder CARRIES INTO NEXT MONTH, where it is added to
 *              that month's earnings before the cap is applied again. So
 *              the column says "Carryover" and never "Payout" - promising
 *              a transfer that does not exist is the one mistake this card
 *              must not make.
 *   Apartment  An Apartment's bill reaches zero and the remainder is CASH,
 *              sent over Stripe Connect. Below the subscription there is
 *              no payout at all, so the column is absent rather than
 *              showing $0.00 - an empty third of the card reads as a
 *              feature that is broken rather than one that has not applied
 *              yet.
 *
 * The bar is the same claim drawn once. Its full width is the larger of
 * what is owed and what was earned, so:
 *
 *   lime   the earnings actually applied to the invoice
 *   blue   an Apartment's surplus, the part that leaves as cash
 *   grey   whatever the earnings did not cover
 *
 * A Condo therefore always ends in grey - the $100 it will pay whatever
 * happens - and that grey is labelled rather than left to be guessed at.
 */

import React from "react";
import Link from "next/link";

import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { formatMoney } from "../../lib/demo/pricing";

export type MoneySource = {
  id: string;
  /** "Community Spots", "Resident spots". */
  label: string;
  cents: number;
};

export function MoneyProgressCard({
  product,
  subscriptionCents,
  /** Everything this month's activity produced, before any cap. */
  earnedCents,
  /** What actually came off the bill. Capped by the floor on a Condo. */
  savedCents,
  /** What the bill could not absorb: a carryover, or cash. */
  remainderCents,
  floorCents,
  dueLabel,
  sources,
  href,
  bankConnected = false,
  /** "Oct 1 to ••4417", when a bank account is connected. */
  payoutNote,
  onConnectBank,
}: {
  product: "condo" | "apartment";
  subscriptionCents: number;
  earnedCents: number;
  savedCents: number;
  remainderCents: number;
  /** A Condo's bill never falls below this. Zero for an Apartment. */
  floorCents: number;
  dueLabel: string;
  sources: readonly MoneySource[];
  href: string;
  bankConnected?: boolean;
  payoutNote?: string;
  onConnectBank?: () => void;
}) {
  const isCondo = product === "condo";
  const dueCents = subscriptionCents - savedCents;
  const atMax = isCondo && floorCents > 0 && dueCents <= floorCents;

  // The percentage is of the SUBSCRIPTION, not of the maximum discount: an
  // Apartment operator reading "100%" means their bill is gone, and a
  // Condo's "80%" against a bill that stops at $100 is the floor made
  // arithmetic. Quoting it against the cap would show a Condo 100% beside
  // an invoice that is plainly not zero.
  const pctOfSubscription =
    subscriptionCents <= 0 ? 0 : Math.round((savedCents / subscriptionCents) * 100);

  // An Apartment below its subscription has nothing to pay out, and a
  // column of $0.00 reads as a broken feature rather than one that has not
  // applied yet. A Condo always shows its carryover, including at zero:
  // "nothing carried over" is the answer to a question a board asks.
  const showRemainder = isCondo || remainderCents > 0;

  // The bar spans whichever is larger - what is owed, or what was earned -
  // so an Apartment earning past its subscription grows the bar rather
  // than pinning it at full and hiding the surplus.
  const span = Math.max(subscriptionCents, isCondo ? subscriptionCents : earnedCents);
  const pct = (c: number) => (span <= 0 ? 0 : Math.min(100, (c / span) * 100));
  const payoutCents = isCondo ? 0 : remainderCents;

  // Only worth nagging when there is money with nowhere to send it.
  const needsBank = !isCondo && payoutCents > 0 && !bankConnected;

  const columns: { label: string; node: React.ReactNode; note: string }[] = [
    {
      label: "Saved on subscription",
      node: <span style={{ ...st.figure, color: "var(--color-text-success)" }}>{formatMoney(savedCents)}</span>,
      note: atMax
        ? "Max savings reached"
        : `${pctOfSubscription}% of your ${formatMoney(subscriptionCents)} subscription`,
    },
    {
      label: "Next invoice",
      node: (
        <span style={st.invoice}>
          {/* The full price, struck. The discount is only legible against
              what would otherwise have been owed. */}
          <s style={st.struck}>{formatMoney(subscriptionCents)}</s>
          <span style={st.figure}>{formatMoney(dueCents)}</span>
        </span>
      ),
      note: dueLabel,
    },
  ];

  if (showRemainder) {
    columns.push({
      label: isCondo ? "Carryover" : "Payout",
      node: <span style={st.figure}>{formatMoney(remainderCents)}</span>,
      note: isCondo
        ? "Applies to next month"
        : bankConnected
          ? (payoutNote ?? "Scheduled")
          : "Ready to pay out",
    });
  }

  return (
    // 16, not Card's default 24: every other card on this dashboard pads
    // to 16, and the odd one out read as a different kind of card.
    <Card style={{ padding: 16 }}>
      <div style={st.body}>
        <div style={st.headRow}>
          <span style={st.eyebrow}>
            This month&rsquo;s {isCondo ? "savings" : "earnings"}
          </span>
          <Link href={href} style={st.link}>
            View {isCondo ? "savings" : "earnings"}
          </Link>
        </div>

        <div className="money-columns">
          {columns.map((c, i) => (
            <React.Fragment key={c.label}>
              {/* Between sections only, and dropped entirely once the row
                  stacks - a rule at the top of a stacked column is the bug
                  that made this a grid in the first place. */}
              {i > 0 && <span className="money-divider" aria-hidden />}
              <div style={st.column}>
                <span style={st.colLabel}>{c.label}</span>
                {c.node}
                <span style={st.colNote}>{c.note}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div style={st.barWrap}>
          <div
            style={st.track}
            role="img"
            aria-label={`${formatMoney(savedCents)} of a ${formatMoney(subscriptionCents)} subscription covered${
              payoutCents > 0 ? `, ${formatMoney(payoutCents)} paid out` : ""
            }`}
          >
            <div style={{ ...st.fillApplied, width: `${pct(savedCents)}%` }} />
            {payoutCents > 0 && (
              <div
                style={{
                  ...st.fillPayout,
                  left: `${pct(savedCents)}%`,
                  width: `${pct(payoutCents)}%`,
                }}
              />
            )}
          </div>
          {/* Only a Condo's bar ends in a grey it can never fill, so only a
              Condo has to say why. */}
          {isCondo && floorCents > 0 && (
            <span style={st.floorNote}>Minimum subscription {formatMoney(floorCents)}</span>
          )}
        </div>

        {sources.length > 0 && (
          <div style={st.chipRow}>
            <span style={st.chipLead}>From:</span>
            {sources.map((s) => (
              <span key={s.id} style={st.chip}>
                {s.label} <strong style={st.chipValue}>{formatMoney(s.cents)}</strong>
              </span>
            ))}
          </div>
        )}

        {needsBank && (
          <div style={st.banner}>
            <span style={st.bannerIcon} aria-hidden>
              <IcBank />
            </span>
            <span style={st.bannerText}>Connect a bank account to receive your payout.</span>
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

const st: Record<string, React.CSSProperties> = {
  body: { display: "flex", flexDirection: "column", gap: "var(--spacing-16)" },
  headRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--spacing-16)",
  },
  eyebrow: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-uppercase)",
    lineHeight: "var(--line-height-uppercase)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "var(--color-text-weak)",
  },
  link: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-strong)",
    textDecoration: "none",
  },
  /* `.money-columns` / `.money-divider` live in globals.css because they
     need a media query: the columns sit left in a row with a hairline
     between them, and below 640px they stack and the hairlines disappear.
     Inline styles cannot express that, and a divider stranded at the top
     of a stacked column is exactly the bug that made this a grid before. */
  column: { display: "flex", flexDirection: "column", gap: 2, minWidth: 0 },
  colLabel: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
  },
  colNote: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
  },
  figure: {
    fontFamily: "var(--font-family-heading)",
    fontSize: "var(--font-size-heading-1)",
    lineHeight: "var(--line-height-heading-1)",
    color: "var(--color-text-strong)",
  },
  invoice: { display: "flex", alignItems: "baseline", gap: "var(--spacing-8)", flexWrap: "wrap" },
  struck: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-body)",
    color: "var(--color-text-weak)",
  },
  barWrap: { display: "flex", flexDirection: "column", gap: "var(--spacing-4)" },
  track: {
    position: "relative",
    height: 10,
    borderRadius: 999,
    background: "var(--color-stroke-medium)",
    overflow: "hidden",
  },
  fillApplied: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    background: "var(--color-spot-community)",
    borderRadius: 999,
  },
  fillPayout: {
    position: "absolute",
    top: 0,
    bottom: 0,
    background: "var(--color-blue-1000)",
    borderRadius: 999,
  },
  floorNote: {
    alignSelf: "flex-end",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
  },
  chipRow: { display: "flex", alignItems: "center", gap: "var(--spacing-8)", flexWrap: "wrap" },
  chipLead: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
  },
  chip: {
    padding: "6px var(--spacing-12)",
    borderRadius: 999,
    background: "var(--color-tag-bg-neutral)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
    whiteSpace: "nowrap",
  },
  chipValue: {
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    color: "var(--color-tag-text-neutral)",
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
  bannerText: { flex: 1, fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", minWidth: 200 },
};
