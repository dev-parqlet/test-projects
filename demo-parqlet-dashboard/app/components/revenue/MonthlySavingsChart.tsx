"use client";

/**
 * Savings per month, against the most that can be saved.
 *
 * A BAR chart because the job is magnitude per period, and a stacked one
 * because the two parts are parts of one quantity: what the bill absorbed,
 * and what it could not. A line would imply a continuous quantity between
 * months, which this is not - each month is settled on its own invoice.
 *
 * THE DASHED LINE IS THE POINT. Savings stop at the subscription less the
 * floor, so a bar that reaches it has done everything it can. Without the
 * line the tallest bar reads as "most so far" rather than "the maximum",
 * and the carried-over cap above it looks like an error instead of the
 * whole reason carryover exists.
 *
 * Every bar is directly labelled, and the same figures appear in the
 * Monthly History table below. That is deliberate: the brand lime and the
 * carried-over blue are both light against this surface, so identity and
 * value never rest on colour alone - the labels and the table carry them.
 * Two series, so a legend is always shown.
 */

import React, { useState } from "react";

import { formatDollars, formatMoney } from "../../lib/demo/pricing";
import type { SavingsMonth } from "../../lib/demo/condo-revenue";

/** Plot geometry, in the SVG's own units. */
const H = 240;
const TOP = 28; // headroom for the value label above the tallest bar
const BASE = H - 24; // leaves room for the month labels

export function MonthlySavingsChart({ months }: { months: SavingsMonth[] }) {
  // Oldest on the left: time reads left to right, and the story here is
  // growth.
  const data = [...months].reverse();
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) return null;

  const maxSavings = Math.max(...data.map((m) => m.maxSavingsCents));
  // The tallest thing on the plot is a bar PLUS its carried-over cap, and
  // the scale has to hold it or the cap would be clipped at the exact
  // moment it matters.
  const ceiling = Math.max(
    maxSavings,
    ...data.map((m) => m.savedCents + m.carriedOverCents),
  );
  const y = (cents: number) => BASE - (cents / ceiling) * (BASE - TOP);
  const slot = 100 / data.length;
  const barW = Math.min(46, slot * 0.46);

  return (
    <div>
      <div style={st.legend}>
        <span style={st.legendItem}>
          <span style={{ ...st.swatch, background: "var(--color-button-primary)" }} /> Saved
        </span>
        <span style={st.legendItem}>
          <span
            style={{
              ...st.swatch,
              background: "var(--color-tag-upcoming)",
              border: "1px solid var(--color-tag-text-upcoming)",
            }}
          />{" "}
          Carried over
        </span>
        <span style={st.legendItem}>
          <span style={st.dashSwatch} /> Max savings {formatDollars(maxSavings)}
        </span>
      </div>

      <div style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 100 ${H}`}
          preserveAspectRatio="none"
          style={{ width: "100%", height: H, display: "block" }}
          role="img"
          aria-label={`Savings per month against a maximum of ${formatMoney(maxSavings)}`}
        >
          {/* The cap, drawn under the bars so a full bar sits ON it. */}
          <line
            x1="0"
            x2="100"
            y1={y(maxSavings)}
            y2={y(maxSavings)}
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
            const savedTop = y(m.savedCents);
            const carriedTop = y(m.savedCents + m.carriedOverCents);
            return (
              <g
                key={m.id}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {/* A full-height target, so the tooltip does not demand
                    that the pointer find a 3px-wide bar. */}
                <rect x={slot * i} y={0} width={slot} height={H} fill="transparent" />
                {m.carriedOverCents > 0 && (
                  <rect
                    x={x}
                    y={carriedTop}
                    width={barW}
                    /* 2px of surface between the two fills, so the join
                       reads as two parts rather than one gradient. */
                    height={Math.max(0, savedTop - carriedTop - 2)}
                    rx="2"
                    fill="var(--color-tag-upcoming)"
                    stroke="var(--color-tag-text-upcoming)"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                <rect
                  x={x}
                  y={savedTop}
                  width={barW}
                  height={Math.max(0, BASE - savedTop)}
                  rx="2"
                  fill="var(--color-button-primary)"
                />
              </g>
            );
          })}
        </svg>

        {/* Labels in HTML rather than SVG text: the viewBox is stretched
            horizontally to fill the card, which would distort any glyph
            drawn inside it. */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {data.map((m, i) => {
            const topCents = m.savedCents + m.carriedOverCents;
            return (
              <div
                key={m.id}
                style={{
                  position: "absolute",
                  left: `${slot * i}%`,
                  width: `${slot}%`,
                  top: `${((y(topCents) - 20) / H) * 100}%`,
                  textAlign: "center",
                }}
              >
                <span style={st.valueLabel}>{formatDollars(m.savedCents)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={st.axis}>
        {data.map((m) => (
          <span key={m.id} style={{ ...st.axisLabel, width: `${slot}%` }}>
            {m.short}
          </span>
        ))}
      </div>

      {hover != null && (
        <div style={st.tooltip} role="status">
          <strong>{data[hover].period}</strong>
          <span>Saved {formatMoney(data[hover].savedCents)}</span>
          <span>Invoice {formatMoney(data[hover].invoiceCents)}</span>
          {data[hover].carriedOverCents > 0 && (
            <span>Carried over {formatMoney(data[hover].carriedOverCents)}</span>
          )}
        </div>
      )}
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
  tooltip: {
    marginTop: "var(--spacing-12)",
    display: "flex",
    gap: "var(--spacing-12)",
    flexWrap: "wrap",
    padding: "var(--spacing-8) var(--spacing-12)",
    borderRadius: "var(--radius-8)",
    background: "var(--color-fill-weak)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-strong)",
  },
};
