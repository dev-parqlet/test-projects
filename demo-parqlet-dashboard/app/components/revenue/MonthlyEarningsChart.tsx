"use client";

/**
 * Earnings per month, against the subscription they are paying off.
 *
 * The sibling of <MonthlySavingsChart>, and deliberately not the same
 * component with a flag. They stack DIFFERENT things: a Condo's bar splits
 * into what the bill absorbed and what carried over, which is one quantity
 * cut by an outcome. An Apartment's splits by SOURCE - the spots the
 * building owns against the ones its residents lend - which is the mix an
 * operator is actually managing, and the reason to list one more of their
 * own spots. Collapsing the two would need a component whose every part
 * was conditional.
 *
 * THE DASHED LINE IS THE POINT. An Apartment's bill reaches zero, so the
 * subscription is the threshold where earnings stop being a discount and
 * start being cash. A bar below it is a smaller invoice; a bar above it is
 * a transfer. Without the line the bars are just six numbers getting
 * bigger.
 *
 * Every bar is directly labelled, because the lime and the olive are both
 * mid-tone against this surface and neither value nor identity should rest
 * on colour alone.
 */

import React, { useState } from "react";

import { formatDollars, formatMoney } from "../../lib/demo/pricing";
import type { ApartmentMonth } from "../../lib/demo/apartment-earnings";

/** Plot geometry, in the SVG's own units. */
const H = 240;
const TOP = 28; // headroom for the value label above the tallest bar
const BASE = H - 24; // leaves room for the month labels

/**
 * A bar with independent top and bottom corner radii.
 *
 * `<rect rx>` rounds all four, which is what left a notch where the two
 * halves of a stacked bar meet: the top segment's rounded bottom and the
 * bottom segment's rounded top curved away from each other and showed the
 * background between them. Only the ends of the whole bar should be
 * rounded, so each half rounds one end and squares the other.
 */
function barPath(x: number, y: number, w: number, h: number, rTop: number, rBottom: number): string {
  if (h <= 0) return "";
  // A radius taller than the segment would invert the curve.
  const rt = Math.max(0, Math.min(rTop, h / 2, w / 2));
  const rb = Math.max(0, Math.min(rBottom, h / 2, w / 2));
  return [
    `M ${x} ${y + rt}`,
    rt ? `A ${rt} ${rt} 0 0 1 ${x + rt} ${y}` : `L ${x} ${y}`,
    `L ${x + w - rt} ${y}`,
    rt ? `A ${rt} ${rt} 0 0 1 ${x + w} ${y + rt}` : "",
    `L ${x + w} ${y + h - rb}`,
    rb ? `A ${rb} ${rb} 0 0 1 ${x + w - rb} ${y + h}` : `L ${x + w} ${y + h}`,
    `L ${x + rb} ${y + h}`,
    rb ? `A ${rb} ${rb} 0 0 1 ${x} ${y + h - rb}` : "",
    "Z",
  ].filter(Boolean).join(" ");
}

