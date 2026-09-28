"use client";

import React from "react";

/**
 * The underlined tab row used to put several views of one subject on a
 * single page - Account Settings' six tabs, Availability's two.
 *
 * Lifted out of the Settings page, where it was written, once a second
 * screen needed it. It is generic over the tab id so each page keeps its
 * own union type rather than casting through `string`.
 *
 * It scrolls horizontally instead of wrapping: a wrapped second row reads
 * as a separate control, and on a narrow window the tabs would reflow
 * every time one was added.
 */
export interface TabBarItem<T extends string> {
  id: T;
  label: string;
}

export function TabBar<T extends string>({
  active,
  onChange,
  tabs,
}: {
  active: T;
  onChange: (t: T) => void;
  tabs: readonly TabBarItem<T>[];
}) {
  const [hovered, setHovered] = React.useState<T | null>(null);

  return (
    <div style={{
      overflowX:               "auto",
      WebkitOverflowScrolling: "touch",
      marginBottom:            "var(--spacing-24)",
    }}>
      <div style={{
        display:      "flex",
        alignItems:   "flex-end",
        gap:          0,
        borderBottom: "1px solid var(--color-stroke-medium)",
        minWidth:     "max-content",
      }}>
        {tabs.map(({ id, label }) => {
          const isActive  = active === id;
          const isHovered = hovered === id && !isActive;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding:      "0 var(--spacing-4)",
                height:       40,
                marginRight:  "var(--spacing-24)",
                background:   "none",
                border:       "none",
                borderBottom: isActive
                  ? "2px solid var(--color-text-strong)"
                  : "2px solid transparent",
                cursor:       "pointer",
                fontFamily:   "var(--font-family-body)",
                fontSize:     "var(--font-size-tiny)",
                fontWeight:   isActive
                  ? ("var(--font-weight-medium)" as React.CSSProperties["fontWeight"])
                  : ("var(--font-weight-regular)" as React.CSSProperties["fontWeight"]),
                lineHeight:   "var(--line-height-tiny)",
                color:        isActive || isHovered ? "var(--color-text-strong)" : "var(--color-text-weak)",
                transition:   "color 0.15s, border-color 0.15s",
                marginBottom: -1,
                whiteSpace:   "nowrap",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
