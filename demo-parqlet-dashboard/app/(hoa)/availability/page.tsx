"use client";

/**
 * Availability — Apartments only.
 *
 * This is the spot-owner flow from the resident app, moved into the
 * dashboard: the building says which of its spots are free, when, and at
 * what price. An HOA has no equivalent - there each resident shares their
 * own spot from their phone.
 *
 * The price defaults to the spot's own price and can be overridden for a
 * single window, which is how a building charges more for an event weekend
 * without permanently repricing the spot.
 */

import React, { useMemo, useState } from "react";

import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import {
  DEMO_SPOTS,
  formatMoney,
} from "../../lib/demo/apartments-data";

type Window = {
  id: string;
  spotId: string;
  startsAt: string;
  endsAt: string;
  priceCents: number;
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
    { id: "w1", spotId: "s1", startsAt: at(0, 8),  endsAt: at(0, 20), priceCents: 2400, booked: true },
    { id: "w2", spotId: "s3", startsAt: at(1, 9),  endsAt: at(1, 18), priceCents: 2800, booked: false },
    { id: "w3", spotId: "s2", startsAt: at(2, 7),  endsAt: at(3, 19), priceCents: 2200, booked: false },
    { id: "w4", spotId: "s4", startsAt: at(4, 10), endsAt: at(4, 22), priceCents: 1800, booked: false },
  ];
}

export default function AvailabilityPage() {
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
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={st.h1}>Availability</h1>
          <p style={st.sub}>
            When your spots are free to book. Price defaults to the spot&rsquo;s
            own rate and can be overridden for a single window.
          </p>
        </div>
        <Button variant="primary" onClick={() => setAdding(true)}>
          Add availability
        </Button>
      </div>

      <div style={st.card}>
        <table style={st.table}>
          <thead>
            <tr>
              {["Spot", "From", "Until", "Price / day", "Status", ""].map((h) => (
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
                <td style={{ ...st.td, fontWeight: 600 }}>{formatMoney(w.priceCents)}</td>
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
                <td colSpan={6} style={{ ...st.td, color: "var(--color-text-weak)" }}>
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
  const listed = DEMO_SPOTS.filter((s) => s.status === "Listed");
  const [spotId, setSpotId] = useState(listed[0]?.id ?? "");
  const start = new Date(now);
  start.setHours(start.getHours() + 1, 0, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + 8);

  const [startsAt, setStartsAt] = useState(iso(start));
  const [endsAt, setEndsAt] = useState(iso(end));
  const spot = DEMO_SPOTS.find((s) => s.id === spotId);
  const [price, setPrice] = useState(((spot?.priceCents ?? 0) / 100).toFixed(2));

  const invalid = new Date(endsAt) <= new Date(startsAt);

  return (
    <div style={st.backdrop} onClick={onCancel}>
      <div style={st.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Add availability</h2>

        <label style={st.field}>
          <span style={st.fieldLabel}>Spot</span>
          <select
            style={st.input}
            value={spotId}
            onChange={(e) => {
              setSpotId(e.target.value);
              const s = DEMO_SPOTS.find((x) => x.id === e.target.value);
              if (s) setPrice((s.priceCents / 100).toFixed(2));
            }}
          >
            {listed.map((s) => (
              <option key={s.id} value={s.id}>
                {s.number} — {s.level} — {formatMoney(s.priceCents)}/day
              </option>
            ))}
          </select>
        </label>

        <label style={st.field}>
          <span style={st.fieldLabel}>From</span>
          <input style={st.input} type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </label>
        <label style={st.field}>
          <span style={st.fieldLabel}>Until</span>
          <input style={st.input} type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </label>
        <label style={st.field}>
          <span style={st.fieldLabel}>Price per day (USD)</span>
          <input style={st.input} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>

        {invalid && (
          <span style={{ fontSize: 12, color: "var(--color-tag-text-expired)" }}>
            The end has to be after the start.
          </span>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button
            variant="primary"
            disabled={invalid}
            onClick={() =>
              onAdd({
                id: `w${Date.now()}`,
                spotId,
                startsAt: new Date(startsAt).toISOString(),
                endsAt: new Date(endsAt).toISOString(),
                priceCents: Math.round(Number(price) * 100) || 0,
                booked: false,
              })
            }
          >
            Add
          </Button>
        </div>
      </div>
    </div>
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
  backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 },
  modal: { width: "100%", maxWidth: 420, background: "var(--color-fill-white)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { fontSize: 12, color: "var(--color-text-weak)" },
  input: { padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-stroke-medium)", fontSize: 14, fontFamily: "inherit", background: "var(--color-fill-white)", color: "var(--color-text-strong)" },
};
