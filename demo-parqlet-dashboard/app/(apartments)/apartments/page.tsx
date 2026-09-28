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
import { CurrentBookingsCard } from "../../components/hoa/CurrentBookingsCard";
import { TopEarningSpotsCard } from "../../components/demo/TopEarningSpotsCard";
import { CreditPriceCard, type PriceRow } from "../../components/pricing/CreditPriceCard";
import { EarningsProgressCard } from "../../components/revenue/EarningsProgressCard";
import {
  COMMISSION_PCT,
  currentPeriod,
  DEMO_SPOTS,
  formatMoney,
  netToBuilding,
  recentPayouts,
} from "../../lib/demo/apartments-data";
import {
  APARTMENT_FLOOR_CENTS,
  APARTMENT_SUBSCRIPTION_CENTS,
  BASE_PRICE_CENTS,
  BASE_PRICE_CREDITS,
} from "../../lib/demo/pricing";

type Booking = { status: string };

export default function ApartmentsDashboardPage() {
  const { user } = useAuth();
  const buildingId = user?.buildingId ?? "";
  const period = useMemo(() => currentPeriod(), []);

  const { data } = useQuery({
    queryKey: ["apartments", "overview", buildingId],
    enabled: !!buildingId,
    queryFn: async (): Promise<{ current: Booking[] }> => {
      const res = await fetch(`/api/bookings?buildingId=${buildingId}&tab=current&pageSize=200`, { cache: "no-store" });
      return { current: ((await res.json()) as { data?: Booking[] }).data ?? [] };
    },
  });

  const liveNow = data?.current.length ?? 0;
  const listed = DEMO_SPOTS.filter((s) => s.status === "Listed").length;
  // Occupancy against LISTED spots, not every spot: an unlisted spot was
  // never on offer, so counting it would make the building look emptier
  // than it chose to be.
  const occupancy = listed === 0 ? 0 : Math.round((liveNow / listed) * 100);

  /**
   * Every month the building has earned in, the open one included.
   *
   * Summed from the same history the Earnings page prints rather than from
   * the booking corpus. The corpus is a fixed sample - a few dozen rows
   * kept small enough to read - so adding it up gave an all-time total
   * SMALLER than the month beside it, which reads as a bug whichever
   * number the viewer believes.
   */
  const earnedAllTime = useMemo(
    () => recentPayouts(5).reduce((sum, p) => sum + p.netCents, 0) + period.netCents,
    [period],
  );

  // Read off the spots themselves rather than restating the constants, so
  // the card cannot drift from what the Parking Spots screen charges.
  const priceRows = useMemo<PriceRow[]>(() => {
    const owned = DEMO_SPOTS.filter((sp) => sp.owner === "building");
    const extras = owned.map((sp) => sp.extraCents);
    const lo = Math.min(...extras, 0);
    const hi = Math.max(...extras, 0);
    const hasExtra = hi > 0;
    return [
      {
        label: "A resident's own spot",
        note: "They share it, you never price it",
        price: `${BASE_PRICE_CREDITS} credit`,
        total: formatMoney(BASE_PRICE_CENTS),
      },
      {
        label: "A spot your building owns",
        note: hasExtra
          ? `The base, plus whatever you set - yours run ${formatMoney(lo)} to ${formatMoney(hi)}`
          : "The base, plus whatever you set - yours are all at the base today",
        price: hasExtra
          ? `${BASE_PRICE_CREDITS} credit + ${formatMoney(lo)}-${formatMoney(hi)}`
          : `${BASE_PRICE_CREDITS} credit`,
        total: hasExtra
          ? `${formatMoney(BASE_PRICE_CENTS + lo)}-${formatMoney(BASE_PRICE_CENTS + hi)}`
          : formatMoney(BASE_PRICE_CENTS),
      },
      {
        label: "You receive",
        note: `After our ${COMMISSION_PCT}% commission and card fees`,
        price: "on the base",
        total: formatMoney(netToBuilding(BASE_PRICE_CENTS)),
      },
    ];
  }, []);

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
        <Stat label="Earned all time" value={formatMoney(earnedAllTime)} hint="After commission" />
        <Stat label="Spots listed" value={`${listed}`} hint={`${DEMO_SPOTS.length} owned`} />
      </div>

      {/* This month's earnings against the subscription */}
      <EarningsProgressCard
        product="apartment"
        earningsCents={period.netCents}
        subscriptionCents={APARTMENT_SUBSCRIPTION_CENTS}
        floorCents={APARTMENT_FLOOR_CENTS}
        revenueHref="/apartment/revenue"
      />

      <CreditPriceCard
        rows={priceRows}
        footnote="Everyone pays in credits, the same as a Condo. The difference is that you own some of the spots, and only those can carry an extra on top of the base."
      />

      {/* Recent bookings, with what each one actually paid the building */}
      <CurrentBookingsCard buildingId={buildingId} showEarnings />

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
