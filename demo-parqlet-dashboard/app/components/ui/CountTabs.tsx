"use client";

import React from "react";

/**
 * A row of pill filters that each carry a COUNT: "All 180 · Rentable 18 ·
 * Move-in soon 3 · Assigned 159". One is always selected.
 *
 * Not `TabBar`. That one switches between different VIEWS of a subject
 * (Parking Spots / Availability) and lives directly under the page title;
 * this one narrows a single list and lives with the search box, next to
 * the dropdown filters it works alongside. Using the underlined tabs for
 * both would have put two rows of tabs on this screen that mean different
 * things and look identical.
 *
 * The counts are the point. A dropdown reading "Status: All" hides the
 * one number an operator opens this screen for - how many spaces they can
 * actually sell this month - behind a click.
 */
export interface CountTab<T extends string> {
  id: T;
  label: string;
  count: number;
}

export function CountTabs<T extends string>({
  active,
  onChange,
  tabs,
}: {
  active: T;
  onChange: (id: T) => void;
  tabs: readonly CountTab<T>[];
}) {
  const [hovered, setHovered] = React.useState<T | null>(null);

  return (
    <div
      role="tablist"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--spacing-4)",
        padding: 4,
        borderRadius: "var(--radius-48)",
        border: "1px solid var(--color-stroke-medium)",
        background: "var(--color-fill-white)",
        overflowX: "auto",
        maxWidth: "100%",
      }}
    >
      {tabs.map(({ id, label, count }) => {
        const isActive = active === id;
        const isHovered = hovered === id && !isActive;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-8)",
              height: 32,
              padding: "0 var(--spacing-16)",
              borderRadius: "var(--radius-48)",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-tiny)",
              lineHeight: "var(--line-height-tiny)",
              fontWeight: isActive
                ? ("var(--font-weight-medium)" as React.CSSProperties["fontWeight"])
                : ("var(--font-weight-regular)" as React.CSSProperties["fontWeight"]),
              background: isActive
                ? "var(--color-fill-strong)"
                : isHovered
                  ? "var(--color-fill-weak)"
                  : "transparent",
              color: isActive ? "var(--color-text-white)" : "var(--color-text-weak)",
              transition: "background 0.12s, color 0.12s",
            }}
          >
            {label}
            <span
              style={{
                fontVariantNumeric: "tabular-nums",
                color: isActive ? "var(--color-text-white)" : "var(--color-text-strong)",
                opacity: isActive ? 0.72 : 1,
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
