"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useNotificationFeed, type NotificationFeedItem, type NotificationFeedCategory } from "@/components/hooks/useNotificationFeed";
import { relativeTime } from "../../lib/dates";

type FilterTab = "All" | NotificationFeedCategory;

// Dropdown is a fixed 360px wide, so it keeps only the original 4 tabs
// (adding "Residents"/"Data & Sync" here would cram 6 across that width).
// Both new categories still show up under "All" here; the full /notifications
// page (more horizontal room) has a tab for every category.
const TABS: { key: FilterTab; label: string }[] = [
  { key: "All",          label: "All" },
  { key: "bookings",     label: "Bookings" },
  { key: "subscription", label: "Subscription" },
  { key: "access",       label: "Staff & Admin" },
];

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<FilterTab>("All");
  const { items, unreadCount, isLoading, acknowledge } = useNotificationFeed();

  const filtered = tab === "All" ? items : items.filter((i) => i.category === tab);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-notification-dropdown]")) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Acknowledging a real alert permanently changes real backend state, so it
  // fires on click (an explicit action) rather than hover — hovering
  // shouldn't silently mutate real state. Synthetic items only ever touch
  // localStorage, but click is used for both so the interaction is uniform.
  const handleClick = (item: NotificationFeedItem) => { void acknowledge(item); };

  return (
    <div
      data-notification-dropdown
      style={{
        // Fixed (viewport-relative) rather than absolute (trigger-relative):
        // the bell icon sits in the middle of the header, not at its true
        // right edge (account menu + help icon come after it), so anchoring
        // `right: 0` to the trigger's own position pushed a fixed 360px-wide
        // panel left off-screen on mobile. Anchoring to the viewport's right
        // edge instead guarantees it never overflows either side.
        position: "fixed", top: 64, right: 16, width: 360,
        maxWidth: "calc(100vw - 32px)",
        background: "var(--color-fill-white)", borderRadius: 12,
        border: "1px solid var(--color-stroke-medium)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 200, overflow: "hidden",
      }}
    >
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-stroke-medium)" }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: "14px 0", background: "none", border: "none",
              borderBottom: tab === key ? "2px solid var(--color-text-strong)" : "2px solid transparent",
              cursor: "pointer", fontSize: 13, fontWeight: tab === key ? 500 : 400,
              color: tab === key ? "var(--color-text-strong)" : "var(--color-text-weak)",
              fontFamily: "var(--font-family-body)", marginBottom: -1, transition: "color 0.15s",
            }}
          >
            {key === "All" ? `All (${unreadCount})` : label}
          </button>
        ))}
      </div>

      {/* Items */}
      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {isLoading ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-weaker)", fontSize: 14 }}>
            Loading…
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((item, i) => (
            <div
              key={item.id}
              onClick={() => handleClick(item)}
              style={{
                display: "flex", gap: 12, padding: "16px",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--color-stroke-weak)" : "none",
                background: !item.acknowledged ? "var(--color-gray-5)" : "var(--color-fill-white)",
                cursor: "pointer", transition: "background 0.15s",
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-fill-strong)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-white)", lineHeight: 1 }}>{item.initials}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-strong)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                  {!item.acknowledged && (
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-fill-error)", flexShrink: 0 }} />
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-weak)", lineHeight: "18px", marginBottom: 6 }}>{item.message}</p>
                <span style={{ fontSize: 12, color: "var(--color-text-weaker)" }}>{relativeTime(item.timestamp)}</span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-weaker)", fontSize: 14 }}>
            No notifications
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--color-stroke-medium)", padding: "12px 16px", textAlign: "center" }}>
        <Link
          href="/notifications"
          style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", textDecoration: "none", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"] }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}
