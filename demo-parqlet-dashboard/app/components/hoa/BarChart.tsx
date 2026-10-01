"use client";

import { useState } from "react";
import { ChartPoint } from "../ui/chart-utils";
import { colors } from "../ui/chart-utils";

interface BarChartProps {
  data: ChartPoint[];
  /**
   * How a bar's total is written above it, and in the tooltip. Counts by
   * default; the Earnings metric passes a money formatter.
   */
  format?: (value: number) => string;
  /** Names for the two halves of a split bar, bottom half second. */
  seriesLabels?: readonly [string, string];
}

/**
 * Bars with no Y axis and no printed values - the figure appears on hover.
 *
 * The axis went first, because a reader wanting Saturday's number had to
 * trace the bar's top across to a scale and interpolate. Printing the
 * number on every bar replaced it, and then became the same problem in a
 * different form: seven numerals across the top of a small card is a row
 * of text competing with the shape it annotates, and the shape is what the
 * chart is for. Comparing heights is what the bars already do well; an
 * exact figure is wanted one bar at a time, which is what hover is.
 *
 * What is left is a baseline, the one part a bar chart cannot do without:
 * without it the bars float and their heights stop being comparable.
 */
export function BarChart({ data, format, seriesLabels = ["Community Spots", "Resident spots"] }: BarChartProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const label = format ?? ((v: number) => `${v}`);
  // Never zero: an all-zero week would divide every bar by nothing.
  const chartMax = Math.max(1, ...data.map((d) => d.value));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", flex: 1, minHeight: 0 }}>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          // Headroom so the hover tooltip above the tallest bar is not
          // clipped by the card.
          paddingTop: 20,
          borderBottom: `1px solid ${colors.border}`,
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
              {/* Every bar with something in it answers on hover: the
                  total first, then the split for a building that has one.
                  An empty day has nothing to say, so it says nothing. */}
              {isHovered && value > 0 && (
                <div style={{ ...tip, bottom: `${heightPct}%` }}>
                  <span style={{ display: "block" }}>
                    <strong>{label(value)}</strong>
                  </span>
                  {neighbor != null && (
                    <>
                      <span style={{ display: "block" }}>
                        {seriesLabels[0]} <strong>{label(value - neighbor)}</strong>
                      </span>
                      <span style={{ display: "block" }}>
                        {seriesLabels[1]} <strong>{label(neighbor)}</strong>
                      </span>
                    </>
                  )}
                  <div style={tipArrow} />
                </div>
              )}

              <div
                style={{
                  width: 30,
                  height: `${heightPct}%`,
                  background: colors.chartBar,
                  borderRadius: 4,
                  minHeight: value > 0 ? 4 : 0,
                  transition: "opacity 0.15s ease",
                  opacity: isHovered ? 0.85 : 1,
                  // A split bar is two stacked shares of the same total,
                  // resident spots at the bottom. Drawn INSIDE the bar
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
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

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
  );
}

const tip: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  transform: "translate(-50%, -24px)",
  background: colors.textStrong,
  color: colors.white,
  fontSize: 12,
  lineHeight: "16px",
  padding: "4px 8px",
  borderRadius: 6,
  whiteSpace: "nowrap",
  zIndex: 10,
  pointerEvents: "none",
};

const tipArrow: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: "50%",
  transform: "translateX(-50%)",
  width: 0,
  height: 0,
  borderLeft: "5px solid transparent",
  borderRight: "5px solid transparent",
  borderTop: `5px solid ${colors.textStrong}`,
};
