"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { useQuery } from "@tanstack/react-query";
import { getCredits, superAdminKeys } from "@/lib/api/super-admin";
import type { CreditStats } from "@/lib/api/super-admin";
import { listBuildings, buildingKeys } from "@/lib/api/buildings";
import { useBuildingFilter } from "../../components/context/building-filter-context";
import { IdDisplay } from "../../components/ui/IdDisplay";
import { TableScroll } from "../../components/ui/TableScroll";
import { TableHeadLabel } from "../../components/ui/TableHeadLabel";
import { CopyableCell } from "../../components/ui/CopyableCell";
import "../../tokens.css";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
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

function TableSkeleton() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", padding: "0 20px", height: 57,
          borderBottom: i < 4 ? "1px solid var(--color-stroke-medium)" : "none",
        }}>
          {[28, 16, 14, 14, 12, 14].map((flex, j) => (
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
        No credit data available.
      </span>
    </div>
  );
}

interface CreditRow extends CreditStats {
  name: string;
  city: string;
}

export default function CreditsPage() {
  const { selectedIds, isAll } = useBuildingFilter();

  const { data: creditsData, isLoading: creditsLoading, isError: creditsError } = useQuery({
    queryKey: superAdminKeys.credits(),
    queryFn: () => getCredits(),
  });

  const { data: buildingsData, isLoading: buildingsLoading, isError: buildingsError } = useQuery({
    queryKey: buildingKeys.list(),
    queryFn: () => listBuildings(),
  });

  // Build buildingId → {name, city} map from buildings response
  const buildingNameMap = useMemo(() => {
    const map = new Map<string, { name: string; city: string }>();
    if (!buildingsData?.data) return map;
    for (const b of buildingsData.data) {
      map.set(b.id, { name: b.name, city: b.city });
    }
    return map;
  }, [buildingsData]);

  // Merge credits with building names; filter by selectedIds when not "all"
  const rows: CreditRow[] = useMemo(() => {
    if (!creditsData) return [];
    return creditsData
      .filter((c) => isAll || selectedIds.includes(c.buildingId))
      .map((c: any) => ({
        buildingId: c.buildingId,
        // Number(...) guards against Postgres SUM() returning bigint, which
        // node-postgres serializes as a string — without this, summing
        // several buildings' totals below does string concatenation
        // instead of addition (e.g. "02309046530" instead of 2,309,046,530).
        creditsInCirculation: Number(c.totalCredits ?? c.creditsInCirculation ?? 0),
        creditsEarnedThisMonth: c.creditsEarnedThisMonth ?? 0,
        creditsSpentThisMonth: c.creditsSpentThisMonth ?? 0,
        residentsAtThreshold: c.residentsAtThreshold ?? 0,
        name: buildingNameMap.get(c.buildingId)?.name ?? c.buildingId,
        city: buildingNameMap.get(c.buildingId)?.city ?? "",
      }));
  }, [creditsData, buildingNameMap, isAll, selectedIds]);

  const totalCirculation = rows.reduce((s, r) => s + r.creditsInCirculation, 0);
  const totalEarned      = rows.reduce((s, r) => s + r.creditsEarnedThisMonth, 0);
  const totalSpent       = rows.reduce((s, r) => s + r.creditsSpentThisMonth, 0);
  const atThreshold      = rows.reduce((s, r) => s + r.residentsAtThreshold, 0);

  const loading = creditsLoading || buildingsLoading;
  const error   = creditsError || buildingsError;

  return (<>
    <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-24)", fontFamily: "var(--font-family-body)", height: "100%", overflow: "hidden", boxSizing: "border-box" as React.CSSProperties["boxSizing"] }}>

        {/* Title */}
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--font-size-heading-1)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-heading-1)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-heading)" }}>
            Credits
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "var(--font-size-body)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>
            Credit economy health across the portfolio
          </p>
        </div>

        {/* Summary cards */}
        {loading ? (
          <SummarySkeleton />
        ) : error ? (
          <ErrorState message="Failed to load credit summary." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--spacing-16)" }}>
            <StatCard label="In Circulation"    value={totalCirculation.toLocaleString()} sub="total credits outstanding" />
            <StatCard label="Earned This Month" value={totalEarned.toLocaleString()}       sub="across all buildings" />
            <StatCard label="Spent This Month"  value={totalSpent.toLocaleString()}        sub="across all buildings" />
            <StatCard label="At Threshold"      value={atThreshold.toLocaleString()}       sub="residents near credit floor" />
          </div>
        )}

        {/* Per-building table */}
        <div style={{ background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-12)", overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-white)" }}>
            <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)" }}>
              Per-Building Breakdown
            </span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <TableScroll minWidth={720}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", padding: "0 var(--spacing-24)", minHeight: 48, borderBottom: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-white)", position: "sticky", top: 0, zIndex: 2 }}>
            {[["Building", 28], ["In Circulation", 16], ["Earned (Mo)", 14], ["Spent (Mo)", 14], ["Net (Mo)", 12], ["At Threshold", 14]].map(([label, flex]) => (
              <div key={label as string} style={{ flex: `${flex} 1 0`, minWidth: 0 }}>
                <span style={{ lineHeight: "var(--line-height-uppercase)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", textTransform: "uppercase" as const, minWidth: 0, maxWidth: "100%", display: "block" }}><TableHeadLabel>{label as string}</TableHeadLabel></span>
              </div>
            ))}
            <div style={{ flex: "8 1 0", minWidth: 0 }} />
          </div>

          {loading ? (
            <TableSkeleton />
          ) : error ? (
            <ErrorState message="Failed to load building credits." />
          ) : rows.length === 0 ? (
            <EmptyState />
          ) : (
            rows.map((b, i) => {
              const net = b.creditsEarnedThisMonth - b.creditsSpentThisMonth;
              const stagnant = b.creditsEarnedThisMonth === 0 && b.creditsSpentThisMonth === 0;
              return (
                <div key={b.buildingId} style={{
                  display: "flex", alignItems: "center", padding: "0 20px", height: 57,
                  borderBottom: i < rows.length - 1 ? "1px solid var(--color-stroke-medium)" : "none",
                }}>
                  <div style={{ flex: "28 1 0", minWidth: 0 }}>
                    <CopyableCell value={b.name}>
                      <div style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontWeight: "500" as React.CSSProperties["fontWeight"], fontFamily: "var(--font-family-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {UUID_RE.test(b.name)
                          ? <IdDisplay value={b.name} style={{ fontSize: "var(--font-size-tiny)", fontWeight: 500 }} />
                          : b.name}
                      </div>
                    </CopyableCell>
                    <CopyableCell value={b.city}>
                      <div style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.city}</div>
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "16 1 0", minWidth: 0 }}>
                    <CopyableCell value={b.creditsInCirculation.toLocaleString()}>
                      <span style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {b.creditsInCirculation.toLocaleString()}
                      </span>
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "14 1 0", minWidth: 0 }}>
                    <CopyableCell value={`+${b.creditsEarnedThisMonth}`}>
                      <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], color: stagnant ? "var(--color-text-strong)" : "var(--color-green-1000)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        +{b.creditsEarnedThisMonth}
                      </span>
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "14 1 0", minWidth: 0 }}>
                    <CopyableCell value={`-${b.creditsSpentThisMonth}`}>
                      <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], color: stagnant ? "var(--color-text-strong)" : "var(--color-tag-text-expired)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        -{b.creditsSpentThisMonth}
                      </span>
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "12 1 0", minWidth: 0 }}>
                    <CopyableCell value={net > 0 ? `+${net}` : net === 0 ? "0" : String(net)}>
                      <span style={{ fontSize: "var(--font-size-tiny)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], color: net > 0 ? "var(--color-green-1000)" : net < 0 ? "var(--color-tag-text-expired)" : "var(--color-text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {net > 0 ? `+${net}` : net === 0 ? "0" : net}
                      </span>
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "14 1 0", minWidth: 0 }}>
                    <CopyableCell value={String(b.residentsAtThreshold)}>
                      <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], color: b.residentsAtThreshold > 5 ? "var(--color-tag-text-expired)" : "var(--color-text-strong)", fontFamily: "var(--font-family-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {b.residentsAtThreshold}
                      </span>
                    </CopyableCell>
                  </div>
                  <div style={{ flex: "8 1 0", minWidth: 0, display: "flex", justifyContent: "flex-end" }}>
                    <ViewLink href={`/buildings/${b.buildingId}`} />
                  </div>
                </div>
              );
            })
          )}
          </TableScroll>
          </div>
        </div>
      </div>
    </>
  );
}