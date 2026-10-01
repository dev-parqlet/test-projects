"use client";

/**
 * The pieces both Revenue screens are built from.
 *
 * Condos and Apartments tell DIFFERENT stories about the same arithmetic.
 * A Condo's earnings pull its bill down towards a floor; an Apartment's
 * clear the bill outright and the rest is money it withdraws. So the
 * pages stay separate - Apartments is its own product, not an HOA with
 * extra rows - but the figure, the offset bar and the history table are
 * presentation, and there is no reason for two of each to drift apart.
 *
 * Nothing here knows which product it is rendering. Everything it shows
 * is passed in.
 */

import React from "react";
import Link from "next/link";

import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { TableHeadLabel } from "../ui/TableHeadLabel";
import {
  formatMoney,
  savingsBarFill,
  type CondoSavings,
  type OffsetResult,
} from "../../lib/demo/pricing";

// ── A single number with a label ──────────────────────────────────────

export function Figure({
  label,
  value,
  note,
  tone = "normal",
}: {
  label: string;
  value: string;
  note?: string;
  /** `strong` is the number the operator came to see; `muted` is a deduction. */
  tone?: "normal" | "strong" | "muted";
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <span style={st.figureLabel}>{label}</span>
      <span
        style={{
          fontSize: tone === "strong" ? "var(--font-size-heading-2)" : "var(--font-size-heading-3)",
          fontWeight: tone === "strong" ? 700 : 500,
          color: tone === "muted" ? "var(--color-text-weak)" : "var(--color-text-strong)",
          fontFamily: "var(--font-family-heading)",
          lineHeight: 1.2,
        }}
      >
        {value}
      </span>
      {note && <span style={st.figureNote}>{note}</span>}
    </div>
  );
}

export function FigureRow({ children }: { children: React.ReactNode }) {
  return <div style={st.figures}>{children}</div>;
}

// ── A titled card ─────────────────────────────────────────────────────

