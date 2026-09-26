"use client";

import React from "react";
import { useWindowWidth } from "../hooks/useWindowSize";

export interface PaginationProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;  // pages around current (default 1)
  showFirstLast?: boolean; // << and >> buttons (default true)
  itemLabel?: string;     // singular label for "X items" text (default "items")
  pageSizeOptions?: number[]; // rows-per-page options; if omitted, selector is hidden
  onPageSizeChange?: (size: number) => void;
}

export function getPaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1
): (number | "...")[] {
  const minPage = 1;
  const maxPage = totalPages;

  // Standard pagination numbers algorithm
  // Shows: [first] [siblings before] [ellipsis?] [current range] [ellipsis?] [siblings after] [last]
  const totalPageNumbers = siblingCount * 2 + 5; // first, last, current, 2*siblings, 2 ellipsis

  if (totalPages <= totalPageNumbers) {
    return Array.from({ length: maxPage }, (_, i) => minPage + i);
  }

  const leftSiblingIndex  = Math.max(currentPage - siblingCount, minPage);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, maxPage);

  const showLeftEllipsis  = leftSiblingIndex  > minPage + 2;
  const showRightEllipsis = rightSiblingIndex < maxPage - 1;

  if (!showLeftEllipsis && !showRightEllipsis) {
    return Array.from({ length: totalPages }, (_, i) => minPage + i);
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = Array.from(
      { length: maxPage - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [minPage, "...", ...rightRange];
  }

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = Array.from(
      { length: rightSiblingIndex - minPage + 1 },
      (_, i) => minPage + i
    );
    return [...leftRange, "...", maxPage];
  }

  // Both ellipses
  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i
  );
  return [minPage, "...", ...middleRange, "...", maxPage];
}

// ─── Icons ────────────────────────────────────────────────────────────────────

export function IcChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 12L6 8l4-4" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IcChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 12l4-4-4-4" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── PageBtn ────────────────────────────────────────────────────────────────────

export function PageBtn({
  children, active, disabled, onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 32, height: 32, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: active ? "var(--color-fill-strong)" : "var(--color-fill-white)",
        border: "1px solid var(--color-stroke-medium)",
        borderRadius: "var(--radius-8)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontFamily: "var(--font-family-body)",
        fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
        fontSize: "var(--font-size-extra-tiny)",
        color: active ? "var(--color-text-white)" : "var(--color-text-weak)",
      }}
    >
      {children}
    </button>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function Pagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  itemLabel = "items",
  pageSizeOptions,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pageStart  = (currentPage - 1) * pageSize;
  const range      = getPaginationRange(currentPage, totalPages, siblingCount);
  const width = useWindowWidth();
  const isMobile = width < 640;

  function goTo(p: number) {
    onPageChange(Math.max(1, Math.min(p, totalPages)));
  }

  const hasEllipsis = range.includes("...");
  const showFirst  = showFirstLast && hasEllipsis;
  const showLast   = showFirstLast && hasEllipsis;

  return (
    <div style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "stretch" : "center",
      justifyContent: "space-between",
      gap: isMobile ? "var(--spacing-12)" : 0,
      padding: isMobile ? "var(--spacing-12) var(--spacing-16)" : "0 var(--spacing-24)",
      minHeight: 57, flexShrink: 0,
      borderTop: "1px solid var(--color-stroke-medium)",
      background: "var(--color-fill-white)",
    }}>
      {/* "Showing X–Y of Z items" */}
      <span style={{
        fontSize: "var(--font-size-extra-tiny)",
        color: "var(--color-text-weak)",
        lineHeight: "var(--line-height-extra-tiny)",
        fontFamily: "var(--font-family-body)",
        fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
        textAlign: isMobile ? "center" : "left",
      }}>
        Showing {totalItems === 0 ? 0 : pageStart + 1} to {Math.min(pageStart + pageSize, totalItems)} of {totalItems} {itemLabel}
      </span>

      {/* Right side: page size selector + page buttons */}
      <div style={{
        display: "flex", alignItems: "center", gap: "var(--spacing-12)",
        flexWrap: isMobile ? "wrap" : "nowrap",
        justifyContent: isMobile ? "center" : "flex-end",
      }}>
        {pageSizeOptions && onPageSizeChange && (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)" }}>
            <span style={{
              fontSize: "var(--font-size-extra-tiny)",
              color: "var(--color-text-weak)",
              fontFamily: "var(--font-family-body)",
              whiteSpace: "nowrap",
            }}>
              Rows per page
            </span>
            <select
              value={pageSize}
              onChange={(e) => { onPageSizeChange(Number(e.target.value)); }}
              style={{
                height: 28, padding: "0 var(--spacing-8)",
                border: "1px solid var(--color-stroke-medium)",
                borderRadius: "var(--radius-8)",
                fontSize: "var(--font-size-extra-tiny)",
                fontFamily: "var(--font-family-body)",
                color: "var(--color-text-strong)",
                background: "var(--color-fill-white)",
                cursor: "pointer", outline: "none",
                appearance: "none" as React.CSSProperties["appearance"],
                WebkitAppearance: "none",
              }}
            >
              {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-4)" }}>
          {showFirst && (
            <PageBtn onClick={() => goTo(1)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l4-4m-4 4l4 4" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 8l4-4m-4 4l4 4" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </PageBtn>
          )}

          <PageBtn onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1}>
            <IcChevronLeft />
          </PageBtn>

          {range.map((p, i) =>
            p === "..." ? (
              <span
                key={`ellipsis-${i}`}
                style={{
                  width: 32, height: 32, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "var(--font-size-extra-tiny)",
                  color: "var(--color-text-weak)",
                  fontFamily: "var(--font-family-body)",
                }}
              >
                …
              </span>
            ) : (
              <PageBtn
                key={p}
                active={p === currentPage}
                onClick={() => goTo(p as number)}
              >
                {p}
              </PageBtn>
            )
          )}

          <PageBtn onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages}>
            <IcChevronRight />
          </PageBtn>

          {showLast && (
            <PageBtn onClick={() => goTo(totalPages)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 8l-4-4m4 4l-4 4" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 8l-4-4m4 4l-4 4" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </PageBtn>
          )}
        </div>
      </div>
    </div>
  );
}
