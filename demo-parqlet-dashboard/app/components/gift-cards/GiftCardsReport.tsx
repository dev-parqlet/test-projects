"use client";

/**
 * Gift Cards report — shared between the HOA and Super Admin dashboards
 * (product decision 2026-09-16). One row per resident who currently
 * holds credits or has ever redeemed a gift card. Backend scopes the
 * data by building for HOA callers and shows everything for Super
 * Admin — see parqlet-backend/src/routes/super-admin-gift-cards.ts.
 *
 * Clicking a row (anywhere except an Actions button) opens a detail
 * modal with the resident's full gift card + credit history.
 *
 * Both roles get an Actions column. HOA sees "View Details" with its
 * label spelled out; Super Admin sees the same action as an icon-only
 * button (the label would crowd the row next to "Send Reminder") plus
 * "Send Reminder", and additionally gets the Building column.
 *
 * `isSuperAdmin` is passed by the caller — see
 * app/(superadmin)/super-admin/gift-cards/page.tsx vs.
 * app/(hoa)/gift-cards/page.tsx. The backend re-checks the role
 * independently, so this prop is a UI convenience, not a security
 * boundary.
 *
 * Paginated client-side: the report endpoint returns every eligible
 * resident in one payload (no page params), and the row count is bounded
 * by residents-who-hold-credits, so slicing here keeps the same
 * Pagination control the other dashboard tables use without inventing a
 * paged API for it.
 *
 * Columns are declared ONCE (`columns` below) and used to render both
 * the header and every body row, so a header can never drift out of
 * vertical alignment with the cells underneath it — the flex ratio,
 * padding and alignment of a column are stated in a single place.
 */

import { useEffect, useMemo, useState } from "react";
import {
  listGiftCardReport,
  sendGiftCardReminder,
  type BuildingGiftCardForecast,
  type BuildingGiftCardTerms,
  type GiftCardResidentSummary,
} from "@/lib/api/super-admin";
import { useBuildingFilter } from "../context/building-filter-context";
import { TableScroll } from "../ui/TableScroll";
import { TableHeadLabel } from "../ui/TableHeadLabel";
import { CopyableCell } from "../ui/CopyableCell";
import { Pagination } from "../ui/Pagination";
import { IcEye } from "../icons";
import { GiftCardResidentDetailModal } from "./GiftCardResidentDetailModal";
import "../../tokens.css";

const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const cellText: React.CSSProperties = {
  fontSize: "var(--font-size-tiny)",
  color: "var(--color-text-weak)",
};
const cellTextStrong: React.CSSProperties = {
  ...cellText,
  fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
  color: "var(--color-text-strong)",
};

/** Shared look for both row actions, so the eye button and "Send
 *  Reminder" read as one control group rather than two designs. */
const actionButton: React.CSSProperties = {
  height: 30,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  border: "1px solid var(--color-stroke-medium)",
  borderRadius: "var(--radius-8)",
  background: "var(--color-fill-white)",
  color: "var(--color-text-strong)",
  cursor: "pointer",
  fontSize: "var(--font-size-tiny)",
  fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
  whiteSpace: "nowrap",
};

type ReminderState = "idle" | "sending" | "sent" | "error";

/**
 * HOA: a plain "View details" text link, matching the Tickets table and
 * the Buildings table — a bordered button was heavier than every other
 * row action in the dashboard.
 *
 * Super Admin keeps the icon button: it sits next to "Send Reminder",
 * where two text links would be ambiguous and a link beside a button
 * reads as the secondary action it is.
 */
function ViewDetailsAction({ iconOnly, onOpen }: { iconOnly: boolean; onOpen: () => void }) {
  const [hovered, setHovered] = useState(false);

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={onOpen}
        // An icon alone still needs an accessible name, and the tooltip
        // gives sighted users what the HOA label provides for free.
        title="View details"
        aria-label="View details"
        style={{ ...actionButton, padding: "0 8px" }}>
        <IcEye />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        fontSize: "var(--font-size-tiny)",
        color: "var(--color-text-strong)",
        fontFamily: "var(--font-family-body)",
        textDecoration: hovered ? "underline" : "none",
        textUnderlineOffset: 2,
        whiteSpace: "nowrap",
      }}>
      View details
    </button>
  );
}

/**
 * "Send Reminder" renders for every resident, not only those already at
 * the redemption threshold. A resident short of a gift card is exactly
 * who a reminder is for: the backend picks the copy from how far off
 * they are ("You need N more credits…" vs "Your gift card is waiting"),
 * so there is nothing for this component to gate on.
 */
