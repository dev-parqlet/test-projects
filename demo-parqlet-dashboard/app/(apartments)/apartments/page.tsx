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
import { MoneyProgressCard } from "../../components/revenue/MoneyProgressCard";
import { formatMoney } from "../../lib/demo/apartments-data";
import { currentApartmentMonth } from "../../lib/demo/apartment-earnings";
import { bookingEarning } from "../../lib/demo/booking-earnings";
import { APARTMENT_SUBSCRIPTION_CENTS } from "../../lib/demo/pricing";

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
  const month = useMemo(() => currentApartmentMonth(), []);

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
  return (
    <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
      <div>
        {/* "Dashboard", not the building's name. The header already shows
            which building you are in, and printing it again as the page
            title left the screen as the only one with no title at all. */}
        <h1 style={st.h1}>Dashboard</h1>
        {/* The same sentence the Condo dashboard opens with, ending in the
            word that differs. An operator is told what the page is, not what
            the commercial terms are - those belong on Subscription, and at
            the top of a dashboard they read as a disclaimer. */}
        <p style={st.sub}>Overview of parking activity and earnings in your building</p>
      </div>

      <div style={st.stats}>
        <StatCard label="Bookings today" value={stats.today} tag="today" />
        <StatCard label="Bookings this month" value={stats.month} tag="this month" />
        {/* The split only means something where the building owns spots of
            its own, which is why a Condo never shows this card. */}
        <StatCard
          label="Bookings by spot type"
          value={`${stats.community} Comm · ${stats.neighbor} Res`}
          tag="this month"
          split={{ primary: stats.community, secondary: stats.neighbor }}
        />
        <StatCard
          label="Avg. earned per community spot"
          value={formatMoney(stats.avgPerCommunitySpot)}
          tag="this month"
        />
      </div>

      {/* This month's earnings against the subscription. An Apartment's
          bill reaches zero and the remainder is CASH, so the third column
          is a payout rather than a carryover - see MoneyProgressCard. */}
      <MoneyProgressCard
        product="apartment"
        subscriptionCents={APARTMENT_SUBSCRIPTION_CENTS}
        earnedCents={month.totalCents}
        savedCents={month.appliedCents}
        remainderCents={month.payoutCents}
        floorCents={0}
        dueLabel={month.dueLabel}
        href="/apartment/earnings"
        sources={[
          { id: "community", label: "Community Spots", cents: month.communityCents },
          { id: "resident", label: "Resident spots", cents: month.residentCents },
        ]}
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

    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
  h1: {
    margin: 0,
    fontSize: "var(--font-size-heading-1)",
    lineHeight: "var(--line-height-heading-1)",
    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
    fontFamily: "var(--font-family-heading)",
    color: "var(--color-text-strong)",
  },
  sub: { margin: "var(--spacing-8) 0 0", fontSize: 16, lineHeight: "20px", color: "var(--color-text-weak)" },
  stats: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "var(--spacing-12)" },
};
