"use client";

import { useState } from "react";
import { computeYLabels, ChartPoint } from "../ui/chart-utils";
import { colors } from "../ui/chart-utils";

interface BarChartProps {
  data: ChartPoint[];
}

export function BarChart({ data }: BarChartProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const maxVal   = Math.max(...data.map(d => d.value));
  const yLabels  = computeYLabels(maxVal);
  const chartMax = yLabels[0];

  return (
    <div style={{ display: "flex", gap: 16, width: "100%", flex: 1, minHeight: 0 }}>
      {/* Y axis */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
          paddingBottom: 22,
          width: 24,
          maxWidth: 24,
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {yLabels.map((v) => (
          <span key={v} style={{ fontSize: 13, color: colors.textWeak, lineHeight: "1" }}>
            {v}
          </span>
        ))}
      </div>

      {/* Bars + X labels */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, minHeight: 0 }}>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            position: "relative",
          }}
        >
          {data.map(({ day, value, neighbor }) => {
            const heightPct = (value / chartMax) * 100;
            const isHovered = hoveredDay === day;
            return (
              <div
                key={day}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  height: "100%",
                  justifyContent: "flex-end",
                  position: "relative",
                  cursor: "default",
                }}
              >
                {/* Dashed guide */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 1,
                    borderLeft: "1px dashed var(--color-gray-30)",
                    zIndex: 0,
                  }}
                />
                {/* Tooltip */}
                {isHovered && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: `${heightPct}%`,
                      left: "50%",
                      transform: "translate(-50%, -8px)",
                      background: colors.textStrong,
                      color: colors.white,
                      fontSize: 12,
                      lineHeight: "16px",
                      padding: "4px 8px",
                      borderRadius: 6,
                      whiteSpace: "nowrap",
                      zIndex: 10,
                      pointerEvents: "none",
                    }}
                  >
                    {value} bookings
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 0,
                        height: 0,
                        borderLeft: "5px solid transparent",
                        borderRight: "5px solid transparent",
                        borderTop: `5px solid ${colors.textStrong}`,
                      }}
                    />
                  </div>
                )}
                {/* Bar */}
                <div
                  style={{
                    width: 30,
                    height: `${heightPct}%`,
                    background: isHovered ? "var(--color-accent-800)" : colors.chartBar,
                    borderRadius: 4,
                    minHeight: 4,
                    position: "relative",
                    zIndex: 1,
                    transition: "background 0.15s ease",
                    // A split bar is two stacked shares of the same total,
                    // neighbour spots at the bottom. Drawn INSIDE the bar
                    // rather than as two bars so the column still reads as
                    // one day's height.
                    display: neighbor == null ? undefined : "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    overflow: "hidden",
                  }}
                >
                  {neighbor != null && value > 0 && (
                    <div
                      style={{
                        height: `${(neighbor / value) * 100}%`,
                        background: "var(--color-spot-neighbor)",
                        borderTop: neighbor > 0 && neighbor < value ? "2px solid #fff" : undefined,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* X labels */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {data.map(({ day }) => (
            <div
              key={day}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 13,
                color: colors.textWeak,
                lineHeight: "1",
              }}
            >
              {day}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}