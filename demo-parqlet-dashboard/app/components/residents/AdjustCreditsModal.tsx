"use client";

/**
 * Super-admin credit adjustment.
 *
 * Moves a balance by a delta — +5, -2 — for one resident or for every
 * active resident in a building. Deliberately a DELTA rather than a
 * "set to" field: the balances change under you (a booking completes, a
 * gift card is redeemed), so reading a number and writing it back would
 * quietly overwrite whatever happened in between.
 *
 * The backend owns the rules and is the authority on all of them:
 * a balance never goes below zero, a resident who cannot take the whole
 * deduction is skipped rather than part-deducted, and a deduction gives
 * back the gift card reserve the credits accrued. This screen states
 * those rules so an admin is not surprised, and reports what actually
 * happened afterwards.
 */

import React, { useState } from "react";

import { adjustCredits } from "../../lib/api/residents";

export type AdjustCandidate = {
  id: string;
  name: string;
  /** Shown on every row and searchable. Two residents can share a name,
   *  and a super admin is usually given an email rather than a name when
   *  asked to adjust someone. Optional so an older caller still builds. */
  email?: string;
  unitNumber: string | null;
  creditBalance?: number;
  buildingName?: string;
};

type Mode = "resident" | "building";

/** Mirrors MAX_CREDIT_ADJUSTMENT server-side — a guard against a stray
 *  zero turning +10 into +100 across a whole building. */
const MAX_ADJUSTMENT = 100;

const fieldStyle: React.CSSProperties = {
  border: "1px solid var(--color-stroke-medium)",
  borderRadius: "var(--radius-8)",
  padding: "10px 12px",
  fontSize: "var(--font-size-tiny)",
  fontFamily: "var(--font-family-body)",
  color: "var(--color-text-strong)",
  background: "var(--color-fill-white)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

function ModeButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: "8px 10px",
        borderRadius: "var(--radius-8)",
        border: `1px solid ${active ? "var(--color-text-strong)" : "var(--color-stroke-medium)"}`,
        background: active ? "var(--color-fill-weak)" : "none",
        color: disabled ? "var(--color-text-weak)" : "var(--color-text-strong)",
        cursor: disabled ? "default" : "pointer",
        fontSize: "var(--font-size-extra-tiny)",
        fontFamily: "var(--font-family-body)",
      }}>
      {children}
    </button>
  );
}

