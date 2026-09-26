"use client";

import { useState, useRef, useEffect } from "react";
import { colors } from "../ui/chart-utils";

type Period = "This month" | "Last month" | "All time";

interface PeriodSelectorProps {
  value: Period;
  onChange: (p: Period) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display:      "flex",
          alignItems:   "center",
          gap:          "var(--spacing-8)",
          background:   "var(--color-fill-white)",
          border:       "1px solid var(--color-stroke-medium)",
          borderRadius: "var(--radius-8)",
          padding:      "var(--spacing-8) 10px",
          fontSize:     "var(--font-size-tiny)",
          lineHeight:   "var(--line-height-tiny)",
          color:        "var(--color-text-weak)",
          fontFamily:   "var(--font-family-body)",
          fontWeight:   "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          cursor:       "pointer",
          whiteSpace:   "nowrap" as const,
        }}
      >
        {value}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.5 }}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          style={{
            position:   "absolute",
            top:        "calc(100% + 4px)",
            right:      0,
            background: colors.white,
            border:     `1px solid ${colors.border}`,
            borderRadius: 8,
            boxShadow:  "0 4px 16px rgba(0,0,0,0.10)",
            zIndex:     50,
            minWidth:   120,
            overflow:   "hidden",
          }}
        >
          {(["This month", "Last month", "All time"] as Period[]).map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                display:    "block",
                width:      "100%",
                padding:    "9px 14px",
                textAlign:  "left",
                fontSize:   13,
                fontFamily: "var(--font-family-body)",
                color:      opt === value ? colors.textStrong : colors.textWeak,
                fontWeight: opt === value ? 500 : 400,
                background: opt === value ? colors.tagBg : "transparent",
                border:     "none",
                cursor:     "pointer",
                transition: "background 0.12s ease",
              }}
              onMouseEnter={(e) => { if (opt !== value) (e.currentTarget as HTMLElement).style.background = colors.tagBg; }}
              onMouseLeave={(e) => { if (opt !== value) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const RANK_STYLE: React.CSSProperties = {
  width:          24,
  height:         24,
  display:        "flex",
  alignItems:     "center",
  justifyContent: "center",
  flexShrink:     0,
  fontSize:       "var(--font-size-tiny)",
  fontWeight:     "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
  lineHeight:     "var(--line-height-tiny)",
  fontFamily:     "var(--font-family-body)",
  color:          colors.textWeak,
  background:     "transparent",
};