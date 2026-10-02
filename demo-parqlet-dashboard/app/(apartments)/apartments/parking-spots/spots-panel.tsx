"use client";

/**
 * Parking Spots — the spot list, Apartments only.
 *
 * WHERE THE ROWS COME FROM. A building does not maintain a list of
 * parking spaces; it maintains LEASES, in Yardi or whatever
 * it runs on, and the parking assignment is a line on the lease. So the
 * spots arrive by integration, and the one column that matters -
 * STATUS - is read off the lease rather than typed in:
 *
 *   Vacant        No lease covers it. The building prices it and sells
 *                 it on Parqlet.
 *   Move-in soon  A lease starts on a known date. Still sellable, but
 *                 only up to the day before.
 *   Assigned      On a lease today. Base credit, no extra, and the
 *                 resident may share it from their phone - the same deal
 *                 a Condo resident gets.
 *
 * That third status is the whole argument for the integration. Without
 * it somebody has to work out, every month, which spaces are empty and
 * when the empty ones stop being empty - and nobody does that. A building
 * without a lease system can still add spots by hand; it just gets two
 * statuses instead of three, and has to keep them honest itself.
 *
 * A hundred-odd spots is too many to scan, so this reuses the search box
 * and <FilterDropdown> row the Bookings and Resident Directory pages use,
 * plus the shared <Modal> / <Input> for editing. An operator should not
 * have to learn a second set of controls on their third screen.
 */

import React, { useMemo, useState } from "react";

import { Badge } from "../../../components/ui/Badge";
import { BulkActionBar } from "../../../components/ui/BulkActionBar";
import { Button } from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";
import { CountTabs } from "../../../components/ui/CountTabs";
import { FilterDropdown } from "../../../components/ui/FilterDropdown";
import { Input } from "../../../components/ui/Input";
import { Modal } from "../../../components/ui/Modal";
import { NumberStepper } from "../../../components/ui/NumberStepper";
import { Pagination } from "../../../components/ui/Pagination";
import { TableHeadLabel } from "../../../components/ui/TableHeadLabel";
import { useToast } from "../../../components/ui/use-toast";
import {
  COMMISSION_PCT,
  DEMO_SPOTS,
  SPOT_TIERS,
  bookableUntil,
  canPrice,
  SPOT_BOOKING_LABEL,
  countByStatus,
  formatMoney,
  formatSpotDate,
  netToBuilding,
  spotPriceCents,
  spotBookingStatus,
  spotStatus,
  type DemoSpot,
  type SpotBookingStatus,
  type SpotStatus,
  type SpotTier,
} from "../../../lib/demo/apartments-data";
import { BASE_PRICE_CENTS, BASE_PRICE_CREDITS } from "../../../lib/demo/pricing";
import { BulkSpotsModal, rangeEffect, type SpotRange } from "./bulk-spots-modal";

type Draft = Omit<DemoSpot, "id">;

const EMPTY: Draft = {
  number: "",
  type: "Standard",
  // Standard is the default tier, the same as the real dashboard, where a
  // spot with none set is Standard rather than untyped.
  tier: "Standard",
  evCharger: false,
  // Anything added by hand is free until a lease says otherwise, so it
  // starts rentable and priceable.
  unit: null,
  moveInAt: null,
  paused: false,
  extraCents: 0,
};

type StatusTab = "all" | SpotStatus;

function IcSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
      <path d="M11 11l3 3" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The two "open a modal" flags are OWNED BY THE PAGE, not by this panel.
 * Their buttons belong on the title row, which the page renders, and the
 * modals belong here next to the state they change - so the flags are
 * passed down rather than the buttons being lifted out with them.
 */
export type SpotsPanelProps = {
  creating: boolean;
  setCreating: (v: boolean) => void;
  bulkEditing: boolean;
  setBulkEditing: (v: boolean) => void;
};

