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
 * Directly labelled bars, no Y axis.
 *
 * The axis was doing the work the labels now do, and doing it worse: a
 * reader wanting Saturday's figure had to trace the bar's top across to a
 * scale and interpolate between two gridlines. With every bar carrying its
 * own number the axis is a second, vaguer copy of the same information, so
 * it and the dashed guides that helped you read it are both gone. What is
 * left is a baseline, which is the one part a bar chart cannot do without:
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
          // Headroom for the value label that sits above the tallest bar.
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
              {/* Split bars carry their total above and their parts in the
                  tooltip; a solid bar has nothing more to say, so it gets
                  no tooltip at all. */}
              {isHovered && neighbor != null && (
                <div style={{ ...tip, bottom: `${heightPct}%` }}>
                  <span style={{ display: "block" }}>
                    {seriesLabels[0]} <strong>{label(value - neighbor)}</strong>
                  </span>
                  <span style={{ display: "block" }}>
                    {seriesLabels[1]} <strong>{label(neighbor)}</strong>
                  </span>
                  <div style={tipArrow} />
                </div>
              )}

              {/* The figure, above its own bar. */}
              <span
                style={{
                  position: "absolute",
                  bottom: `${heightPct}%`,
                  marginBottom: 4,
                  fontFamily: "var(--font-family-body)",
                  fontSize: 12,
                  lineHeight: "16px",
                  color: colors.textWeak,
                  whiteSpace: "nowrap",
                }}
              >
                {label(value)}
              </span>

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
