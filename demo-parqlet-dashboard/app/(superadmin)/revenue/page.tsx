"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { getRevenueSummary, getRevenueBuildings, superAdminKeys } from "@/lib/api/super-admin";
import { fmtDate } from "@/lib/dates";
import { TableScroll } from "../../components/ui/TableScroll";
import { TableHeadLabel } from "../../components/ui/TableHeadLabel";
import { CopyableCell } from "../../components/ui/CopyableCell";
import "../../tokens.css";

function ViewLink({ href }: { href: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", textDecoration: hovered ? "underline" : "none", textUnderlineOffset: 2, fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"] }}
    >
      View
    </Link>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: "var(--color-fill-white)",
      border: "1px solid var(--color-stroke-medium)",
      borderRadius: "var(--radius-12)",
      padding: "20px 24px",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", fontWeight: "500" as React.CSSProperties["fontWeight"], textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      <span style={{ fontSize: "var(--font-size-heading-2)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", fontFamily: "var(--font-family-heading)", lineHeight: 1.2 }}>{value}</span>
      {sub && <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>{sub}</span>}
    </div>
  );
}

function SubBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Active:          { bg: "var(--color-tag-active)",  color: "var(--color-tag-text-active)"  },
    Overdue:         { bg: "var(--color-tag-expired)", color: "var(--color-tag-text-expired)" },
    "Past Due":      { bg: "var(--color-tag-expired)", color: "var(--color-tag-text-expired)" },
    "Expiring Soon": { bg: "var(--color-tag-pending)", color: "var(--color-tag-text-pending)" },
  };
  const s = map[status] ?? { bg: "var(--color-gray-100)", color: "var(--color-text-strong)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: s.bg, color: s.color,
      borderRadius: "var(--radius-48)",
      padding: "3px 10px",
      fontSize: "var(--font-size-extra-tiny)",
      fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
      fontFamily: "var(--font-family-body)",
      whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

export default function RevenuePage() {
  const [page, setPage] = useState(1);

  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useQuery({
    queryKey: superAdminKeys.revenueSummary,
    queryFn: getRevenueSummary,
  });

  const { data: buildingsData, isLoading: buildingsLoading, isError: buildingsError } = useQuery({
    queryKey: superAdminKeys.revenueBuildings(page),
    queryFn: () => getRevenueBuildings(page),
  });

  const buildings = buildingsData?.data ?? [];
  const totalBuildings = buildingsData?.total ?? 0;
  const pageSize = buildingsData?.pageSize ?? 10;
  const totalPages = Math.ceil(totalBuildings / pageSize);

  const subLabel = (count: number, label: string) =>
    `${count} ${label}${count !== 1 ? "s" : ""}`;

  // Loading skeleton for summary cards
  function SummarySkeleton() {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--spacing-16)" }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            background: "var(--color-fill-white)",
            border: "1px solid var(--color-stroke-medium)",
            borderRadius: "var(--radius-12)",
            padding: "20px 24px",
            height: 90,
          }}>
            <div style={{
              width: 60, height: 10, borderRadius: 4,
              background: "var(--color-gray-30)", marginBottom: 10,
            }} />
            <div style={{
              width: 100, height: 20, borderRadius: 4,
              background: "var(--color-gray-30)",
            }} />
          </div>
        ))}
      </div>
    );
  }

  // Loading skeleton for table rows
  function TableSkeleton() {
    return (
      <>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", padding: "0 20px", height: 57,
            borderBottom: i < 4 ? "1px solid var(--color-stroke-medium)" : "none",
          }}>
            {[28, 12, 16, 16, 16, 16].map((flex, j) => (
              <div key={j} style={{ flex: `${flex} 1 0`, minWidth: 0 }}>
                <div style={{
                  width: "80%", height: 12, borderRadius: 4,
                  background: "var(--color-gray-30)",
                }} />
              </div>
            ))}
            <div style={{ flex: "8 1 0", minWidth: 0 }} />
          </div>
        ))}
      </>
    );
  }

  // Error state
  function ErrorState({ message }: { message?: string }) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "var(--spacing-48)", gap: "var(--spacing-12)",
        background: "var(--color-fill-white)",
        border: "1px solid var(--color-stroke-medium)",
        borderRadius: "var(--radius-12)",
      }}>
        <span style={{
          fontSize: "var(--font-size-body)", color: "var(--color-text-weak)",
          fontFamily: "var(--font-family-body)",
        }}>
          {message ?? "Failed to load data. Please try again."}
        </span>
      </div>
    );
  }

  // Empty state
  function EmptyState() {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center",
        padding: "var(--spacing-48)", gap: "var(--spacing-12)",
        background: "var(--color-fill-white)",
      }}>
        <span style={{
          fontSize: "var(--font-size-body)", color: "var(--color-text-weak)",
          fontFamily: "var(--font-family-body)",
        }}>
          No subscriptions found.
        </span>
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-24)", fontFamily: "var(--font-family-body)" }}>

        {/* Title */}
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--font-size-heading-1)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-heading-1)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-heading)" }}>
            Revenue
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "var(--font-size-body)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"] }}>
            Subscription and billing overview
          </p>
        </div>

        {/* Summary cards */}
        {summaryLoading ? (
          <SummarySkeleton />
        ) : summaryError ? (
          <ErrorState message="Failed to load revenue summary." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--spacing-16)" }}>
            <StatCard label="MRR"             value={`$${(summary?.totalMrr ?? 0).toLocaleString()}`}    sub={subLabel(summary?.activeSubscriptions ?? 0, "active subscription")} />
            <StatCard label="ARR"             value={`$${(summary?.totalArr ?? 0).toLocaleString()}`}    />
            <StatCard label="Overdue"         value={`${summary?.overdueCount ?? 0}`}                  sub="payment past due" />
            <StatCard label="Expiring Soon"   value={`${summary?.expiringSoonCount ?? 0}`}                 sub="within 30 days" />
          </div>
        )}

        {/* Subscription table */}
        <div style={{ background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-12)", overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-white)" }}>
            <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap" }}>
              All Subscriptions
            </span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <TableScroll minWidth={780}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", padding: "0 var(--spacing-24)", minHeight: 48, borderBottom: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-white)", position: "sticky", top: 0, zIndex: 2 }}>
            {[["Building", 28], ["MRR", 12], ["Status", 16], ["Last Payment", 16], ["Next Renewal", 16], ["Contract Expiry", 16]].map(([label, flex]) => (
              <div key={label as string} style={{ flex: `${flex} 1 0`, minWidth: 0 }}>
                <span style={{ lineHeight: "var(--line-height-uppercase)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", textTransform: "uppercase" as const, minWidth: 0, maxWidth: "100%", display: "block" }}><TableHeadLabel>{label as string}</TableHeadLabel></span>
              </div>
            ))}
            <div style={{ flex: "8 1 0", minWidth: 0 }} />
          </div>

          {buildingsLoading ? (
            <TableSkeleton />
          ) : buildingsError ? (
            <ErrorState message="Failed to load buildings." />
          ) : buildings.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {buildings.map((b, i) => (
                <div key={b.buildingId} style={{
                  display: "flex", alignItems: "center", padding: "0 20px", height: 57,
                  borderBottom: i < buildings.length - 1 ? "1px solid var(--color-stroke-medium)" : "none",
                }}>
                  <div style={{ flex: "28 1 0", minWidth: 0 }}>
                    <CopyableCell value={b.buildingName}>
                      <div style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontWeight: "500" as React.CSSProperties["fontWeight"], fontFamily: "var(--font-family-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.buildingName}
                      </div>
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "12 1 0", minWidth: 0 }}>
                    <CopyableCell value={`$${(b.mrr ?? 0).toLocaleString()}`}>
                      <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>${(b.mrr ?? 0).toLocaleString()}</span>
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "16 1 0", minWidth: 0, overflow: "hidden" }}>
                    <CopyableCell value={b.status}>
                      <SubBadge status={b.status} />
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "16 1 0", minWidth: 0 }}>
                    <CopyableCell value={fmtDate(b.lastPayment)}>
                      <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fmtDate(b.lastPayment)}</span>
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "16 1 0", minWidth: 0 }}>
                    <CopyableCell value={fmtDate(b.nextRenewal)}>
                      <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fmtDate(b.nextRenewal)}</span>
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "16 1 0", minWidth: 0 }}>
                    <CopyableCell value={fmtDate(b.contractExpiry)}>
                      <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fmtDate(b.contractExpiry)}</span>
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "8 1 0", minWidth: 0, display: "flex", justifyContent: "flex-end" }}>
                    <ViewLink href={`/buildings/${b.buildingId}`} />
                  </div>
                </div>
              ))}
            </>
          )}
          </TableScroll>
          </div>

          {/* Pagination — outside the scroll wrapper so it stays fixed at
              the card's bottom instead of scrolling away with the rows. */}
          {!buildingsLoading && !buildingsError && buildings.length > 0 && totalPages > 1 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 var(--spacing-24)", height: 57,
              borderTop: "1px solid var(--color-stroke-medium)",
            }}>
              <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap" }}>
                Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalBuildings)} of {totalBuildings}
              </span>
              <div style={{ display: "flex", gap: "var(--spacing-8)", flexShrink: 0 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    background: "none", border: "1px solid var(--color-stroke-medium)",
                    borderRadius: "var(--radius-8)", padding: "6px 12px",
                    fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-strong)",
                    fontFamily: "var(--font-family-body)", cursor: page === 1 ? "not-allowed" : "pointer",
                    opacity: page === 1 ? 0.4 : 1, whiteSpace: "nowrap",
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    background: "none", border: "1px solid var(--color-stroke-medium)",
                    borderRadius: "var(--radius-8)", padding: "6px 12px",
                    fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-strong)",
                    fontFamily: "var(--font-family-body)", cursor: page === totalPages ? "not-allowed" : "pointer",
                    opacity: page === totalPages ? 0.4 : 1, whiteSpace: "nowrap",
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
