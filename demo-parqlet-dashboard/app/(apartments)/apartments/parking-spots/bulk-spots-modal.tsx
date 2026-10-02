"use client";

/**
 * Add or edit spots in bulk — ONE control where there were two.
 *
 * There used to be an "Add spots in bulk" button and a "Set prices by
 * range" button side by side. They asked for almost the same thing - a
 * range of spot numbers and what those spots are - and differed only in
 * whether the numbers already existed, which is a fact about the garage
 * that the operator has to work out before they can pick a button. Get it
 * wrong and the add silently skips every existing number, or the pricer
 * silently matches nothing.
 *
 * So the distinction is gone from the UI and kept in the result: numbers
 * that do not exist are created, numbers that do are updated, and the
 * summary at the bottom says which is which BEFORE anything is saved.
 * That is also what makes several ranges in one dialog worth having - a
 * garage is priced level by level, and "1-40 at $15, 201-250 at $10" is
 * one decision, not two trips through a modal.
 *
 * Spots on a unit's lease are never touched. They cost the base, the
 * building does not price them, and a bulk rule must not be the thing
 * that quietly overrules that - so they are counted, reported and
 * skipped.
 */

import React, { useMemo, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";
import { Input } from "../../../components/ui/Input";
import { Modal } from "../../../components/ui/Modal";
import { NumberStepper } from "../../../components/ui/NumberStepper";
import {
  canPrice,
  formatMoney,
  netToBuilding,
  type DemoSpot,
} from "../../../lib/demo/apartments-data";
import { BASE_PRICE_CENTS, BASE_PRICE_CREDITS } from "../../../lib/demo/pricing";

/** The most spots one range may cover. A typo of 1-99999 is not an intent. */
const MAX_RANGE = 500;

export type SpotRange = {
  /** Stable across re-renders, so React does not reuse a removed row's state. */
  key: string;
  from: string;
  to: string;
  type: DemoSpot["type"];
  evCharger: boolean;
  /** The FULL daily price in dollars, not the extra over the base. */
  price: string;
};

/** What one range would do, worked out against the spots that exist today. */
export type RangeEffect = {
  lo: number;
  hi: number;
  created: number;
  updated: number;
  /** On a unit's lease, so left at the base. */
  skipped: number;
  extraCents: number;
  priceCents: number;
};

function newRange(from: string, to: string, price: string): SpotRange {
  return {
    key: `r${Math.random().toString(36).slice(2, 9)}`,
    from,
    to,
    type: "Standard",
    evCharger: false,
    price,
  };
}

const dollars = (s: string) => {
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};

/**
 * Validate one range and say what it would do.
 *
 * Returns null when the range is not yet a question that can be answered -
 * a half-typed "2" in the From field is not an error to shout about, it is
 * a range with no preview.
 */
export function rangeEffect(r: SpotRange, spots: DemoSpot[]): RangeEffect | null {
  const f = Number.parseInt(r.from, 10);
  const t = Number.parseInt(r.to, 10);
  const priceCents = dollars(r.price);
  if (!Number.isInteger(f) || !Number.isInteger(t) || f < 1 || t < 1) return null;
  if (!Number.isFinite(priceCents)) return null;

  const lo = Math.min(f, t);
  const hi = Math.max(f, t);
  if (hi - lo + 1 > MAX_RANGE) return null;

  const byNumber = new Map(spots.map((s) => [s.number, s]));
  let created = 0;
  let updated = 0;
  let skipped = 0;
  for (let n = lo; n <= hi; n++) {
    const existing = byNumber.get(String(n));
    if (!existing) created++;
    else if (canPrice(existing)) updated++;
    else skipped++;
  }
  return { lo, hi, created, updated, skipped, extraCents: priceCents - BASE_PRICE_CENTS, priceCents };
}

/** Why this range cannot be saved, or null. */
function rangeError(r: SpotRange): string | null {
  const f = Number.parseInt(r.from, 10);
  const t = Number.parseInt(r.to, 10);
  const priceCents = dollars(r.price);
  if (!Number.isInteger(f) || !Number.isInteger(t) || f < 1 || t < 1) {
    return "Give a first and last spot number.";
  }
  if (Math.abs(t - f) + 1 > MAX_RANGE) {
    return `That is ${Math.abs(t - f) + 1} spots. A range covers at most ${MAX_RANGE} at a time.`;
  }
  if (!Number.isFinite(priceCents)) return "Give a price per day.";
  // Below the base is not a price this product can express: a spot on a
  // lease already costs the base, so a cheaper one would undercut the
  // floor the whole credit system stands on.
  if (priceCents < BASE_PRICE_CENTS) {
    return `A spot cannot be priced below the base of ${formatMoney(BASE_PRICE_CENTS)} a day.`;
  }
  return null;
}

export function BulkSpotsModal({
  open,
  spots,
  onClose,
  onSave,
}: {
  open: boolean;
  spots: DemoSpot[];
  onClose: () => void;
  onSave: (ranges: SpotRange[]) => void;
}) {
  const [ranges, setRanges] = useState<SpotRange[]>(() => [
    newRange("1", "10", ((BASE_PRICE_CENTS + 900) / 100).toFixed(2)),
  ]);

  const patch = (key: string, next: Partial<SpotRange>) =>
    setRanges((p) => p.map((r) => (r.key === key ? { ...r, ...next } : r)));

  const effects = useMemo(() => ranges.map((r) => rangeEffect(r, spots)), [ranges, spots]);
  const errors = useMemo(() => ranges.map(rangeError), [ranges]);
  const blocked = errors.some((e) => e !== null);
  const touchesNothing = effects.every((e) => !e || e.created + e.updated === 0);

  if (!open) return null;

  return (
    <Modal open onClose={onClose} title="Add or edit spots in bulk" size="xlarge">
      <div style={st.body}>
        <p style={st.intro}>
          Add new spots or update existing ones by range. Numbers that
          don&rsquo;t exist yet are created, and existing ones get the new
          type and price. Spots assigned to a unit keep the{" "}
          {formatMoney(BASE_PRICE_CENTS)} base.
        </p>

        {ranges.map((r, i) => (
          <div key={r.key} style={st.range}>
            <div style={st.rangeHead}>
              <span style={st.rangeLabel}>Range {i + 1}</span>
              {/* Only after the first. Range 1 is the dialog itself -
                  removing it would leave a form with no question in it. */}
              {i > 0 && (
                <button
                  style={st.remove}
                  onClick={() => setRanges((p) => p.filter((x) => x.key !== r.key))}
                >
                  Remove
                </button>
              )}
            </div>

            <div style={st.fields}>
              <div style={st.field}>
                <Input
                  label="From spot"
                  inputMode="numeric"
                  value={r.from}
                  onChange={(e) => patch(r.key, { from: e.target.value })}
                />
              </div>
              <div style={st.field}>
                <Input
                  label="To spot"
                  inputMode="numeric"
                  value={r.to}
                  onChange={(e) => patch(r.key, { to: e.target.value })}
                />
              </div>
              <div style={st.field}>
                <label style={st.selectWrap}>
                  <span style={st.selectLabel}>Vehicle type</span>
                  <select
                    style={st.select}
                    value={r.type}
                    onChange={(e) => patch(r.key, { type: e.target.value as DemoSpot["type"] })}
                  >
                    {(["Compact", "Standard", "Large SUV"] as const).map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div style={{ ...st.field, flex: "0 0 150px" }}>
                <NumberStepper
                  label="Price per day"
                  prefix="$"
                  align="left"
                  width="100%"
                  value={r.price}
                  min={BASE_PRICE_CENTS / 100}
                  max={999}
                  onChange={(v) => patch(r.key, { price: v })}
                />
              </div>
            </div>

            <div style={st.rangeFoot}>
              <Checkbox
                checked={r.evCharger}
                onChange={(v) => patch(r.key, { evCharger: v })}
                label="EV charger"
              />
              {errors[i] ? (
                <span style={{ ...st.breakdown, color: "var(--color-tag-text-expired)" }}>
                  {errors[i]}
                </span>
              ) : (
                <span style={st.breakdown}>
                  Renter pays <strong>{formatMoney(effects[i]!.priceCents)}</strong> (
                  {BASE_PRICE_CREDITS} credit
                  {effects[i]!.extraCents > 0 ? ` + ${formatMoney(effects[i]!.extraCents)}` : ""}) ·
                  you receive <strong>{formatMoney(netToBuilding(effects[i]!.priceCents))}</strong>
                </span>
              )}
            </div>
          </div>
        ))}

        <button
          style={st.addRange}
          onClick={() => {
            // The next block starts after the last one ends, so adding a
            // range is one click and two edits rather than four.
            const last = ranges[ranges.length - 1];
            const end = Number.parseInt(last?.to ?? "0", 10);
            const next = Number.isInteger(end) ? end + 1 : 1;
            setRanges((p) => [
              ...p,
              newRange(String(next), String(next + 9), last?.price ?? (BASE_PRICE_CENTS / 100).toFixed(2)),
            ]);
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add one more range
        </button>

        {/* The whole reason the two buttons could become one: the dialog
            says which numbers it will create and which it will overwrite
            before anything happens, so the operator never has to know in
            advance. */}
        <div style={st.preview}>
          <span style={st.previewTitle}>What will change</span>
          {effects.map((e, i) =>
            e && !errors[i] ? (
              <div key={ranges[i].key} style={st.previewRow}>
                <span style={st.dot} />
                <span style={st.previewText}>
                  <strong>
                    Spots {e.lo} to {e.hi}:
                  </strong>{" "}
                  {describeEffect(e, ranges[i])}
                </span>
              </div>
            ) : (
              <div key={ranges[i].key} style={st.previewRow}>
                <span style={{ ...st.dot, background: "var(--color-stroke-strong)" }} />
                <span style={{ ...st.previewText, color: "var(--color-text-weak)" }}>
                  <strong>Range {i + 1}:</strong> nothing yet — finish the range above.
                </span>
              </div>
            ),
          )}
          <span style={st.previewNote}>
            Spots assigned to a unit are skipped and keep the{" "}
            {formatMoney(BASE_PRICE_CENTS)} base.
          </span>
        </div>

        <div style={st.actions}>
          <Button variant="secondary" size="small" style={{ width: "auto" }} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="small"
            style={{ width: "auto" }}
            disabled={blocked || touchesNothing}
            onClick={() => onSave(ranges)}
          >
            Save spots
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/** "30 new · Standard with EV at $10.00", or why it is a no-op. */
function describeEffect(e: RangeEffect, r: SpotRange): string {
  const parts: string[] = [];
  if (e.created) parts.push(`${e.created} new`);
  if (e.updated) parts.push(`${e.updated} existing updated`);
  if (e.skipped) parts.push(`${e.skipped} assigned, skipped`);
  const what = `${r.type}${r.evCharger ? " with EV" : ""} at ${formatMoney(e.priceCents)}`;
  if (parts.length === 0) return "nothing to do";
  // A range of nothing but leased spots changes no price, so naming one
  // would be a lie.
  if (e.created + e.updated === 0) return parts.join(" · ");
  return `${parts.join(" · ")} · ${what}`;
}

const st: Record<string, React.CSSProperties> = {
  body: { display: "flex", flexDirection: "column", gap: "var(--spacing-16)" },
  intro: {
    margin: 0,
    fontSize: "var(--font-size-tiny)",
    lineHeight: 1.6,
    color: "var(--color-text-weak)",
    fontFamily: "var(--font-family-body)",
  },
  range: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--spacing-12)",
    paddingBottom: "var(--spacing-16)",
    borderBottom: "1px solid var(--color-stroke-medium)",
  },
  rangeHead: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--spacing-12)" },
  rangeLabel: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-uppercase)",
    lineHeight: "var(--line-height-uppercase)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    color: "var(--color-text-weak)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  remove: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-tag-text-expired)",
  },
  fields: { display: "flex", gap: "var(--spacing-12)", flexWrap: "wrap", alignItems: "flex-end" },
  field: { flex: "1 1 130px", minWidth: 120 },
  rangeFoot: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--spacing-16)",
    flexWrap: "wrap",
  },
  breakdown: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-extra-tiny)",
    lineHeight: 1.5,
    color: "var(--color-text-weak)",
    textAlign: "right",
  },
  addRange: {
    display: "flex",
    alignItems: "center",
    gap: "var(--spacing-8)",
    alignSelf: "flex-start",
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-strong)",
  },
  preview: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--spacing-8)",
    padding: "var(--spacing-16)",
    borderRadius: "var(--radius-12)",
    background: "var(--color-fill-weak)",
    border: "1px solid var(--color-stroke-medium)",
  },
  previewTitle: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-uppercase)",
    lineHeight: "var(--line-height-uppercase)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    color: "var(--color-text-weak)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  previewRow: { display: "flex", alignItems: "flex-start", gap: "var(--spacing-8)" },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
    background: "var(--color-fill-accent)",
  },
  previewText: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    lineHeight: 1.6,
    color: "var(--color-text-strong)",
  },
  previewNote: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-extra-tiny)",
    lineHeight: 1.5,
    color: "var(--color-text-weak)",
    marginTop: "var(--spacing-4)",
  },
  actions: { display: "flex", gap: "var(--spacing-12)", justifyContent: "flex-end" },
  selectWrap: { display: "flex", flexDirection: "column", gap: "var(--spacing-4)" },
  selectLabel: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-extra-tiny)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    lineHeight: "var(--line-height-extra-tiny)",
    color: "var(--color-text-strong)",
    marginBottom: "var(--spacing-4)",
  },
  select: {
    height: 40,
    width: "100%",
    boxSizing: "border-box",
    padding: "0 var(--spacing-12)",
    borderRadius: "var(--radius-8)",
    border: "1px solid var(--color-stroke-medium)",
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    background: "var(--color-fill-white)",
    color: "var(--color-text-strong)",
  },
};
