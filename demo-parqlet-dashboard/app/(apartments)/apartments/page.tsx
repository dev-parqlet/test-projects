"use client";

/**
 * Apartments dashboard.
 *
 * Its own overview, not the HOA one with a card swapped. An HOA dashboard
 * counts credits and ranks residents who shared their spots; neither
 * happens here, where the building owns every spot and is paid in dollars.
 */

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../components/auth/auth-provider";
import { TopEarningSpotsCard } from "../../components/demo/TopEarningSpotsCard";
import {
  COMMISSION_PCT,
  currentPeriod,
  DEMO_SPOTS,
  formatMoney,
  netToBuilding,
} from "../../lib/demo/apartments-data";

type Booking = { status: string; amountCents?: number | null };

export default function ApartmentsDashboardPage() {
  const { user } = useAuth();
  const buildingId = user?.buildingId ?? "";
  const period = useMemo(() => currentPeriod(), []);

  const { data } = useQuery({
    queryKey: ["apartments", "overview", buildingId],
    enabled: !!buildingId,
    queryFn: async (): Promise<{ current: Booking[]; all: Booking[] }> => {
      const [cur, all] = await Promise.all([
        fetch(`/api/bookings?buildingId=${buildingId}&tab=current&pageSize=200`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/bookings?buildingId=${buildingId}&pageSize=500`, { cache: "no-store" }).then((r) => r.json()),
      ]);
      return { current: cur.data ?? [], all: all.data ?? [] };
    },
  });

  const liveNow = data?.current.length ?? 0;
  const listed = DEMO_SPOTS.filter((s) => s.status === "Listed").length;
  // Occupancy against LISTED spots, not every spot: an unlisted spot was
  // never on offer, so counting it would make the building look emptier
  // than it chose to be.
  const occupancy = listed === 0 ? 0 : Math.round((liveNow / listed) * 100);

  const earned = (data?.all ?? []).reduce((sum, b) => {
    if (b.status === "Cancelled" || b.amountCents == null) return sum;
    return sum + netToBuilding(b.amountCents);
  }, 0);

  return (
    <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
      <div>
        <h1 style={st.h1}>{user?.buildings?.[0]?.name ?? "Your building"}</h1>
        <p style={st.sub}>
          Public parking. Parqlet keeps {COMMISSION_PCT}% of every booking;
          the rest is paid to you monthly.
        </p>
      </div>

      <div style={st.stats}>
        <Stat label="Parked right now" value={String(liveNow)} hint={`${occupancy}% of ${listed} listed spots`} />
        <Stat label={`${period.period} balance`} value={formatMoney(period.netCents)} hint="After commission" />
        <Stat label="Earned all time" value={formatMoney(earned)} hint="After commission" />
        <Stat label="Spots listed" value={`${listed}`} hint={`${DEMO_SPOTS.length} owned`} />
      </div>

      <TopEarningSpotsCard buildingId={buildingId} />
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div style={st.stat}>
      <span style={st.statLabel}>{label}</span>
      <span style={st.statValue}>{value}</span>
      <span style={st.statHint}>{hint}</span>
    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
  h1: { margin: 0, fontSize: "var(--font-size-heading-3)", fontWeight: 600, color: "var(--color-text-strong)" },
  sub: { margin: "var(--spacing-4) 0 0", fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" },
  stats: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "var(--spacing-12)" },
  stat: {
    display: "flex", flexDirection: "column", gap: 4,
    padding: "var(--spacing-16)", borderRadius: "var(--radius-12)",
    border: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-white)",
  },
  statLabel: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", textTransform: "uppercase", letterSpacing: 0.3 },
  statValue: { fontSize: 26, fontWeight: 700, color: "var(--color-text-strong)" },
  statHint: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" },
};
