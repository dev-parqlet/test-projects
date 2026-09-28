"use client";

/**
 * Demo home — a standalone page, belonging to neither product.
 *
 * It has no sidebar, no building and no identity: it is not the Condo
 * dashboard and it is not the Apartments one, it is a page for looking at
 * the pieces themselves, away from the screens that use them. So it sits
 * at the top level rather than inside `(hoa)` or `(apartments)`, and the
 * front door lets it through without asking which product the visitor came
 * for (see lib/demo/product-path.ts).
 *
 * Reached by typing the URL. Nothing links here on purpose - see
 * ./layout.tsx.
 *
 * The figures below are written into the page rather than fetched, so it
 * renders the same thing every time and needs nothing running behind it.
 * The one thing it does NOT do is restate the arithmetic: every number is
 * produced by the same helpers the real screens call, so a rule that
 * changes there changes here too, and this page can never quietly become a
 * picture of how things used to work.
 */

import React, { useState } from "react";

import { Card } from "../components/ui/Card";
import { InfoTooltip } from "../components/ui/InfoTooltip";
import { NumberStepper } from "../components/ui/NumberStepper";
import { TabBar } from "../components/ui/TabBar";
import { EarningsProgressCard } from "../components/revenue/EarningsProgressCard";
import { bookingEarning } from "../lib/demo/booking-earnings";
import {
  APARTMENT_FLOOR_CENTS,
  APARTMENT_SUBSCRIPTION_CENTS,
  CONDO_FLOOR_CENTS,
  CONDO_SUBSCRIPTION_CENTS,
  formatMoney,
} from "../lib/demo/pricing";
import "../tokens.css";

/**
 * One booking of each kind the earnings rule has to handle. The ids are
 * chosen, not arbitrary: `bookingEarning` derives whether a credit was
 * reused from the id, so these pin each row to the case it is here to
 * show rather than leaving it to chance.
 */
const SAMPLE_BOOKINGS = [
  {
    id: "sample-2",
    label: "A spot the building owns, paid by card",
    amountCents: 1500,
    creditsSpent: 0,
    spotOwnerName: null,
    status: "Assigned",
  },
  {
    id: "sample-3",
    label: "A spot a resident lent, paid with a bought credit",
    amountCents: null,
    creditsSpent: 1,
    spotOwnerName: "Maya Chen",
    status: "Assigned",
  },
  {
    id: "sample-1",
    label: "Paid with a credit the resident had already earned",
    amountCents: null,
    creditsSpent: 1,
    spotOwnerName: "Liam Carter",
    status: "Assigned",
  },
  {
    id: "sample-6",
    label: "Refunded — the renter could not park",
    amountCents: 1500,
    creditsSpent: 0,
    spotOwnerName: null,
    status: "Cancelled",
  },
];

type PreviewTab = "earnings" | "bookings" | "controls";

const TABS = [
  { id: "earnings", label: "Earnings card" },
  { id: "bookings", label: "What a booking paid" },
  { id: "controls", label: "Controls" },
] as const satisfies readonly { id: PreviewTab; label: string }[];

