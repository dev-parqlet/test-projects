"use client";

/**
 * Parking Spots — Apartments only.
 *
 * Two kinds of spot live in one list, and the difference between them is
 * the whole point of the screen:
 *
 *   The BUILDING's own spots. It can add, edit, unlist and delete them,
 *   and it can charge an EXTRA on top of the base credit, because a
 *   covered space by the lift is worth more than one on the roof.
 *
 *   A RESIDENT's own spot. The building can see it and can unlist it, but
 *   it cannot price it or delete it. A resident's spot costs the base
 *   credit and nothing else - the same deal residents get in a Condo.
 *   Residents never set prices in either product.
 *
 * Both appear here rather than on separate screens so the rule is visible
 * rather than documented: the price column simply has nothing to edit on a
 * resident's row.
 *
 * A hundred-odd spots is too many to scan, so this reuses the same search
 * box and <FilterDropdown> row the Bookings and Resident Directory pages
 * use, and the shared <Modal> / <Input> for editing. An operator should not
 * have to learn a second set of controls on their third screen.
 */

import React, { useMemo, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { FilterDropdown } from "../../../components/ui/FilterDropdown";
import { TableHeadLabel } from "../../../components/ui/TableHeadLabel";
import {
  COMMISSION_PCT,
  DEMO_SPOTS,
  canPrice,
  formatMoney,
  netToBuilding,
  spotPriceCents,
  type DemoSpot,
} from "../../../lib/demo/apartments-data";
import { BASE_PRICE_CENTS, BASE_PRICE_CREDITS } from "../../../lib/demo/pricing";

type Draft = Omit<DemoSpot, "id">;

const EMPTY: Draft = {
  number: "",
  level: "P1",
  type: "Standard",
  covered: true,
  evCharger: false,
  // Anything the building adds by hand is its own, so it starts priceable.
  owner: "building",
  extraCents: 0,
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
  const [owner, setOwner] = useState("All spots");
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
      if (owner === "Building owned" && s.owner !== "building") return false;
      if (owner === "Resident shared" && s.owner !== "resident") return false;
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

    if (sort === "Price: high to low") return [...rows].sort((a, b) => spotPriceCents(b) - spotPriceCents(a));
    if (sort === "Price: low to high") return [...rows].sort((a, b) => spotPriceCents(a) - spotPriceCents(b));
    return [...rows].sort(byNumber);
  }, [spots, query, level, type, owner, status, covered, ev, sort]);

  const save = (draft: Draft, id?: string) => {
    setSpots((prev) =>
      id ? prev.map((s) => (s.id === id ? { ...draft, id } : s)) : [...prev, { ...draft, id: `s${Date.now()}` }],
    );
    setEditing(null);
    setCreating(false);
  };

  const toggleListed = (id: string) =>
    setSpots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: s.status === "Listed" ? "Unlisted" : "Listed" } : s)),
    );

  /**
   * Price a whole block at once, by spot NUMBER. This is how a building
   * actually prices - everything on level 1 at one rate, the roof at
   * another - and setting a hundred spots one at a time is the sort of
   * thing that makes an operator abandon onboarding.
   *
   * Residents' spots inside the range are skipped rather than repriced,
   * and the count is reported, so a bulk edit can never quietly overrule
   * the rule that a resident's spot costs the base.
   */
  const applyRange = (from: number, to: number, extraCents: number) => {
    const lo = Math.min(from, to);
    const hi = Math.max(from, to);
    let touched = 0;
    let skipped = 0;
    setSpots((prev) =>
      prev.map((sp) => {
        const n = Number(sp.number);
        // A non-numeric spot number is outside every range rather than
        // coerced to 0 and silently repriced.
        if (!Number.isFinite(n) || n < lo || n > hi) return sp;
        if (!canPrice(sp)) {
          skipped++;
          return sp;
        }
        touched++;
        return { ...sp, extraCents };
      }),
    );
    setPricingRange(false);
    const skippedNote = skipped === 0 ? "" : ` ${skipped} resident-shared spot${skipped === 1 ? "" : "s"} left at the base.`;
    setLastBulk(
      touched === 0
        ? `No spots you own are numbered ${lo}–${hi}.${skippedNote}`
        : `${touched} spot${touched === 1 ? "" : "s"} (${lo}–${hi}) set to ${formatMoney(BASE_PRICE_CENTS + extraCents)} per day.${skippedNote}`,
    );
  };

  return (
    <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--spacing-16)", flexWrap: "wrap" }}>
        <div>
          <h1 style={st.h1}>Parking Spots</h1>
          <p style={st.sub}>
            Every spot starts at the base of {BASE_PRICE_CREDITS} credit
            ({formatMoney(BASE_PRICE_CENTS)} a day). On the spots your
            building owns you can charge whatever you like on top; spots
            your residents share stay at the base. Parqlet keeps{" "}
            {COMMISSION_PCT}% and the rest is paid to you.
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--spacing-8)", flexShrink: 0 }}>
          <Button variant="secondary" size="small" style={{ width: "auto", whiteSpace: "nowrap" }} onClick={() => setPricingRange(true)}>
            Set prices by range
          </Button>
          <Button variant="primary" size="small" style={{ width: "auto", whiteSpace: "nowrap" }} onClick={() => setCreating(true)}>
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
          <FilterDropdown label="Owner" options={["All spots", "Building owned", "Resident shared"]} value={owner} onChange={setOwner} />
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
          {["Spot", "Level", "Type", "Covered", "EV", "Shared by", "Price / day", "You receive", "Status", ""].map((h, i) => (
            <div key={h || i} style={{ ...st.cellBase, flex: COL_FLEX[i], justifyContent: i === 9 ? "flex-end" : "flex-start" }}>
              <TableHeadLabel style={{ color: "var(--color-text-weak)" }}>{h}</TableHeadLabel>
            </div>
          ))}
        </div>

        {visible.map((sp) => {
          const total = spotPriceCents(sp);
          return (
            <div key={sp.id} style={st.row}>
              <Cell i={0}><span style={{ ...st.txt, fontWeight: 600 }}>{sp.number}</span></Cell>
              <Cell i={1}><span style={st.txt}>{sp.level}</span></Cell>
              <Cell i={2}><span style={st.txt}>{sp.type}</span></Cell>
              <Cell i={3}><span style={st.txt}>{sp.covered ? "Yes" : "No"}</span></Cell>
              <Cell i={4}><span style={st.txt}>{sp.evCharger ? "Yes" : "No"}</span></Cell>
              <Cell i={5}>
                <span style={{ ...st.txt, color: sp.owner === "building" ? "var(--color-text-strong)" : "var(--color-text-weak)" }}>
                  {sp.owner === "building" ? "Building" : "Resident"}
                </span>
              </Cell>
              <Cell i={6}>
                <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ ...st.txt, fontWeight: 600 }}>{formatMoney(total)}</span>
                  <span style={st.subTxt}>
                    {sp.extraCents > 0
                      ? `${BASE_PRICE_CREDITS} credit + ${formatMoney(sp.extraCents)}`
                      : `${BASE_PRICE_CREDITS} credit`}
                  </span>
                </span>
              </Cell>
              <Cell i={7}><span style={{ ...st.txt, color: "var(--color-text-weak)" }}>{formatMoney(netToBuilding(total))}</span></Cell>
              <Cell i={8}>
                <Badge as="span" variant={sp.status === "Listed" ? "active" : "inactive"}>{sp.status}</Badge>
              </Cell>
              <div style={{ ...st.cellBase, flex: COL_FLEX[9], justifyContent: "flex-end", gap: "var(--spacing-12)" }}>
                {canPrice(sp) ? (
                  <>
                    <button style={st.link} onClick={() => setEditing(sp)}>Edit</button>
                    <button
                      style={{ ...st.link, color: "var(--color-tag-text-expired)" }}
                      onClick={() => setSpots((prev) => prev.filter((x) => x.id !== sp.id))}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  // A resident's spot is theirs. The building can take it
                  // off the market, but it cannot reprice or remove it.
                  <button style={st.link} onClick={() => toggleListed(sp.id)}>
                    {sp.status === "Listed" ? "Unlist" : "List"}
                  </button>
                )}
              </div>
            </div>
          );
        })}

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
  "7 1 70px", "6 1 60px", "8 1 90px", "6 1 70px", "5 1 55px",
  "7 1 80px", "9 1 120px", "8 1 100px", "8 1 100px", "8 1 120px",
];

