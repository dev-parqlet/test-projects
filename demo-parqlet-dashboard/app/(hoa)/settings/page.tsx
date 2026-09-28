"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAutoInvite } from "../../components/auto-invite-context";
import { useBuildingFilter } from "../../components/context/building-filter-context";
import {
  buildingKeys,
  getBuildingSettings,
  updateBuildingSettings,
  type BuildingSettings,
} from "../../lib/api/buildings";
import { preferencesApi, type UserPreferences } from "../../lib/api/preferences";
import { TableScroll } from "../../components/ui/TableScroll";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import { CREDIT_PRICE_CENTS, formatMoney, netToBuilding } from "../../lib/demo/pricing";
import { productFromPath } from "../../lib/demo/product-path";
import "../../tokens.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "notifications" | "profile" | "security" | "resident-mgmt" | "sms-settings" | "credit-price";

interface NotifRow {
  id:    string;
  name:  string;
  desc:  string;
  email: boolean;
  web:   boolean;
}

interface NotifBucket {
  id:    string;
  title: string;
  Icon:  () => React.ReactElement;
  rows:  NotifRow[];
}

interface Session {
  id:         string;
  device:    string;
  browser:   string;
  location:  string;
  lastActive: string;
  current:    boolean;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IcPeople() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="9"  cy="8"  r="3.25" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
      <circle cx="17" cy="8"  r="2.25" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
      <path d="M2 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 11c2.21 0 4 1.79 4 4" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IcShieldTick() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3L4 6.5V12c0 4.418 3.582 8 8 9 4.418-1 8-4.582 8-9V6.5L12 3z" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcCalendarCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="16" rx="2" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
      <line x1="8"  y1="3"  x2="8"  y2="7"  stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="3"  x2="16" y2="7"  stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5"  y1="11" x2="19" y2="11" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
      <path d="M8.5 16l2 2 5-5" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcSync() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 12a8 8 0 018-8 8 8 0 016.928 4" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 12a8 8 0 01-8 8 8 8 0 01-6.928-4" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
      <polyline points="19 4 20 8 16 8" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="5 20 4 16 8 16" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcTicket() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4V8z" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="14" y1="7" x2="14" y2="17" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeDasharray="2 2" />
    </svg>
  );
}

function IcLock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
      <path d="M8 11V7a4 4 0 018 0v4" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1" fill="var(--color-icon-weak)" />
    </svg>
  );
}

function IcMonitor() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="3" width="20" height="14" rx="2" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
      <line x1="8" y1="21" x2="16" y2="21" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IcGlobe() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
      <path d="M12 3c-2 3-3 5.5-3 9s1 6 3 9M12 3c2 3 3 5.5 3 9s-1 6-3 9" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
      <line x1="3" y1="12" x2="21" y2="12" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
    </svg>
  );
}

function IcClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
      <path d="M12 7v5l3 3" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      style={{
        position:        "relative",
        display:         "inline-flex",
        alignItems:      "center",
        width:           40,
        height:          22,
        borderRadius:    99,
        border:          "none",
        cursor:          "pointer",
        padding:         0,
        flexShrink:      0,
        backgroundColor: on ? "var(--color-fill-accent)" : "var(--color-gray-30)",
        transition:      "background-color 0.18s ease",
      }}
    >
      <span
        style={{
          position:        "absolute",
          left:            on ? 21 : 3,
          width:           16,
          height:          16,
          borderRadius:    "50%",
          backgroundColor: "var(--color-fill-white)",
          boxShadow:       "0 1px 3px rgba(0,0,0,0.22)",
          transition:      "left 0.18s ease",
        }}
      />
    </button>
  );
}

// ─── Notification data ────────────────────────────────────────────────────────

function buildInitialBuckets(saved?: UserPreferences | null): NotifBucket[] {
  const np = saved?.notificationPreferences ?? {};
  const def = (id: string, emailDefault: boolean, webDefault: boolean) => {
    const p = np[id];
    return { email: p?.email ?? emailDefault, web: p?.web ?? webDefault };
  };

  return [
    {
      id:    "resident",
      title: "Resident Management",
      Icon:  IcPeople,
      rows: [
        { id: "res-invite",   name: "Resident invite accepted",   desc: "Be notified when a resident accepts their invitation and joins the platform.", ...def("res-invite",   true, false) },
        { id: "res-updated",  name: "Resident profile updated",   desc: "Be notified when a resident updates their unit or parking spot details.",      ...def("res-updated",  true, false) },
        { id: "res-removed",  name: "Resident removed",           desc: "Be notified when a resident is removed from the building.",                     ...def("res-removed",  true, false) },
      ],
    },
    {
      id:    "staff",
      title: "Staff & Admin",
      Icon:  IcShieldTick,
      rows: [
        { id: "staff-invite", name: "Staff invite accepted",      desc: "Be notified when a staff or admin invitation is accepted.",                     ...def("staff-invite", false, false) },
        { id: "new-admin",    name: "New admin added",            desc: "Be notified when a new HOA admin account is created.",                          ...def("new-admin",    false, false) },
      ],
    },
    {
      id:    "bookings",
      title: "Bookings",
      Icon:  IcCalendarCheck,
      rows: [
        { id: "book-new",     name: "New booking made",           desc: "Be notified when a resident makes a new guest parking booking.",                ...def("book-new",     true, false) },
        { id: "book-cancel",  name: "Booking cancelled",          desc: "Be notified when a resident cancels a booking.",                                ...def("book-cancel",  true, false) },
        { id: "book-issue",   name: "Issue reported",             desc: "Be notified when a resident reports a parking issue on an active booking.",     ...def("book-issue",   true, false) },
      ],
    },
    {
      id:    "sync",
      title: "Data & Sync",
      Icon:  IcSync,
      rows: [
        { id: "sync-ok",      name: "Resident data sync completed", desc: "Be notified when an automatic or manual data sync finishes, including a summary of changes.", ...def("sync-ok",      false, false) },
        { id: "sync-error",   name: "Sync error",                 desc: "Be notified if a data sync fails and requires attention.",                      ...def("sync-error",   false, false) },
      ],
    },
    {
      id:    "tickets",
      title: "Tickets",
      Icon:  IcTicket,
      rows: [
        { id: "ticket-reply", name: "Ticket reply",               desc: "Be notified when a ticket gets a new reply, whether it comes in over email or from another admin.", ...def("ticket-reply", true, false) },
      ],
    },
  ];
}

// ─── Active sessions data ─────────────────────────────────────────────────────

const SESSIONS: Session[] = [
  { id: "s1", device: "MacBook Pro",       browser: "Chrome 124",       location: "Austin, TX",       lastActive: "Active now",      current: true  },
  { id: "s2", device: "iPhone 15 Pro",     browser: "Safari 17",        location: "Austin, TX",       lastActive: "2 hours ago",     current: false },
  { id: "s3", device: "iPad Air",          browser: "Safari 17",        location: "Austin, TX",       lastActive: "Yesterday",       current: false },
  { id: "s4", device: "Windows Desktop",   browser: "Edge 123",         location: "San Antonio, TX",  lastActive: "3 days ago",      current: false },
];

