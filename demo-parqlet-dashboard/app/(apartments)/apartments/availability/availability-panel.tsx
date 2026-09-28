"use client";

/**
 * Availability — the first tab of the Availability page, Apartments only.
 *
 * This is the spot-owner flow from the resident app, moved into the
 * dashboard: the building says which of its spots are free, when, and at
 * what price. An HOA has no equivalent - there each resident shares their
 * own spot from their phone.
 *
 * Only the building's OWN spots appear here. A resident sharing their own
 * space does it from their phone, exactly as they do in a Condo, and the
 * building never sets a price on their behalf.
 *
 * Every window starts at the base credit. The EXTRA defaults to the spot's
 * own extra and can be overridden for a single window, which is how a
 * building charges more for an event weekend without permanently
 * repricing the spot.
 */

import React, { useMemo, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import {
  COMMISSION_PCT,
  DEMO_SPOTS,
  canPrice,
  formatMoney,
  netToBuilding,
} from "../../../lib/demo/apartments-data";
import { BASE_PRICE_CENTS, BASE_PRICE_CREDITS } from "../../../lib/demo/pricing";

/** What a renter pays for a window: the base credit, plus this window's extra. */
const windowTotal = (extraCents: number) => BASE_PRICE_CENTS + extraCents;

type Window = {
  id: string;
  spotId: string;
  startsAt: string;
  endsAt: string;
  /** Dollars on top of the base credit, for this window only. */
  extraCents: number;
  booked: boolean;
};

const iso = (d: Date) => d.toISOString().slice(0, 16);

/** Seeded from "now" so the demo always shows a live-looking week. */
function seedWindows(now: Date): Window[] {
  const at = (dayOffset: number, hour: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  return [
    { id: "w1", spotId: "s1", startsAt: at(0, 8),  endsAt: at(0, 20), extraCents: 900, booked: true },
    { id: "w2", spotId: "s3", startsAt: at(1, 9),  endsAt: at(1, 18), extraCents: 1300, booked: false },
    { id: "w3", spotId: "s2", startsAt: at(2, 7),  endsAt: at(3, 19), extraCents: 700, booked: false },
    { id: "w4", spotId: "s4", startsAt: at(4, 10), endsAt: at(4, 22), extraCents: 300, booked: false },
  ];
}

export function AvailabilityPanel() {
  const now = useMemo(() => new Date(), []);
  const [windows, setWindows] = useState<Window[]>(() => seedWindows(now));
  const [adding, setAdding] = useState(false);

  const spotName = (id: string) =>
    DEMO_SPOTS.find((s) => s.id === id)?.number ?? "—";

  const fmt = (v: string) =>
    new Date(v).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <p style={st.sub}>
            When your spots are free to book. Price defaults to the spot&rsquo;s
            own rate and can be overridden for a single window.
          </p>
        </div>
        <div style={{ flexShrink: 0 }}>
          <Button variant="primary" size="small" style={{ width: "auto", whiteSpace: "nowrap" }} onClick={() => setAdding(true)}>
            Add availability
          </Button>
        </div>
      </div>

      <div style={st.card}>
        <table style={st.table}>
          <thead>
            <tr>
              {["Spot", "From", "Until", "Price / day", "You receive", "Status", ""].map((h) => (
                <th key={h} style={st.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {windows.map((w) => (
              <tr key={w.id}>
                <td style={{ ...st.td, fontWeight: 600 }}>{spotName(w.spotId)}</td>
                <td style={st.td}>{fmt(w.startsAt)}</td>
                <td style={st.td}>{fmt(w.endsAt)}</td>
                <td style={{ ...st.td, fontWeight: 600 }}>{formatMoney(windowTotal(w.extraCents))}</td>
                <td style={{ ...st.td, color: "var(--color-text-weak)" }}>
                  {formatMoney(netToBuilding(windowTotal(w.extraCents)))}
                </td>
                <td style={st.td}>
                  <Badge variant={w.booked ? "upcoming" : "active"}>
                    {w.booked ? "Booked" : "Open"}
                  </Badge>
                </td>
                <td style={{ ...st.td, textAlign: "right" }}>
                  {/* A booked window cannot simply vanish - someone has paid
                      to park in it. The real product would need a cancel and
                      refund path, which is a bigger decision than this
                      screen. */}
                  {w.booked ? (
                    <span style={{ fontSize: 12, color: "var(--color-text-weak)" }}>
                      Booked — cannot remove
                    </span>
                  ) : (
                    <button
                      style={{ ...st.link, color: "var(--color-tag-text-expired)" }}
                      onClick={() => setWindows((p) => p.filter((x) => x.id !== w.id))}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {windows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...st.td, color: "var(--color-text-weak)" }}>
                  No availability yet. Add a window so renters can book.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {adding && (
        <AddWindowModal
          now={now}
          onCancel={() => setAdding(false)}
          onAdd={(w) => {
            setWindows((p) => [...p, w]);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}

function AddWindowModal({
  now,
  onCancel,
  onAdd,
}: {
  now: Date;
  onCancel: () => void;
  onAdd: (w: Window) => void;
}) {
  // The building's own spots only. A resident's spot is shared from their
  // phone, so offering it here would imply a control the building has not got.
  const listed = DEMO_SPOTS.filter((s) => s.status === "Listed" && canPrice(s));
  const [spotId, setSpotId] = useState(listed[0]?.id ?? "");
  const start = new Date(now);
  start.setHours(start.getHours() + 1, 0, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + 8);

  const [startsAt, setStartsAt] = useState(iso(start));
  const [endsAt, setEndsAt] = useState(iso(end));
  const spot = DEMO_SPOTS.find((s) => s.id === spotId);
  const [extra, setExtra] = useState(((spot?.extraCents ?? 0) / 100).toFixed(2));

  const extraCents = Math.max(0, Math.round(Number(extra) * 100) || 0);
  const invalid = new Date(endsAt) <= new Date(startsAt);

  return (
    <Modal open onClose={onCancel} title="Add availability" size="small">
      <div style={st.form}>
        <label style={st.field}>
          <span style={st.fieldLabel}>Spot</span>
          <select
            style={st.input}
            value={spotId}
            onChange={(e) => {
              setSpotId(e.target.value);
              const s = DEMO_SPOTS.find((x) => x.id === e.target.value);
              if (s) setExtra((s.extraCents / 100).toFixed(2));
            }}
          >
            {listed.map((s) => (
              <option key={s.id} value={s.id}>
                {s.number} — {s.level} — {formatMoney(windowTotal(s.extraCents))}/day
              </option>
            ))}
          </select>
        </label>

        <Input label="From" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        <Input label="Until" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        <Input
          label="Extra per day (USD), on top of the base credit"
          inputMode="decimal"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
        />

        <span style={{ fontSize: 12, color: "var(--color-text-weak)" }}>
          Renter pays <strong>{formatMoney(windowTotal(extraCents))}</strong>{" "}
          ({BASE_PRICE_CREDITS} credit
          {extraCents > 0 ? ` + ${formatMoney(extraCents)}` : ""}) · you receive{" "}
          <strong>{formatMoney(netToBuilding(windowTotal(extraCents)))}</strong>{" "}
          per day, after our {COMMISSION_PCT}% commission and card fees.
        </span>

        {invalid && (
          <span style={{ fontSize: 12, color: "var(--color-tag-text-expired)" }}>
            The end has to be after the start.
          </span>
        )}

        <div style={st.actions}>
          <Button variant="secondary" size="small" style={{ width: "auto" }} onClick={onCancel}>Cancel</Button>
          <Button
            variant="primary"
            size="small"
            style={{ width: "auto" }}
            disabled={invalid}
            onClick={() =>
              onAdd({
                id: `w${Date.now()}`,
                spotId,
                startsAt: new Date(startsAt).toISOString(),
                endsAt: new Date(endsAt).toISOString(),
                extraCents,
                booked: false,
              })
            }
          >
            Add
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const st: Record<string, React.CSSProperties> = {
  h1: { margin: 0, fontSize: 24, fontWeight: 600, color: "var(--color-text-strong)" },
  sub: { margin: "6px 0 0", fontSize: 14, color: "var(--color-text-weak)", maxWidth: 560 },
  card: { padding: 24, borderRadius: 16, border: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-white)" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 12, fontWeight: 500, color: "var(--color-text-weak)", padding: "8px 12px 8px 0", borderBottom: "1px solid var(--color-stroke-medium)", whiteSpace: "nowrap" },
  td: { fontSize: 14, color: "var(--color-text-strong)", padding: "12px 12px 12px 0", borderBottom: "1px solid var(--color-stroke-medium)" },
  link: { background: "none", border: "none", cursor: "pointer", fontSize: 13, textDecoration: "underline", fontFamily: "inherit" },
  form: { display: "flex", flexDirection: "column", gap: "var(--spacing-12)" },
  actions: { display: "flex", gap: "var(--spacing-12)", justifyContent: "flex-end", marginTop: "var(--spacing-8)" },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" },
  input: { padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-stroke-medium)", fontSize: 14, fontFamily: "inherit", background: "var(--color-fill-white)", color: "var(--color-text-strong)" },
};
