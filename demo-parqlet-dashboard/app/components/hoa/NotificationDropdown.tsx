"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "../hooks";

type NotifTab = "all" | "bookings" | "subscription";

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const [tab, setTab] = useState<NotifTab>("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const { notifications, loading } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.acknowledged).length - readIds.size;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-notification-dropdown]")) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

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
        position: "fixed",
        top: 64,
        right: 16,
        width: 360,
        maxWidth: "calc(100vw - 32px)",
        background: "var(--color-fill-white)",
        borderRadius: 12,
        border: "1px solid var(--color-stroke-medium)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
        zIndex: 200,
        overflow: "hidden",
      }}
    >
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--color-stroke-medium)",
        }}
      >
        {([
          { key: "all",          label: `All (${unreadCount})` },
          { key: "bookings",     label: "Bookings" },
          { key: "subscription", label: "Subscription" },
        ] as { key: NotifTab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1,
              padding: "14px 0",
              background: "none",
              border: "none",
              borderBottom: tab === key ? "2px solid var(--color-text-strong)" : "2px solid transparent",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: tab === key ? 500 : 400,
              color: tab === key ? "var(--color-text-strong)" : "var(--color-text-weak)",
              fontFamily: "var(--font-family-body)",
              marginBottom: -1,
              transition: "color 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items */}
      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--color-text-weaker)", fontSize: 14 }}>
            Loading…
          </div>
        ) : (() => {
          const typeMap: Record<NotifTab, string[]> = {
            all: [],
            bookings: ["New Booking", "Booking Cancelled", "Sync Failure"],
            subscription: ["Subscription Overdue", "Renewal Reminder", "New Registration"],
          };
          const filtered = tab === "all"
            ? notifications
            : notifications.filter((n) => typeMap[tab].some(t => n.type.includes(t) || n.type.includes("Registration")));
          return filtered.length > 0 ? filtered.map((n, i) => (
            <div
              key={n.id}
              onMouseEnter={() => { if (!n.acknowledged) setReadIds((prev) => new Set(prev).add(n.id)); }}
              style={{
                display: "flex",
                gap: 12,
                padding: "16px",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--color-stroke-weak)" : "none",
                background: !n.acknowledged && !readIds.has(n.id) ? "var(--color-gray-5)" : "var(--color-fill-white)",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "var(--color-fill-strong)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-white)", lineHeight: 1 }}>
                  {(n.buildingName ?? "?").split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("")}
                </span>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-strong)" }}>{n.type}</span>
                  {!n.acknowledged && !readIds.has(n.id) && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "var(--color-fill-error)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-weak)", lineHeight: "18px", marginBottom: 6 }}>
                  {n.description}
                </p>
                <span style={{ fontSize: 12, color: "var(--color-text-weaker)" }}>
                  {new Date(n.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          )) : (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-weaker)", fontSize: 14 }}>
              No notifications
            </div>
          );
        })()}
      </div>

      {/* Footer link */}
      <div style={{ borderTop: "1px solid var(--color-stroke-medium)", padding: "12px 16px", textAlign: "center" }}>
        <a
          href="/notifications"
          style={{
            fontSize:       "var(--font-size-tiny)",
            color:          "var(--color-text-strong)",
            textDecoration: "none",
            fontFamily:     "var(--font-family-body)",
            fontWeight:     "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
          }}
          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
        >
          View all notifications
        </a>
      </div>
    </div>
  );
}