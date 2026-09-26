"use client";

/**
 * Parking Spots — Apartments only.
 *
 * The building owns these, so it can add, edit, unlist and delete them, and
 * each carries its own daily price: a covered space on P1 is worth more
 * than one on the roof, which is why price lives on the spot rather than on
 * the building.
 *
 * Ninety spots is too many to scan, so this reuses the same search box and
 * <FilterDropdown> row the Bookings and Resident Directory pages use, and
 * the shared <Modal> / <Input> for editing. An operator should not have to
 * learn a second set of controls on their third screen.
 */

import React, { useMemo, useState } from "react";

import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { FilterDropdown } from "../../components/ui/FilterDropdown";
import { TableHeadLabel } from "../../components/ui/TableHeadLabel";
import {
  COMMISSION_PCT,
  DEMO_SPOTS,
  formatMoney,
  netToBuilding,
  type DemoSpot,
} from "../../lib/demo/apartments-data";

type Draft = Omit<DemoSpot, "id">;

const EMPTY: Draft = {
  number: "",
  level: "P1",
  type: "Standard",
  covered: true,
  evCharger: false,
  priceCents: 1500,
  status: "Listed",
};

function IcSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
      <path d="M11 11l3 3" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function SpotsPage() {
  const [spots, setSpots] = useState<DemoSpot[]>(DEMO_SPOTS);
  const [editing, setEditing] = useState<DemoSpot | null>(null);
  const [creating, setCreating] = useState(false);
  const [pricingRange, setPricingRange] = useState(false);
  const [lastBulk, setLastBulk] = useState<string | null>(null);

  // ── Filters ───────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All levels");
  const [type, setType] = useState("All types");
  const [status, setStatus] = useState("All");
  const [covered, setCovered] = useState("Covered: All");
  const [ev, setEv] = useState("EV: All");
  const [sort, setSort] = useState("Spot number");

  const levels = useMemo(
    () => ["All levels", ...Array.from(new Set(DEMO_SPOTS.map((s) => s.level)))],
    [],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = spots.filter((s) => {
      if (q && !`${s.number} ${s.level} ${s.type}`.toLowerCase().includes(q)) return false;
      if (level !== "All levels" && s.level !== level) return false;
      if (type !== "All types" && s.type !== type) return false;
      if (status !== "All" && s.status !== status) return false;
      if (covered === "Covered only" && !s.covered) return false;
      if (covered === "Uncovered only" && s.covered) return false;
      if (ev === "EV only" && !s.evCharger) return false;
      if (ev === "No EV" && s.evCharger) return false;
      return true;
    });

    // Spot numbers are free text but usually numeric; sort them as numbers
    // so 9 comes before 11 rather than after it.
    const byNumber = (a: DemoSpot, b: DemoSpot) => {
      const na = Number(a.number);
      const nb = Number(b.number);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return a.number.localeCompare(b.number);
    };

    if (sort === "Price: high to low") return [...rows].sort((a, b) => b.priceCents - a.priceCents);
    if (sort === "Price: low to high") return [...rows].sort((a, b) => a.priceCents - b.priceCents);
    return [...rows].sort(byNumber);
  }, [spots, query, level, type, status, covered, ev, sort]);

  const save = (draft: Draft, id?: string) => {
    setSpots((prev) =>
      id ? prev.map((s) => (s.id === id ? { ...draft, id } : s)) : [...prev, { ...draft, id: `s${Date.now()}` }],
    );
    setEditing(null);
    setCreating(false);
  };

  /**
   * Price a whole block at once, by spot NUMBER. This is how a building
   * actually prices - everything on level 1 at one rate, the roof at
   * another - and setting ninety spots one at a time is the sort of thing
   * that makes an operator abandon onboarding.
   */
  const applyRange = (from: number, to: number, priceCents: number) => {
    const lo = Math.min(from, to);
    const hi = Math.max(from, to);
    let touched = 0;
    setSpots((prev) =>
      prev.map((sp) => {
        const n = Number(sp.number);
        // A non-numeric spot number is outside every range rather than
        // coerced to 0 and silently repriced.
        if (!Number.isFinite(n) || n < lo || n > hi) return sp;
        touched++;
        return { ...sp, priceCents };
      }),
    );
    setPricingRange(false);
    setLastBulk(
      touched === 0
        ? `No spots numbered ${lo}–${hi}.`
        : `${touched} spot${touched === 1 ? "" : "s"} (${lo}–${hi}) set to ${formatMoney(priceCents)} per day.`,
    );
  };

  return (
    <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--spacing-16)", flexWrap: "wrap" }}>
        <div>
          <h1 style={st.h1}>Parking Spots</h1>
          <p style={st.sub}>
            Spots your building owns and rents out. Each has its own daily
            price; Parqlet keeps {COMMISSION_PCT}% and the rest is paid to you.
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--spacing-8)", flexShrink: 0 }}>
          <Button variant="secondary" onClick={() => setPricingRange(true)}>
            Set prices by range
          </Button>
          <Button variant="primary" onClick={() => setCreating(true)}>
            Add spot
          </Button>
        </div>
      </div>

      {/* ── Search + Filters — same shape as Bookings ──────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--spacing-12)", flexWrap: "wrap" }}>
        <div style={st.search}>
          <IcSearch />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by spot number, level or type"
            style={st.searchInput}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", flexWrap: "wrap", flexShrink: 0 }}>
          <FilterDropdown label="Level" options={levels} value={level} onChange={setLevel} />
          <FilterDropdown label="Type" options={["All types", "Compact", "Standard", "Large SUV"]} value={type} onChange={setType} />
          <FilterDropdown label="Status" options={["All", "Listed", "Unlisted"]} value={status} onChange={setStatus} />
          <FilterDropdown label="Covered" options={["Covered: All", "Covered only", "Uncovered only"]} value={covered} onChange={setCovered} />
          <FilterDropdown label="EV" options={["EV: All", "EV only", "No EV"]} value={ev} onChange={setEv} />
          <FilterDropdown label="Sort" options={["Spot number", "Price: high to low", "Price: low to high"]} value={sort} onChange={setSort} />
        </div>
      </div>

      {lastBulk && (
        <div style={st.notice} role="status">
          {lastBulk}
          <button style={st.noticeClose} onClick={() => setLastBulk(null)}>Dismiss</button>
        </div>
      )}

      <div style={st.card}>
        <div style={{ ...st.row, ...st.headRow }}>
          {["Spot", "Level", "Type", "Covered", "EV", "Price / day", "You receive", "Status", ""].map((h, i) => (
            <div key={h || i} style={{ ...st.cellBase, flex: COL_FLEX[i], justifyContent: i === 8 ? "flex-end" : "flex-start" }}>
              <TableHeadLabel style={{ color: "var(--color-text-weak)" }}>{h}</TableHeadLabel>
            </div>
          ))}
        </div>

        {visible.map((sp) => (
          <div key={sp.id} style={st.row}>
            <Cell i={0}><span style={{ ...st.txt, fontWeight: 600 }}>{sp.number}</span></Cell>
            <Cell i={1}><span style={st.txt}>{sp.level}</span></Cell>
            <Cell i={2}><span style={st.txt}>{sp.type}</span></Cell>
            <Cell i={3}><span style={st.txt}>{sp.covered ? "Yes" : "No"}</span></Cell>
            <Cell i={4}><span style={st.txt}>{sp.evCharger ? "Yes" : "No"}</span></Cell>
            <Cell i={5}><span style={{ ...st.txt, fontWeight: 600 }}>{formatMoney(sp.priceCents)}</span></Cell>
            <Cell i={6}><span style={{ ...st.txt, color: "var(--color-text-weak)" }}>{formatMoney(netToBuilding(sp.priceCents))}</span></Cell>
            <Cell i={7}>
              <Badge as="span" variant={sp.status === "Listed" ? "active" : "inactive"}>{sp.status}</Badge>
            </Cell>
            <div style={{ ...st.cellBase, flex: COL_FLEX[8], justifyContent: "flex-end", gap: "var(--spacing-12)" }}>
              <button style={st.link} onClick={() => setEditing(sp)}>Edit</button>
              <button
                style={{ ...st.link, color: "var(--color-tag-text-expired)" }}
                onClick={() => setSpots((prev) => prev.filter((x) => x.id !== sp.id))}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {visible.length === 0 && (
          <div style={{ ...st.row, color: "var(--color-text-weak)", fontSize: "var(--font-size-tiny)" }}>
            No spots match these filters.
          </div>
        )}
      </div>

      <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" }}>
        Showing {visible.length} of {spots.length} spots
      </span>

      <RangePriceModal
        open={pricingRange}
        onClose={() => setPricingRange(false)}
        onApply={applyRange}
      />

      <SpotModal
        open={creating || editing != null}
        initial={editing ? { ...editing } : EMPTY}
        title={editing ? `Edit spot ${editing.number}` : "Add spot"}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        onSave={(draft) => save(draft, editing?.id)}
      />
    </div>
  );
}

const COL_FLEX = [
  "8 1 80px", "7 1 70px", "9 1 100px", "7 1 80px",
  "6 1 60px", "9 1 110px", "9 1 110px", "8 1 100px", "9 1 130px",
];

function Cell({ i, children }: { i: number; children: React.ReactNode }) {
  return <div style={{ ...st.cellBase, flex: COL_FLEX[i] }}>{children}</div>;
}

function RangePriceModal({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (from: number, to: number, priceCents: number) => void;
}) {
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState("100");
  const [price, setPrice] = useState("15.00");

  const priceCents = Math.round(Number(price) * 100) || 0;
  const valid = Number.isFinite(Number(from)) && Number.isFinite(Number(to)) && priceCents > 0;

  return (
    <Modal open={open} onClose={onClose} title="Set prices by range" size="small">
      <div style={st.form}>
        <p style={st.formHint}>
          Applies one price to every spot whose number falls in the range.
          Run it once per block: 1–100 at one rate, 200–300 at another.
        </p>

        <div style={{ display: "flex", gap: "var(--spacing-12)" }}>
          <Input label="From spot" inputMode="numeric" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To spot" inputMode="numeric" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>

        <Input label="Price per day (USD)" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />

        {priceCents > 0 && (
          <span style={st.formHint}>
            Renter pays {formatMoney(priceCents)} · Parqlet keeps{" "}
            {formatMoney(priceCents - netToBuilding(priceCents))} ({COMMISSION_PCT}%) · you
            receive <strong>{formatMoney(netToBuilding(priceCents))}</strong>
          </span>
        )}

        <div style={st.actions}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} onClick={() => onApply(Number(from), Number(to), priceCents)}>
            Apply
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function SpotModal({
  open,
  initial,
  title,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: Draft;
  title: string;
  onClose: () => void;
  onSave: (d: Draft) => void;
}) {
  const [d, setD] = useState<Draft>(initial);
  // Dollars in the field, cents in the model - "24.50" must not become 2450
  // dollars. Keyed on `title` so reopening for a different spot resets.
  const [price, setPrice] = useState((initial.priceCents / 100).toFixed(2));
  const [seen, setSeen] = useState(title);
  if (seen !== title) {
    setSeen(title);
    setD(initial);
    setPrice((initial.priceCents / 100).toFixed(2));
  }

  const priceCents = Math.round(Number(price) * 100) || 0;

  return (
    <Modal open={open} onClose={onClose} title={title} size="small">
      <div style={st.form}>
        <Input label="Spot number" value={d.number} onChange={(e) => setD({ ...d, number: e.target.value })} />
        <Input label="Level" value={d.level} onChange={(e) => setD({ ...d, level: e.target.value })} />

        <label style={st.selectWrap}>
          <span style={st.selectLabel}>Type</span>
          <select
            style={st.select}
            value={d.type}
            onChange={(e) => setD({ ...d, type: e.target.value as DemoSpot["type"] })}
          >
            <option>Compact</option>
            <option>Standard</option>
            <option>Large SUV</option>
          </select>
        </label>

        <Input label="Price per day (USD)" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />

        <span style={st.formHint}>
          You receive <strong>{formatMoney(netToBuilding(priceCents))}</strong> of
          it, after our {COMMISSION_PCT}% commission.
        </span>

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

        <div style={st.actions}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave({ ...d, priceCents })}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

const st: Record<string, React.CSSProperties> = {
  h1: { margin: 0, fontSize: "var(--font-size-heading-3)", fontWeight: 600, color: "var(--color-text-strong)" },
  sub: { margin: "var(--spacing-4) 0 0", fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", maxWidth: 560 },
  search: {
    display: "flex", alignItems: "center", gap: 10,
    background: "var(--color-fill-white)",
    border: "1px solid var(--color-stroke-medium)",
    borderRadius: "var(--radius-8)", padding: "0 10px", height: 40,
    flex: "1 0 240px", maxWidth: 480,
  },
  searchInput: {
    border: "none", outline: "none", background: "transparent",
    fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)",
    fontFamily: "var(--font-family-body)", width: "100%",
  },
  card: {
    border: "1px solid var(--color-stroke-medium)",
    borderRadius: "var(--radius-12)",
    background: "var(--color-fill-white)",
    overflow: "hidden",
  },
  row: {
    display: "flex", alignItems: "center", gap: "var(--spacing-8)",
    padding: "0 var(--spacing-24)", minHeight: 48,
    borderBottom: "1px solid var(--color-stroke-medium)",
  },
  headRow: { background: "var(--color-fill-white)" },
  cellBase: { display: "flex", alignItems: "center", minWidth: 0 },
  txt: { fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", whiteSpace: "nowrap" },
  link: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)",
    textDecoration: "underline", fontFamily: "var(--font-family-body)", padding: 0,
  },
  notice: {
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--spacing-16)",
    padding: "var(--spacing-12) var(--spacing-16)", borderRadius: "var(--radius-12)",
    background: "var(--color-fill-weak)", border: "1px solid var(--color-stroke-medium)",
    fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)",
  },
  noticeClose: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)",
    textDecoration: "underline", fontFamily: "var(--font-family-body)",
  },
  form: { display: "flex", flexDirection: "column", gap: "var(--spacing-12)" },
  formHint: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", margin: 0 },
  actions: { display: "flex", gap: "var(--spacing-12)", justifyContent: "flex-end", marginTop: "var(--spacing-8)" },
  selectWrap: { display: "flex", flexDirection: "column", gap: 6 },
  selectLabel: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" },
  select: {
    padding: "10px 12px", borderRadius: "var(--radius-8)",
    border: "1px solid var(--color-stroke-medium)",
    fontSize: "var(--font-size-tiny)", fontFamily: "var(--font-family-body)",
    background: "var(--color-fill-white)", color: "var(--color-text-strong)",
  },
  check: { display: "flex", alignItems: "center", gap: 8, fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)" },
};