// ─── Section card wrapper ─────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background:   "var(--color-fill-white)",
      border:       "1px solid var(--color-stroke-medium)",
      borderRadius: "var(--radius-12)",
      overflow:     "hidden",
    }}>
      {children}
    </div>
  );
}

// ─── Notifications tab ────────────────────────────────────────────────────────

function NotificationsTab({ savedPreferences, onSave }: {
  savedPreferences: UserPreferences | null;
  onSave: (updates: Partial<UserPreferences>) => void;
}) {
  const [buckets, setBuckets] = useState<NotifBucket[]>(() => buildInitialBuckets(savedPreferences));

  function toggle(bucketId: string, rowId: string, field: "email" | "web") {
    setBuckets((prev) => {
      const next = prev.map((b) =>
        b.id !== bucketId ? b : {
          ...b,
          rows: b.rows.map((r) =>
            r.id !== rowId ? r : { ...r, [field]: !r[field] }
          ),
        }
      );
      // Auto-save notification preferences
      const notifPrefs: Record<string, { email: boolean; web: boolean }> = {};
      for (const b of next) {
        for (const r of b.rows) {
          notifPrefs[r.id] = { email: r.email, web: r.web };
        }
      }
      onSave({ notificationPreferences: notifPrefs });
      return next;
    });
  }

  const COL_HEADER: React.CSSProperties = {
    width:      72,
    flexShrink: 0,
    textAlign:  "center",
    fontSize:   "var(--font-size-extra-tiny)",
    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
    lineHeight: "var(--line-height-extra-tiny)",
    color:      "var(--color-text-weak)",
    fontFamily: "var(--font-family-body)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-20)" }}>

      {buckets.map((bucket) => (
        <Card key={bucket.id}>
          {/* Card header */}
          <div style={{
            display:    "flex",
            alignItems: "center",
            gap:        "var(--spacing-8)",
            padding:    "var(--spacing-16) var(--spacing-20)",
          }}>
            <bucket.Icon />
            <span style={{
              flex:         1,
              minWidth:     0,
              whiteSpace:   "nowrap",
              overflow:     "hidden",
              textOverflow: "ellipsis",
              fontSize:   "var(--font-size-tiny)",
              fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              lineHeight: "var(--line-height-tiny)",
              color:      "var(--color-text-strong)",
              fontFamily: "var(--font-family-body)",
            }}>
              {bucket.title}
            </span>
            <div style={{ display: "flex", gap: 0, flexShrink: 0 }}>
              <div style={COL_HEADER}>Email</div>
              <div style={COL_HEADER}>Web</div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "var(--color-stroke-medium)" }} />

          {/* Rows */}
          {bucket.rows.map((row, i) => (
            <div key={row.id}>
              <div style={{
                display:     "flex",
                alignItems:  "center",
                padding:     "var(--spacing-16) var(--spacing-20)",
                gap:         "var(--spacing-16)",
              }}>
                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin:     0,
                    fontSize:   "var(--font-size-tiny)",
                    fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                    lineHeight: "var(--line-height-tiny)",
                    color:      "var(--color-text-strong)",
                    fontFamily: "var(--font-family-body)",
                    marginBottom: 2,
                  }}>
                    {row.name}
                  </p>
                  <p style={{
                    margin:     0,
                    fontSize:   "var(--font-size-extra-tiny)",
                    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                    lineHeight: "var(--line-height-extra-tiny)",
                    color:      "var(--color-text-weak)",
                    fontFamily: "var(--font-family-body)",
                  }}>
                    {row.desc}
                  </p>
                </div>

                {/* Toggles */}
                <div style={{ display: "flex", gap: 0 }}>
                  <div style={{ width: 72, display: "flex", justifyContent: "center" }}>
                    <Toggle on={row.email} onChange={() => toggle(bucket.id, row.id, "email")} />
                  </div>
                  <div style={{ width: 72, display: "flex", justifyContent: "center" }}>
                    <Toggle on={row.web}   onChange={() => toggle(bucket.id, row.id, "web")}   />
                  </div>
                </div>
              </div>
              {i < bucket.rows.length - 1 && (
                <div style={{ height: 1, background: "var(--color-stroke-weak)", margin: "0 var(--spacing-20)" }} />
              )}
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

// ─── Profile Preferences tab ──────────────────────────────────────────────────

function SelectField({ label, Icon, options, value, onChange }: {
  label:    string;
  Icon:     () => React.ReactElement;
  options:  string[];
  value:    string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
      <label style={{
        display:    "flex",
        alignItems: "center",
        gap:        "var(--spacing-8)",
        fontSize:   "var(--font-size-tiny)",
        fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
        lineHeight: "var(--line-height-tiny)",
        color:      "var(--color-text-strong)",
        fontFamily: "var(--font-family-body)",
      }}>
        <Icon />
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:        "100%",
            height:       40,
            padding:      "0 var(--spacing-40) 0 var(--spacing-12)",
            appearance:   "none",
            WebkitAppearance: "none",
            border:       `1px solid ${focused ? "var(--color-stroke-strong)" : "var(--color-stroke-medium)"}`,
            borderRadius: "var(--radius-8)",
            background:   "var(--color-fill-white)",
            fontSize:     "var(--font-size-tiny)",
            lineHeight:   "var(--line-height-tiny)",
            fontWeight:   "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            fontFamily:   "var(--font-family-body)",
            color:        "var(--color-text-strong)",
            cursor:       "pointer",
            outline:      "none",
            boxSizing:    "border-box" as React.CSSProperties["boxSizing"],
            transition:   "border-color 0.12s",
          }}
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <div style={{
          position:      "absolute",
          right:         12,
          top:           "50%",
          transform:     "translateY(-50%)",
          pointerEvents: "none",
        }}>
          <IcChevronDown />
        </div>
      </div>
    </div>
  );
}

