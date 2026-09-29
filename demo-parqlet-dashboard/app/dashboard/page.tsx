"use client";

import { useMemo, useState } from "react";
import { useAuth } from "../components/auth/auth-provider";
import { useDashboardStats } from "../components/hooks";
import { useWindowWidth } from "../components/hooks/useWindowSize";
import {
  StatCard,
  RecentActivityCard,
  CurrentBookingsCard,
  TopContributorsCard,
  TopGuestParkingBookersCard,
  DocumentModal,
} from "../components/hoa";
import { EarningsProgressCard } from "../components/revenue/EarningsProgressCard";
import {
  CONDO_FLOOR_CENTS,
} from "../lib/demo/pricing";
import { currentCondoMonth } from "../lib/demo/condo-revenue";

export default function DashboardPage() {
  const { user } = useAuth();
  const width = useWindowWidth();
  const isMobile = width < 768;
  const isDesktop = width >= 1024;
  const pad = isMobile ? 16 : 24;
  const [docModal, setDocModal] = useState<"Privacy Policy" | "Terms of Service" | null>(null);
  // `/api/auth/me` only ever returns `buildingIds` (plural) — it never sends
  // a singular `buildingId` (see api-backend/src/routes/auth.ts) — so this
  // must read `buildingIds[0]`, not `buildingId`, or every widget on this
  // page silently gets no scope at all against a real session.
  const buildingId = user?.buildingIds?.[0] ?? null;
  const { data: stats, isLoading: statsLoading } = useDashboardStats(buildingId);
  // Same source as the Revenue page, so the dashboard cannot quote a
  // different month's earnings than the page it links to.
  const month = useMemo(() => currentCondoMonth(), []);
  const safeStats = stats ?? { daily: 0, weekly: 0, monthly: 0, ytd: 0 };

  return (
    <>
      {docModal && <DocumentModal title={docModal} onClose={() => setDocModal(null)} />}
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
              Overview of parking activity in your building
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
            <StatCard label="Daily Bookings" value={statsLoading ? 0 : safeStats.daily} tag={statsLoading ? "Loading…" : "bookings today"} />
            <StatCard label="Weekly Bookings" value={statsLoading ? 0 : safeStats.weekly} tag={statsLoading ? "Loading…" : "this week"} />
            <StatCard label="Monthly Bookings" value={statsLoading ? 0 : safeStats.monthly} tag={statsLoading ? "Loading…" : "this month"} />
            <StatCard label="Year to Date Bookings" value={statsLoading ? 0 : safeStats.ytd} tag={statsLoading ? "Loading…" : "all time"} />
          </div>

          {/* This month's earnings against the subscription */}
          <EarningsProgressCard
            product="condo"
            earningsCents={month.earningsCents}
            subscriptionCents={month.subscriptionCents}
            floorCents={CONDO_FLOOR_CENTS}
            revenueHref="/condo/revenue"
          />

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

          {/* Footer links */}
          <div style={{ display: "flex", gap: 16, paddingBottom: 8, flexWrap: "wrap" }}>
            {([
              { label: "Privacy Policy", href: "https://parqlet-terms-and-privacy.notion.site/Privacy-Policy-35d38574a76480a0be27c1cac5735ebe" },
              { label: "Terms of Service", href: "https://parqlet-terms-and-privacy.notion.site/Terms-of-Service-35d38574a76480228d7bc194bc23c6de" },
            ] as const).map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "var(--font-size-tiny)",
                  color: "var(--color-text-weak)",
                  textDecoration: "none",
                  fontFamily: "var(--font-family-body)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
              >
                {label}
              </a>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}