function ReminderButton({ residentId }: { residentId: string }) {
  const [state, setState] = useState<ReminderState>("idle");

  if (state === "sent") {
    return <span style={{ ...cellText, color: "var(--color-tag-text-active)" }}>Reminder sent</span>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
      <button
        type="button"
        onClick={async () => {
          setState("sending");
          try {
            await sendGiftCardReminder(residentId);
            setState("sent");
          } catch {
            setState("error");
          }
        }}
        disabled={state === "sending"}
        style={{
          ...actionButton,
          padding: "0 12px",
          cursor: state === "sending" ? "default" : "pointer",
        }}>
        {state === "sending" ? "Sending…" : "Send Reminder"}
      </button>
      {state === "error" && (
        <span style={{ ...cellText, color: "var(--color-tag-text-expired)" }}>Failed — try again</span>
      )}
    </div>
  );
}

/**
 * One number in the funding strip. Shows the dollars as the headline,
 * not the card count: the question this answers is "how much money do we
 * need on Tremendous", and $25 x N is the answer to it.
 */
function ForecastFigure({
  label,
  cards,
  caption,
  emphasis = false,
}: {
  label: string;
  cards: number;
  caption: string;
  emphasis?: boolean;
}) {
  return (
    <div style={{ minWidth: 200 }}>
      <div style={{ ...cellText, marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontSize: "var(--font-size-heading-3)",
          fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
          color: emphasis ? "var(--color-text-strong)" : "var(--color-text-weak)",
          lineHeight: 1.2,
        }}>
        ${(cards * 25).toLocaleString("en-US")}
      </div>
      <div style={cellText}>
        {cards} gift card{cards === 1 ? "" : "s"} · {caption}
      </div>
    </div>
  );
}

/**
 * Every building's credit price and reserve, for the "all buildings"
 * case where no single pair of numbers is true.
 */
function BuildingTermsModal({
  terms,
  onClose,
}: {
  terms: BuildingGiftCardTerms[];
  onClose: () => void;
}) {
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--spacing-24)",
      }}>
      <div
        style={{
          background: "var(--color-fill-white)",
          border: "1px solid var(--color-stroke-medium)",
          borderRadius: "var(--radius-12)",
          width: "100%",
          maxWidth: 520,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "var(--font-family-body)",
        }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-stroke-medium)",
          }}>
          <span
            style={{
              fontSize: "var(--font-size-body)",
              fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              color: "var(--color-text-strong)",
            }}>
            Credit terms by building
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--color-text-weak)", padding: 0 }}
            aria-label="Close">
            ×
          </button>
        </div>

        <div style={{ overflowY: "auto" }}>
          <div
            style={{
              display: "flex",
              padding: "10px 20px",
              background: "var(--color-fill-weak)",
              ...cellText,
            }}>
            <div style={{ flex: "2 1 0" }}>Building</div>
            <div style={{ flex: "1 1 0", textAlign: "right" }}>Credit price</div>
            <div style={{ flex: "1 1 0", textAlign: "right" }}>Reserved</div>
          </div>
          {terms.map((t) => (
            <div
              key={t.buildingId}
              style={{
                display: "flex",
                padding: "10px 20px",
                borderTop: "1px solid var(--color-stroke-medium)",
                ...cellText,
              }}>
              <div style={{ flex: "2 1 0", ...cellTextStrong }}>{t.buildingName}</div>
              <div style={{ flex: "1 1 0", textAlign: "right" }}>{formatCents(t.creditPriceCents)}</div>
              <div style={{ flex: "1 1 0", textAlign: "right" }}>
                {formatCents(t.reservePerCreditCents)}
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...cellText, padding: "12px 20px", borderTop: "1px solid var(--color-stroke-medium)" }}>
          Every gift card is $25.00. The reserve is the share of each credit set aside to fund
          them, so the credits a resident needs differ per building.
        </div>
      </div>
    </div>
  );
}

type Column = {
  key: string;
  label: string;
  /** Flex grow ratio; the basis is always 0 so these read as weights. */
  flex: number;
  /** Right-aligned columns (Actions) also drop their right padding so
   *  their content ends flush with the table's own 24px gutter. */
  align?: "right";
  render: (r: GiftCardResidentSummary) => React.ReactNode;
};

/** The one place a column's geometry is defined — applied identically to
 *  the header cell and the body cell, which is what keeps them aligned. */
function cellStyle(col: Column): React.CSSProperties {
  return {
    flex: `${col.flex} 1 0`,
    minWidth: 0,
    paddingRight: col.align === "right" ? 0 : 12,
    display: "flex",
    alignItems: "center",
    justifyContent: col.align === "right" ? "flex-end" : "flex-start",
  };
}

