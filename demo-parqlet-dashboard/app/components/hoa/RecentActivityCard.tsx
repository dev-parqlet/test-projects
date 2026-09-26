"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IcCalendarSm, IcArrowUp } from "../icons";
import { ApiBooking } from "../hooks/dashboard/types";
import { weekData, monthData, avg, generateCustomData, defaultFrom, defaultTo, ChartPoint } from "../ui/chart-utils";
import { colors } from "../ui/chart-utils";
import { BarChart } from "./BarChart";
import { dashboardKeys, DASHBOARD_STALE_TIME, BACKEND_URL } from "../hooks/dashboard/queryKeys";

type TabOption = "Week" | "Month" | "Custom";

const BACKEND = BACKEND_URL;

interface RecentActivityCardProps {
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

export function RecentActivityCard({ buildingId }: RecentActivityCardProps) {
  const [activeTab, setActiveTab] = useState<TabOption>("Week");
  const [visible, setVisible] = useState(false);
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: dashboardKeys.bookings(buildingId ?? ""),
    queryFn: () => fetchBookings(buildingId!),
    enabled: !!buildingId,
    staleTime: DASHBOARD_STALE_TIME,
  });

  const staticData = useMemo(() => {
    if (bookings.length === 0) {
      return { weekly: weekData, monthly: monthData, weekAvg: avg(weekData), monthAvg: avg(monthData) };
    }
    const now = new Date();
    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);

    const weekly = Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      const label = DAY_NAMES[dayDate.getDay()];
      const count = bookings.filter((b) => {
        const d = new Date(b.bookingStartIso);
        return !isNaN(d.getTime()) && d.toDateString() === dayDate.toDateString();
      }).length;
      return { day: label, value: count };
    });

    const monthly = Array.from({ length: 5 }, (_, i) => {
      const wStart = new Date(now);
      wStart.setDate(now.getDate() - (6 - i) * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wStart.getDate() + 6);
      return {
        day: `W${i + 1}`,
        value: bookings.filter((b) => {
          const bd = new Date(b.bookingStartIso);
          return !isNaN(bd.getTime()) && bd >= wStart && bd <= wEnd;
        }).length,
      };
    });

    const weekAvg = Math.round(weekly.reduce((s, p) => s + p.value, 0) / weekly.length) || 0;
    const monthAvg = Math.round(monthly.reduce((s, p) => s + p.value, 0) / monthly.length) || 0;

    // Trigger visible transition after initial compute
    setTimeout(() => setVisible(true), 50);

    return { weekly, monthly, weekAvg, monthAvg };
  }, [bookings]);

  // Trigger visible after first data
  if (visible === false && !isLoading && bookings.length > 0) {
    // Handled by useMemo's setTimeout side effect
  }

  const chartData = useMemo(() => {
    if (activeTab === "Week") return staticData.weekly;
    if (activeTab === "Month") return staticData.monthly;
    return generateCustomData(fromDate, toDate, bookings);
  }, [activeTab, staticData, fromDate, toDate, bookings]);

  const avgLabel =
    activeTab === "Week"
      ? `${staticData.weekAvg} per day`
      : activeTab === "Month"
      ? `${staticData.monthAvg} per week`
      : `${avg(chartData)} per day`;

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: colors.tagBg,
            borderRadius: 47,
            padding: "4px 8px",
            fontSize: 12,
            color: colors.textStrong,
          }}
        >
          Average: {avgLabel}
          <IcArrowUp />
        </div>
      </div>

      {/* Tabs */}
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
          <BarChart data={chartData} />
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-weaker)", fontSize: 14 }}>
            No bookings yet
          </div>
        )}
      </div>
    </div>
  );
}