function Cell({ i, children }: { i: number; children: React.ReactNode }) {
  return <div style={{ ...st.cellBase, flex: COL_FLEX[i] }}>{children}</div>;
}

/** The base + extra + commission line, shown wherever a price is set. */
function PriceBreakdown({ extraCents }: { extraCents: number }) {
  const total = BASE_PRICE_CENTS + extraCents;
  return (
    <span style={st.formHint}>
      Renter pays <strong>{formatMoney(total)}</strong> ({BASE_PRICE_CREDITS} credit
      {extraCents > 0 ? ` + ${formatMoney(extraCents)}` : ""}) · Parqlet keeps{" "}
      {formatMoney(total - netToBuilding(total))} ({COMMISSION_PCT}% and card fees) ·
      you receive <strong>{formatMoney(netToBuilding(total))}</strong>
    </span>
  );
}

function RangePriceModal({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (from: number, to: number, extraCents: number) => void;
}) {
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState("100");
  const [extra, setExtra] = useState("10.00");

  const extraCents = Math.max(0, Math.round(Number(extra) * 100) || 0);
  const valid = Number.isFinite(Number(from)) && Number.isFinite(Number(to)) && Number.isFinite(Number(extra));

  return (
    <Modal open={open} onClose={onClose} title="Set prices by range" size="small">
      <div style={st.form}>
        <p style={st.formHint}>
          Applies one extra to every spot you own whose number falls in the
          range. Run it once per block: 1–100 at one rate, 200–300 at
          another. Spots your residents share are skipped.
        </p>

        <div style={{ display: "flex", gap: "var(--spacing-12)" }}>
          <Input label="From spot" inputMode="numeric" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To spot" inputMode="numeric" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>

        <Input
          label="Extra per day (USD), on top of the base credit"
          inputMode="decimal"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
        />

        <PriceBreakdown extraCents={extraCents} />

        <div style={st.actions}>
          <Button variant="secondary" size="small" style={{ width: "auto" }} onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="small" style={{ width: "auto" }} disabled={!valid} onClick={() => onApply(Number(from), Number(to), extraCents)}>
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
  const [extra, setExtra] = useState((initial.extraCents / 100).toFixed(2));
  const [seen, setSeen] = useState(title);
  if (seen !== title) {
    setSeen(title);
    setD(initial);
    setExtra((initial.extraCents / 100).toFixed(2));
  }

  const extraCents = Math.max(0, Math.round(Number(extra) * 100) || 0);

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

        <Input
          label="Extra per day (USD), on top of the base credit"
          inputMode="decimal"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
        />

        <PriceBreakdown extraCents={extraCents} />

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
          <Button variant="secondary" size="small" style={{ width: "auto" }} onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="small" style={{ width: "auto" }} onClick={() => onSave({ ...d, extraCents })}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

const st: Record<string, React.CSSProperties> = {
  h1: { margin: 0, fontSize: "var(--font-size-heading-3)", fontWeight: 600, color: "var(--color-text-strong)" },
  sub: { margin: "var(--spacing-4) 0 0", fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", maxWidth: 620 },
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
    padding: "var(--spacing-8) var(--spacing-24)", minHeight: 48,
    borderBottom: "1px solid var(--color-stroke-medium)",
  },
  headRow: { background: "var(--color-fill-white)" },
  cellBase: { display: "flex", alignItems: "center", minWidth: 0 },
  txt: { fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", whiteSpace: "nowrap" },
  subTxt: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", whiteSpace: "nowrap" },
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
    textDecoration: "underline", fontFamily: "var(--font-family-body)", flexShrink: 0,
  },
  form: { display: "flex", flexDirection: "column", gap: "var(--spacing-12)" },
  formHint: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", margin: 0, lineHeight: 1.5 },
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
