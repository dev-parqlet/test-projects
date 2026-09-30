"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IcCalendarSm } from "../icons";
import { ApiBooking } from "../hooks/dashboard/types";
import { weekData, monthData, generateCustomData, defaultFrom, defaultTo } from "../ui/chart-utils";
import { bookingEarning } from "../../lib/demo/booking-earnings";
import { formatMoney } from "../../lib/demo/pricing";
import { colors } from "../ui/chart-utils";
import { BarChart } from "./BarChart";
import { dashboardKeys, DASHBOARD_STALE_TIME, BACKEND_URL } from "../hooks/dashboard/queryKeys";

type TabOption = "Week" | "Month" | "Custom";
/**
 * What the bars measure.
 *
 * Only a building that EARNS has a second thing to plot. A Condo is never
 * paid, so bookings are the only series it has and the toggle would be a
 * control with one position.
 */
type Metric = "Bookings" | "Earnings";

const BACKEND = BACKEND_URL;

interface RecentActivityCardProps {
  /**
   * Split each bar into the building's own spots and the ones residents
   * lent. Off for a Condo, where every spot is a resident's and the split
   * would be one colour with a legend explaining nothing.
   */
  splitBySpotKind?: boolean;
  buildingId: string | null;
}

async function fetchBookings(buildingId: string): Promise<ApiBooking[]> {
  // No `tab` filter — "current" is now a narrow "happening right now"
  // chronological window (see api-backend routes/bookings.ts), which would
  // exclude nearly every booking from this week/month's activity chart.
  // Needs every booking for the building; the chart below buckets them by
  // bookingStart itself.
  const r = await fetch(
    `${BACKEND}/api/bookings?buildingId=${buildingId}&pageSize=200`,
    { credentials: "include" }
  );
  const d = await r.json();
  return d.data ?? [];
}