function RadioGroup({ label, options, value, onChange }: {
  label:    string;
  options:  { value: string; label: string; sub: string }[];
  value:    string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)" }}>
      <span style={{
        display:    "flex",
        alignItems: "center",
        gap:        "var(--spacing-8)",
        fontSize:   "var(--font-size-tiny)",
        fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
        lineHeight: "var(--line-height-tiny)",
        color:      "var(--color-text-strong)",
        fontFamily: "var(--font-family-body)",
      }}>
        <IcClock />
        {label}
      </span>
      <div style={{ display: "flex", gap: "var(--spacing-12)" }}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                flex:         1,
                display:      "flex",
                flexDirection: "column",
                alignItems:   "flex-start",
                gap:          "var(--spacing-4)",
                padding:      "var(--spacing-16)",
                background:   active ? "var(--color-accent-50)" : "var(--color-fill-white)",
                border:       `1.5px solid ${active ? "var(--color-fill-accent)" : "var(--color-stroke-medium)"}`,
                borderRadius: "var(--radius-8)",
                cursor:       "pointer",
                textAlign:    "left",
                transition:   "border-color 0.15s, background 0.15s",
              }}
            >
              <span style={{
                fontSize:   "var(--font-size-tiny)",
                fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                lineHeight: "var(--line-height-tiny)",
                color:      "var(--color-text-strong)",
                fontFamily: "var(--font-family-body)",
              }}>
                {opt.label}
              </span>
              <span style={{
                fontSize:   "var(--font-size-extra-tiny)",
                fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                lineHeight: "var(--line-height-extra-tiny)",
                color:      "var(--color-text-weak)",
                fontFamily: "var(--font-family-body)",
              }}>
                {opt.sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProfilePreferencesTab({ savedPreferences, onSave }: {
  savedPreferences: UserPreferences | null;
  onSave: (updates: Partial<UserPreferences>) => void;
}) {
  const [timeFormat, setTimeFormat] = useState(savedPreferences?.timeFormat ?? "12h");

  function handleSave() {
    onSave({ timeFormat });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-20)", maxWidth: 560 }}>
      <Card>
        <div style={{ padding: "var(--spacing-20)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--spacing-16)", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"] }}>Appearance</div>
            <div style={{ marginTop: 2, fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>Switch between light and dark mode</div>
          </div>
          <ThemeToggle />
        </div>
      </Card>
      <Card>
        <div style={{ padding: "var(--spacing-20)", display: "flex", flexDirection: "column", gap: "var(--spacing-24)" }}>
          <RadioGroup
            label="Date & Time Format"
            value={timeFormat}
            onChange={setTimeFormat}
            options={[
              { value: "12h", label: "12-hour",  sub: "e.g. 2:30 PM" },
              { value: "24h", label: "24-hour",  sub: "e.g. 14:30"   },
            ]}
          />
        </div>
      </Card>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleSave}
          style={{
            height: 40,
            padding: "0 var(--spacing-20)",
            background: "var(--color-button-neutral)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-8)",
            cursor: "pointer",
            fontFamily: "var(--font-family-body)",
            fontSize: "var(--font-size-tiny)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            lineHeight: "var(--line-height-tiny)",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gray-90)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-button-neutral)"; }}
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}

// ─── Security tab ─────────────────────────────────────────────────────────────

function SecurityTab({ savedPreferences, onSave }: {
  savedPreferences: UserPreferences | null;
  onSave: (updates: Partial<UserPreferences>) => void;
}) {
  const [twoFAEnabled, setTwoFAEnabled] = useState(savedPreferences?.twoFactorEnabled ?? false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [signOutAllDone, setSignOutAllDone] = useState(false);

  function toggleTwoFA() {
    const next = !twoFAEnabled;
    setTwoFAEnabled(next);
    onSave({ twoFactorEnabled: next });
  }

  function signOut(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  function signOutAll() {
    setSessions((prev) => prev.filter((s) => s.current));
    setSignOutAllDone(true);
  }

  const isTwoFactorEnabled = false;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-20)", maxWidth: 640 }}>

      {/* 2FA card */}
      <Card>
        {isTwoFactorEnabled && (
          <div style={{
            display:    "flex",
            alignItems: "center",
            gap:        "var(--spacing-8)",
            padding:    "var(--spacing-16) var(--spacing-20)",
          }}>
            <IcLock />
            <span style={{
              fontSize:   "var(--font-size-tiny)",
              fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              lineHeight: "var(--line-height-tiny)",
              color:      "var(--color-text-strong)",
              fontFamily: "var(--font-family-body)",
            }}>
              Two-Factor Authentication
            </span>
          </div>
        )}
        <div style={{ height: 1, background: "var(--color-stroke-medium)" }} />
        <div style={{
          padding:     "var(--spacing-20)",
          display:     "flex",
          alignItems:  "flex-start",
          gap:         "var(--spacing-16)",
        }}>
          <div style={{ flex: 1 }}>
            <p style={{
              margin:     0,
              fontSize:   "var(--font-size-tiny)",
              fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              lineHeight: "var(--line-height-tiny)",
              color:      "var(--color-text-strong)",
              fontFamily: "var(--font-family-body)",
              marginBottom: 4,
            }}>
              Email verification code
            </p>
            <p style={{
              margin:     0,
              fontSize:   "var(--font-size-extra-tiny)",
              fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
              lineHeight: "var(--line-height-extra-tiny)",
              color:      "var(--color-text-weak)",
              fontFamily: "var(--font-family-body)",
            }}>
              {twoFAEnabled
                ? "Two-factor authentication is active. A verification code will be sent to your email each time you sign in."
                : "Require a one-time code sent to your email address each time you sign in."}
            </p>
          </div>
          <Toggle on={twoFAEnabled} onChange={toggleTwoFA} />
        </div>
        {twoFAEnabled && (
          <>
            <div style={{ height: 1, background: "var(--color-stroke-weak)", margin: "0 var(--spacing-20)" }} />
            <div style={{ padding: "var(--spacing-16) var(--spacing-20)" }}>
              <button
                style={{
                  height:       36,
                  padding:      "0 var(--spacing-16)",
                  background:   "var(--color-fill-white)",
                  border:       "1px solid var(--color-stroke-medium)",
                  borderRadius: "var(--radius-8)",
                  cursor:       "pointer",
                  fontFamily:   "var(--font-family-body)",
                  fontSize:     "var(--font-size-tiny)",
                  fontWeight:   "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
                  lineHeight:   "var(--line-height-tiny)",
                  color:        "var(--color-text-strong)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-fill-weak)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-fill-white)"; }}
              >
                Change email address
              </button>
            </div>
          </>
        )}
      </Card>

      {/* Session management card */}
      <Card>
        <div style={{
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "space-between",
          gap:             "var(--spacing-8)",
          padding:         "var(--spacing-16) var(--spacing-20)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)" }}>
            <IcMonitor />
            <span style={{
              fontSize:   "var(--font-size-tiny)",
              fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
              lineHeight: "var(--line-height-tiny)",
              color:      "var(--color-text-strong)",
              fontFamily: "var(--font-family-body)",
            }}>
              Active Sessions
            </span>
          </div>
        </div>
        <div style={{ height: 1, background: "var(--color-stroke-medium)" }} />

        <div style={{
          padding:   "var(--spacing-16) var(--spacing-20)",
          fontSize:  "var(--font-size-extra-tiny)",
          color:     "var(--color-text-weak)",
          fontFamily: "var(--font-family-body)",
          textAlign: "center",
        }}>
          Active sessions will appear here
        </div>
      </Card>
    </div>
  );
}

// ─── Inner components for the import flow ────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      flex: 1, minWidth: 120,
      background: "var(--color-fill-white)",
      border: "1px solid var(--color-stroke-medium)",
      borderRadius: "var(--radius-8)",
      padding: "var(--spacing-12) var(--spacing-16)",
      display: "flex", flexDirection: "column", gap: "var(--spacing-4)",
    }}>
      <span style={{
        fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)",
        lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-text-weak)",
        fontFamily: "var(--font-family-body)",
      }}>{label}</span>
      <span style={{
        fontSize: "var(--font-size-heading-2)", fontWeight: "var(--font-weight-regular)",
        lineHeight: "var(--line-height-heading-2)", color: "var(--color-text-strong)",
        fontFamily: "var(--font-family-body)",
      }}>{value}</span>
    </div>
  );
}

