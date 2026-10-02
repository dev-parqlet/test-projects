"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../components/auth/auth-provider";
import { useDashboardStats } from "../components/hooks";
import { useWindowWidth } from "../components/hooks/useWindowSize";
import {
  StatCard,
  RecentActivityCard,
  CurrentBookingsCard,
  TopContributorsCard,
  TopGuestParkingBookersCard,
} from "../components/hoa";
import { MoneyProgressCard } from "../components/revenue/MoneyProgressCard";
import {
  CONDO_FLOOR_CENTS,
  CONDO_SUBSCRIPTION_CENTS,
} from "../lib/demo/pricing";
import { condoSavingsHistory } from "../lib/demo/condo-revenue";
import { condoShowsSavings, productPrefix } from "../lib/demo/product-path";
import { countMockGiftCardsRedeemed } from "../lib/mock-data/gift-cards-mock-store";

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function DashboardPage() {
  const { user } = useAuth();
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isDesktop = width >= 1024;
  const pad = isMobile ? 16 : 24;
  // `/api/auth/me` only ever returns `buildingIds` (plural) — it never sends
  // a singular `buildingId` (see api-backend/src/routes/auth.ts) — so this
  // must read `buildingIds[0]`, not `buildingId`, or every widget on this
  // page silently gets no scope at all against a real session.
  const buildingId = user?.buildingIds?.[0] ?? null;
  // A Condo's residents own every spot, so the money their sharing makes is
  // theirs. HOA boards told us a dashboard pitching the BUILDING on earning
  // off it reads wrong - so /condo leaves the savings story out, and
  // /condo+savings keeps it for the buildings already shown it.
  const pathname = usePathname();
  const showsSavings = condoShowsSavings(pathname);
  const prefix = productPrefix(pathname);
  const { data: stats, isLoading: statsLoading } = useDashboardStats(buildingId);
  // The SAME call the Savings page makes, not a second estimate of the same
  // month. These two screens quote the same four figures, and when they were
  // computed from different sources they disagreed by whatever the two
  // formulas happened to differ by that day.
  const month = useMemo(() => condoSavingsHistory(6)[0], []);
  const giftCardsRedeemed = countMockGiftCardsRedeemed(buildingId);
  const safeStats = stats ?? { daily: 0, weekly: 0, monthly: 0, ytd: 0 };

  return (
    <>
      <div style={{ padding: pad }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Page title */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h1
              style={{
                margin: 0,
                fontSize: isMobile ? "var(--font-size-heading-2)" : "var(--font-size-heading-1)",
                fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                lineHeight: isMobile ? "var(--line-height-heading-2)" : "var(--line-height-heading-1)",
                color: "var(--color-text-strong)",
                fontFamily: "var(--font-family-heading)",
              }}
            >
              Dashboard
            </h1>
            <p style={{ fontSize: 16, lineHeight: "20px", color: "var(--color-text-weak)" }}>
              {showsSavings
                ? "Overview of parking activity and savings in your building"
                : "Overview of parking activity in your building"}
            </p>
          </div>

          {/* Stat cards */}
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: isDesktop
                ? "repeat(4, 1fr)"
                : isMobile
                ? "1fr"
                : "repeat(2, 1fr)",
              overflow: "hidden",
            }}
          >
            {/* Three windows on the same count, widening - today, this
                month, this year - so the fourth card is free to answer a
                different question. A weekly count sat between the first two
                without separating them, and year-to-date bookings beside
                year-to-date redemptions is the pair a board actually reads:
                how much parking happened, and how much of it came back to
                residents as rewards. */}
            <StatCard label="Bookings today" value={statsLoading ? 0 : safeStats.daily} tag={statsLoading ? "Loading…" : "today"} />
            <StatCard label="Bookings this month" value={statsLoading ? 0 : safeStats.monthly} tag={statsLoading ? "Loading…" : "this month"} />
            <StatCard label="Bookings year to date" value={statsLoading ? 0 : safeStats.ytd} tag={statsLoading ? "Loading…" : "year to date"} />
            <StatCard label="Gift cards redeemed" value={giftCardsRedeemed} tag="year to date" />
          </div>

          {/* What this month's sharing took off the bill. A Condo is never
              paid, so the third column is a CARRYOVER, not a payout - see
              MoneyProgressCard. Absent entirely on /condo: see
              `showsSavings` above. */}
          {showsSavings && (
          <MoneyProgressCard
            product="condo"
            subscriptionCents={CONDO_SUBSCRIPTION_CENTS}
            earnedCents={month.fromSharingCents + month.carriedInCents}
            savedCents={month.savedCents}
            remainderCents={month.carriedOverCents}
            floorCents={CONDO_FLOOR_CENTS}
            dueLabel={`Due ${MONTHS_SHORT[(new Date().getMonth() + 1) % 12]} 1`}
            href={`${prefix}/savings`}
            sources={[
              // A Condo's residents own every spot, so there is exactly one
              // place its money can come from. The chip is still drawn,
              // because "from resident spots" is the sentence the figure
              // needs and a board reads the card without the page around it.
              { id: "resident", label: "Resident spots", cents: month.fromSharingCents },
            ]}
          />
          )}

          {/* Recent Activity + Current Bookings */}
          <div style={{ display: "flex", flexDirection: isDesktop ? "row" : "column", gap: 16, alignItems: isDesktop ? "stretch" : undefined }}>
            <RecentActivityCard buildingId={buildingId} />
            <CurrentBookingsCard buildingId={buildingId} />
          </div>

          {/* Top Contributors + Top Guest Parking Bookers */}
          <div style={{ display: "flex", flexDirection: isDesktop ? "row" : "column", gap: 16, alignItems: isDesktop ? "stretch" : undefined }}>
            <TopContributorsCard buildingId={buildingId} />
            <TopGuestParkingBookersCard buildingId={buildingId} />
          </div>

          {/* The Privacy Policy / Terms of Service pair that used to close
              this page is gone: both are permanent items in the left nav,
              so repeating them here was a second route to the same two
              documents. */}

        </div>
      </div>
    </>
  );
}