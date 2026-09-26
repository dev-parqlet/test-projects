"use client";

/**
 * Row-click detail for the Gift Cards report — full resident info,
 * every gift card they've ever redeemed, and their complete credit
 * ledger. Fetched lazily on open (not pre-loaded per row in the table).
 *
 * The two histories are tabs rather than stacked sections: a resident
 * with a long ledger pushed the gift cards out of view entirely, and the
 * two answer different questions ("what did they take out" vs "how did
 * they get there"). Tab styling follows the pill pattern the HOA
 * dashboard's Recent Activity card already uses.
 */

import { useEffect, useState } from "react";
import {
  getGiftCardResidentDetail,
  type GiftCardResidentDetail,
} from "@/lib/api/super-admin";
import { Modal } from "../ui/Modal";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

const CREDIT_TYPE_LABEL: Record<GiftCardResidentDetail["creditHistory"][number]["type"], string> = {
  Purchase: "Credits purchased",
  Earned: "Spot booking earnings",
  Spent: "Parking fee",
  Refund: "Refund",
};

/** A super-admin credit change, in either direction. Both are written
 *  as `Earned` rows (there is no enum value for them) — a grant with
 *  POSITIVE credits, a deduction with NEGATIVE, so that the gift card
 *  reserve follows the credits. See api-backend credit-adjustment.ts.
 *
 *  Without these two checks both read as "Spot booking earnings", which
 *  credits the resident with income from a booking that never happened
 *  — and, for a deduction, gets the direction backwards as well. */
function isAdminGrant(entry: GiftCardResidentDetail["creditHistory"][number]): boolean {
  return entry.type === "Earned" && entry.paymentMethod === "admin_grant";
}

function isAdminPenalty(entry: GiftCardResidentDetail["creditHistory"][number]): boolean {
  return entry.type === "Earned" && entry.paymentMethod === "admin_deduction";
}

/** True when the row takes credits away. `Spent` is the usual debit; an
 *  admin penalty is the exception, being a negative `Earned` row. */
function isDebit(entry: GiftCardResidentDetail["creditHistory"][number]): boolean {
  return entry.type === "Spent" || isAdminPenalty(entry);
}

function creditRowLabel(entry: GiftCardResidentDetail["creditHistory"][number]): string {
  if (entry.type === "Spent" && entry.paymentMethod === "gift_card:tremendous") {
    return "Gift card redeemed";
  }
  // Client wording (2026-09-24): the two admin directions are "Bonus"
  // and "Penalty", matching what the resident sees in the app.
  if (isAdminGrant(entry)) return "Bonus";
  if (isAdminPenalty(entry)) return "Penalty";
  return CREDIT_TYPE_LABEL[entry.type];
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "10px 0",
  borderBottom: "1px solid var(--color-stroke-medium)",
};
type DetailTab = "giftCards" | "credits";

/** Pill tab, matching app/components/hoa/RecentActivityCard.tsx. */
function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 52,
        border: "none",
        cursor: "pointer",
        background: active ? "var(--color-text-strong)" : "transparent",
        color: active ? "var(--color-fill-white)" : "var(--color-text-weak)",
        fontSize: "var(--font-size-tiny)",
        fontFamily: "var(--font-family-body)",
        fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
        transition: "background 0.18s ease, color 0.18s ease",
      }}>
      {label}
      {/* The count is the reason to switch tabs at all — without it the
          resident has to open each one to find out if it is empty. */}
      <span style={{ opacity: 0.7 }}>{count}</span>
    </button>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: "var(--font-size-tiny)",
  color: "var(--color-text-strong)",
};
const captionStyle: React.CSSProperties = {
  fontSize: "var(--font-size-extra-tiny)",
  color: "var(--color-text-weak)",
};