export function AdjustCreditsModal({
  residents,
  building,
  onClose,
  onDone,
}: {
  /** The residents currently in view — the page already has them, so the
   *  picker needs no extra request. */
  residents: AdjustCandidate[];
  /** Present only when the top-bar filter is on ONE building. Building-wide
   *  adjustment is hidden otherwise: "all buildings" is not a scope anyone
   *  should be able to grant credits across by accident. */
  building: { id: string; name: string } | null;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("resident");
  const [residentId, setResidentId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [delta, setDelta] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = residents.filter((r) =>
    search.trim() === ""
      ? true
      : `${r.name} ${r.email ?? ""} ${r.unitNumber ?? ""}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
  );
  const selected = residents.find((r) => r.id === residentId) ?? null;
  // Which buildings this list actually covers. On "All Buildings" the
  // picker mixes several, and a name alone does not say which one a
  // resident belongs to — so the scope is named above the list.
  const buildingsInList = Array.from(
    new Set(residents.map((r) => r.buildingName).filter((n): n is string => !!n)),
  ).sort();
  const manyBuildings = buildingsInList.length > 1;

  const parsed = Number.parseInt(delta, 10);
  const valid =
    Number.isInteger(parsed) && parsed !== 0 && Math.abs(parsed) <= MAX_ADJUSTMENT;

  // Only meaningful for a single resident — a building-wide delta lands
  // on many different balances.
  const balance = selected?.creditBalance;
  const projected =
    mode === "resident" && valid && balance != null ? Math.max(0, balance + parsed) : null;
  const wouldGoNegative =
    mode === "resident" && valid && balance != null && balance + parsed < 0;
  const targetChosen = mode === "building" ? building != null : selected != null;

  const submit = async () => {
    if (!valid || saving || !targetChosen) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adjustCredits({
        ...(mode === "resident" ? { residentId: selected!.id } : { buildingId: building!.id }),
        delta: parsed,
      });
      const sign = res.delta > 0 ? "+" : "";
      onDone(
        `${sign}${res.delta} credits applied to ${res.applied} resident${res.applied === 1 ? "" : "s"}` +
          (res.skipped > 0
            ? `. ${res.skipped} skipped — they would have gone below zero.`
            : "."),
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to adjust credits");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--spacing-16)",
      }}>
      <div
        style={{
          background: "var(--color-fill-white)",
          border: "1px solid var(--color-stroke-medium)",
          borderRadius: "var(--radius-12)",
          width: "100%",
          maxWidth: 460,
          fontFamily: "var(--font-family-body)",
          overflow: "hidden",
        }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-stroke-medium)",
          }}>
          <span
            style={{
              fontSize: "var(--font-size-body)",
              fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              color: "var(--color-text-strong)",
            }}>
            Adjust credit balance
          </span>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-text-weak)",
            }}>
            {mode === "resident"
              ? selected
                ? `${selected.name}${selected.email ? ` (${selected.email})` : ""}${selected.creditBalance != null ? ` — currently ${selected.creditBalance} credit${selected.creditBalance === 1 ? "" : "s"}` : ""}`
                : "Pick a resident below"
              : `Every active resident in ${building?.name ?? "this building"}`}
          </p>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Building-wide is only offered when the top-bar filter is on
              ONE building. Across "all buildings" it would be far too
              easy to grant credits platform-wide by accident. */}
          <div style={{ display: "flex", gap: 8 }}>
            <ModeButton active={mode === "resident"} onClick={() => setMode("resident")}>
              One resident
            </ModeButton>
            <ModeButton
              active={mode === "building"}
              disabled={building == null}
              onClick={() => building && setMode("building")}>
              All in building
            </ModeButton>
          </div>

          {building == null && (
            <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" }}>
              To adjust a whole building, pick one in the building filter at the top of the
              page. Credits cannot be changed for every building at once.
            </span>
          )}

          {mode === "resident" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                htmlFor="credit-resident"
                style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" }}>
                Resident
              </label>
              {buildingsInList.length > 0 && (
                <span
                  style={{
                    fontSize: "var(--font-size-extra-tiny)",
                    color: "var(--color-text-weak)",
                  }}>
                  Showing residents from {buildingsInList.join(", ")}
                </span>
              )}
              <input
                id="credit-resident-search"
                placeholder="Search by name, email or unit"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={fieldStyle}
              />
              {/* A styled list rather than a native <select size>: that
                  renders with OS defaults — no padding, browser-blue
                  highlight — and cannot show the balance as a distinct
                  column, which is the number an admin is checking
                  against before they type a deduction. */}
              <div
                role="listbox"
                aria-label="Resident"
                style={{
                  border: "1px solid var(--color-stroke-medium)",
                  borderRadius: "var(--radius-8)",
                  maxHeight: 208,
                  overflowY: "auto",
                  background: "var(--color-fill-white)",
                }}>
                {matches.length === 0 && (
                  <div
                    style={{
                      padding: "12px",
                      fontSize: "var(--font-size-tiny)",
                      color: "var(--color-text-weak)",
                    }}>
                    No resident matches that search.
                  </div>
                )}
                {matches.map((r, i) => {
                  const isSelected = r.id === residentId;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        setResidentId(r.id);
                        setError(null);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "var(--spacing-12)",
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        border: "none",
                        borderTop:
                          i === 0 ? "none" : "1px solid var(--color-stroke-medium)",
                        background: isSelected
                          ? "var(--color-fill-weak)"
                          : "transparent",
                        cursor: "pointer",
                        fontFamily: "var(--font-family-body)",
                      }}>
                      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span
                          style={{
                            fontSize: "var(--font-size-tiny)",
                            fontWeight: isSelected
                              ? ("var(--font-weight-medium)" as React.CSSProperties["fontWeight"])
                              : undefined,
                            color: "var(--color-text-strong)",
                          }}>
                          {r.name}
                        </span>
                        {/* Always shown when present: a name alone is not
                            enough to pick the right person out of a long
                            list, and email is what a super admin is
                            usually given to go on. */}
                        {r.email && (
                          <span
                            style={{
                              fontSize: "var(--font-size-extra-tiny)",
                              color: "var(--color-text-weak)",
                              wordBreak: "break-all" as React.CSSProperties["wordBreak"],
                            }}>
                            {r.email}
                          </span>
                        )}
                        {/* The building is named per row ONLY when the
                            list spans more than one: two buildings can
                            both have a Unit 101, so the unit alone is
                            ambiguous there. With a single building it
                            would just repeat the line above. */}
                        {(r.unitNumber || (manyBuildings && r.buildingName)) && (
                          <span
                            style={{
                              fontSize: "var(--font-size-extra-tiny)",
                              color: "var(--color-text-weak)",
                            }}>
                            {[
                              r.unitNumber ? `Unit ${r.unitNumber}` : null,
                              manyBuildings ? r.buildingName : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        )}
                      </span>
                      {r.creditBalance != null && (
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: "var(--font-size-extra-tiny)",
                            color: "var(--color-text-weak)",
                            whiteSpace: "nowrap",
                          }}>
                          {r.creditBalance} credit{r.creditBalance === 1 ? "" : "s"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              htmlFor="credit-delta"
              style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" }}>
              Change by (plus for a bonus, minus for a penalty)
            </label>
            <input
              id="credit-delta"
              type="number"
              inputMode="numeric"
              min={-MAX_ADJUSTMENT}
              max={MAX_ADJUSTMENT}
              step={1}
              value={delta}
              placeholder="e.g. 5 for a bonus, -2 for a penalty"
              onChange={(e) => {
                setDelta(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              autoFocus
              style={{
                border: "1px solid var(--color-stroke-medium)",
                borderRadius: "var(--radius-8)",
                padding: "10px 12px",
                fontSize: "var(--font-size-tiny)",
                fontFamily: "var(--font-family-body)",
                color: "var(--color-text-strong)",
                background: "var(--color-fill-white)",
                outline: "none",
                width: "100%",
                boxSizing: "border-box" as React.CSSProperties["boxSizing"],
              }}
            />
          </div>

          {projected != null && !wouldGoNegative && (
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" }}>
              {/* Naming the direction matters here: "penalty" is the word the
                  resident sees on this row in their own credit history, so the
                  two sides of the same action use the same term. */}
              {Number(delta) < 0 ? "Penalty. " : Number(delta) > 0 ? "Bonus. " : ""}New balance:{" "}
              <strong style={{ color: "var(--color-text-strong)" }}>{projected}</strong>
            </span>
          )}

          {wouldGoNegative && (
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-tag-text-expired)" }}>
              {selected?.name ?? "This resident"} only has {balance ?? 0}. A balance cannot go
              below zero.
            </span>
          )}

          {mode === "building" && (
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" }}>
              Residents who do not have enough credits are skipped, not part-penalised. You
              will be told how many.
            </span>
          )}

          {/* Said plainly because it is real money, not a counter: every
              credit granted accrues gift card reserve, and removing
              credits gives it back. */}
          <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" }}>
            Credits fund gift cards, so this changes what the building owes. Adding credits
            creates gift card value; removing them takes it back.
          </span>

          {error != null && (
            <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-tag-text-expired)" }}>
              {error}
            </span>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-8)",
                border: "1px solid var(--color-stroke-medium)",
                background: "none",
                cursor: saving ? "default" : "pointer",
                fontSize: "var(--font-size-tiny)",
                fontFamily: "var(--font-family-body)",
                color: "var(--color-text-strong)",
              }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!valid || wouldGoNegative || saving || !targetChosen}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-8)",
                border: "none",
                background:
                  !valid || wouldGoNegative || saving || !targetChosen
                    ? "var(--color-fill-weak)"
                    : "var(--color-button-primary)",
                color:
                  !valid || wouldGoNegative || saving || !targetChosen
                    ? "var(--color-text-weak)"
                    : "var(--color-text-strong)",
                cursor:
                  !valid || wouldGoNegative || saving || !targetChosen ? "default" : "pointer",
                fontSize: "var(--font-size-tiny)",
                fontFamily: "var(--font-family-body)",
                fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              }}>
              {saving ? "Applying…" : "Apply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
