"use client";

import { useState } from "react";
import { useNotificationFeed, type NotificationFeedItem, type NotificationFeedCategory } from "@/components/hooks/useNotificationFeed";
import { relativeTime } from "@/lib/dates";

import "../../tokens.css";

// ─── Icons ───────────────────────────────────────────────────────────────────

function IcCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 8L6.5 12L13.5 4" stroke="var(--color-text-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcRetry() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7a4.5 4.5 0 1 0 1.05-2.87" stroke="var(--color-text-strong)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M2.5 2.5V5h2.5" stroke="var(--color-text-strong)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type FilterTab = "All" | NotificationFeedCategory;

const TABS: { key: FilterTab; label: string }[] = [
  { key: "All",          label: "All" },
  { key: "bookings",     label: "Bookings" },
  { key: "residents",    label: "Resident Management" },
  { key: "access",       label: "Staff & Admin" },
  { key: "sync",         label: "Data & Sync" },
  { key: "subscription", label: "Subscription" },
  { key: "tickets",      label: "Tickets" },
];

// ─── Notification Row ─────────────────────────────────────────────────────────

function NotificationRow({ item, onRead }: { item: NotificationFeedItem; onRead: (item: NotificationFeedItem) => void }) {
  const unread = !item.acknowledged;

  return (
    <div
      onClick={() => { if (unread) onRead(item); }}
      style={{
        display: "flex", alignItems: "flex-start", gap: 16,
        padding: "16px 24px",
        borderBottom: "1px solid var(--color-stroke-medium)",
        background: unread ? "var(--color-gray-5)" : "var(--color-fill-white)",
        cursor: unread ? "pointer" : "default",
        transition: "background 0.15s",
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-fill-strong)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-white)", lineHeight: 1 }}>{item.initials}</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 13, fontWeight: 500, color: "var(--color-text-strong)",
            flex: "1 1 auto", minWidth: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {item.name}
          </span>
          <span style={{ fontSize: 12, color: "var(--color-text-weaker)", flexShrink: 0, whiteSpace: "nowrap" }}>{relativeTime(item.timestamp)}</span>
          {unread && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-fill-error)", flexShrink: 0 }} />}
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--color-text-weak)", lineHeight: "18px" }}>{item.message}</p>
      </div>
    </div>
  );
}

// ─── Skeleton Row ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "16px 24px",
        borderBottom: "1px solid var(--color-stroke-medium)",
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: "var(--color-fill-weak)" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{ height: 13, width: 120, maxWidth: "40%", background: "var(--color-fill-weak)", borderRadius: 4 }} />
          <div style={{ height: 12, width: 48, flexShrink: 0, background: "var(--color-fill-weak)", borderRadius: 4 }} />
        </div>
        <div style={{ height: 11, width: "60%", background: "var(--color-fill-weak)", borderRadius: 4 }} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [tab, setTab] = useState<FilterTab>("All");
  const { items, unreadCount, isLoading, isError, refetch, acknowledge, acknowledgeAll } = useNotificationFeed();

  const filtered = tab === "All" ? items : items.filter((i) => i.category === tab);

  return (
    <>
    <div style={{ fontFamily: "var(--font-family-body)" }}>

        {/* Page header */}
        <div
          style={{
            background: "var(--color-fill-white)",
            borderBottom: "1px solid var(--color-stroke-medium)",
            padding: "24px 32px 0",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: "var(--font-size-heading-1)", lineHeight: "var(--line-height-heading-1)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], fontFamily: "var(--font-family-heading)", color: "var(--color-text-strong)" }}>Updates</h1>
              <p style={{ margin: "var(--spacing-8) 0 0", fontSize: 16, color: "var(--color-text-weak)", lineHeight: "20px" }}>
                Keep track of all activity and notifications for your community.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => acknowledgeAll()}
                style={{
                  display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                  background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)",
                  borderRadius: 8, padding: "8px 14px",
                  fontSize: 13, fontWeight: 500,
                  color: "var(--color-text-strong)",
                  cursor: "pointer",
                  fontFamily: "var(--font-family-body)",
                  whiteSpace: "nowrap",
                }}
              >
                <IcCheck />
                Mark all as read
              </button>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", flexWrap: "wrap", rowGap: 8, gap: 24 }}>
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  padding: "0 0 12px", background: "none", border: "none",
                  borderBottom: tab === key ? "2px solid var(--color-text-strong)" : "2px solid transparent",
                  cursor: "pointer", fontSize: 14, fontWeight: tab === key ? 500 : 400,
                  color: tab === key ? "var(--color-text-strong)" : "var(--color-text-weak)",
                  fontFamily: "var(--font-family-body)", marginBottom: -1, transition: "color 0.15s",
                }}
              >
                {key === "All" ? `All (${unreadCount})` : label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ padding: "24px 32px" }}>
          <div
            style={{
              background: "var(--color-fill-white)",
              borderRadius: 12,
              border: "1px solid var(--color-stroke-medium)",
              overflow: "hidden",
            }}
          >
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : isError ? (
              <div style={{ padding: "48px 24px", textAlign: "left" }}>
                <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--color-text-weak)" }}>
                  Failed to load notifications.
                </p>
                <button
                  onClick={() => refetch()}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "var(--color-fill-strong)", border: "none",
                    borderRadius: 8, padding: "8px 16px",
                    fontSize: 13, fontWeight: 500,
                    color: "var(--color-text-white)", cursor: "pointer", fontFamily: "var(--font-family-body)",
                  }}
                >
                  <IcRetry />
                  Retry
                </button>
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((item) => (
                <NotificationRow key={item.id} item={item} onRead={(i) => acknowledge(i)} />
              ))
            ) : (
              <div style={{ padding: "64px 24px", textAlign: "left", color: "var(--color-text-weaker)", fontSize: 14 }}>
                No notifications yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