export function RevenueCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    // 16, like every other card on the dashboard. Card defaults to 24,
    // which left these two sitting lower than their neighbours.
    <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
      {/* Title left, control right. The badge slot carries a range picker
          on the chart cards, so the row has to separate rather than hug.

          minHeight is what keeps the two titles level: a card WITH a range
          pill got a taller header row than one without, so side by side
          their titles sat at different heights. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--spacing-12)",
          flexWrap: "wrap",
          minHeight: 32,
        }}
      >
        <span style={st.cardTitle}>{title}</span>
        {badge}
      </div>
      {children}
    </Card>
  );
}

// ── The offset, drawn ─────────────────────────────────────────────────

/**
 * How much of the subscription this month's earnings paid off.
 *
 * The bar is filled to the share of the invoice the earnings covered, and
 * the floor is marked where the discount stops. On a Condo the floor sits
 * part-way along and the bar cannot pass it, which is the $100 minimum
 * made visible rather than explained in a footnote.
 */
export function OffsetBar({
  offset,
  floorLabel,
  /** Hide the legend under the track, for a caller that states the same
   *  figures in its own header. The floor note survives, because nothing
   *  else on a Condo card explains why the bar stops short. */
  compact = false,
}: {
  offset: OffsetResult;
  floorLabel?: string;
  compact?: boolean;
}) {
  const { subscriptionCents, appliedCents, floorCents } = offset;
  // A zero subscription has nothing to offset and no bar to draw.
  if (subscriptionCents <= 0) return null;

  const pct = (c: number) => `${Math.min(100, Math.max(0, (c / subscriptionCents) * 100))}%`;
  const maxOffsetCents = Math.max(0, subscriptionCents - floorCents);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
      <div style={st.track} role="img" aria-label={`${formatMoney(appliedCents)} of ${formatMoney(subscriptionCents)} covered by earnings`}>
        <div style={{ ...st.fill, width: pct(appliedCents) }} />
        {floorCents > 0 && (
          <div style={{ ...st.floorMark, left: pct(maxOffsetCents) }} />
        )}
      </div>
      <div style={{ ...st.trackLegend, display: compact && floorCents === 0 ? "none" : undefined }}>
        {!compact && (
          <span>
            <span style={st.swatch} /> {formatMoney(appliedCents)} covered by your earnings
          </span>
        )}
        {floorCents > 0 && (
          <span style={{ color: "var(--color-text-weak)" }}>
            {floorLabel ?? `Discount stops at ${formatMoney(floorCents)}`}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * How much of the POSSIBLE saving a Condo has taken.
 *
 * Deliberately not <OffsetBar>. That one measures the discount against the
 * whole subscription, which is the right picture for an Apartment - its
 * bill really can reach zero. A Condo's stops at a floor, so the same bar
 * can never fill, and a building that has saved every cent it is allowed to
 * sees a bar sitting short with a marker explaining why. This one measures
 * against the maximum instead, so "as cheap as this gets" looks like it.
 *
 * Shared by the dashboard card and the Savings page so the two cannot draw
 * the same claim differently.
 */
export function SavingsBar({
  savings,
  showFoot = true,
}: {
  savings: CondoSavings;
  /** Off for a caller that states the same two facts in its own layout. */
  showFoot?: boolean;
}) {
  const fill = savingsBarFill(savings);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
      <div
        style={st.track}
        role="img"
        aria-label={`${Math.round(fill * 100)}% of the most you can save`}
      >
        <div style={{ ...st.fill, width: `${fill * 100}%` }} />
      </div>
      {showFoot && (
        <div style={st.trackLegend}>
          {savings.atMax ? (
            <span style={{ color: "var(--color-text-success)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"] }}>
              Max savings reached
            </span>
          ) : (
            <span style={{ color: "var(--color-text-weak)" }}>
              {formatMoney(savings.maxSavingsCents - savings.savingsCents)} more to reach the max
            </span>
          )}
          <span style={{ color: "var(--color-text-weak)" }}>
            Minimum bill {formatMoney(savings.floorCents)}
          </span>
        </div>
      )}
    </div>
  );
}

// ── History ───────────────────────────────────────────────────────────

export type HistoryRow = {
  id: string;
  period: string;
  grossCents: number;
  feesCents: number;
  netCents: number;
  status: string;
  /** Right-hand column: a payout date for Apartments, an invoice for Condos. */
  trailing: string;
};

export function HistoryTable({
  columns,
  rows,
  emptyText = "Nothing yet.",
}: {
  /** Six headings, matching the six cells each row renders. */
  columns: readonly [string, string, string, string, string, string];
  rows: readonly HistoryRow[];
  emptyText?: string;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={st.table}>
        <thead>
          <tr>
            {columns.map((h) => (
              <th key={h} style={st.th}>
                <TableHeadLabel style={{ color: "var(--color-text-weak)" }}>{h}</TableHeadLabel>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={st.td}>{r.period}</td>
              <td style={st.td}>{formatMoney(r.grossCents)}</td>
              <td style={{ ...st.td, color: "var(--color-text-weak)" }}>− {formatMoney(r.feesCents)}</td>
              <td style={{ ...st.td, fontWeight: 600 }}>{formatMoney(r.netCents)}</td>
              <td style={st.td}>
                <Badge as="span" variant={r.status === "Paid" ? "active" : "pending"}>{r.status}</Badge>
              </td>
              <td style={{ ...st.td, color: "var(--color-text-weak)" }}>{r.trailing}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td style={{ ...st.td, color: "var(--color-text-weak)" }} colSpan={6}>{emptyText}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Page header ───────────────────────────────────────────────────────

/**
 * Just the title now.
 *
 * The pitch and the explanation moved into the "What a spot costs" card
 * at the foot of the page - they explain that card's arithmetic, and at
 * the top they pushed the figures a building opens Earnings to see below
 * the fold.
 */
/**
 * The page heading, which is not the same word in both products.
 *
 * A Condo is never paid, so its page is Savings and says what it is for. An
 * Apartment earns, and keeps Earnings. Shared rather than duplicated
 * because everything else about the heading is the same.
 */
export function RevenueHeader({
  title = "Earnings",
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h1 style={st.h1}>{title}</h1>
      {subtitle && <p style={st.headerSub}>{subtitle}</p>}
    </div>
  );
}

/** A static range label beside a chart title, e.g. "Last 6 months". */
export function RangePill({ children }: { children: React.ReactNode }) {
  return <span style={st.rangePill}>{children}</span>;
}

/** The link that closes a card, e.g. "View all bookings". */
export function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={st.cardLink}>
      {children}
    </Link>
  );
}

export const st: Record<string, React.CSSProperties> = {
  rangePill: {
    padding: "var(--spacing-8) var(--spacing-12)",
    borderRadius: "var(--radius-8)",
    border: "1px solid var(--color-stroke-medium)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-strong)",
    whiteSpace: "nowrap",
  },
  cardLink: {
    alignSelf: "flex-end",
    marginTop: "auto",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-strong)",
    textDecoration: "none",
  },
  headerSub: {
    margin: "var(--spacing-4) 0 0",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-body)",
    color: "var(--color-text-weak)",
  },
  // ── Savings page layout ───────────────────────────────────────────
  tiles: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "var(--spacing-16)",
  },
  tile: {
    background: "var(--color-fill-white)",
    border: "1px solid var(--color-stroke-medium)",
    borderRadius: "var(--radius-12)",
    padding: "var(--spacing-16) var(--spacing-20)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--spacing-8)",
  },
  tileLabel: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-extra-tiny)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--color-text-weak)",
  },
  tileValue: {
    fontFamily: "var(--font-family-heading)",
    fontSize: "var(--font-size-heading-1)",
    lineHeight: "var(--line-height-heading-1)",
    color: "var(--color-text-strong)",
  },
  tileValueRow: { display: "flex", alignItems: "baseline", gap: "var(--spacing-8)", flexWrap: "wrap" },
  tileWas: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-body)",
    color: "var(--color-text-weak)",
  },
  tileTag: {
    // Pinned to the bottom-right, matching the dashboard's stat cards: the
    // tiles sit in one row and a tag that floats under a short value left
    // the row looking ragged.
    alignSelf: "flex-end",
    marginTop: "auto",
    padding: "2px var(--spacing-8)",
    borderRadius: "var(--radius-48)",
    background: "var(--color-fill-weak)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-extra-tiny)",
    // The same token the dashboard's stat-card pills use, so the two
    // four-up rows read as the same component on both screens.
    color: "var(--color-tag-text-neutral)",
  },
  twoUp: {
    display: "grid",
    // auto-fit, not a fixed 2fr/1fr pair. The old rule gave the right
    // column a 260px floor that a phone cannot honour, so the chart beside
    // it was squeezed to nothing and the row overflowed. Two columns
    // wherever 320px each will fit, one column below that.
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "var(--spacing-16)",
    alignItems: "stretch",
  },
  steps: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--spacing-16)" },
  step: { display: "flex", gap: "var(--spacing-12)", alignItems: "flex-start" },
  stepNum: {
    flexShrink: 0,
    width: 24,
    height: 24,
    borderRadius: "50%",
    // Accent, not the green "active" tag: these are numbered steps in an
    // explanation, and the green read as a status.
    background: "var(--color-accent-150)",
    color: "var(--color-accent-1400)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-extra-tiny)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
  },
  stepTitle: {
    display: "block",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    color: "var(--color-text-strong)",
    marginBottom: 2,
  },
  stepBody: {
    display: "block",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    lineHeight: "var(--line-height-tiny)",
    color: "var(--color-text-weak)",
  },
  tableWrap: { overflowX: "auto" },
  savingsTable: { width: "100%", borderCollapse: "collapse", minWidth: 640 },
  savingsTh: {
    padding: "var(--spacing-8) var(--spacing-12)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-extra-tiny)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--color-text-weak)",
    borderBottom: "1px solid var(--color-stroke-medium)",
    whiteSpace: "nowrap",
  },
  savingsTd: {
    padding: "var(--spacing-12)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-strong)",
    borderBottom: "1px solid var(--color-stroke-weak)",
    whiteSpace: "nowrap",
  },
  savingsTdNum: {
    padding: "var(--spacing-12)",
    textAlign: "right",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-strong)",
    borderBottom: "1px solid var(--color-stroke-weak)",
    whiteSpace: "nowrap",
  },
  h1: {
    margin: 0,
    fontSize: "var(--font-size-heading-1)",
    lineHeight: "var(--line-height-heading-1)",
    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
    color: "var(--color-text-strong)",
    fontFamily: "var(--font-family-heading)",
  },
  cardTitle: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-uppercase)",
    lineHeight: "var(--line-height-uppercase)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "var(--color-text-weak)",
  },
  figures: { display: "flex", gap: 48, flexWrap: "wrap" },
  figureLabel: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" },
  figureNote: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" },
  hint: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", lineHeight: 1.6 },
  actionRow: { display: "flex", alignItems: "center", gap: "var(--spacing-16)", flexWrap: "wrap" },
  track: {
    position: "relative",
    height: 8,
    borderRadius: 999,
    // No border and a flat track: the bar is read as one solid length, and
    // an outline around it made a full bar look like it stopped short.
    background: "var(--color-stroke-weak)",
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    inset: "0 auto 0 0",
    // The brand lime, and the same token the spot-type split bar fills
    // with, rather than the green reserved for status badges.
    background: "var(--color-spot-community)",
    borderRadius: 999,
  },
  floorMark: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    background: "var(--color-text-weak)",
  },
  trackLegend: {
    display: "flex",
    justifyContent: "space-between",
    gap: "var(--spacing-16)",
    flexWrap: "wrap",
    fontSize: "var(--font-size-extra-tiny)",
    color: "var(--color-text-strong)",
  },
  swatch: {
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: 2,
    background: "var(--color-spot-community)",
    marginRight: 6,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "var(--spacing-8) var(--spacing-12) var(--spacing-8) 0",
    borderBottom: "1px solid var(--color-stroke-medium)",
    whiteSpace: "nowrap",
  },
  td: {
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-strong)",
    padding: "var(--spacing-12) var(--spacing-12) var(--spacing-12) 0",
    borderBottom: "1px solid var(--color-stroke-medium)",
    whiteSpace: "nowrap",
  },
};
