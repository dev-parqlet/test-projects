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
import { RecentActivityCard } from "../../components/hoa/RecentActivityCard";
import { StatCard } from "../../components/hoa/StatCard";
import { TopContributorsCard } from "../../components/hoa/TopContributorsCard";
import { useWindowWidth } from "../../components/hooks/useWindowSize";
import { TopEarningSpotsCard } from "../../components/demo/TopEarningSpotsCard";
import { CreditPriceCard, type PriceRow } from "../../components/pricing/CreditPriceCard";
import { EarningsProgressCard } from "../../components/revenue/EarningsProgressCard";
import {
  COMMISSION_PCT,
  currentPeriod,
  DEMO_SPOTS,
  formatMoney,
  netToBuilding,
} from "../../lib/demo/apartments-data";
import { bookingEarning } from "../../lib/demo/booking-earnings";
import {
  APARTMENT_FLOOR_CENTS,
  APARTMENT_SUBSCRIPTION_CENTS,
  BASE_PRICE_CENTS,
  BASE_PRICE_CREDITS,
} from "../../lib/demo/pricing";

type Booking = {
  status: string;
  bookingStartIso?: string;
  spotNumber?: string;
  spotOwnerName?: string | null;
  creditsSpent?: number | null;
  amountCents?: number | null;
};

export default function ApartmentsDashboardPage() {
  const { user } = useAuth();
  const buildingId = user?.buildingId ?? "";
  // The paired cards below sit side by side only where there is room for
  // two readable columns; under that they stack, because a half-width bar
  // chart with seven days on it is unreadable rather than merely small.
  const isDesktop = useWindowWidth() >= 1024;
  const pairStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: isDesktop ? "row" : "column",
    gap: "var(--spacing-16)",
    alignItems: isDesktop ? "stretch" : undefined,
  };
  const period = useMemo(() => currentPeriod(), []);

  const { data } = useQuery({
    queryKey: ["apartments", "overview", buildingId],
    enabled: !!buildingId,
    queryFn: async (): Promise<Booking[]> => {
      const res = await fetch(`/api/bookings?buildingId=${buildingId}&pageSize=500`, { cache: "no-store" });
      return ((await res.json()) as { data?: Booking[] }).data ?? [];
    },
  });

  /**
   * The four headline figures, all read off the same list of bookings so
   * they cannot disagree with each other or with the rows printed below.
   *
   * A cancelled booking is left out of every one of them: it was never
   * paid for, so counting it would overstate both the activity and the
   * earnings.
   */
  const stats = useMemo(() => {
    const rows = (data ?? []).filter((b) => b.status !== "Cancelled");
    const now = new Date();
    const sameDay = (iso?: string) => {
      if (!iso) return false;
      const d = new Date(iso);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    };
    const thisMonth = rows.filter((b) => {
      if (!b.bookingStartIso) return false;
      const d = new Date(b.bookingStartIso);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    const community = thisMonth.filter((b) => !b.spotOwnerName);
    const neighbor = thisMonth.length - community.length;

    // Averaged over the spots that actually earned, not over every spot
    // the building owns: a spot nobody booked drags the figure towards
    // zero and makes the ones that did work look worse than they are.
    const earnedBySpot = new Map<string, number>();
    for (const b of community) {
      const key = b.spotNumber ?? "?";
      earnedBySpot.set(key, (earnedBySpot.get(key) ?? 0) + bookingEarning(b).earnedCents);
    }
    const earnedTotal = [...earnedBySpot.values()].reduce((a, c) => a + c, 0);

    return {
      today: rows.filter((b) => sameDay(b.bookingStartIso)).length,
      month: thisMonth.length,
      community: community.length,
      neighbor,
      avgPerCommunitySpot: earnedBySpot.size === 0 ? 0 : Math.round(earnedTotal / earnedBySpot.size),
    };
  }, [data]);

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
        <StatCard variant="apartment" label="Bookings today" value={stats.today} tag="today" />
        <StatCard variant="apartment" label="Bookings this month" value={stats.month} tag="this month" />
        {/* The split only means something where the building owns spots of
            its own, which is why a Condo never shows this card. */}
        <StatCard
          variant="apartment"
          label="Bookings by spot type"
          value={`${stats.community} Comm · ${stats.neighbor} Res`}
          tag="this month"
          split={{ primary: stats.community, secondary: stats.neighbor }}
        />
        <StatCard
          variant="apartment"
          label="Avg. earned per community spot"
          value={formatMoney(stats.avgPerCommunitySpot)}
          tag="this month"
        />
      </div>

      {/* This month's earnings against the subscription */}
      <EarningsProgressCard
        product="apartment"
        earningsCents={period.netCents}
        subscriptionCents={APARTMENT_SUBSCRIPTION_CENTS}
        floorCents={APARTMENT_FLOOR_CENTS}
        revenueHref="/apartment/revenue"
      />

      {/* Activity against the bookings that produced it */}
      <div style={pairStyle}>
        <RecentActivityCard buildingId={buildingId} splitBySpotKind />
        <CurrentBookingsCard buildingId={buildingId} showEarnings />
      </div>

      {/* Who lends spots, and which of the building's own earn most */}
      <div style={pairStyle}>
        <TopContributorsCard buildingId={buildingId} />
        <TopEarningSpotsCard buildingId={buildingId} />
      </div>

      <CreditPriceCard
        rows={priceRows}
        footnote="Everyone pays in credits, the same as a Condo. The difference is that you own some of the spots, and only those can carry an extra on top of the base."
      />
    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
  h1: { margin: 0, fontSize: "var(--font-size-heading-3)", fontWeight: 600, color: "var(--color-text-strong)" },
  sub: { margin: "var(--spacing-4) 0 0", fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" },
  stats: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "var(--spacing-12)" },
};
