"use client";

/**
 * Parking Spots — Apartments only.
 *
 * The building owns these, so it can add, edit, unlist and delete them, and
 * each one carries its own nightly price: a covered space on P1 is worth
 * more than an uncovered one on the roof, and that difference is the whole
 * reason price lives on the spot rather than on the building.
 *
 * An HOA has no equivalent screen - there the residents own the spots.
 */

import React, { useState } from "react";

import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import {
  DEMO_SPOTS,
  formatMoney,
  type DemoSpot,
} from "../../lib/demo/apartments-data";

type Draft = Omit<DemoSpot, "id">;

const EMPTY: Draft = {
  number: "",
  level: "P1",
  type: "Standard",
  covered: true,
  evCharger: false,
  priceCents: 2000,
  status: "Listed",
};

export default function SpotsPage() {
  const [spots, setSpots] = useState<DemoSpot[]>(DEMO_SPOTS);
  const [editing, setEditing] = useState<DemoSpot | null>(null);
  const [creating, setCreating] = useState(false);

  const save = (draft: Draft, id?: string) => {
    setSpots((prev) =>
      id
        ? prev.map((s) => (s.id === id ? { ...draft, id } : s))
        : [...prev, { ...draft, id: `s${Date.now()}` }],
    );
    setEditing(null);
    setCreating(false);
  };

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={st.h1}>Parking Spots</h1>
          <p style={st.sub}>
            Spots your building owns and rents out. Each one has its own daily
            price.
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreating(true)}>
          Add spot
        </Button>
      </div>

      <div style={st.card}>
        <table style={st.table}>
          <thead>
            <tr>
              {["Spot", "Level", "Type", "Covered", "EV", "Price / day", "Status", ""].map((h) => (
                <th key={h} style={st.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spots.map((sp) => (
              <tr key={sp.id}>
                <td style={{ ...st.td, fontWeight: 600 }}>{sp.number}</td>
                <td style={st.td}>{sp.level}</td>
                <td style={st.td}>{sp.type}</td>
                <td style={st.td}>{sp.covered ? "Yes" : "No"}</td>
                <td style={st.td}>{sp.evCharger ? "Yes" : "No"}</td>
                <td style={{ ...st.td, fontWeight: 600 }}>{formatMoney(sp.priceCents)}</td>
                <td style={st.td}>
                  <Badge variant={sp.status === "Listed" ? "active" : "inactive"}>
                    {sp.status}
                  </Badge>
                </td>
                <td style={{ ...st.td, textAlign: "right", whiteSpace: "nowrap" }}>
                  <button style={st.link} onClick={() => setEditing(sp)}>Edit</button>
                  <button
                    style={{ ...st.link, color: "var(--color-tag-text-expired)" }}
                    onClick={() => setSpots((prev) => prev.filter((x) => x.id !== sp.id))}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <SpotModal
          initial={editing ? { ...editing } : EMPTY}
          title={editing ? `Edit spot ${editing.number}` : "Add spot"}
          onCancel={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={(draft) => save(draft, editing?.id)}
        />
      )}
    </div>
  );
}

function SpotModal({
  initial,
  title,
  onCancel,
  onSave,
}: {
  initial: Draft;
  title: string;
  onCancel: () => void;
  onSave: (d: Draft) => void;
}) {
  const [d, setD] = useState<Draft>(initial);
  // Dollars in the field, cents in the model — entering "24.50" must not
  // become 2450 dollars.
  const [price, setPrice] = useState((initial.priceCents / 100).toFixed(2));

  const commit = () => {
    const parsed = Number(price);
    onSave({
      ...d,
      priceCents: Number.isFinite(parsed) ? Math.round(parsed * 100) : 0,
    });
  };

  return (
    <div style={st.backdrop} onClick={onCancel}>
      <div style={st.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h2>

        <Field label="Spot number">
          <input style={st.input} value={d.number} onChange={(e) => setD({ ...d, number: e.target.value })} />
        </Field>
        <Field label="Level">
          <input style={st.input} value={d.level} onChange={(e) => setD({ ...d, level: e.target.value })} />
        </Field>
        <Field label="Type">
          <select style={st.input} value={d.type} onChange={(e) => setD({ ...d, type: e.target.value as DemoSpot["type"] })}>
            <option>Compact</option>
            <option>Standard</option>
            <option>Large SUV</option>
          </select>
        </Field>
        <Field label="Price per day (USD)">
          <input style={st.input} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>

        <label style={st.check}>
          <input type="checkbox" checked={d.covered} onChange={(e) => setD({ ...d, covered: e.target.checked })} />
          Covered
        </label>
        <label style={st.check}>
          <input type="checkbox" checked={d.evCharger} onChange={(e) => setD({ ...d, evCharger: e.target.checked })} />
          EV charger
        </label>
        <label style={st.check}>
          <input
            type="checkbox"
            checked={d.status === "Listed"}
            onChange={(e) => setD({ ...d, status: e.target.checked ? "Listed" : "Unlisted" })}
          />
          Listed for booking
        </label>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={commit}>Save</Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, color: "var(--color-text-weak)" }}>{label}</span>
      {children}
    </label>
  );
}

const st: Record<string, React.CSSProperties> = {
  h1: { margin: 0, fontSize: 24, fontWeight: 600, color: "var(--color-text-strong)" },
  sub: { margin: "6px 0 0", fontSize: 14, color: "var(--color-text-weak)" },
  card: { padding: 24, borderRadius: 16, border: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-white)" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 12, fontWeight: 500, color: "var(--color-text-weak)", padding: "8px 12px 8px 0", borderBottom: "1px solid var(--color-stroke-medium)", whiteSpace: "nowrap" },
  td: { fontSize: 14, color: "var(--color-text-strong)", padding: "12px 12px 12px 0", borderBottom: "1px solid var(--color-stroke-medium)" },
  link: { background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--color-text-strong)", textDecoration: "underline", marginLeft: 12, fontFamily: "inherit" },
  backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 },
  modal: { width: "100%", maxWidth: 420, background: "var(--color-fill-white)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 14 },
  input: { padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-stroke-medium)", fontSize: 14, fontFamily: "inherit", background: "var(--color-fill-white)", color: "var(--color-text-strong)" },
  check: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--color-text-strong)" },
};