export function GiftCardsReport({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const [allResidents, setAllResidents] = useState<GiftCardResidentSummary[]>([]);
  const [forecast, setForecast] = useState<BuildingGiftCardForecast[]>([]);
  const [terms, setTerms] = useState<BuildingGiftCardTerms[]>([]);
  const [termsOpen, setTermsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  // Default context (no provider, e.g. under the HOA layout) resolves to
  // { selectedIds: [], isAll: true } — safe no-op filtering there, since
  // the backend already scopes HOA callers to their own building(s).
  const { selectedIds, isAll } = useBuildingFilter();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listGiftCardReport()
      .then((res) => {
        if (cancelled) return;
        setAllResidents(res.residents);
        setForecast(res.forecast ?? []);
        setTerms(res.buildingTerms ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load gift card report");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const residentRows = useMemo(
    () => (isAll ? allResidents : allResidents.filter((r) => selectedIds.includes(r.buildingId))),
    [allResidents, isAll, selectedIds],
  );

  const totalGiftCards = residentRows.reduce((sum, r) => sum + r.giftCardCount, 0);

  // Sum only the buildings in view. Safe to add up because the server
  // floors card counts PER RESIDENT before returning them — reserve
  // never pools across people, so summing raw dollars here instead
  // would overstate (2 residents at 21 credits + 8 at 8 credits reads
  // as 10 cards pooled, 4 in reality).
  const visibleForecast = isAll
    ? forecast
    : forecast.filter((f) => selectedIds.includes(f.buildingId));
  // Terms for whatever is in view. One building selected (or an HOA with
  // a single building) shows its numbers inline; several buildings can
  // disagree, so those go behind the "?" instead of picking one to show.
  const visibleTerms = isAll ? terms : terms.filter((t) => selectedIds.includes(t.buildingId));
  const singleTerms = visibleTerms.length === 1 ? visibleTerms[0] : null;

  const cardsNow = visibleForecast.reduce((n, f) => n + f.cardsNow, 0);
  const cardsSoon = visibleForecast.reduce((n, f) => n + f.cardsByEndOfNextMonth, 0);

  // Clamped during render rather than corrected in an effect: shrinking
  // the building filter while sitting on, say, page 4 would otherwise
  // paint one empty page before the effect pulled it back.
  const totalPages = Math.max(1, Math.ceil(residentRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = residentRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns: Column[] = [
    {
      key: "name",
      label: "Resident Name",
      flex: isSuperAdmin ? 16 : 20,
      render: (r) => <span style={cellTextStrong}>{r.residentName ?? "—"}</span>,
    },
    {
      key: "phone",
      label: "Phone",
      flex: isSuperAdmin ? 11 : 13,
      render: (r) => <span style={cellText}>{r.residentPhone ?? "—"}</span>,
    },
    {
      key: "email",
      label: "Email",
      flex: isSuperAdmin ? 17 : 20,
      render: (r) => (
        // Copying an email must not also open the detail modal.
        <span onClick={(e) => e.stopPropagation()} style={{ minWidth: 0 }}>
          <CopyableCell value={r.residentEmail}>
            <span style={cellText}>{r.residentEmail ?? "—"}</span>
          </CopyableCell>
        </span>
      ),
    },
    {
      key: "unit",
      label: "Unit #",
      flex: isSuperAdmin ? 7 : 9,
      render: (r) => <span style={cellText}>{r.unit ?? "—"}</span>,
    },
    ...(isSuperAdmin
      ? [
          {
            key: "building",
            label: "Building",
            flex: 13,
            render: (r: GiftCardResidentSummary) => <span style={cellText}>{r.buildingName}</span>,
          },
        ]
      : []),
    {
      key: "credits",
      label: "Credits",
      flex: isSuperAdmin ? 9 : 11,
      render: (r) => <span style={cellTextStrong}>{r.creditBalance}</span>,
    },
    {
      key: "giftCards",
      label: "Gift Cards",
      flex: isSuperAdmin ? 11 : 13,
      render: (r) => (
        <span style={cellText}>
          {r.giftCardCount} gift card{r.giftCardCount === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      flex: isSuperAdmin ? 18 : 16,
      align: "right",
      render: (r) => (
        // One stopPropagation for the whole group — every control in
        // here acts on the row without also triggering the row's own
        // "open the modal" click.
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
          <ViewDetailsAction
            iconOnly={isSuperAdmin}
            onOpen={() => setSelectedResidentId(r.residentId)}
          />
          {isSuperAdmin && (
            <ReminderButton residentId={r.residentId} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: "var(--spacing-24)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-24)",
        fontFamily: "var(--font-family-body)",
        height: "100%",
        overflowY: "auto",
        boxSizing: "border-box" as React.CSSProperties["boxSizing"],
      }}>
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: "var(--font-size-heading-1)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-heading-1)",
            color: "var(--color-text-strong)",
            fontFamily: "var(--font-family-heading)",
          }}>
          Gift Cards
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: "var(--font-size-body)", color: "var(--color-text-weak)" }}>
          {loading
            ? "Loading..."
            : `${residentRows.length} resident${residentRows.length !== 1 ? "s" : ""} · ${totalGiftCards} gift card${totalGiftCards !== 1 ? "s" : ""} redeemed`}
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: "16px 20px",
            background: "var(--color-tag-expired)",
            borderRadius: "var(--radius-8)",
            color: "var(--color-tag-text-expired)",
            fontSize: "var(--font-size-tiny)",
          }}>
          {error}
        </div>
      )}

      {/* Credit terms for whatever is in view. An admin reading these
          numbers needs to know what a credit costs and how much of it is
          set aside, or "12 gift cards" is a figure with no basis. */}
      {visibleTerms.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "var(--spacing-24)",
            fontSize: "var(--font-size-tiny)",
            color: "var(--color-text-weak)",
          }}>
          {singleTerms ? (
            <>
              <span>
                Credit price{" "}
                <strong style={{ color: "var(--color-text-strong)" }}>
                  {formatCents(singleTerms.creditPriceCents)}
                </strong>
              </span>
              <span>
                Reserved per credit for gift cards{" "}
                <strong style={{ color: "var(--color-text-strong)" }}>
                  {formatCents(singleTerms.reservePerCreditCents)}
                </strong>
              </span>
              <span>
                Gift card value{" "}
                <strong style={{ color: "var(--color-text-strong)" }}>$25.00</strong>
              </span>
            </>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              Credit price and gift card reserve vary by building
              <button
                type="button"
                onClick={() => setTermsOpen(true)}
                aria-label="Credit price and reserve per building"
                title="Credit price and reserve per building"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: "1px solid var(--color-stroke-medium)",
                  background: "var(--color-fill-white)",
                  color: "var(--color-text-strong)",
                  fontSize: 11,
                  lineHeight: "16px",
                  cursor: "pointer",
                  padding: 0,
                }}>
                ?
              </button>
            </span>
          )}
        </div>
      )}

      {termsOpen && (
        <BuildingTermsModal terms={visibleTerms} onClose={() => setTermsOpen(false)} />
      )}

      {/* Funding forecast — Super Admin only. Answers "how much has to be
          sitting on the Tremendous balance", which cannot be derived from
          the table below: a resident's reserve is not their credit
          balance, and cards floor per resident. */}
      {isSuperAdmin && visibleForecast.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--spacing-24)",
            padding: "16px 20px",
            background: "var(--color-fill-white)",
            border: "1px solid var(--color-stroke-medium)",
            borderRadius: "var(--radius-12)",
          }}>
          <ForecastFigure
            label="Redeemable now"
            cards={cardsNow}
            caption="reserve already accumulated"
          />
          <ForecastFigure
            label="Possible by end of next month"
            cards={cardsSoon}
            caption="at current earning rates"
            emphasis
          />
        </div>
      )}

      <div
        style={{
          background: "var(--color-fill-white)",
          border: "1px solid var(--color-stroke-medium)",
          borderRadius: "var(--radius-12)",
          overflow: "hidden",
          // Without this the card is a flex child that shrinks below its
          // own content, and `overflow: hidden` then clips the last row
          // mid-height instead of letting the page scroll.
          flexShrink: 0,
        }}>
        <TableScroll minWidth={isSuperAdmin ? 1060 : 900}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 var(--spacing-24)",
              minHeight: 48,
              borderBottom: "1px solid var(--color-stroke-medium)",
              background: "var(--color-fill-white)",
            }}>
            {columns.map((col) => (
              <div key={col.key} style={cellStyle(col)}>
                <TableHeadLabel style={col.align === "right" ? { textAlign: "right" } : undefined}>
                  {col.label}
                </TableHeadLabel>
              </div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: "48px 20px", ...cellText }}>Loading...</div>
          ) : residentRows.length === 0 ? (
            <div style={{ padding: "48px 20px", ...cellText }}>
              No resident currently has credits or gift card history.
            </div>
          ) : (
            pagedRows.map((r, i) => (
              <div
                key={r.residentId}
                onClick={() => setSelectedResidentId(r.residentId)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0 var(--spacing-24)",
                  minHeight: 56,
                  borderBottom: i < pagedRows.length - 1 ? "1px solid var(--color-stroke-medium)" : "none",
                  cursor: "pointer",
                }}>
                {columns.map((col) => (
                  <div key={col.key} style={cellStyle(col)}>
                    {col.render(r)}
                  </div>
                ))}
              </div>
            ))
          )}
        </TableScroll>
      </div>

      <Pagination
        totalItems={residentRows.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={setPage}
        itemLabel="residents"
        pageSizeOptions={[10, 20, 50, 100]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      <GiftCardResidentDetailModal
        residentId={selectedResidentId}
        onClose={() => setSelectedResidentId(null)}
      />
    </div>
  );
}