export default function DemoHomePage() {
  const [tab, setTab] = useState<PreviewTab>("earnings");
  const [price, setPrice] = useState("15");

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <header>
          <span style={s.eyebrow}>Internal preview</span>
          <h1 style={s.h1}>Demo home</h1>
          <p style={s.sub}>
            The pieces the demo is built from, on their own. Not linked from
            anywhere and not part of either product — open it by URL when you
            want to look at one of these without walking through a dashboard
            to reach it.
          </p>
        </header>

        <TabBar active={tab} onChange={setTab} tabs={TABS} />

        {tab === "earnings" && (
          <section style={s.section}>
            <p style={s.note}>
              The same card, told twice. An Apartment&rsquo;s bill can reach
              zero and the surplus is a payout it withdraws, so it is offered
              one. A Condo is never paid out and its bill stops at a floor, so
              it is shown what it actually gets instead.
            </p>

            <div style={s.stack}>
              <div>
                <span style={s.caption}>Apartment</span>
                <EarningsProgressCard
                  product="apartment"
                  earningsCents={66780}
                  subscriptionCents={APARTMENT_SUBSCRIPTION_CENTS}
                  floorCents={APARTMENT_FLOOR_CENTS}
                  revenueHref="/apartment/revenue"
                />
              </div>
              <div>
                <span style={s.caption}>Condo</span>
                <EarningsProgressCard
                  product="condo"
                  earningsCents={66780}
                  subscriptionCents={CONDO_SUBSCRIPTION_CENTS}
                  floorCents={CONDO_FLOOR_CENTS}
                  revenueHref="/condo/revenue"
                />
              </div>
            </div>
          </section>
        )}

        {tab === "bookings" && (
          <section style={s.section}>
            <p style={s.note}>
              Three things come off what a renter paid, and each is a rule
              rather than a rounding. Our commission and the card fee. The
              gift-card reserve, but only on a spot a resident lent, because
              that is owed to them. And the whole amount when the credit had
              already been earned — no card was charged, so nothing new came
              in.
            </p>

            <Card>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {SAMPLE_BOOKINGS.map((b, i) => {
                  const earn = bookingEarning(b);
                  return (
                    <div
                      key={b.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "var(--spacing-16)",
                        padding: "var(--spacing-12) 0",
                        borderTop: i === 0 ? undefined : "1px solid var(--color-stroke-medium)",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 220, flex: 1 }}>
                        <span style={s.rowLabel}>{b.label}</span>
                        <span style={s.rowMeta}>
                          {earn.spotKindLabel} · {earn.payLabel}
                        </span>
                      </div>
                      {earn.refunded ? (
                        <span style={{ ...s.amount, color: "var(--color-text-weak)" }}>—</span>
                      ) : earn.zeroReason ? (
                        <InfoTooltip text={earn.zeroReason}>
                          <span
                            style={{
                              ...s.amount,
                              color: "var(--color-text-weak)",
                              borderBottom: "1px dotted var(--color-stroke-strong)",
                            }}
                          >
                            {formatMoney(earn.earnedCents)}
                          </span>
                        </InfoTooltip>
                      ) : (
                        <span style={{ ...s.amount, color: "var(--color-tag-text-active)" }}>
                          +{formatMoney(earn.earnedCents)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
            <p style={s.footnote}>
              Hover the $0.00 — the row explains itself rather than sending
              anyone to support to ask.
            </p>
          </section>
        )}

        {tab === "controls" && (
          <section style={s.section}>
            <p style={s.note}>
              The shared controls these screens are built from. The stepper
              never leaves its range and disables at each end; typing stays
              free, because clamping per keystroke would turn a 4 on the way
              to 40 into the minimum.
            </p>

            <Card>
              <div style={{ display: "flex", gap: "var(--spacing-24)", flexWrap: "wrap", alignItems: "flex-end" }}>
                <NumberStepper
                  label="Price per credit"
                  value={price}
                  min={6}
                  max={40}
                  onChange={(next) => setPrice(next.replace(/[^0-9]/g, "").slice(0, 2))}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={s.caption}>Tooltip</span>
                  <InfoTooltip text="A hint that belongs beside a figure, not in a help panel.">
                    <span style={{ ...s.amount, borderBottom: "1px dotted var(--color-stroke-strong)" }}>
                      Hover me
                    </span>
                  </InfoTooltip>
                </div>
              </div>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "var(--color-fill-weak)",
    padding: "var(--spacing-24) 16px",
    fontFamily: "var(--font-family-body)",
  },
  inner: {
    maxWidth: 880,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "var(--spacing-16)",
  },
  eyebrow: {
    fontSize: "var(--font-size-extra-tiny)",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--color-text-weak)",
  },
  h1: {
    margin: "var(--spacing-4) 0 0",
    fontSize: "var(--font-size-heading-1)",
    lineHeight: "var(--line-height-heading-1)",
    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
    fontFamily: "var(--font-family-heading)",
    color: "var(--color-text-strong)",
  },
  sub: {
    margin: "var(--spacing-8) 0 var(--spacing-24)",
    fontSize: "var(--font-size-body)",
    lineHeight: "var(--line-height-body)",
    color: "var(--color-text-weak)",
    maxWidth: 620,
  },
  section: { display: "flex", flexDirection: "column", gap: "var(--spacing-16)" },
  stack: { display: "flex", flexDirection: "column", gap: "var(--spacing-24)" },
  caption: {
    display: "block",
    marginBottom: "var(--spacing-8)",
    fontSize: "var(--font-size-extra-tiny)",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--color-text-weak)",
  },
  note: { margin: 0, fontSize: "var(--font-size-tiny)", lineHeight: 1.6, color: "var(--color-text-weak)", maxWidth: 620 },
  footnote: { margin: 0, fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" },
  rowLabel: { fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)" },
  rowMeta: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" },
  amount: { fontSize: "var(--font-size-tiny)", fontWeight: 600, whiteSpace: "nowrap" },
};
