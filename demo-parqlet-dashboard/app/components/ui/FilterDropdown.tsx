"use client";
import { useState, useRef } from "react";
import { FloatingMenu } from "./FloatingMenu";

// ─── Icons (inline, scoped to this module) ───────────────────────────────────

function IcChevronDown({ color = "var(--color-icon-weak)" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcCross({ color = "var(--color-icon-weak)" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M7 7l10 10M17 7L7 17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IcSmallCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 8L6.5 12L13.5 4" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export type FilterOption = string | { label: string; value: string };

export interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (v: string) => void;
}

// Most callers pass plain strings (the displayed text IS the filter value —
// "All", "Newest first", etc). Status filters need the two to differ (the
// dropdown should read "Awaiting confirmation", not the raw "PendingApproval"
// enum value sent to the API), so a caller can pass `{label, value}` instead.
function normalize(opt: FilterOption): { label: string; value: string } {
  return typeof opt === "string" ? { label: opt, value: opt } : opt;
}

export function FilterDropdown({ label, options, value, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const normalized = options.map(normalize);
  const defaultValue = normalized[0]?.value;
  const isActive = value !== defaultValue;
  const activeLabel = normalized.find((o) => o.value === value)?.label ?? value;

  return (
    <div>
      {/* Trigger button */}
      <div
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: "var(--spacing-8)",
          background: isActive ? "var(--color-gray-30)" : "var(--color-fill-white)",
          border: "1px solid var(--color-stroke-medium)",
          borderRadius: "var(--radius-12)", padding: "var(--spacing-8) 10px",
          cursor: "pointer", userSelect: "none",
        }}
      >
        <span style={{
          fontSize: "var(--font-size-tiny)",
          color: "var(--color-text-weak)",
          fontFamily: "var(--font-family-body)",
          lineHeight: "var(--line-height-tiny)",
          fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          whiteSpace: "nowrap",
        }}>
          {isActive ? activeLabel : label}
        </span>
        {isActive ? (
          <span
            onClick={(e) => { e.stopPropagation(); onChange(defaultValue); setOpen(false); }}
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          >
            <IcCross />
          </span>
        ) : (
          <IcChevronDown />
        )}
      </div>

      {/* Dropdown panel — portaled via FloatingMenu so it escapes the
          dashboard shell's ancestor `overflow: hidden` and clamps within
          the viewport horizontally (mobile toolbar buttons sit close to
          the left edge, so a naive right-anchored panel can render
          partly off-screen under the sidebar). */}
      {open && (
        <FloatingMenu anchorRef={triggerRef} onClose={() => setOpen(false)} align="end">
          <div style={{
            background: "var(--color-fill-white)",
            border: "1px solid var(--color-stroke-medium)",
            borderRadius: "var(--radius-8)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            overflow: "hidden",
            minWidth: 160,
          }}>
            {normalized.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "10px var(--spacing-12)",
                  background: "none", border: "none",
                  cursor: "pointer",
                  fontSize: "var(--font-size-tiny)",
                  color: "var(--color-text-strong)",
                  fontFamily: "var(--font-family-body)",
                  fontWeight: (opt.value === value ? "var(--font-weight-medium)" : "var(--font-weight-regular)") as React.CSSProperties["fontWeight"],
                  lineHeight: "var(--line-height-tiny)",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gray-5)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
              >
                {opt.label}
                {opt.value === value && <IcSmallCheck />}
              </button>
            ))}
          </div>
        </FloatingMenu>
      )}
    </div>
  );
}