export function RecentActivityCard({ buildingId, splitBySpotKind = false }: RecentActivityCardProps) {
  const [activeTab, setActiveTab] = useState<TabOption>("Week");
  const [metric, setMetric] = useState<Metric>("Bookings");
  const [visible, setVisible] = useState(false);
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: dashboardKeys.bookings(buildingId ?? ""),
    queryFn: () => fetchBookings(buildingId!),
    enabled: !!buildingId,
    staleTime: DASHBOARD_STALE_TIME,
  });

  // Counting rows, or summing what they made. `bookingEarning` is the same
  // function the Recent Bookings list and the Earnings page use, so a bar
  // and the rows behind it can never disagree about what a booking earned.
  const measure = useMemo(
    () =>
      metric === "Earnings"
        ? (rows: { bookingStartIso: string }[]) =>
            rows.reduce((sum, b) => sum + bookingEarning(b as never).earnedCents, 0)
        : (rows: unknown[]) => rows.length,
    [metric],
  );

  const staticData = useMemo(() => {
    if (bookings.length === 0) {
      return { weekly: weekData, monthly: monthData };
    }
    const now = new Date();
    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);

    const weekly = Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      const label = DAY_NAMES[dayDate.getDay()];
      const onDay = bookings.filter((b) => {
        const d = new Date(b.bookingStartIso);
        return !isNaN(d.getTime()) && d.toDateString() === dayDate.toDateString();
      });
      return {
        day: label,
        value: measure(onDay),
        neighbor: splitBySpotKind ? measure(onDay.filter((b) => b.spotOwnerName)) : undefined,
      };
    });

    const monthly = Array.from({ length: 5 }, (_, i) => {
      const wStart = new Date(now);
      wStart.setDate(now.getDate() - (6 - i) * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wStart.getDate() + 6);
      const inWeek = bookings.filter((b) => {
        const bd = new Date(b.bookingStartIso);
        return !isNaN(bd.getTime()) && bd >= wStart && bd <= wEnd;
      });
      return {
        day: `W${i + 1}`,
        value: measure(inWeek),
        neighbor: splitBySpotKind ? measure(inWeek.filter((b) => b.spotOwnerName)) : undefined,
      };
    });

    // Trigger visible transition after initial compute
    setTimeout(() => setVisible(true), 50);

    return { weekly, monthly };
  }, [bookings, splitBySpotKind, measure]);

  // Trigger visible after first data
  if (visible === false && !isLoading && bookings.length > 0) {
    // Handled by useMemo's setTimeout side effect
  }

  const chartData = useMemo(() => {
    if (activeTab === "Week") return staticData.weekly;
    if (activeTab === "Month") return staticData.monthly;
    // Pass the split through, or the bars lose their two colours the
    // moment someone picks Custom while the legend above still shows them.
    return generateCustomData(fromDate, toDate, bookings, splitBySpotKind, measure);
  }, [activeTab, staticData, fromDate, toDate, bookings, splitBySpotKind, measure]);

  const switchTab = (tab: TabOption) => {
    if (tab === activeTab) return;
    setVisible(false);
    setTimeout(() => {
      setActiveTab(tab);
      setVisible(true);
    }, 180);
  };

  const applyCustomRange = (from: string, to: string) => {
    setFromDate(from);
    setToDate(to);
    if (activeTab === "Custom") {
      setVisible(false);
      setTimeout(() => setVisible(true), 180);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        background: colors.white,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: "var(--font-family-body)",
            fontSize: "var(--font-size-uppercase)",
            lineHeight: "var(--line-height-uppercase)",
            fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
            color: "var(--color-text-weak)",
            textTransform: "uppercase" as const,
          }}
        >
          Recent Activity
        </span>
      </div>

      {/* Range on the left, what is being measured on the right. Two
          separate questions, so two separate groups rather than one row of
          five pills where picking "Earnings" would look like picking a
          range. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          border: `1px solid ${colors.border}`,
          borderRadius: 76,
          padding: "2px 4px",
          alignSelf: "flex-start",
        }}
      >
        {(["Week", "Month", "Custom"] as TabOption[]).map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 12px",
              borderRadius: 52,
              background: activeTab === tab ? colors.textStrong : "transparent",
              color: activeTab === tab ? colors.white : colors.textWeak,
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              lineHeight: "16px",
              fontFamily: "var(--font-family-body)",
              transition: "background 0.18s ease, color 0.18s ease",
            }}
          >
            {tab === "Custom" && <IcCalendarSm color={activeTab === "Custom" ? colors.white : colors.textWeak} />}
            {tab}
          </button>
        ))}
      </div>

      {/* Only a building that earns has a second series to plot. */}
      {splitBySpotKind && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            border: `1px solid ${colors.border}`,
            borderRadius: 76,
            padding: "2px 4px",
          }}
        >
          {(["Bookings", "Earnings"] as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                if (m === metric) return;
                setVisible(false);
                setTimeout(() => {
                  setMetric(m);
                  setVisible(true);
                }, 180);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 52,
                // Lime rather than the dark fill the range tabs use: the two
                // groups sit side by side, and two identical dark pills read
                // as one control with two active states.
                background: metric === m ? "var(--color-spot-community)" : "transparent",
                color: metric === m ? colors.textStrong : colors.textWeak,
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                lineHeight: "16px",
                fontFamily: "var(--font-family-body)",
                transition: "background 0.18s ease, color 0.18s ease",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      )}
      </div>

      {/* Custom date picker */}
      {activeTab === "Custom" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: colors.textWeak }}>From</span>
          <input
            type="date"
            value={fromDate}
            max={toDate}
            onChange={(e) => applyCustomRange(e.target.value, toDate)}
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 13,
              color: colors.textStrong,
              background: colors.white,
              fontFamily: "Rubik, sans-serif",
              cursor: "pointer",
              outline: "none",
            }}
          />
          <span style={{ fontSize: 13, color: colors.textWeak }}>To</span>
          <input
            type="date"
            value={toDate}
            min={fromDate}
            onChange={(e) => applyCustomRange(fromDate, e.target.value)}
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 13,
              color: colors.textStrong,
              background: colors.white,
              fontFamily: "Rubik, sans-serif",
              cursor: "pointer",
              outline: "none",
            }}
          />
        </div>
      )}

      {splitBySpotKind && (
        <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--color-text-strong)" }}>
          {([
            ["Community Spots", "var(--color-spot-community)"],
            ["Resident spots", "var(--color-spot-neighbor)"],
          ] as const).map(([label, colour]) => (
            <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: colour, flex: "none" }} />
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Chart */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(6px)",
          transition: "opacity 0.18s ease, transform 0.18s ease",
        }}
      >
        {isLoading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-weaker)", fontSize: 14 }}>
            Loading…
          </div>
        ) : chartData.length > 0 ? (
          <BarChart
            data={chartData}
            format={metric === "Earnings" ? formatMoney : undefined}
          />
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-weaker)", fontSize: 14 }}>
            No bookings yet
          </div>
        )}
      </div>
    </div>
  );
}