export function GiftCardResidentDetailModal({
  residentId,
  onClose,
}: {
  residentId: string | null;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<GiftCardResidentDetail | null>(null);
  // Tab is stored WITH the resident it belongs to, so opening another
  // resident (the modal's prev/next arrows) falls back to "giftCards"
  // without an effect that resets it — one less synchronous setState in
  // an effect, which this repo's lint rules reject anyway.
  const [tabState, setTabState] = useState<{ residentId: string | null; tab: DetailTab }>({
    residentId: null,
    tab: "giftCards",
  });
  const tab: DetailTab = tabState.residentId === residentId ? tabState.tab : "giftCards";
  const setTab = (next: DetailTab) => setTabState({ residentId, tab: next });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!residentId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getGiftCardResidentDetail(residentId)
      .then((res) => {
        if (!cancelled) setDetail(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load resident detail");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [residentId]);

  return (
    <Modal
      open={residentId != null}
      onClose={onClose}
      title={detail?.resident.name ?? "Resident"}
      size="large">
      {loading && <div style={{ ...captionStyle, padding: "24px 0" }}>Loading…</div>}
      {error && (
        <div style={{ ...captionStyle, color: "var(--color-tag-text-expired)", padding: "24px 0" }}>{error}</div>
      )}

      {detail && (
        <>
          {/* ── Contact + balance ────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", marginBottom: 24 }}>
            <DetailField label="Email" value={detail.resident.email ?? "—"} />
            <DetailField label="Phone" value={detail.resident.phone ?? "—"} />
            <DetailField label="Unit" value={detail.resident.unit ?? "—"} />
            <DetailField label="Building" value={detail.resident.buildingName} />
            <DetailField label="Credit balance" value={`${detail.resident.creditBalance} credits`} strong />
            <DetailField
              label="Gift cards redeemed"
              value={`${detail.giftCards.length} gift card${detail.giftCards.length === 1 ? "" : "s"}`}
              strong
            />
          </div>

          {/* ── Histories ────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 16,
              borderBottom: "1px solid var(--color-stroke-medium)",
              paddingBottom: 12,
            }}>
            <TabButton
              label="Gift cards"
              count={detail.giftCards.length}
              active={tab === "giftCards"}
              onClick={() => setTab("giftCards")}
            />
            <TabButton
              label="Credit history"
              count={detail.creditHistory.length}
              active={tab === "credits"}
              onClick={() => setTab("credits")}
            />
          </div>

          {/* The list scrolls on its own rather than letting the whole
              modal body scroll: with a long ledger the tab bar (and the
              resident's contact details) would otherwise scroll out of
              view, so you lose the thing you use to switch. Modal's own
              80vh cap still applies outside this. */}
          <div style={{ maxHeight: "min(42vh, 360px)", overflowY: "auto" }}>
          {tab === "giftCards" ? (
            detail.giftCards.length === 0 ? (
              <p style={{ ...captionStyle, margin: 0 }}>No gift cards redeemed yet.</p>
            ) : (
              <div>
                {detail.giftCards.map((g) => (
                  <div key={g.id} style={rowStyle}>
                    <div>
                      <div style={labelStyle}>
                        {g.brand} · {formatCents(g.valueCents)}
                      </div>
                      <div style={captionStyle}>{g.creditsSpent} credits spent</div>
                    </div>
                    <div style={captionStyle}>{formatDate(g.redeemedAt)}</div>
                  </div>
                ))}
              </div>
            )
          ) : detail.creditHistory.length === 0 ? (
            <p style={{ ...captionStyle, margin: 0 }}>No credit activity yet.</p>
          ) : (
            <div>
              {detail.creditHistory.map((entry) => (
                <div key={entry.id} style={rowStyle}>
                  <div style={labelStyle}>{creditRowLabel(entry)}</div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        ...labelStyle,
                        fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                        color: isDebit(entry)
                          ? "var(--color-text-strong)"
                          : "var(--color-tag-text-active)",
                      }}>
                      {isDebit(entry) ? "-" : "+"}
                      {Math.abs(entry.credits)}
                    </div>
                    <div style={captionStyle}>{formatDate(entry.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </>
      )}
    </Modal>
  );
}

function DetailField({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <div style={captionStyle}>{label}</div>
      <div style={{ ...labelStyle, fontWeight: strong ? ("var(--font-weight-medium)" as React.CSSProperties["fontWeight"]) : undefined }}>
        {value}
      </div>
    </div>
  );
}