export function SpotsPanel({ creating, setCreating, bulkEditing, setBulkEditing }: SpotsPanelProps) {
  const [spots, setSpots] = useState<DemoSpot[]>(DEMO_SPOTS);
  const [editing, setEditing] = useState<DemoSpot | null>(null);
  const [assigning, setAssigning] = useState<DemoSpot | null>(null);
  const [lease, setLease] = useState<DemoSpot | null>(null);
  const toast = useToast();

  // ── Filters ───────────────────────────────────────────────────────────
  const [tab, setTab] = useState<StatusTab>("all");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All types");
  const [tier, setTier] = useState("All tiers");
  const [ev, setEv] = useState("EV: All");
  const [sort, setSort] = useState("Spot number");

  const counts = useMemo(() => countByStatus(spots), [spots]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = spots.filter((s) => {
      if (tab !== "all" && spotStatus(s) !== tab) return false;
      // Spot number OR unit: an operator chasing "who has 804's space"
      // starts from the unit as often as from the bay.
      if (q && !`${s.number} ${s.unit ?? ""}`.toLowerCase().includes(q)) return false;
      if (type !== "All types" && s.type !== type) return false;
      if (tier !== "All tiers" && s.tier !== tier) return false;
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
    // Status: everything the building can actually sell first, in spot
    // order, then the leased ones. Still offered, because on a 180-space
    // garage where 159 are leased it is the fastest way to the rows worth
    // acting on - it is just no longer what the screen opens on.
    if (sort === "Status") {
      return [...rows].sort((a, b) => {
        const ra = canPrice(a) ? 0 : 1;
        const rb = canPrice(b) ? 0 : 1;
        return ra === rb ? byNumber(a, b) : ra - rb;
      });
    }
    // Spot number, the DEFAULT. A garage is numbered, and an operator
    // looking for bay 148 wants it where 148 belongs rather than wherever
    // its lease happens to sort it.
    return [...rows].sort(byNumber);
  }, [spots, tab, query, type, tier, ev, sort]);

  // ── Pagination ────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // A filter that shortens the list can strand you on a page that no
  // longer exists, which renders as an empty table rather than as no
  // results - so changing one sends you back to the first page.
  //
  // Adjusted during render rather than in an effect: React re-runs this
  // component before anything is painted, so the wrong page is never
  // shown, where an effect would paint the empty table first and then
  // correct it.
  const filterKey = [tab, query, type, tier, ev, sort].join("\u0000");
  const [seenFilters, setSeenFilters] = useState(filterKey);
  if (seenFilters !== filterKey) {
    setSeenFilters(filterKey);
    setPage(1);
  }
  const paged = useMemo(
    () => visible.slice((page - 1) * pageSize, page * pageSize),
    [visible, page, pageSize],
  );

  // ── Selection ─────────────────────────────────────────────────────────
  /**
   * Ids, not rows. A selection held as objects goes stale the moment a
   * bulk edit replaces them, and the bar would then act on the spots as
   * they were before the last edit.
   */
  const [ticked, setTicked] = useState<Set<string>>(new Set());

  /**
   * The selection the BAR acts on: ticked rows that the current filters
   * still show.
   *
   * Narrowed on read rather than pruned in an effect. A row you cannot
   * see is a row you cannot untick, so it must never be deleted or
   * repriced by a button you press while looking at a different list -
   * but relaxing the filter should bring your ticks back rather than
   * having silently thrown them away.
   */
  const selected = useMemo(() => {
    if (ticked.size === 0) return ticked;
    const live = new Set(visible.map((s) => s.id));
    return new Set([...ticked].filter((id) => live.has(id)));
  }, [ticked, visible]);

  const selectedSpots = useMemo(
    () => spots.filter((s) => selected.has(s.id)),
    [spots, selected],
  );
  const pageAllSelected = paged.length > 0 && paged.every((s) => selected.has(s.id));
  const pageSomeSelected = paged.some((s) => selected.has(s.id));

  const toggleOne = (id: string, on: boolean) =>
    setTicked((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const togglePage = (on: boolean) =>
    setTicked((prev) => {
      const next = new Set(prev);
      for (const s of paged) {
        if (on) next.add(s.id);
        else next.delete(s.id);
      }
      return next;
    });

  // ── Mutations ─────────────────────────────────────────────────────────
  const save = (draft: Draft, id?: string) => {
    setSpots((prev) =>
      id ? prev.map((s) => (s.id === id ? { ...draft, id } : s)) : [...prev, { ...draft, id: `s${Date.now()}` }],
    );
    setEditing(null);
    setCreating(false);
    // The modal closes onto a long table where a new row is easy to miss,
    // especially when a filter or sort puts it off-screen.
    toast.show(
      id
        ? `Spot ${draft.number} updated · ${formatMoney(BASE_PRICE_CENTS + draft.extraCents)} a day`
        : `Spot ${draft.number} added · ${formatMoney(BASE_PRICE_CENTS + draft.extraCents)} a day`,
    );
  };

  /**
   * Apply every range in the bulk dialog in one pass.
   *
   * Creating and updating are the SAME operation here, deliberately: the
   * operator said what a block of numbers should be, and whether each
   * number happened to exist already is our problem, not theirs. The
   * dialog has already shown them the split.
   */
  const applyRanges = (ranges: SpotRange[]) => {
    let created = 0;
    let updated = 0;
    let skipped = 0;

    setSpots((prev) => {
      const byNumber = new Map(prev.map((s) => [s.number, s]));
      const next = [...prev];

      for (const r of ranges) {
        const e = rangeEffect(r, prev);
        if (!e) continue;
        for (let n = e.lo; n <= e.hi; n++) {
          const number = String(n);
          const existing = byNumber.get(number);
          if (!existing) {
            const made: DemoSpot = {
              id: `s${number}-${Date.now()}`,
              number,
              type: r.type,
              tier: "Standard",
              evCharger: r.evCharger,
              unit: null,
              moveInAt: null,
              paused: false,
              extraCents: e.extraCents,
            };
            next.push(made);
            byNumber.set(number, made);
            created++;
          } else if (canPrice(existing)) {
            const i = next.findIndex((s) => s.id === existing.id);
            next[i] = { ...existing, type: r.type, evCharger: r.evCharger, extraCents: e.extraCents };
            updated++;
          } else {
            // On a lease, so it costs the base whatever the rule said.
            skipped++;
          }
        }
      }
      return next;
    });

    setBulkEditing(false);
    const parts: string[] = [];
    if (created) parts.push(`${created} spot${created === 1 ? "" : "s"} added`);
    if (updated) parts.push(`${updated} updated`);
    toast.show(
      parts.length === 0
        ? "Nothing changed — every number in those ranges is on a lease."
        : `${parts.join(", ")}.` +
          (skipped ? ` ${skipped} assigned to a unit, left at the base.` : ""),
    );
  };

  /** Give a spot to a unit, by hand. Normally the lease sync does this. */
  const assignToUnit = (spot: DemoSpot, unit: string, moveInAt: string | null) => {
    setSpots((prev) =>
      prev.map((s) =>
        s.id === spot.id
          // An assigned spot costs the base and nothing more, so the extra
          // goes with the assignment rather than lingering until someone
          // notices the resident is being charged for a Premium bay.
          ? { ...s, unit, moveInAt, extraCents: moveInAt ? s.extraCents : 0, paused: false }
          : s,
      ),
    );
    setAssigning(null);
    toast.show(
      moveInAt
        ? `Spot ${spot.number} goes to unit ${unit} on ${formatSpotDate(moveInAt)} · bookable until ${formatSpotDate(new Date(new Date(moveInAt).getTime() - 86400000))}`
        : `Spot ${spot.number} assigned to unit ${unit} · now ${formatMoney(BASE_PRICE_CENTS)} a day`,
    );
  };

  const unassign = (spot: DemoSpot) => {
    setSpots((prev) =>
      prev.map((s) => (s.id === spot.id ? { ...s, unit: null, moveInAt: null } : s)),
    );
    toast.show(`Spot ${spot.number} unassigned · you can price and rent it now`);
  };

  // ── Bulk actions ──────────────────────────────────────────────────────
  const [bulkPricing, setBulkPricing] = useState(false);
  const [bulkTyping, setBulkTyping] = useState(false);

  /** Run `change` over the selection, skipping anything on a lease. */
  const overSelection = (
    change: (s: DemoSpot) => DemoSpot,
    describe: (touched: number, skipped: number) => string,
  ) => {
    const touched = selectedSpots.filter(canPrice);
    const skipped = selectedSpots.length - touched.length;
    const ids = new Set(touched.map((s) => s.id));
    setSpots((prev) => prev.map((s) => (ids.has(s.id) ? change(s) : s)));
    setTicked(new Set());
    toast.show(describe(touched.length, skipped));
  };

  const skipNote = (skipped: number) =>
    skipped ? ` ${skipped} assigned to a unit and left alone.` : "";

  // Every selected rentable spot already off Parqlet? Then the button is
  // the way back on, not a second press of the same switch.
  const pausable = selectedSpots.filter(canPrice);
  const allPaused = pausable.length > 0 && pausable.every((s) => s.paused);

  /**
   * Apply one new price per price-block, in a single pass.
   *
   * Takes blocks rather than one price because the dialog hands back what
   * the operator actually decided: these spots to this rate, those to
   * that one. Nothing on a lease can be in here - the dialog is only ever
   * given spots that `canPrice`.
   */
  const applyPriceGroups = (next: { spotIds: string[]; extraCents: number }[]) => {
    setBulkPricing(false);
    const byId = new Map<string, number>();
    for (const g of next) for (const id of g.spotIds) byId.set(id, g.extraCents);
    if (byId.size === 0) return;

    setSpots((prev) =>
      prev.map((s) => (byId.has(s.id) ? { ...s, extraCents: byId.get(s.id)! } : s)),
    );
    setTicked(new Set());

    const skipped = selectedSpots.length - selectedSpots.filter(canPrice).length;
    const rates = next
      .map((g) => `${g.spotIds.length} to ${formatMoney(BASE_PRICE_CENTS + g.extraCents)}`)
      .join(", ");
    toast.show(`Repriced ${byId.size} spot${byId.size === 1 ? "" : "s"} - ${rates}.${skipNote(skipped)}`);
  };

  const deleteSelected = () => {
    const removable = selectedSpots.filter(canPrice);
    const skipped = selectedSpots.length - removable.length;
    const ids = new Set(removable.map((s) => s.id));
    setSpots((prev) => prev.filter((s) => !ids.has(s.id)));
    setTicked(new Set());
    toast.show(
      removable.length === 0
        ? `Nothing deleted — all ${skipped} are on a unit's lease.`
        : `${removable.length} spot${removable.length === 1 ? "" : "s"} deleted.${skipNote(skipped)}`,
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
      <p style={st.sub}>
        {/* Composed in JS, not interpolated into the sentence: JSX drops
            the space between an expression and the word after it when the
            text runs onto the next line, and "$6.00a day" is the kind of
            typo nobody sees until a prospect does. */}
        {`Every spot starts at the base of ${BASE_PRICE_CREDITS} credit (${formatMoney(BASE_PRICE_CENTS)} a day).`}{" "}
        Vacant spots can be priced higher and rented to residents&rsquo;
        guests. Spots assigned to a unit stay at the base, and their residents
        can share them.
      </p>

      {/*
        Status, search, filters — and, laid OVER them, the selection bar.
        ONE slot, not two.

        The bar used to sit in the flow between this row and the table,
        which meant ticking the first checkbox pushed every row down by the
        bar's own height. The second tick then landed on whichever row had
        moved into the place the eye last saw - exactly the "I clicked 415
        and it ticked 411" fault. A control that appears mid-interaction
        must not take space from the thing being interacted with.

        Hiding the filters under it is deliberate rather than a side
        effect: narrowing the list while rows are ticked silently changes
        what a bulk action would hit.
      */}
      <div style={st.toolbar}>
        <div style={{ ...st.filterRow, visibility: selected.size > 0 ? "hidden" : "visible" }}>
        <CountTabs
          active={tab}
          onChange={setTab}
          tabs={[
            { id: "all", label: "All", count: spots.length },
            { id: "rentable", label: "Vacant", count: counts.rentable },
            { id: "move-in-soon", label: "Move-in soon", count: counts["move-in-soon"] },
            { id: "assigned", label: "Assigned", count: counts.assigned },
          ]}
        />

        <div style={st.filterRight}>
          <div style={st.search}>
            <IcSearch />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by spot or unit"
              style={st.searchInput}
            />
          </div>
          <FilterDropdown label="Type" options={["All types", "Compact", "Standard", "Large SUV"]} value={type} onChange={setType} />
          <FilterDropdown label="Tier" options={["All tiers", ...SPOT_TIERS]} value={tier} onChange={setTier} />
          <FilterDropdown label="EV" options={["EV: All", "EV only", "No EV"]} value={ev} onChange={setEv} />
          <FilterDropdown
            label="Sort"
            options={["Spot number", "Status", "Price: high to low", "Price: low to high"]}
            value={sort}
            onChange={setSort}
          />
          </div>
        </div>

        <BulkActionBar
          count={selected.size}
          itemLabel="spot"
          style={{ position: "absolute", inset: 0 }}
          onClear={() => setTicked(new Set())}
          actions={[
            { label: "Edit price", onClick: () => setBulkPricing(true) },
            { label: "Edit type", onClick: () => setBulkTyping(true) },
            {
              label: allPaused ? "Resume" : "Pause",
              onClick: () =>
                overSelection(
                  (s) => ({ ...s, paused: !allPaused }),
                  (n, skipped) =>
                    `${n} spot${n === 1 ? "" : "s"} ${allPaused ? "back on Parqlet" : "paused — hidden from Parqlet"}.${skipNote(skipped)}`,
                ),
            },
            { label: "Delete", onClick: deleteSelected, destructive: true },
          ]}
        />
      </div>

      <div style={st.card}>
        <div style={st.tableScroll}>
          <div style={{ ...st.row, ...st.headRow }}>
            <div style={{ ...st.cellBase, flex: COL_FLEX[0] }}>
              <Checkbox
                checked={pageAllSelected}
                indeterminate={pageSomeSelected && !pageAllSelected}
                onChange={togglePage}
                aria-label="Select every spot on this page"
              />
            </div>
            {HEADS.map((h, i) => (
              <div
                key={h || i}
                style={{ ...st.cellBase, flex: COL_FLEX[i + 1], justifyContent: i === HEADS.length - 1 ? "flex-end" : "flex-start" }}
              >
                <TableHeadLabel>{h}</TableHeadLabel>
              </div>
            ))}
          </div>

          {paged.map((sp) => {
            const status = spotStatus(sp);
            const total = spotPriceCents(sp);
            const until = bookableUntil(sp);
            const isSelected = selected.has(sp.id);
            return (
              <div key={sp.id} style={{ ...st.row, ...(isSelected ? st.rowSelected : null) }}>
                <div style={{ ...st.cellBase, flex: COL_FLEX[0] }}>
                  <Checkbox
                    checked={isSelected}
                    onChange={(on) => toggleOne(sp.id, on)}
                    aria-label={`Select spot ${sp.number}`}
                  />
                </div>
                <Cell i={1}><span style={{ ...st.txt, fontWeight: 600 }}>{sp.number}</span></Cell>
                <Cell i={2}><span style={st.txt}>{sp.type}</span></Cell>
                {/* What it is SOLD AS, beside what FITS in it. Two axes, and
                    a Premium spot can be Compact. */}
                <Cell i={3}>
                  <span style={{ ...st.txt, color: canPrice(sp) ? "var(--color-text-strong)" : "var(--color-text-weak)" }}>
                    {sp.tier}
                  </span>
                </Cell>
                <Cell i={4}><span style={st.txt}>{sp.evCharger ? "Yes" : "No"}</span></Cell>
                <Cell i={5}>
                  <span style={st.stack}>
                    <StatusTag spot={sp} status={status} />
                    <span style={st.subTxt}>{statusNote(sp, status)}</span>
                  </span>
                </Cell>
                {/* Is it SOLD? A different question from whether it may
                    be sold, which is the Status column beside it. */}
                <Cell i={6}><BookingTag status={spotBookingStatus(sp.number)} /></Cell>
                <Cell i={7}>
                  <span style={st.stack}>
                    <span style={{ ...st.txt, fontWeight: 600 }}>{formatMoney(total)}</span>
                    <span style={st.subTxt}>
                      {status === "assigned"
                        ? "Resident sharing"
                        : until
                          // The date is the price's shelf life, so it belongs
                          // with the price rather than in a fourth column.
                          ? `Bookable until ${formatSpotDate(until)}`
                          : sp.extraCents > 0
                            ? `${BASE_PRICE_CREDITS} credit + ${formatMoney(sp.extraCents)}`
                            : `${BASE_PRICE_CREDITS} credit`}
                    </span>
                  </span>
                </Cell>
                <Cell i={8}>
                  {/* A spot on a lease earns the building nothing directly -
                      the resident shares it and keeps the credit - so there
                      is no figure to put here. */}
                  <span style={{ ...st.txt, color: "var(--color-text-weak)" }}>
                    {canPrice(sp) ? formatMoney(netToBuilding(total)) : "—"}
                  </span>
                </Cell>
                <div style={{ ...st.cellBase, flex: COL_FLEX[9], justifyContent: "flex-end", gap: "var(--spacing-12)" }}>
                  {status === "assigned" ? (
                    <button style={st.link} onClick={() => unassign(sp)}>Unassign</button>
                  ) : (
                    <>
                      <button style={st.link} onClick={() => setEditing(sp)}>Edit</button>
                      {status === "move-in-soon" ? (
                        <button style={st.link} onClick={() => setLease(sp)}>View lease</button>
                      ) : (
                        <button style={st.link} onClick={() => setAssigning(sp)}>Assign to unit</button>
                      )}
                    </>
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

        {/* Inside the card, as every other table view has it. */}
        <Pagination
          totalItems={visible.length}
          pageSize={pageSize}
          currentPage={page}
          onPageChange={setPage}
          itemLabel="spots"
          pageSizeOptions={[10, 20, 50, 100]}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      </div>

      {toast.node}

      <BulkSpotsModal
        open={bulkEditing}
        spots={spots}
        onClose={() => setBulkEditing(false)}
        onSave={applyRanges}
      />

      <SpotModal
        open={creating || editing != null}
        initial={editing ? { ...editing } : EMPTY}
        title={editing ? `Edit spot ${editing.number}` : "Add spot"}
        onClose={() => { setEditing(null); setCreating(false); }}
        onSave={(draft) => save(draft, editing?.id)}
      />

      {assigning && (
        <AssignModal
          spot={assigning}
          onClose={() => setAssigning(null)}
          onAssign={(unit, moveInAt) => assignToUnit(assigning, unit, moveInAt)}
        />
      )}

      {lease && <LeaseModal spot={lease} onClose={() => setLease(null)} />}

      {/* Mounted only while open, so each run starts from the prices the
          selection is at NOW rather than from the last run's fields. */}
      {bulkPricing && (
        <BulkPriceModal
          spots={pausable}
          onClose={() => setBulkPricing(false)}
          onApply={applyPriceGroups}
        />
      )}

      <BulkTypeModal
        open={bulkTyping}
        count={pausable.length}
        onClose={() => setBulkTyping(false)}
        onApply={(type_, tier_) => {
          setBulkTyping(false);
          overSelection(
            (s) => ({ ...s, type: type_, tier: tier_ }),
            (n, skipped) =>
              `${n} spot${n === 1 ? "" : "s"} set to ${type_} · ${tier_}.${skipNote(skipped)}`,
          );
        }}
      />
    </div>
  );
}

const HEADS = ["Spot", "Size", "Tier", "EV", "Status", "Booking", "Price / day", "You receive", ""];
const COL_FLEX = [
  "0 0 40px", "5 1 58px", "6 1 78px", "6 1 78px", "3 1 42px",
  "10 1 140px", "6 1 95px", "9 1 115px", "5 1 80px", "8 1 136px",
];

function Cell({ i, children }: { i: number; children: React.ReactNode }) {
  return <div style={{ ...st.cellBase, flex: COL_FLEX[i] }}>{children}</div>;
}

function StatusTag({ spot, status }: { spot: DemoSpot; status: SpotStatus }) {
  // Paused is a modifier on a rentable spot, not a status of its own - the
  // lease has not changed, only whether we are showing it to renters - so
  // it borrows the row rather than adding a fifth chip to the filter bar.
  if (status === "rentable" && spot.paused) return <Badge variant="inactive">Paused</Badge>;
  if (status === "rentable") return <Badge variant="active">Vacant</Badge>;
  if (status === "move-in-soon") return <Badge variant="pending">Move-in soon</Badge>;
  return <Badge variant="inactive">Assigned</Badge>;
}

/**
 * Booked / Upcoming / Available.
 *
 * `upcoming` borrows the same blue the Bookings screen gives a booking
 * that has not started, and `available` is deliberately the quiet grey:
 * on a garage where most spots are free, a hundred and sixty coloured
 * pills would drown the dozen that mean something.
 */
function BookingTag({ status }: { status: SpotBookingStatus }) {
  if (status === "booked") return <Badge variant="active">{SPOT_BOOKING_LABEL.booked}</Badge>;
  if (status === "upcoming") return <Badge variant="upcoming">{SPOT_BOOKING_LABEL.upcoming}</Badge>;
  return <span style={{ ...st.txt, color: "var(--color-text-weak)" }}>{SPOT_BOOKING_LABEL.available}</span>;
}

function statusNote(spot: DemoSpot, status: SpotStatus): string {
  if (status === "assigned") return `Unit ${spot.unit}`;
  if (status === "move-in-soon") return `Unit ${spot.unit} moves in ${formatSpotDate(spot.moveInAt!)}`;
  return spot.paused ? "Hidden from Parqlet" : "Can be rented on Parqlet";
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

/**
 * A price field that asks for the FULL daily price, not the extra.
 *
 * It used to ask for "extra per day, on top of the base credit", which is
 * how the data is stored but not a number anybody has in their head. A
 * manager pricing a garage knows what a spot costs; the extra is derived
 * on the way out and the stored shape is unchanged.
 */
function PriceField({
  value,
  onChange,
  width,
}: {
  value: string;
  onChange: (v: string) => void;
  width?: number | string;
}) {
  const cents = Math.round(Number.parseFloat(value) * 100);
  const belowBase = Number.isFinite(cents) && cents < BASE_PRICE_CENTS;
  return (
    <NumberStepper
      label="Price per day"
      prefix="$"
      align="left"
      width={width ?? "100%"}
      min={BASE_PRICE_CENTS / 100}
      max={999}
      value={value}
      onChange={onChange}
      error={
        belowBase
          ? `A spot cannot be priced below the base of ${formatMoney(BASE_PRICE_CENTS)} a day.`
          : undefined
      }
    />
  );
}

const priceToExtra = (price: string) =>
  Math.max(0, Math.round(Number.parseFloat(price) * 100) - BASE_PRICE_CENTS) || 0;

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
  const [price, setPrice] = useState(((BASE_PRICE_CENTS + initial.extraCents) / 100).toFixed(2));
  const [seen, setSeen] = useState(title);
  if (seen !== title) {
    setSeen(title);
    setD(initial);
    setPrice(((BASE_PRICE_CENTS + initial.extraCents) / 100).toFixed(2));
  }

  const extraCents = priceToExtra(price);
  const invalid = !d.number.trim() || Math.round(Number.parseFloat(price) * 100) < BASE_PRICE_CENTS;

  return (
    <Modal open={open} onClose={onClose} title={title} size="small">
      <div style={st.form}>
        <Input label="Spot number" value={d.number} onChange={(e) => setD({ ...d, number: e.target.value })} />

        <div style={{ display: "flex", gap: "var(--spacing-12)" }}>
          <label style={{ ...st.selectWrap, flex: 1 }}>
            <span style={st.selectLabel}>Vehicle type</span>
            <select
              style={st.select}
              value={d.type}
              onChange={(e) => setD({ ...d, type: e.target.value as DemoSpot["type"] })}
            >
              {(["Compact", "Standard", "Large SUV"] as const).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
          {/* What it is SOLD AS. A separate decision from the price, so a
              level can be repriced without being renamed. */}
          <label style={{ ...st.selectWrap, flex: 1 }}>
            <span style={st.selectLabel}>Tier</span>
            <select
              style={st.select}
              value={d.tier}
              onChange={(e) => setD({ ...d, tier: e.target.value as SpotTier })}
            >
              {SPOT_TIERS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
        </div>

        <PriceField value={price} onChange={setPrice} />
        <PriceBreakdown extraCents={extraCents} />

        <Checkbox
          checked={d.evCharger}
          onChange={(v) => setD({ ...d, evCharger: v })}
          label="EV charger"
        />

        <div style={st.actions}>
          <Button variant="secondary" size="small" style={{ width: "auto" }} onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            size="small"
            style={{ width: "auto" }}
            disabled={invalid}
            onClick={() => onSave({ ...d, extraCents })}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Assign a spot to a unit by hand.
 *
 * The lease sync normally does this; the form exists for the building
 * that has no sync yet, and for the bay the sync does not know about. The
 * move-in date is optional because both cases are real: a lease that
 * started last year, and one that starts in three weeks and leaves the
 * spot sellable until then.
 */
function AssignModal({
  spot,
  onClose,
  onAssign,
}: {
  spot: DemoSpot;
  onClose: () => void;
  onAssign: (unit: string, moveInAt: string | null) => void;
}) {
  const [unit, setUnit] = useState("");
  const [later, setLater] = useState(false);
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });

  const dateOk = !later || new Date(`${date}T00:00:00`) > new Date();

  return (
    <Modal open onClose={onClose} title={`Assign spot ${spot.number}`} size="small">
      <div style={st.form}>
        <p style={st.formHint}>
          A spot on a unit&rsquo;s lease costs the base of{" "}
          {formatMoney(BASE_PRICE_CENTS)} a day, and the resident can share it
          from their phone. Your extra comes off.
        </p>

        <Input
          label="Unit"
          placeholder="e.g. 804"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />

        <Checkbox
          checked={later}
          onChange={setLater}
          label="Their lease starts later"
        />

        {later && (
          <>
            <Input label="Move-in date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <span style={st.formHint}>
              {dateOk
                ? `You keep renting it until ${formatSpotDate(new Date(new Date(`${date}T00:00:00`).getTime() - 86400000))}, then it goes to unit ${unit || "—"}.`
                : "A move-in date has to be in the future."}
            </span>
          </>
        )}

        <div style={st.actions}>
          <Button variant="secondary" size="small" style={{ width: "auto" }} onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            size="small"
            style={{ width: "auto" }}
            disabled={!unit.trim() || !dateOk}
            onClick={() => onAssign(unit.trim(), later ? new Date(`${date}T00:00:00`).toISOString() : null)}
          >
            Assign
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * What the lease system says about this spot.
 *
 * Read-only on purpose. The lease is the source, and a dashboard that
 * lets you edit a synced date has two answers to the same question by
 * the next sync - so this shows where the date came from and sends the
 * operator to fix it where it lives.
 */
function LeaseModal({ spot, onClose }: { spot: DemoSpot; onClose: () => void }) {
  const until = bookableUntil(spot);
  return (
    <Modal open onClose={onClose} title={`Spot ${spot.number} · unit ${spot.unit}`} size="small">
      <div style={st.form}>
        <dl style={st.leaseList}>
          <Row label="Unit" value={`Unit ${spot.unit}`} />
          <Row label="Lease starts" value={formatSpotDate(spot.moveInAt!)} />
          <Row label="Bookable until" value={until ? formatSpotDate(until) : "—"} />
          <Row label="Price while it is yours" value={`${formatMoney(spotPriceCents(spot))} a day`} />
          <Row label="From" value="Yardi sync" />
        </dl>
        <p style={st.formHint}>
          This comes from your property system, so it is not edited here. Change
          the lease there and the spot follows on the next sync.
        </p>
        <div style={st.actions}>
          <Button variant="secondary" size="small" style={{ width: "auto" }} onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={st.leaseRow}>
      <dt style={st.leaseLabel}>{label}</dt>
      <dd style={st.leaseValue}>{value}</dd>
    </div>
  );
}

/**
 * Spot numbers as the blocks they actually form: "1-10, 14, 27".
 *
 * A group of thirty consecutive bays is one range to the operator who
 * laid them out, and printing all thirty numbers buries that. Runs are
 * collapsed; anything non-numeric is listed after, because a bay called
 * "VISITOR" is in no run.
 */
function compressSpotNumbers(numbers: string[]): string {
  const nums = numbers.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  const named = numbers.filter((n) => !Number.isFinite(Number(n))).sort();

  const parts: string[] = [];
  for (let i = 0; i < nums.length; ) {
    let j = i;
    while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
    parts.push(i === j ? String(nums[i]) : `${nums[i]}\u2013${nums[j]}`);
    i = j + 1;
  }
  const all = [...parts, ...named];
  // Eight blocks is about a line. Past that the list stops informing and
  // starts pushing the price field off the dialog.
  if (all.length > 8) return `${all.slice(0, 8).join(", ")} +${all.length - 8} more`;
  return all.join(", ");
}

type PriceGroup = {
  /** The price the whole group sits at today, as the key that formed it. */
  fromExtraCents: number;
  spotIds: string[];
  label: string;
  /** Full daily price in dollars, edited. */
  price: string;
};

/** The ticked spots, gathered into one block per price they are at now. */
function groupByPrice(spots: DemoSpot[]): PriceGroup[] {
  const by = new Map<number, DemoSpot[]>();
  for (const s of spots) {
    const g = by.get(s.extraCents);
    if (g) g.push(s);
    else by.set(s.extraCents, [s]);
  }
  return [...by.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([extraCents, members]) => ({
      fromExtraCents: extraCents,
      spotIds: members.map((m) => m.id),
      label: compressSpotNumbers(members.map((m) => m.number)),
      price: ((BASE_PRICE_CENTS + extraCents) / 100).toFixed(2),
    }));
}

/**
 * Edit price — the selection, split into the prices it is ALREADY at.
 *
 * Tick two spots that both cost $15 and there is one block to edit. Tick
 * seven spanning three rates and there are three, each with its own
 * field, because that is the decision the operator is actually making:
 * they are not flattening a garage to one number, they are moving a tier.
 * A single field would have quietly levelled the lot, and the only way
 * back is to remember what each one used to cost.
 *
 * Grouped by PRICE rather than by spot number, because price is what the
 * operator picked the rows for. The numbers are then printed back as the
 * runs they form, so a block reads "201-230" rather than thirty numbers.
 */
function BulkPriceModal({
  spots,
  onClose,
  onApply,
}: {
  /** Already filtered to the spots the building may price. */
  spots: DemoSpot[];
  onClose: () => void;
  onApply: (next: { spotIds: string[]; extraCents: number }[]) => void;
}) {
  const [groups, setGroups] = useState<PriceGroup[]>(() => groupByPrice(spots));

  const parsed = groups.map((g) => Math.round(Number.parseFloat(g.price) * 100));
  const invalid = parsed.some((c) => !Number.isFinite(c) || c < BASE_PRICE_CENTS);
  const changed = groups.some(
    (g, i) => Number.isFinite(parsed[i]) && parsed[i] - BASE_PRICE_CENTS !== g.fromExtraCents,
  );
  const total = groups.reduce((n, g) => n + g.spotIds.length, 0);

  const setPrice = (i: number, price: string) =>
    setGroups((p) => p.map((g, j) => (j === i ? { ...g, price } : g)));

  return (
    <Modal open onClose={onClose} title="Edit price" size="large">
      <div style={st.form}>
        <p style={st.formHint}>
          {groups.length === 1
            ? `All ${total} spot${total === 1 ? "" : "s"} you selected are at the same price.`
            : `Your ${total} selected spots sit at ${groups.length} different prices. Change the ones you mean - the rest stay as they are.`}{" "}
          Spots on a unit&rsquo;s lease are not listed: they keep the{" "}
          {formatMoney(BASE_PRICE_CENTS)} base.
        </p>

        {groups.map((g, i) => {
          const cents = parsed[i];
          const ok = Number.isFinite(cents) && cents >= BASE_PRICE_CENTS;
          const moved = ok && cents - BASE_PRICE_CENTS !== g.fromExtraCents;
          return (
            <div key={g.fromExtraCents} style={st.priceGroup}>
              <div style={st.rangeHead}>
                <span style={st.rangeLabel}>Range {i + 1}</span>
                <span style={st.groupMeta}>
                  {g.spotIds.length} spot{g.spotIds.length === 1 ? "" : "s"} now at{" "}
                  {formatMoney(BASE_PRICE_CENTS + g.fromExtraCents)}
                </span>
              </div>
              <span style={st.groupSpots}>Spots {g.label}</span>
              <div style={{ maxWidth: 190 }}>
                <PriceField value={g.price} onChange={(v) => setPrice(i, v)} />
              </div>
              {ok ? (
                <PriceBreakdown extraCents={cents - BASE_PRICE_CENTS} />
              ) : (
                <span style={{ ...st.formHint, color: "var(--color-tag-text-expired)" }}>
                  A spot cannot be priced below the base of {formatMoney(BASE_PRICE_CENTS)} a day.
                </span>
              )}
              {moved && (
                <span style={st.groupMoved}>
                  {g.spotIds.length} spot{g.spotIds.length === 1 ? "" : "s"} move from{" "}
                  {formatMoney(BASE_PRICE_CENTS + g.fromExtraCents)} to {formatMoney(cents)}.
                </span>
              )}
            </div>
          );
        })}

        <div style={st.actions}>
          <Button variant="secondary" size="small" style={{ width: "auto" }} onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            size="small"
            style={{ width: "auto" }}
            disabled={invalid || !changed}
            onClick={() =>
              onApply(
                groups
                  .map((g, i) => ({ spotIds: g.spotIds, extraCents: parsed[i] - BASE_PRICE_CENTS }))
                  // An untouched block is not an edit, so it is not reported
                  // as one in the toast either.
                  .filter((g, i) => g.extraCents !== groups[i].fromExtraCents),
              )
            }
          >
            Apply
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Both of a spot's "type" axes in one dialog, because the bar has one
 * button for them: what FITS in the space, and what it is SOLD AS.
 */
function BulkTypeModal({
  open,
  count,
  onClose,
  onApply,
}: {
  open: boolean;
  count: number;
  onClose: () => void;
  onApply: (type: DemoSpot["type"], tier: SpotTier) => void;
}) {
  const [type, setType] = useState<DemoSpot["type"]>("Standard");
  const [tier, setTier] = useState<SpotTier>("Standard");

  return (
    <Modal open={open} onClose={onClose} title="Edit type" size="small">
      <div style={st.form}>
        <p style={st.formHint}>
          Applies to the {count} selected spot{count === 1 ? "" : "s"} you can
          edit. Vehicle type is what fits in the space; tier is what you sell it
          as, and the two move independently.
        </p>
        <label style={st.selectWrap}>
          <span style={st.selectLabel}>Vehicle type</span>
          <select style={st.select} value={type} onChange={(e) => setType(e.target.value as DemoSpot["type"])}>
            {(["Compact", "Standard", "Large SUV"] as const).map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>
        <label style={st.selectWrap}>
          <span style={st.selectLabel}>Tier</span>
          <select style={st.select} value={tier} onChange={(e) => setTier(e.target.value as SpotTier)}>
            {SPOT_TIERS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>
        <div style={st.actions}>
          <Button variant="secondary" size="small" style={{ width: "auto" }} onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            size="small"
            style={{ width: "auto" }}
            disabled={count === 0}
            onClick={() => onApply(type, tier)}
          >
            Apply
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const st: Record<string, React.CSSProperties> = {
  sub: { margin: 0, fontSize: "var(--font-size-tiny)", lineHeight: 1.6, color: "var(--color-text-weak)", maxWidth: 760 },
  /** The one slot the filter row and the selection bar share. */
  toolbar: { position: "relative" },
  filterRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--spacing-12)",
    flexWrap: "wrap",
  },
  filterRight: {
    display: "flex",
    alignItems: "center",
    gap: "var(--spacing-8)",
    flexWrap: "wrap",
    flex: "1 1 420px",
    justifyContent: "flex-end",
  },
  search: {
    display: "flex", alignItems: "center", gap: 10,
    background: "var(--color-fill-white)",
    border: "1px solid var(--color-stroke-medium)",
    borderRadius: "var(--radius-8)", padding: "0 10px", height: 40,
    flex: "1 1 200px", maxWidth: 380,
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
  /** Pans the table instead of crushing it. The card keeps its corners,
   *  so the scroller has to live inside it. */
  tableScroll: { overflowX: "auto" },
  row: {
    display: "flex", alignItems: "center", gap: "var(--spacing-8)",
    padding: "var(--spacing-8) var(--spacing-24)", minWidth: 1000, minHeight: 56,
    borderBottom: "1px solid var(--color-stroke-medium)",
  },
  /** A ticked row, so the bar's count can be traced back to the rows it
   *  means without hunting for small boxes. Accent-50 rather than a grey:
   *  the selection is the same lime as the tick in the box. */
  rowSelected: { background: "var(--color-accent-50)" },
  headRow: { background: "var(--color-fill-white)", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-uppercase)", lineHeight: "var(--line-height-uppercase)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", textTransform: "uppercase" as const },
  cellBase: { display: "flex", alignItems: "center", minWidth: 0 },
  stack: { display: "flex", flexDirection: "column", gap: 3, minWidth: 0, alignItems: "flex-start" },
  txt: { fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", whiteSpace: "nowrap" },
  subTxt: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", whiteSpace: "nowrap" },
  link: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)",
    textDecoration: "underline", fontFamily: "var(--font-family-body)", padding: 0,
    whiteSpace: "nowrap",
  },
  form: { display: "flex", flexDirection: "column", gap: "var(--spacing-12)" },
  formHint: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", margin: 0, lineHeight: 1.5 },
  actions: { display: "flex", gap: "var(--spacing-12)", justifyContent: "flex-end", marginTop: "var(--spacing-8)" },
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
    height: 40, width: "100%", boxSizing: "border-box",
    padding: "0 var(--spacing-12)", borderRadius: "var(--radius-8)",
    border: "1px solid var(--color-stroke-medium)",
    fontSize: "var(--font-size-tiny)", fontFamily: "var(--font-family-body)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    background: "var(--color-fill-white)", color: "var(--color-text-strong)",
  },
  priceGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--spacing-8)",
    paddingBottom: "var(--spacing-16)",
    borderBottom: "1px solid var(--color-stroke-medium)",
  },
  rangeHead: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--spacing-12)" },
  rangeLabel: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-uppercase)",
    lineHeight: "var(--line-height-uppercase)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    color: "var(--color-text-weak)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  groupMeta: { fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" },
  groupSpots: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-strong)",
    lineHeight: 1.5,
  },
  groupMoved: {
    fontFamily: "var(--font-family-body)",
    fontSize: "var(--font-size-extra-tiny)",
    color: "var(--color-text-success)",
  },
  leaseList: { margin: 0, display: "flex", flexDirection: "column", gap: "var(--spacing-8)" },
  leaseRow: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--spacing-16)" },
  leaseLabel: { margin: 0, fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" },
  leaseValue: { margin: 0, fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"] },
};