export function MonthlyEarningsChart({ months }: { months: ApartmentMonth[] }) {
  // Oldest on the left: time reads left to right, and the story is growth.
  const data = [...months].reverse();
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) return null;

  const subscriptionCents = data[data.length - 1].subscriptionCents;
  // The scale has to hold the subscription line even when no month has
  // reached it, or the threshold the chart exists to show sits off the top.
  const ceiling = Math.max(subscriptionCents, ...data.map((m) => m.totalCents));
  const y = (cents: number) => BASE - (cents / ceiling) * (BASE - TOP);
  const slot = 100 / data.length;
  const barW = Math.min(46, slot * 0.46);

  return (
    <div>
      <div style={st.legend}>
        <span style={st.legendItem}>
          <span style={{ ...st.swatch, background: "var(--color-spot-community)" }} /> Community Spots
        </span>
        <span style={st.legendItem}>
          <span style={{ ...st.swatch, background: "var(--color-spot-neighbor)" }} /> Resident spots
        </span>
        <span style={st.legendItem}>
          <span style={st.dashSwatch} /> Subscription {formatDollars(subscriptionCents)}
        </span>
      </div>

      <div style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 100 ${H}`}
          preserveAspectRatio="none"
          style={{ width: "100%", height: H, display: "block" }}
          role="img"
          aria-label={`Earnings per month against a ${formatMoney(subscriptionCents)} subscription`}
        >
          <line
            x1="0"
            x2="100"
            y1={y(subscriptionCents)}
            y2={y(subscriptionCents)}
            stroke="var(--color-text-strong)"
            strokeWidth="1"
            strokeDasharray="4 3"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="0"
            x2="100"
            y1={BASE}
            y2={BASE}
            stroke="var(--color-stroke-medium)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />

          {data.map((m, i) => {
            const cx = slot * i + slot / 2;
            const x = cx - barW / 2;
            const totalTop = y(m.totalCents);
            const residentTop = y(m.residentCents);
            return (
              <g key={m.id} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                {/* A full-height target, so the tooltip does not demand that
                    the pointer find a narrow bar. */}
                <rect x={slot * i} y={0} width={slot} height={H} fill="transparent" />
                {/* The building's own spots on top: they are the part an
                    operator can act on, and the part that grows. */}
                <path
                  d={barPath(x, totalTop, barW, Math.max(0, residentTop - totalTop), 2, 0)}
                  fill="var(--color-spot-community)"
                />
                {/* Square at BOTH ends: it meets the community half above
                    and stands on the axis below. A radius on the baseline
                    curved the column away from the line it sits on. */}
                <path
                  d={barPath(x, residentTop, barW, Math.max(0, BASE - residentTop), 0, 0)}
                  fill="var(--color-spot-neighbor)"
                />
              </g>
            );
          })}
        </svg>

        {/* Labels in HTML rather than SVG text: the viewBox is stretched
            horizontally to fill the card, which would distort any glyph
            drawn inside it. */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {data.map((m, i) => (
            <div
              key={m.id}
              style={{
                position: "absolute",
                left: `${slot * i}%`,
                width: `${slot}%`,
                top: `${((y(m.totalCents) - 20) / H) * 100}%`,
                textAlign: "center",
              }}
            >
              <span style={st.valueLabel}>{formatDollars(m.totalCents)}</span>
            </div>
          ))}
          {/* The threshold, named where it sits. */}
          <div
            style={{
              position: "absolute",
              right: 0,
              top: `${((y(subscriptionCents) - 18) / H) * 100}%`,
            }}
          >
            <span style={st.valueLabel}>{formatDollars(subscriptionCents)}</span>
          </div>
        </div>

        {/* ABSOLUTE, inside the plot. As a block below the chart it was
            laid out in flow, so hovering grew the card and every hover
            nudged the page. Floating it over the bar costs no height. */}
        {hover != null && (
          <div
            style={{
              ...st.tooltip,
              left: `${slot * hover + slot / 2}%`,
              top: `${(y(data[hover].totalCents) / H) * 100}%`,
            }}
            role="status"
          >
            <strong>{data[hover].period}</strong>
            <span>Community Spots {formatMoney(data[hover].communityCents)}</span>
            <span>Resident spots {formatMoney(data[hover].residentCents)}</span>
            <span>Invoice {formatMoney(data[hover].invoiceCents)}</span>
            {data[hover].payoutCents > 0 && <span>Payout {formatMoney(data[hover].payoutCents)}</span>}
          </div>
        )}
      </div>

      <div style={st.axis}>
        {data.map((m) => (
          <span key={m.id} style={{ ...st.axisLabel, width: `${slot}%` }}>
            {m.short}
          </span>
        ))}
      </div>

    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
  legend: {
    display: "flex",
    alignItems: "center",
    gap: "var(--spacing-16)",
    flexWrap: "wrap",
    marginBottom: "var(--spacing-16)",
  },
  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--spacing-8)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
  },
  swatch: { width: 12, height: 12, borderRadius: 3, display: "inline-block" },
  dashSwatch: {
    width: 16,
    height: 0,
    borderTop: "1px dashed var(--color-text-strong)",
    display: "inline-block",
  },
  valueLabel: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-extra-tiny)",
    color: "var(--color-text-weak)",
  },
  axis: { display: "flex", marginTop: "var(--spacing-4)" },
  axisLabel: {
    textAlign: "center",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-weak)",
  },
  /* The dashboard's bar tooltip: a dark pill floated above the bar,
     stacked one fact per line rather than a wrapping row. */
  tooltip: {
    position: "absolute",
    transform: "translate(-50%, calc(-100% - 10px))",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    padding: "6px 10px",
    borderRadius: 6,
    background: "var(--color-fill-strong)",
    fontFamily: "var(--font-family-body)",
    fontSize: 12,
    lineHeight: "16px",
    color: "var(--color-text-white)",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    zIndex: 10,
  },
};