const ENTITY_LABELS: Record<string, string> = {
  resident: "Residents", building: "Buildings", parking_lot: "Parking Lots / Spots",
  team_member: "Team Members", invoice: "Invoices / Fees", unknown: "Other Data",
};
const ENTITY_COLORS: Record<string, string> = {
  resident: "var(--color-tag-text-active)", building: "var(--color-tag-text-upcoming)", parking_lot: "var(--color-tag-text-pending)",
  team_member: "#4a6fa5", invoice: "#8a6d3b", unknown: "var(--color-text-disabled)",
};

function EntityBadge({ entity }: { entity: string }) {
  const color = ENTITY_COLORS[entity] ?? "var(--color-text-disabled)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "var(--spacing-4)",
      padding: "2px var(--spacing-8)", borderRadius: 99,
      fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-medium)",
      lineHeight: "var(--line-height-extra-tiny)", fontFamily: "var(--font-family-body)",
      color, background: `${color}18`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} />
      {ENTITY_LABELS[entity] ?? entity}
    </span>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: Record<string, string>[] }) {
  if (rows.length === 0) {
    return <p style={{ margin: 0, fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)", textAlign: "center", padding: "var(--spacing-24)" }}>No data rows found in this sheet.</p>;
  }
  const tableMinWidth = Math.max(480, headers.length * 160 + 60);

  return (
    <TableScroll minWidth={tableMinWidth}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", lineHeight: "var(--line-height-extra-tiny)" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "var(--spacing-8) var(--spacing-12)", fontWeight: "var(--font-weight-medium)", color: "var(--color-text-strong)", borderBottom: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-weak)", whiteSpace: "nowrap" }}>#</th>
            {headers.map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "var(--spacing-8) var(--spacing-12)", fontWeight: "var(--font-weight-medium)", color: "var(--color-text-strong)", borderBottom: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-weak)", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td style={{ padding: "var(--spacing-6) var(--spacing-12)", color: "var(--color-text-weak)", borderBottom: "1px solid var(--color-stroke-weak)", whiteSpace: "nowrap", verticalAlign: "top" }}>{i + 1}</td>
              {headers.map((h) => (
                <td key={h} style={{ padding: "var(--spacing-6) var(--spacing-12)", color: "var(--color-text-strong)", borderBottom: "1px solid var(--color-stroke-weak)", whiteSpace: "nowrap", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", verticalAlign: "top" }}>
                  {row[h] || <span style={{ color: "var(--color-text-disabled)" }}>&mdash;</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}

// ─── Resident Management tab ───────────────────────────────────────────────────

interface SheetPreview {
  sheetName: string;
  guessedEntity: string;
  rowCount: number;
  headers: string[];
  sample: Record<string, string>[];
}
interface ImportPreview {
  fileName: string;
  fileSize: number;
  totalSheets: number;
  totalRows: number;
  sheets: SheetPreview[];
  detectedEntities: string[];
  /** Dry-run counts from the backend: what confirming would actually
   *  do. Optional so an older API still renders the preview. */
  willInsert?: number;
  willUpdate?: number;
  willSkip?: number;
  /** Existing residents whose stored phone differs from the file's.
   *  Replaced only if `overwritePhones` is sent on confirm. */
  phoneConflicts?: number;
}

type ImportPhase = "drop" | "parsing" | "preview" | "importing" | "done";

/**
 * The resident import template.
 *
 * Columns are exactly the keys `importResidentRows` reads
 * (api-backend/src/lib/resident-importer.ts). Headers are normalised on
 * upload by stripping spaces, so "First Name" and "FirstName" both
 * work — but the spelling must match, since matching is strict.
 *
 * Two example rows rather than one: an Owner and a Renter, because
 * `ResidentType` only distinguishes those two and a single row leaves
 * that ambiguous.
 */
const IMPORT_TEMPLATE_COLUMNS = [
  "Email",
  "FirstName",
  "LastName",
  "CellPhone",
  "UnitNumber",
  "PropertyName",
  "PropertyAddress",
  "PropertyCity",
  "PropertyState",
  "ResidentType",
  "ResidentId",
  "OccupancyId",
  "MoveOutDate",
  "LeaseEndDate",
] as const;

const IMPORT_TEMPLATE_ROWS = [
  [
    "jane.doe@example.com",
    "Jane",
    "Doe",
    "+1 512 555 0101",
    "101",
    "Your Building Name",
    "123 Main Street",
    "Austin",
    "TX",
    "Owner",
    "R-1001",
    "O-2001",
    "",
    "",
  ],
  [
    "sam.lee@example.com",
    "Sam",
    "Lee",
    "+1 512 555 0102",
    "102",
    "Your Building Name",
    "123 Main Street",
    "Austin",
    "TX",
    "Renter",
    "R-1002",
    "O-2002",
    "",
    "2027-06-30",
  ],
];

/** RFC 4180: quote every field, double any embedded quote. Phone numbers
 *  and addresses contain commas, and an unquoted template would teach
 *  people to produce files that break on the first comma. */
function toCsv(rows: readonly (readonly string[])[]): string {
  return rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
}

function downloadImportTemplate() {
  const csv = toCsv([IMPORT_TEMPLATE_COLUMNS, ...IMPORT_TEMPLATE_ROWS]);
  // BOM so Excel opens it as UTF-8 rather than mangling accented names.
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "parqlet-resident-import-template.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function ResidentMgmtTab({ savedPreferences, onSave }: {
  savedPreferences: UserPreferences | null;
  onSave: (updates: Partial<UserPreferences>) => void;
}) {
  const { autoInviteOn, setAutoInviteOn } = useAutoInvite();
  const [phase, setPhase] = useState<ImportPhase>("drop");
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  // Off unless the operator ticks it. Those are numbers residents may
  // have corrected in the app, so replacing them is a decision, never a
  // side effect of uploading a roster.
  const [overwritePhones, setOverwritePhones] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (savedPreferences?.autoInviteEnabled !== undefined && savedPreferences.autoInviteEnabled !== autoInviteOn) {
      setAutoInviteOn(savedPreferences.autoInviteEnabled);
    }
  }, [savedPreferences]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleAutoInvite() {
    const next = !autoInviteOn;
    setAutoInviteOn(next);
    onSave({ autoInviteEnabled: next });
  }

  const acceptFile = useCallback((f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
      setError(`"${ext}" files are not supported. Upload .xlsx, .xls, or .csv.`);
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File exceeds 10 MB limit.");
      return;
    }
    setError(null);
    setFile(f);
    setPhase("parsing");
    uploadFile(f);
  }, []);

  const uploadFile = useCallback(async (f: File) => {
    setPhase("parsing");
    setPreview(null);
    try {
      const formData = new FormData();
      formData.append("file", f);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/residents/import/preview`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message ?? `Server returned ${res.status}`);
      }
      const data: ImportPreview = await res.json();
      setPreview(data);
      setPhase("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPhase("drop");
      setFile(null);
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!file) return;
    setPhase("importing");
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (overwritePhones) formData.append("overwritePhones", "true");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/residents/import/confirm`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message ?? `Import failed: ${res.status}`);
      }
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setPhase("preview");
    }
  }, [file, overwritePhones]);

  const handleReset = useCallback(() => {
    setPhase("drop");
    setFile(null);
    setPreview(null);
    setError(null);
    setOverwritePhones(false);
  }, []);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  };

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-20)", maxWidth: 640 }}>

      {/* Invitations card */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", padding: "var(--spacing-16) var(--spacing-20)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="8" r="3.25" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
            <circle cx="17" cy="8" r="2.25" stroke="var(--color-icon-weak)" strokeWidth="1.5" />
            <path d="M2 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M17 11c2.21 0 4 1.79 4 4" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)" }}>Invitations</span>
        </div>
        <div style={{ height: 1, background: "var(--color-stroke-medium)" }} />
        <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--spacing-16)", padding: "var(--spacing-20)" }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)", marginBottom: 4 }}>Auto-invite new residents</p>
            <p style={{ margin: 0, fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>Automatically send a Parqlet invitation email when a new resident is added to the directory.</p>
          </div>
          <Toggle on={autoInviteOn} onChange={toggleAutoInvite} />
        </div>
      </Card>

      {/* Bulk upload card */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", padding: "var(--spacing-16) var(--spacing-20)" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 13V4M10 4L7 7M10 4L13 7" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 14v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" stroke="var(--color-icon-strong)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-tiny)", color: "var(--color-text-strong)", fontFamily: "var(--font-family-body)" }}>Import Residents & Data</span>
        </div>
        <div style={{ height: 1, background: "var(--color-stroke-medium)" }} />

        <div style={{ padding: "var(--spacing-20)", display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
          <p style={{ margin: 0, fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>
            Upload an Excel (.xlsx, .xls) or CSV file to bulk-import residents, buildings, parking lots, and more.
          </p>

          {/* Error */}
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", padding: "var(--spacing-12) var(--spacing-16)", background: "var(--color-red-50)", borderRadius: "var(--radius-8)", border: "1px solid var(--color-red-100)", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", lineHeight: "var(--line-height-tiny)", color: "var(--color-text-error)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="8" cy="8" r="7" stroke="var(--color-fill-error)" strokeWidth="1.3" />
                <line x1="8" y1="5" x2="8" y2="9" stroke="var(--color-fill-error)" strokeWidth="1.3" strokeLinecap="round" />
                <circle cx="8" cy="11" r="0.8" fill="var(--color-fill-error)" />
              </svg>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--color-text-error)", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
              </button>
            </div>
          )}

          {/* ── DROP ── */}
          {phase === "drop" && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `1.5px dashed ${dragOver ? "var(--color-text-strong)" : "var(--color-stroke-medium)"}`,
                borderRadius: "var(--radius-8)",
                background: dragOver ? "var(--color-fill-weak)" : "transparent",
                padding: "var(--spacing-32) var(--spacing-20)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--spacing-8)",
                cursor: "pointer", transition: "border-color 0.15s, background 0.15s", textAlign: "center",
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: "var(--radius-10)", background: "var(--color-fill-weak)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 16V5M12 5l-4 4M12 5l4 4" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 17v1.5A2.5 2.5 0 0 0 5.5 21h13a2.5 2.5 0 0 0 2.5-2.5V17" stroke="var(--color-icon-weak)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-tiny)", color: "var(--color-text-strong)" }}>
                  Drop your file here, or <span style={{ textDecoration: "underline" }}>browse</span>
                </p>
                <p style={{ margin: "4px 0 0", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-text-weak)" }}>
                  .xlsx, .xls, .csv &mdash; max 10 MB
                </p>
              </div>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) acceptFile(f); e.target.value = ""; }} />
            </div>
          )}

          {/* ── PARSING ── */}
          {phase === "parsing" && (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-16)", padding: "var(--spacing-24)" }}>
              <div style={{ width: 24, height: 24, border: "2px solid var(--color-stroke-medium)", borderTopColor: "var(--color-text-strong)", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-tiny)", color: "var(--color-text-strong)" }}>Parsing {file?.name}&hellip;</p>
                <p style={{ margin: "var(--spacing-4) 0 0", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-text-weak)" }}>Extracting sheets, columns, and data</p>
              </div>
            </div>
          )}

          {/* ── PREVIEW ── */}
          {phase === "preview" && preview && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
              {/* Stats */}
              <div style={{ display: "flex", gap: "var(--spacing-8)", flexWrap: "wrap" }}>
                <StatCard label="File" value={preview.fileName} />
                <StatCard label="Size" value={formatSize(preview.fileSize)} />
                <StatCard label="Sheets" value={preview.totalSheets} />
                <StatCard label="Rows" value={preview.totalRows} />
              </div>

              {/* What confirming would actually do. "312 rows" says
                  nothing about impact — a roster meant to add five
                  people that reports 300 updates is visibly the wrong
                  file, and this is the moment to notice. */}
              {preview.willInsert != null && (
                <div style={{ display: "flex", gap: "var(--spacing-8)", flexWrap: "wrap" }}>
                  <StatCard label="Will add" value={preview.willInsert} />
                  <StatCard label="Will update" value={preview.willUpdate ?? 0} />
                  <StatCard label="Will skip" value={preview.willSkip ?? 0} />
                </div>
              )}

              {/* Phone numbers are the one field residents edit
                  themselves, so replacing them is opt-in and the cost is
                  stated before the choice. */}
              {(preview.phoneConflicts ?? 0) > 0 && (
                <div style={{
                  background: "var(--color-fill-weak)",
                  border: "1px solid var(--color-stroke-medium)",
                  borderRadius: "var(--radius-8)",
                  padding: "var(--spacing-12) var(--spacing-16)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--spacing-8)",
                }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "var(--spacing-8)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={overwritePhones}
                      onChange={(e) => setOverwritePhones(e.target.checked)}
                      style={{ marginTop: 2, cursor: "pointer" }}
                    />
                    <span style={{ fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", color: "var(--color-text-strong)" }}>
                      Also update phone numbers for existing residents
                    </span>
                  </label>
                  <span style={{ fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", paddingLeft: 24 }}>
                    {preview.phoneConflicts} resident
                    {preview.phoneConflicts === 1 ? "" : "s"} would have their phone number
                    replaced. Residents can edit their own number in the app, so leave this
                    off unless the file is the more reliable source.
                  </span>
                </div>
              )}

              {/* Entity badges */}
              {preview.detectedEntities.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>Detected entities:</span>
                  {preview.detectedEntities.map((e) => <EntityBadge key={e} entity={e} />)}
                </div>
              )}

              {/* Sheet previews */}
              {preview.sheets.map((sheet) => (
                <div key={sheet.sheetName} style={{ background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)", overflow: "hidden", padding: "var(--spacing-16)" }}>
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", rowGap: "var(--spacing-4)", gap: "var(--spacing-8)", marginBottom: "var(--spacing-12)" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "var(--radius-6)", background: "var(--color-fill-weak)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2" stroke="var(--color-icon-weak)" strokeWidth="1.3" /><line x1="2" y1="7" x2="16" y2="7" stroke="var(--color-icon-weak)" strokeWidth="1.3" /><line x1="7" y1="2" x2="7" y2="16" stroke="var(--color-icon-weak)" strokeWidth="1.3" /></svg>
                    </div>
                    <p style={{ margin: 0, minWidth: 0, flexShrink: 1, fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-tiny)", color: "var(--color-text-strong)", display: "flex", alignItems: "center", gap: "var(--spacing-6)" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{sheet.sheetName}</span>
                      <EntityBadge entity={sheet.guessedEntity} />
                    </p>
                    <span style={{ marginLeft: "auto", flexShrink: 0, whiteSpace: "nowrap", fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>{sheet.rowCount} rows &middot; {sheet.headers.length} columns</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-4)", marginBottom: "var(--spacing-12)" }}>
                    {sheet.headers.map((h) => (
                      <span key={h} style={{ display: "inline-flex", alignItems: "center", padding: "2px var(--spacing-6)", background: "var(--color-fill-weak)", borderRadius: "var(--radius-4)", fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], fontFamily: "var(--font-family-body)", color: "var(--color-text-weak)", lineHeight: "var(--line-height-extra-tiny)" }}>{h}</span>
                    ))}
                  </div>
                  <DataTable headers={sheet.headers} rows={sheet.sample} />
                  {sheet.rowCount > sheet.sample.length && (
                    <p style={{ margin: "var(--spacing-8) 0 0", textAlign: "center", fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>Showing {sheet.sample.length} of {sheet.rowCount} rows</p>
                  )}
                </div>
              ))}

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--spacing-12) 0 0" }}>
                <span style={{ fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)", fontFamily: "var(--font-family-body)" }}>{preview.totalRows} total rows ready</span>
                <div style={{ display: "flex", gap: "var(--spacing-8)" }}>
                  <button onClick={handleReset}
                    style={{ height: 36, padding: "0 var(--spacing-14)", background: "var(--color-fill-white)", border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)", cursor: "pointer", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], color: "var(--color-text-strong)", transition: "background 0.12s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-fill-weak)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-fill-white)"; }}>Cancel</button>
                  <button onClick={handleImport}
                    style={{ height: 36, padding: "0 var(--spacing-16)", background: "var(--color-button-neutral)", color: "white", border: "none", borderRadius: "var(--radius-8)", cursor: "pointer", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], transition: "background 0.12s", display: "flex", alignItems: "center", gap: "var(--spacing-6)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gray-90)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-button-neutral)"; }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 11V2M8 2l-4 4M8 2l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M1 12v.5A1.5 1.5 0 0 0 2.5 14h11a1.5 1.5 0 0 0 1.5-1.5V12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                    Import all data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── IMPORTING ── */}
          {phase === "importing" && (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-16)", padding: "var(--spacing-24)" }}>
              <div style={{ width: 24, height: 24, border: "2px solid var(--color-stroke-medium)", borderTopColor: "var(--color-text-strong)", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-tiny)", color: "var(--color-text-strong)" }}>Importing data&hellip;</p>
                <p style={{ margin: "var(--spacing-4) 0 0", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-text-weak)" }}>Writing to database</p>
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {phase === "done" && (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-12)", padding: "var(--spacing-16)", background: "var(--color-tag-active)", borderRadius: "var(--radius-8)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><path d="M3 8l4 4 6-6" stroke="var(--color-tag-text-active)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-tiny)", color: "var(--color-tag-text-active)" }}>{preview?.fileName} imported successfully</p>
                <p style={{ margin: "2px 0 0", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-tag-text-active)" }}>{preview?.totalRows} rows processed across {preview?.totalSheets} sheets</p>
              </div>
              <button onClick={handleReset}
                style={{ height: 32, padding: "0 var(--spacing-12)", background: "var(--color-button-neutral)", color: "white", border: "none", borderRadius: "var(--radius-6)", cursor: "pointer", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], transition: "background 0.12s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-gray-90)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-button-neutral)"; }}>Upload another file</button>
            </div>
          )}

          {/* Template download */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-6)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M7 9l-3-3M7 9l3-3" stroke="var(--color-text-weak)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M1 11v.5A1.5 1.5 0 0 0 2.5 13h9a1.5 1.5 0 0 0 1.5-1.5V11" stroke="var(--color-text-weak)" strokeWidth="1.2" strokeLinecap="round" /></svg>
            <button style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"], lineHeight: "var(--line-height-extra-tiny)", color: "var(--color-text-weak)", textDecoration: "underline", textUnderlineOffset: 2 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-strong)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-weak)"; }}
              onClick={downloadImportTemplate}>Download template</button>
          </div>
        </div>

        {/* Spinner keyframe */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </Card>
    </div>
  );
}

// ─── SMS Settings tab ─────────────────────────────────────────────────────────

function SmsSettingsTab() {
  const queryClient = useQueryClient();
  const { selectedIds } = useBuildingFilter();
  const buildingId = selectedIds[0];

  const { data, isLoading, error } = useQuery({
    queryKey: buildingKeys.settings(buildingId ?? ""),
    queryFn: () => getBuildingSettings(buildingId ?? ""),
    enabled: !!buildingId,
  });

  const mutation = useMutation({
    mutationFn: (smsHelpMessage: string) =>
      updateBuildingSettings(buildingId ?? "", { smsHelpMessage }),
    onSuccess: (updated: BuildingSettings) => {
      queryClient.setQueryData(buildingKeys.settings(buildingId ?? ""), updated);
    },
  });

  const [draft, setDraft] = useState("");

  // Sync draft when data loads
  useEffect(() => {
    if (data?.smsHelpMessage !== undefined) {
      setDraft(data.smsHelpMessage ?? "");
    }
  }, [data]);

  const isDirty = draft !== (data?.smsHelpMessage ?? "");

  const handleSave = () => {
    mutation.mutate(draft);
  };

  const charCount = draft.length;
  const isLong = charCount > 160;

  if (!buildingId) {
    return (
      <div style={{
        padding: "var(--spacing-16)",
        background: "var(--color-fill-weak)",
        borderRadius: "var(--radius-8)",
        fontFamily: "var(--font-family-body)",
        fontSize: "var(--font-size-tiny)",
        color: "var(--color-text-weak)",
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }}>
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
          <line x1="8" y1="5" x2="8" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
        </svg>
        Select a building in the header filter to configure its SMS settings.
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "var(--spacing-16)" }}>
        <p style={{ margin: 0, fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", lineHeight: "var(--line-height-body)" }}>
          When a resident texts <strong>HELP</strong> to your SMS number, they will receive this message automatically.
          Keep it short and helpful — single SMS is recommended (160 chars).
        </p>
      </div>

      {isLoading && (
        <p style={{ fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" }}>Loading…</p>
      )}

      {error && (
        <p style={{ fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" }}>Failed to load settings.</p>
      )}

      {!isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)" }}>
          <div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="e.g. Need help? Contact the front desk at (555) 100-0000 or email manager@building.com"
              style={{
                width: "100%",
                padding: "var(--spacing-12)",
                border: "1px solid var(--color-stroke-medium)",
                borderRadius: "var(--radius-8)",
                fontFamily: "var(--font-family-body)",
                fontSize: "var(--font-size-tiny)",
                lineHeight: "var(--line-height-body)",
                color: "var(--color-text-strong)",
                resize: "vertical",
                background: "var(--color-fill-white)",
                boxSizing: "border-box",
              }}
            />
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "var(--spacing-4)",
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-extra-tiny)",
              color: isLong ? "var(--color-text-weak)" : "var(--color-text-weak)",
            }}>
              <span>{charCount}/160 chars{isLong ? " — multi-part SMS" : ""}</span>
              {isLong && <span style={{ color: "#d97706" }}>Consider shortening</span>}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-8)" }}>
            <button
              onClick={handleSave}
              disabled={!isDirty || mutation.isPending}
              style={{
                height: 36,
                padding: "0 var(--spacing-16)",
                background: isDirty && !mutation.isPending ? "var(--color-button-neutral)" : "var(--color-fill-weak)",
                color: isDirty && !mutation.isPending ? "white" : "var(--color-text-weak)",
                border: "none",
                borderRadius: "var(--radius-8)",
                cursor: isDirty && !mutation.isPending ? "pointer" : "not-allowed",
                fontFamily: "var(--font-family-body)",
                fontSize: "var(--font-size-tiny)",
                fontWeight: "var(--font-weight-medium)" as React.CSSProperties["fontWeight"],
                transition: "background 0.12s",
              }}
            >
              {mutation.isPending ? "Saving…" : "Save"}
            </button>

            {mutation.isSuccess && !isDirty && (
              <span style={{ fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" }}>
                ✓ Saved
              </span>
            )}

            {mutation.isError && (
              <span style={{ fontFamily: "var(--font-family-body)", fontSize: "var(--font-size-extra-tiny)", color: "#dc2626" }}>
                Save failed — try again
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Credit Price tab ─────────────────────────────────────────────────────────

/**
 * Setting what a credit costs.
 *
 * Every spot in a Condo costs one credit a day, so this single number is
 * the building's whole price list. It is the one setting on this page that
 * changes what residents are charged, which is why it does not save on
 * blur like the rest: it asks first, and says what it is about to do.
 *
 * The warning is not decoration. A credit already in a resident's wallet
 * keeps buying one day whatever the price becomes, so raising the price
 * does not reprice what people have already bought - it changes what the
 * NEXT credit costs, and it moves the gift-card maths for balances that
 * already exist. Anyone changing this should know that before they do,
 * not after a resident asks why their gift card moved.
 *
 * DEMO: this is local state. Nothing is persisted and no other screen
 * reads it back - the dashboards quote CREDIT_PRICE_CENTS from
 * lib/demo/pricing.ts. Wiring it up for real means
 * PUT /api/buildings/:id/settings, which already owns
 * `credits_price_cents` and already clears the price cache.
 */
function CreditPriceTab() {
  const [saved, setSaved] = useState(CREDIT_PRICE_CENTS);
  const [draft, setDraft] = useState((CREDIT_PRICE_CENTS / 100).toFixed(2));
  const [confirming, setConfirming] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const draftCents = Math.round(Number(draft) * 100);
  const valid = Number.isFinite(draftCents) && draftCents > 0;
  const changed = valid && draftCents !== saved;
  const direction = draftCents > saved ? "up" : "down";

  const reserveFor = (cents: number) => Math.round((cents * 0.4) / 25) * 25;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
      <Card>
        <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
          <div>
            <h2 style={cp.h2}>Credit price</h2>
            <p style={cp.sub}>
              What a resident pays for one credit. Every spot in your
              building costs one credit a day, so this is the price of a
              day&apos;s parking - the same for every spot and every
              resident. Residents never set their own.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--spacing-16)", flexWrap: "wrap" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={cp.label}>Price per credit (USD)</span>
              <div style={cp.inputWrap}>
                <span style={cp.prefix}>$</span>
                <input
                  value={draft}
                  inputMode="decimal"
                  onChange={(e) => { setDraft(e.target.value); setConfirming(false); setJustSaved(false); }}
                  style={cp.input}
                />
              </div>
            </label>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={cp.label}>You receive per credit</span>
              <span style={cp.derived}>
                {valid ? formatMoney(netToBuilding(draftCents)) : "—"}
              </span>
              <span style={cp.hint}>after commission and card fees</span>
            </div>
          </div>

          {changed && !confirming && (
            <div style={{ display: "flex", gap: "var(--spacing-12)" }}>
              <button style={cp.primary} onClick={() => setConfirming(true)}>
                Review change
              </button>
              <button style={cp.secondary} onClick={() => { setDraft((saved / 100).toFixed(2)); setConfirming(false); }}>
                Cancel
              </button>
            </div>
          )}

          {justSaved && (
            <span style={{ ...cp.hint, color: "var(--color-tag-text-active)" }}>
              Saved. New bookings are charged at {formatMoney(saved)} a day.
            </span>
          )}
        </div>
      </Card>

      {/* The warning only appears once a change is actually pending. A
          banner that is always on screen is a banner nobody reads. */}
      {changed && confirming && (
        <Card>
          <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column", gap: "var(--spacing-16)" }}>
            <div style={cp.warnHead}>
              <span aria-hidden style={cp.warnIcon}>!</span>
              <span style={cp.warnTitle}>
                Before you change the price {direction} to {formatMoney(draftCents)}
              </span>
            </div>

            <ul style={cp.list}>
              <li style={cp.li}>
                <strong>Credits residents already bought are not repriced.</strong>{" "}
                A credit always buys one day. Someone holding 10 credits
                bought at {formatMoney(saved)} still parks 10 days, so you
                carry the difference until their balance runs out.
              </li>
              <li style={cp.li}>
                <strong>Gift cards move for balances that already exist.</strong>{" "}
                What a credit earns toward a gift card is a share of its
                price, so it goes from {formatMoney(reserveFor(saved))} to{" "}
                {formatMoney(reserveFor(draftCents))} per credit. Residents
                who have been saving will see their progress change without
                having done anything.
              </li>
              <li style={cp.li}>
                <strong>Only new bookings are affected.</strong> Anything
                already booked or paid for stays at {formatMoney(saved)}.
              </li>
            </ul>

            <div style={{ display: "flex", gap: "var(--spacing-12)", flexWrap: "wrap" }}>
              <button
                style={cp.primary}
                onClick={() => { setSaved(draftCents); setConfirming(false); setJustSaved(true); }}
              >
                Change price to {formatMoney(draftCents)}
              </button>
              <button
                style={cp.secondary}
                onClick={() => { setDraft((saved / 100).toFixed(2)); setConfirming(false); }}
              >
                Keep {formatMoney(saved)}
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

const cp: Record<string, React.CSSProperties> = {
  h2: { margin: 0, fontSize: "var(--font-size-small)", fontWeight: 600, color: "var(--color-text-strong)" },
  sub: { margin: "var(--spacing-8) 0 0", fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", maxWidth: 560, lineHeight: 1.6 },
  label: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" },
  inputWrap: {
    display: "flex", alignItems: "center", gap: 4, height: 40, padding: "0 12px",
    border: "1px solid var(--color-stroke-medium)", borderRadius: "var(--radius-8)",
    background: "var(--color-fill-white)", width: 150,
  },
  prefix: { fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)" },
  input: {
    border: "none", outline: "none", background: "transparent", width: "100%",
    fontSize: "var(--font-size-small)", fontFamily: "var(--font-family-body)",
    color: "var(--color-text-strong)",
  },
  derived: { fontSize: "var(--font-size-small)", fontWeight: 600, color: "var(--color-text-strong)" },
  hint: { fontSize: "var(--font-size-extra-tiny)", color: "var(--color-text-weak)" },
  warnHead: { display: "flex", alignItems: "center", gap: "var(--spacing-8)" },
  warnIcon: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 20, height: 20, borderRadius: 999, flexShrink: 0,
    background: "var(--color-tag-fill-pending, #FDF0D5)",
    color: "var(--color-tag-text-pending, #8A6100)",
    fontSize: 13, fontWeight: 700,
  },
  warnTitle: { fontSize: "var(--font-size-small)", fontWeight: 600, color: "var(--color-text-strong)" },
  list: { margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: "var(--spacing-12)" },
  li: { fontSize: "var(--font-size-tiny)", color: "var(--color-text-weak)", lineHeight: 1.65 },
  primary: {
    height: 36, padding: "0 16px", borderRadius: "var(--radius-8)", border: "none",
    background: "var(--color-fill-inverse, #111)", color: "var(--color-text-inverse, #fff)",
    fontSize: "var(--font-size-tiny)", fontFamily: "var(--font-family-body)", cursor: "pointer",
  },
  secondary: {
    height: 36, padding: "0 16px", borderRadius: "var(--radius-8)",
    border: "1px solid var(--color-stroke-medium)", background: "var(--color-fill-white)",
    color: "var(--color-text-strong)", fontSize: "var(--font-size-tiny)",
    fontFamily: "var(--font-family-body)", cursor: "pointer",
  },
};

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: "security",       label: "Security"            },
  { id: "credit-price",   label: "Credit Price"        },
  { id: "profile",        label: "Profile Preferences" },
  { id: "resident-mgmt",  label: "Resident Management" },
  { id: "notifications",  label: "Notifications"       },
  { id: "sms-settings",   label: "SMS Settings"        },
];

function TabBar({ active, onChange, tabs }: { active: Tab; onChange: (t: Tab) => void; tabs: { id: Tab; label: string }[] }) {
  const [hovered, setHovered] = useState<Tab | null>(null);

  return (
    <div style={{
      overflowX:              "auto",
      WebkitOverflowScrolling: "touch",
      marginBottom:           "var(--spacing-24)",
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
              color:        isActive ? "var(--color-text-strong)" : isHovered ? "var(--color-text-strong)" : "var(--color-text-weak)",
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("security");
  const pathname = usePathname();
  // Settings is served under BOTH product prefixes, so the tab list has to
  // be decided by the URL. Credit price is a Condo control: there the one
  // number IS the price list, since residents own every spot and the
  // building sets one rate for all of them.
  const isCondo = productFromPath(pathname) !== "apartment";
  const tabs = useMemo(
    () => TABS.filter((t) => t.id !== "credit-price" || isCondo),
    [isCondo],
  );
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    preferencesApi.get()
      .then((data) => setPreferences(data))
      .catch(() => {
        // fall back to defaults
        setPreferences(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const savePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences((prev) => prev ? { ...prev, ...updates } : prev);
    preferencesApi.update(updates).catch(console.error);
  }, []);

  return (
    <div style={{
        padding:   "var(--spacing-24)",
        maxWidth:  900,
      }}>
        {/* Page heading */}
        <div style={{ marginBottom: "var(--spacing-24)" }}>
          <h1 style={{
            margin:     0,
            fontSize:   "var(--font-size-heading-1)",
            lineHeight: "var(--line-height-heading-1)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            color:      "var(--color-text-strong)",
            fontFamily: "var(--font-family-heading)",
          }}>
            Account Settings
          </h1>
          <p style={{
            margin:     "var(--spacing-8) 0 0",
            fontSize:   "var(--font-size-body)",
            lineHeight: "var(--line-height-body)",
            fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
            color:      "var(--color-text-weak)",
            fontFamily: "var(--font-family-body)",
          }}>
            Manage your security, preferences, and notification settings.
          </p>
            {loading && (
              <p style={{
                margin: "var(--spacing-8) 0 0",
                fontSize: "var(--font-size-extra-tiny)",
                color: "var(--color-text-weak)",
                fontFamily: "var(--font-family-body)",
              }}>
                Loading settings…
              </p>
            )}
        </div>

        <TabBar active={activeTab} onChange={setActiveTab} tabs={tabs} />

        {!loading && activeTab === "security" && (
          <SecurityTab savedPreferences={preferences} onSave={savePreferences} />
        )}
        {!loading && activeTab === "profile" && (
          <ProfilePreferencesTab savedPreferences={preferences} onSave={savePreferences} />
        )}
        {!loading && activeTab === "resident-mgmt" && (
          <ResidentMgmtTab savedPreferences={preferences} onSave={savePreferences} />
        )}
        {!loading && activeTab === "notifications" && (
          <NotificationsTab savedPreferences={preferences} onSave={savePreferences} />
        )}
        {!loading && activeTab === "sms-settings" && <SmsSettingsTab />}
        {!loading && activeTab === "credit-price" && isCondo && <CreditPriceTab />}
      </div>
  );
}
