"use client";

/**
 * LandingHero — the autoplaying product film, as real HTML.
 *
 * ONE SELF-CONTAINED COMPONENT, ON PURPOSE.
 *
 * This is written to be lifted wholesale into the `landing` repo later, so
 * it imports nothing from this project: no icons, no colour tokens, no
 * shell, no data helpers. Every palette value, every glyph, every keyframe
 * and the whole cast of fake data live in this file. Copy it across, render
 * <LandingHero />, and it works - the only dependency is React.
 *
 * That isolation is also what keeps the promise made when this was
 * commissioned: /condo, /condo+savings, /condo+earnings, /apartment and
 * /demo-home must stay byte-identical. Nothing here is imported by them and
 * nothing of theirs is imported here, so the existing demos cannot change.
 * The palette below is duplicated from the shared Figma library rather than
 * read from tokens.css for the same reason - keep it in sync by hand.
 *
 * NOT INTERACTIVE. The whole stage is pointer-events:none. It is a film:
 * the cursor, the clicks, the tab changes and the phone taps are all
 * scripted. Nothing here responds to a real visitor, which is deliberate -
 * a half-real dashboard that answers some clicks and not others reads as
 * broken, where an obvious film reads as a demo.
 *
 * The choreography is a timeline of scenes (SCENES below) advanced by
 * timeouts, with CSS transitions doing the actual smoothing. State changes
 * are coarse - a scene index - and every motion between them is a
 * transition, so React re-renders a handful of times across a 17s loop
 * rather than sixty times a second.
 *
 * It pauses when scrolled out of view and does not start at all under
 * prefers-reduced-motion, which shows the final frame instead.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";

/* ══════════════════════════════════════════════════════════════════
   PALETTE — duplicated from the shared Figma library (tokens.css in
   this repo, constants/theme/colors.ts in mobile-app). Hard-coded so
   this file travels on its own.
   ══════════════════════════════════════════════════════════════════ */
const C = {
  textStrong: "#222222",
  textWeak: "#504F4D",
  textWeaker: "#A7A7A7",
  white: "#FFFFFF",
  accent: "#C7E51F",
  accentSoft: "#D2EA4C",
  fillWeak: "#F8F6F2",
  strokeMedium: "#E7E4E0",
  strokeWeak: "#F1EEE9",
  sidebarBg: "#222222",
  sidebarItemActive: "#3D3D3D",
  sidebarText: "#A7A7A7",
  tagUpcoming: "#C0E2F2",
  tagUpcomingText: "#14506B",
  tagActive: "#D2EBC3",
  tagActiveText: "#2B5718",
  tagNeutral: "#F1EEE9",
  tagNeutralText: "#6A6A6A",
  tagWarn: "#F4E6C3",
  tagWarnText: "#6B521A",
  heroBg: "#1A1A1A",
  heroCard: "#222222",
} as const;

/* ══════════════════════════════════════════════════════════════════
   CAST — invented, but shaped like the real thing.

   No real resident is named here. The names are ordinary enough to
   read as a real building's directory without belonging to anyone,
   and the unit/spot/plate formats match what the product actually
   stores. THE FEATURED BOOKING IS ONE OBJECT: the phone and the
   dashboard both render `FEATURED`, because the whole point of the
   film is that the booking made on the phone is the row that appears
   on the dashboard. Two copies would drift.
   ══════════════════════════════════════════════════════════════════ */
const FEATURED = {
  // Ids, units, spots and plates all follow the real dashboard's shapes:
  // six hex-ish characters, a floor-letter unit, a bare spot number and a
  // LLL-NNNN plate. The invented versions ("BK-48217", "#135") were the
  // giveaway that this was a drawing of the product.
  id: "7C41D9",
  unit: "4D",
  resident: "Elena Ruiz",
  spot: "519",
  owner: "Mia Kim",
  guest: "Marcus Webb",
  plate: "APC-1234",
  vehicle: "Tesla Model Y",
  start: "7pm, Feb 20",
  end: "11pm, Feb 22",
  whenApp: "Feb 20 7pm - Feb 22 11pm",
  startsIn: "Starts in 2h",
  credits: 5,
};

type Row = {
  id: string;
  unit: string;
  resident: string;
  spot: string;
  owner: string;
  guest: string;
  plate: string;
  start: string;
  end: string;
  status: "Upcoming" | "Active" | "Completed" | "Awaiting conf.";
};

const FEATURED_ROW: Row = {
  id: FEATURED.id,
  unit: FEATURED.unit,
  resident: FEATURED.resident,
  spot: FEATURED.spot,
  owner: FEATURED.owner,
  guest: FEATURED.guest,
  plate: FEATURED.plate,
  start: FEATURED.start,
  end: FEATURED.end,
  status: "Upcoming",
};

const ROWS: Record<"current" | "future" | "past", Row[]> = {
  current: [
    { id: "CB3284", unit: "7A", resident: "Mia Nelson",      spot: "419", owner: "Isabella Irwin", guest: "Liam Kelly",       plate: "QWC-7870", start: "1pm, Feb 19",    end: "2am, Feb 20",    status: "Active" },
    { id: "94944C", unit: "6F", resident: "Lucas Garcia",    spot: "330", owner: "Mason Harris",   guest: "Evelyn Jenkins",   plate: "PTX-7733", start: "4:30am, Feb 19", end: "4:30pm, Feb 19", status: "Active" },
    { id: "5DF615", unit: "5E", resident: "Isabella Turner", spot: "108", owner: "Emma Anderson",  guest: "Benjamin Irwin",   plate: "OQS-7596", start: "7pm, Feb 18",    end: "6am, Feb 19",    status: "Active" },
  ],
  future: [
    FEATURED_ROW,
    { id: "700D2A", unit: "1D", resident: "James Owens",     spot: "330", owner: "Mason Harris",   guest: "Mia Nelson",       plate: "TFR-8281", start: "4:30pm, Feb 21", end: "2:30am, Feb 22", status: "Awaiting conf." },
    { id: "2657DE", unit: "4D", resident: "Mason Murphy",    spot: "519", owner: "Mia Kim",        guest: "Charlotte Hughes", plate: "NNN-7459", start: "10:30am, Feb 22",end: "8:30pm, Feb 22", status: "Upcoming" },
  ],
  past: [
    { id: "396EF3", unit: "9C", resident: "Charlotte Hughes",spot: "108", owner: "Emma Anderson",  guest: "Mason Murphy",     plate: "SCM-8144", start: "2am, Feb 8",     end: "12pm, Feb 8",    status: "Awaiting conf." },
    { id: "EFB9A6", unit: "3C", resident: "Sophia Foster",   spot: "222", owner: "Liam Baker",     guest: "Lucas Garcia",     plate: "MKI-7322", start: "1am, Feb 8",     end: "10am, Feb 8",    status: "Completed" },
    { id: "B81B6F", unit: "2B", resident: "Ethan Simmons",   spot: "251", owner: "Ava Evans",      guest: "Sophia Foster",    plate: "LHD-7185", start: "4:30pm, Feb 7",  end: "12:30am, Feb 8", status: "Completed" },
  ],
};

const NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "residents", label: "Resident Directory" },
  { id: "bookings", label: "Bookings" },
  // Reward Redemption is deliberately absent - it is not shown publicly.
  // Savings is absent too: this is the plain-Condo cut, where residents own
  // the spots and the building earning off them is not the story.
  { id: "tickets", label: "Support Tickets" },
  { id: "subscription", label: "Subscription" },
  { id: "settings", label: "Settings" },
  { id: "notifications", label: "Notifications" },
] as const;

const TABS = [
  { id: "current", label: "Current bookings" },
  { id: "future", label: "Upcoming bookings" },
  { id: "past", label: "Past bookings" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/**
 * ONE column spec, read by the header and the rows alike.
 *
 * They were two parallel lists of inline flex values and they drifted on
 * the first pass: the name columns were `1 1 0` with no basis, so at this
 * table's real width they collapsed to a letter and the headers slid over
 * the column to their right. Deriving both from this list means a width
 * can only ever be changed in one place.
 */
const COLS = [
  { key: "id",       label: "Booking ID",    cls: "plh-mono" },
  { key: "unit",     label: "Unit #",        cls: "" },
  { key: "resident", label: "Resident Name", cls: "plh-trunc plh-hasphone" },
  { key: "spot",     label: "Booked Spot",   cls: "" },
  { key: "owner",    label: "Spot Owner",    cls: "plh-trunc plh-hasphone" },
  { key: "guest",    label: "Guest Name",    cls: "plh-trunc plh-hasphone" },
  { key: "plate",    label: "License Plate", cls: "plh-mono" },
  { key: "start",    label: "Booking Start", cls: "plh-trunc" },
  { key: "end",      label: "Booking End",   cls: "plh-trunc" },
  { key: "status",   label: "Status",        cls: "" },
] as const satisfies readonly { key: keyof Row; label: string; cls: string }[];

/* ══════════════════════════════════════════════════════════════════
   CHOREOGRAPHY

   Each scene names where the cursor is, which dashboard tab is open,
   which phone screen shows, and whether a press is landing this beat.
   `hold` is how long the scene sits before the next one.

   Cursor coordinates are percentages of the stage, so the film keeps
   its timing at any width without measuring anything at runtime.
   ══════════════════════════════════════════════════════════════════ */
type Scene = {
  hold: number;
  tab: TabId;
  phone: "confirmed" | "home";
  /** Pixels inside the dashboard frame, not stage percentages. */
  cursor: { x: number; y: number } | null;
  /** Two separate presses, because the point of the film is that one beat
      carries both: the thumb on the phone and the click on the dashboard
      happen together, not one after the other. */
  pressCursor?: boolean;
  pressTouch?: boolean;
  /** The row lands with the green line and a nudge of scale. */
  flash?: boolean;
};


/**
 * Where each tab pill sits inside the dashboard box.
 *
 * SIDEBAR(256) + BODY_PAD(24) puts the first pill's left edge at 280, and
 * the pills run 72 / 80 / 56 wide with an 8px gap. Y is HEADER(64) +
 * BODY_PAD(24) + half a 34px pill. Keep in step with the CSS below.
 */
const TAB_HIT = {
  current: { x: 338, y: 172 },
  future: { x: 492, y: 172 },
  past: { x: 632, y: 172 },
} as const;

const SCENES: Scene[] = [
  // 1. Settle. Phone on the confirmation splash, dashboard on Current.
  { hold: 1500, tab: "current", phone: "confirmed", cursor: null },
  // 2. The cursor arrives and travels to the Upcoming tab, ready.
  { hold: 1100, tab: "current", phone: "confirmed", cursor: TAB_HIT.future },
  // 3. THE BEAT. The thumb presses "Go to home screen" and the cursor
  //    clicks "Upcoming bookings" at the same instant.
  { hold: 650,  tab: "current", phone: "confirmed", cursor: TAB_HIT.future, pressCursor: true, pressTouch: true },
  // 4. Both land together: the phone shows the booking on its home tab
  //    while the same booking flashes into the dashboard's Upcoming list.
  { hold: 3400, tab: "future",  phone: "home", cursor: TAB_HIT.future, flash: true },
  // 5. On to Past.
  { hold: 950,  tab: "future",  phone: "home", cursor: TAB_HIT.past },
  { hold: 600,  tab: "future",  phone: "home", cursor: TAB_HIT.past, pressCursor: true },
  { hold: 2200, tab: "past",    phone: "home", cursor: TAB_HIT.past },
  // 6. Back to Current, and the cursor leaves.
  { hold: 950,  tab: "past",    phone: "home", cursor: TAB_HIT.current },
  { hold: 600,  tab: "past",    phone: "home", cursor: TAB_HIT.current, pressCursor: true },
  { hold: 1800, tab: "current", phone: "home", cursor: TAB_HIT.current },
  { hold: 1400, tab: "current", phone: "confirmed", cursor: null },
];

/* ══════════════════════════════════════════════════════════════════
   ICONS — inline, so the component carries no asset dependencies.
   24x24, currentColor, stroked at 1.5 to sit with the UI's weight.
   ══════════════════════════════════════════════════════════════════ */
const I = {
  dashboard: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  residents: "M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1.5a4 4 0 0 0-3-3.87M16.5 3.8a4 4 0 0 1 0 7.4",
  bookings: "M7 3v3M17 3v3M3.5 9.5h17M5 6h14a1.5 1.5 0 0 1 1.5 1.5V19A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6",
  tickets: "M12 17h.01M9.2 9a2.9 2.9 0 1 1 3.9 2.7c-.7.3-1.1 1-1.1 1.8v.5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18",
  subscription: "M3 10h18M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5zM6.5 14h4",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.1 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.7 7.1L4.6 7a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1",
  notifications: "M18 8a6 6 0 1 0-12 0c0 7-2.5 9-2.5 9h17S18 15 18 8M13.7 21a2 2 0 0 1-3.4 0",
};

function NavIcon({ d, color }: { d: string; color: string }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d={d} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════════════════════════════════ */

function StatusPill({ status }: { status: Row["status"] }) {
  const map: Record<Row["status"], { bg: string; fg: string }> = {
    Upcoming: { bg: C.tagUpcoming, fg: C.tagUpcomingText },
    Active: { bg: C.tagActive, fg: C.tagActiveText },
    Completed: { bg: C.tagActive, fg: C.tagActiveText },
    // Amber, as in the real table - it is a state waiting on someone, not
    // a finished or a cancelled one.
    "Awaiting conf.": { bg: C.tagWarn, fg: C.tagWarnText },
  };
  const t = map[status];
  return (
    <span className="plh-pill" style={{ background: t.bg, color: t.fg }}>
      {status}
    </span>
  );
}

function Dashboard({ tab, flash }: { tab: TabId; flash: boolean }) {
  const rows = ROWS[tab];
  return (
    <div className="plh-dash">
      {/* ── Sidebar ── */}
      <aside className="plh-side">
        <div className="plh-side-logo">PARQLET</div>
        <nav className="plh-nav">
          {NAV.map((item) => {
            const active = item.id === "bookings";
            return (
              <div key={item.id} className={`plh-nav-item${active ? " is-active" : ""}`}>
                <NavIcon d={I[item.id as keyof typeof I]} color={active ? C.accent : C.sidebarText} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
        {/* The real sidebar is anchored by these, and their absence was part
            of why the panel read as empty below the nav. */}
        <div className="plh-side-foot">
          <span>Terms of Service</span>
          <span>Privacy Policy</span>
          <span>© 2026 Parqlet</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="plh-main">
        <header className="plh-head">
          <span className="plh-head-title">The Condominium Complex</span>
          <div className="plh-head-right">
            <span className="plh-ico">☾</span>
            <span className="plh-ico">◔</span>
            <span className="plh-avatar">SJ</span>
            <span className="plh-whoami">
              <b>Sarah Johnson</b>
              <i>Admin</i>
            </span>
            <span className="plh-ico plh-ico-sm">⌄</span>
            <span className="plh-ico">?</span>
          </div>
        </header>

        <div className="plh-body">
          <h2 className="plh-h2">Bookings</h2>
          <p className="plh-sub">View current bookings and complete booking history</p>

          {/* Underlined text tabs, not pills. */}
          <div className="plh-tabs">
            {TABS.map((t) => (
              <div key={t.id} className={`plh-tab${t.id === tab ? " is-active" : ""}`}>
                {t.label}
              </div>
            ))}
          </div>

          <div className="plh-toolbar">
            <div className="plh-search">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke={C.textWeaker} strokeWidth={1.8} />
                <path d="m20 20-3.6-3.6" stroke={C.textWeaker} strokeWidth={1.8} strokeLinecap="round" />
              </svg>
              <span>Search by unit, spot, resident, spot owner, guest, or plate</span>
            </div>
            <div className="plh-filters">
              {["Notes", "Status", "Sort", "Date range"].map((f) => (
                <span key={f} className="plh-filter">{f} <i>⌄</i></span>
              ))}
            </div>
          </div>

          <div className="plh-table">
            <div className="plh-thead">
              {COLS.map((c) => (
                <span key={c.key} className={`plh-c-${c.key} ${c.cls}`}>
                  <span className="plh-celltxt">{c.label}</span>
                </span>
              ))}
            </div>
            {/* keyed by tab so every switch replays the stagger */}
            <div className="plh-rows" key={tab}>
              {rows.map((r, i) => {
                const isFeatured = flash && r.id === FEATURED.id;
                return (
                  <div
                    key={r.id}
                    className={`plh-row${isFeatured ? " is-flash" : ""}`}
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    {COLS.map((c) => {
                      const hasPhone = c.cls.includes("plh-hasphone");
                      return (
                        <span key={c.key} className={`plh-c-${c.key} ${c.cls}`}>
                          {/* The handset is a sibling of a truncating span,
                              not a trailing child of one. Inline after the
                              text it dropped onto a second line as soon as
                              the name needed ellipsing. */}
                          {hasPhone ? (
                            <span className="plh-celltxt">{r[c.key]}</span>
                          ) : c.key === "status" ? (
                            <StatusPill status={r.status} />
                          ) : (
                            r[c.key]
                          )}
                          {hasPhone && <PhoneGlyph />}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <div className="plh-tfoot">
              <span>Showing 1 to {rows.length} of 28 bookings</span>
              <span className="plh-pager">
                Rows per page <i>10</i> <i>‹</i> <b>1</b> <i>2</i> <i>3</i> <i>›</i>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The little handset beside every name column in the real table. */
function PhoneGlyph() {
  return (
    <svg className="plh-phglyph" width={13} height={13} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 3.5h2l1.4 3.5-1.8 1.2a11 11 0 0 0 5.2 5.2l1.2-1.8L18.5 13v2a2 2 0 0 1-2.2 2A14.5 14.5 0 0 1 5 5.7 2 2 0 0 1 7 3.5"
        stroke={C.textWeaker}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PHONE

   Two screens from the resident app, rebuilt in HTML: the booking
   confirmation splash (app/booking/confirmed.tsx) and the home tab
   (app/(tabs)/home.tsx) with the booking sitting in Upcoming.

   Rebuilt rather than ported - the app is React Native, and its
   StyleSheet does not run in a browser. The palette, radii, spacing
   and copy are taken from those files so it reads as the same product.
   ══════════════════════════════════════════════════════════════════ */

function CheckSplash() {
  return (
    <div className="plh-splash">
      <span className="plh-halo" />
      <svg width={64} height={64} viewBox="0 0 64 64" fill="none" aria-hidden>
        <rect x="6" y="6" width="52" height="52" rx="17" fill={C.accent} />
        <rect x="6" y="6" width="52" height="52" rx="17" fill="url(#plhg)" />
        <path d="M20 33.5 28.5 42 45 24" stroke={C.white} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="plhg" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="1" stopColor="#8FAE16" stopOpacity="0.35" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/** Tab-bar glyphs, 24x24 like the app's. */
const TAB_ICONS: Record<string, string> = {
  Home: "M3 10.6 12 3.5l9 7.1V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  Availability: "M12 7v5l3.2 1.9M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18",
  Bookings: "M7 3v3M17 3v3M3.5 9.5h17M5 6h14a1.5 1.5 0 0 1 1.5 1.5V19A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6",
  Profile: "M18 20v-1.6a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4V20M12 11.2a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2",
};

function Hourglass() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4.7 6.9A5.3 5.3 0 0 0 8 8a5.3 5.3 0 0 0 3.3-1.1c2.2-1.8 1-3.9.4-6H4.3c-.6 2.1-1.8 4.2.4 6" stroke={C.textStrong} strokeWidth={1.1} strokeLinejoin="round" />
      <path d="M4.7 9.1A5.3 5.3 0 0 1 8 8a5.3 5.3 0 0 1 3.3 1.1c2.2 1.8 1 3.9.4 6H4.3c-.6-2.1-1.8-4.2.4-6" stroke={C.textStrong} strokeWidth={1.1} strokeLinejoin="round" />
      <path d="M8 11.4c0-.8.4-1.3 1-1.8H7c.6.5 1 1 1 1.8" fill={C.textStrong} />
    </svg>
  );
}

/** The spot pill + EV bolt + countdown that heads every booking card. */
function CardTop({ note }: { note: string }) {
  return (
    <div className="plh-ph-cardtop">
      <span className="plh-spotpill">P #{FEATURED.spot}</span>
      <span className="plh-bolt">
        <svg width={13} height={16} viewBox="0 0 24 24" aria-hidden>
          <path d="M13 2 4 14h6l-1 8 9-12h-6z" fill={C.accent} stroke={C.accent} strokeWidth={1.4} strokeLinejoin="round" />
        </svg>
      </span>
      <span className="plh-ph-startsin"><Hourglass /> {note}</span>
    </div>
  );
}

/** The booking card, identical on both screens because it is one card. */
function BookingCard({ note, status }: { note: string; status: "Upcoming" | "Active" }) {
  return (
    <div className="plh-ph-card">
      <CardTop note={note} />
      <div className="plh-ph-namerow">
        <span className="plh-ph-name">{FEATURED.guest}</span>
        <span
          className="plh-pill plh-ph-statuspill"
          style={
            status === "Active"
              ? { background: C.tagActive, color: C.tagActiveText }
              : { background: C.tagUpcoming, color: C.tagUpcomingText }
          }
        >
          {status}
        </span>
      </div>
      <div className="plh-ph-row"><span>Model &amp; make</span><b>{FEATURED.vehicle} • {FEATURED.plate}</b></div>
      <div className="plh-ph-row"><span>Date and time</span><b>{FEATURED.whenApp}</b></div>
      <span className="plh-manage">Manage booking</span>
    </div>
  );
}

function PhoneConfirmed({ pressing }: { pressing: boolean }) {
  return (
    <div className="plh-screen">
      <CheckSplash />
      <h3 className="plh-ph-title">Parking spot for your guest is confirmed!</h3>
      <p className="plh-ph-sub">
        Your guest can park during the selected time. Spot details are shown below
      </p>

      <BookingCard note={FEATURED.startsIn} status="Upcoming" />

      <div className="plh-ph-ctas">
        <div className="plh-btn plh-btn-primary">Book one more spot</div>
        <div className={`plh-btn plh-btn-secondary${pressing ? " is-pressed" : ""}`}>
          Go to home screen
          {pressing && <span className="plh-touch" />}
        </div>
      </div>
    </div>
  );
}

function PhoneHome() {
  return (
    <div className="plh-screen plh-screen-home">
      <div className="plh-ph-appbar">
        <span className="plh-wordmark">PARQLET</span>
        <span className="plh-credits">
          <i className="plh-star">★</i> {FEATURED.credits} Credits
        </span>
      </div>

      <span className="plh-ph-section"><i /> UPCOMING GUEST BOOKING</span>
      <div className="plh-ph-cardwrap">
        <BookingCard note={FEATURED.startsIn} status="Upcoming" />
      </div>

      <div className="plh-promo">
        <b>Book parking for your guest</b>
        <span>Reserve a spot in seconds</span>
        <span className="plh-promo-cta">Book parking spot →</span>
        <span className="plh-promo-cal">📅</span>
        <span className="plh-promo-car">🚗</span>
      </div>

      <div className="plh-avail">
        <div className="plh-avail-txt">
          <b>Add availability for your parking spot</b>
          <span>Earn credits while sharing your spot</span>
        </div>
        <span className="plh-avail-cta">Add +</span>
      </div>

      <div className="plh-tabbar">
        {["Home", "Availability", "Bookings", "Profile"].map((l) => (
          <span key={l} className={l === "Home" ? "is-on" : ""}>
            <svg width={23} height={23} viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d={TAB_ICONS[l]} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Reading `?scene=N`, after mount.
 *
 * Read during render it produced a hydration mismatch - the server had no
 * query string and rendered scene 0 while the browser rendered scene N, and
 * the row ids differed. An effect is the boring answer and the correct one:
 * the first client render matches the HTML, and the pin applies a tick
 * later. A review aid can afford one frame.
 */
function readPinnedScene(): number | null {
  const raw = new URLSearchParams(window.location.search).get("scene");
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n < SCENES.length ? n : null;
}

/* ══════════════════════════════════════════════════════════════════
   THE FILM
   ══════════════════════════════════════════════════════════════════ */
export default function LandingHero() {
  /**
   * `?scene=N` freezes the film on one beat.
   *
   * A review aid, and the only practical way to check a given frame: a
   * headless screenshot of a timeline-driven page catches it mid-transition
   * and shows a state the film never actually rests in. Pinning renders the
   * beat exactly as a viewer sees it once it settles. Harmless unpinned -
   * no link carries the parameter.
   */
  const [pinned, setPinned] = useState<number | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setPinned(readPinnedScene()), 0);
    return () => clearTimeout(t);
  }, []);

  const [i, setI] = useState(0);
  const [running, setRunning] = useState(false);
  const [reduced, setReduced] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // Reduced motion: show the end of the story rather than animating to it.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Only run while on screen. A looping film in a scrolled-past hero is
  // main-thread cost for nobody - the same reason the dashboard's step
  // ticker is gated on visibility.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => setRunning(true), 0);
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(([e]) => setRunning(e.isIntersecting), {
      rootMargin: "100px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!running || reduced || pinned !== null) return;
    const id = setTimeout(() => setI((n) => (n + 1) % SCENES.length), SCENES[i].hold);
    return () => clearTimeout(id);
  }, [i, running, reduced, pinned]);

  const scene = useMemo<Scene>(
    () =>
      reduced
        ? { hold: 0, tab: "future", phone: "home", cursor: null, flash: true }
        : SCENES[pinned ?? i],
    [i, reduced, pinned],
  );

  return (
    <section className="plh-root" aria-label="Parqlet product demo">
      <style>{CSS}</style>

      {/* ── Backdrop: the landing hero's grid + lime bloom ── */}
      <div className="plh-grid" aria-hidden />
      <div className="plh-glow" aria-hidden />

      <div className="plh-copy">
        <span className="plh-eyebrow">Live in select high-rise buildings in Austin, TX</span>
        <h1 className="plh-h1">
          Not enough <span>guest parking</span>? Meet Parqlet
        </h1>
        <p className="plh-lede">
          Parqlet is a peer-to-peer platform where residents securely share unused
          parking with neighbors and earn credits toward rewards.
        </p>
        <div className="plh-cta">Book a demo <span aria-hidden>→</span></div>
      </div>

      {/* The stage is inert: a film, not a control surface. */}
      <div className="plh-stage" ref={stageRef} aria-hidden>
        {/* Full container width, so the dashboard can be drawn at its REAL
            dimensions - 256px sidebar, 64px header, 14px body text - rather
            than a shrunken approximation of them. */}
        <div className="plh-frame plh-frame-dash">
          <Dashboard tab={scene.tab} flash={!!scene.flash} />

          {/* The cursor lives INSIDE the dashboard frame and is positioned in
              pixels, not stage percentages. The tabs it clicks are at fixed
              offsets from this box (sidebar + padding), so pixels land on them
              at any viewport; percentages of a stage that changes height with
              the phone's overhang did not. */}
          <div
            className={`plh-cursor${scene.cursor ? " is-on" : ""}${scene.pressCursor ? " is-click" : ""}`}
            style={
              {
                "--plh-x": `${(scene.cursor ?? TAB_HIT.current).x}px`,
                "--plh-y": `${(scene.cursor ?? TAB_HIT.current).y}px`,
              } as React.CSSProperties
            }
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 2.5 19 11l-6.2 1.6L10 19.5z" fill={C.white} stroke={C.textStrong} strokeWidth={1.2} strokeLinejoin="round" />
            </svg>
            <span className="plh-ripple" />
          </div>
        </div>

        {/* Floats over the dashboard on desktop; drops below it on a phone,
            where there is no room to overlap anything. */}
        <div className="plh-frame plh-frame-phone">
          <div className="plh-phone">
            {/* Everything inside is laid out at 390px, the app's real design
                width, and scaled to the device box by this one element. */}
            <div className="plh-scale">
            <span className="plh-statusbar">
              <span className="plh-sb-time">9:41</span>
              <span className="plh-notch" />
              <span className="plh-sb-icons">▮▮▮ ⌁</span>
            </span>
            <div className={`plh-screenwrap${scene.phone === "home" ? " is-home" : ""}`}>
              <div className="plh-slide plh-slide-a">
                <PhoneConfirmed pressing={!!scene.pressTouch} />
              </div>
              <div className="plh-slide plh-slide-b">
                <PhoneHome />
              </div>
            </div>
            <span className="plh-homebar" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STYLES

   Scoped by a `plh-` prefix and injected with the component, so the
   file stays portable - there is no stylesheet to remember to copy.
   ══════════════════════════════════════════════════════════════════ */
const CSS = `
.plh-root{
  position:relative;overflow-x:clip;isolation:isolate;max-width:100vw;
  background:${C.heroBg};
  padding:72px 24px 0;
  font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  -webkit-font-smoothing:antialiased;
}
@media(max-width:760px){ .plh-root{padding:48px 16px 0;} }

/* Backdrop ─────────────────────────────────────────────── */
.plh-grid{
  position:absolute;inset:0;pointer-events:none;z-index:0;
  background-image:
    linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);
  background-size:136px 136px;
  animation:plh-fade 1.6s ease-out both;
}
@media(max-width:1024px){ .plh-grid{background-size:68px 68px;} }
.plh-glow{
  position:absolute;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse at 50% 42%,rgba(199,229,31,.17) 0%,rgba(59,109,17,.09) 38%,transparent 66%);
  animation:plh-bloom 2s cubic-bezier(.16,1,.3,1) both;
}
@keyframes plh-fade{from{opacity:0}to{opacity:1}}
@keyframes plh-bloom{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}

/* Copy ─────────────────────────────────────────────────── */
.plh-copy{position:relative;z-index:2;max-width:760px;margin:0 auto;text-align:center;}
.plh-eyebrow{
  display:inline-block;padding:7px 18px;border-radius:999px;
  background:rgba(255,255,255,.08);color:${C.white};
  font-size:10px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;
  animation:plh-in .9s cubic-bezier(.16,1,.3,1) .05s both;
}
.plh-h1{
  margin:20px 0 0;color:${C.white};font-weight:400;
  font-size:52px;line-height:1.06;letter-spacing:-.02em;
  animation:plh-in 1s cubic-bezier(.16,1,.3,1) .16s both;
}
.plh-h1 span{color:${C.accent};}
.plh-lede{
  margin:18px auto 0;max-width:580px;color:rgba(255,255,255,.72);
  font-size:17px;line-height:1.55;
  animation:plh-in 1s cubic-bezier(.16,1,.3,1) .28s both;
}
.plh-cta{
  display:inline-flex;align-items:center;gap:8px;margin-top:28px;
  padding:13px 26px;border-radius:10px;background:${C.accent};color:${C.textStrong};
  font-size:15px;font-weight:500;
  animation:plh-in 1s cubic-bezier(.16,1,.3,1) .4s both;
}
@keyframes plh-in{
  from{opacity:0;transform:translateY(24px);filter:blur(8px)}
  to{opacity:1;transform:none;filter:blur(0)}
}
@media(max-width:760px){
  .plh-h1{font-size:30px;}
  .plh-lede{font-size:15px;}
}

/* Stage ────────────────────────────────────────────────── */
.plh-stage{
  position:relative;z-index:2;
  margin:120px auto 0;max-width:1240px;
  pointer-events:none; /* a film, not a control surface */
}

/* The glass frames, to the supplied spec. */
.plh-frame{
  border:1px solid #fff;
  border-radius:.75em .75em 0 0;
  padding-top:.75em;padding-left:.75em;padding-right:.75em;
  position:relative;
  box-shadow:0 0 30px #5a7a1126;
  background:rgba(255,255,255,.07);
  -webkit-backdrop-filter:blur(14px) saturate(140%);
  backdrop-filter:blur(14px) saturate(140%);
  animation:plh-rise 1.1s cubic-bezier(.16,1,.3,1) .5s backwards;
  transition:transform .65s cubic-bezier(.16,1,.3,1),right .65s cubic-bezier(.16,1,.3,1);
}
.plh-frame-dash{width:100%;min-width:0;}

/* The phone hangs over the dashboard's top-right corner: 15% in from the
   right edge, lifted 100px so it breaks the frame line. z-index puts it
   above the dashboard rather than beside it. */
.plh-frame-phone{
  position:absolute;right:15%;top:-100px;z-index:5;
  animation-delay:.68s;
  /* NO width. It was 300px, and because the frame is border-box that left
     a 274px content box holding a 300px phone - the phone hung out past
     its own frame by 26px, which is the misfit. Sizing to the content
     makes the frame exactly the phone plus its padding, whatever the
     phone's width becomes. */
  width:max-content;
  /* The frame traces the phone's corners rather than cutting across them:
     the phone's 38px radius plus the 12px of padding between the two. A
     12px radius around a 38px-rounded device reads as a mistake. */
  border-radius:50px 50px 0 0;
}
@keyframes plh-rise{
  from{opacity:0;transform:translateY(42px) scale(.985)}
  to{opacity:1;transform:none}
}

/* Wide screens only: hovering the hero steps the phone out to the right
   and eases the dashboard left, so the whole table is readable without
   losing the overlap that makes the composition. Narrower than the
   threshold there is no room to move into, so nothing moves.

   The hover sits on the section, not on the stage: the stage is
   pointer-events:none and would never receive one.

   This is also why the frames' entrance animation uses a backwards
   fill rather than both: a both-fill keeps the animation's final
   transform forever and
   silently wins over anything hover sets here. */
/* A ladder, because how far the two can separate depends entirely on how
   much margin the 1240-wide stage has beside it. Shifting the dashboard
   left by more than that margin just pushes it under the clip and the
   left edge disappears.

   1280 is where the stage first has room, but only ~20px of it - enough
   to step the phone across, not enough to move the dashboard at all. The
   real separation starts at 1400 (a "1920" monitor is ~1420 CSS pixels
   once display scaling is applied, so that is the tier most machines
   actually land on) and opens up further from there.

   A negative right offset is deliberate past that point: the phone is meant to
   break out beyond the stage's edge, not stop politely at it. */
@media(min-width:1280px){
  .plh-root:hover .plh-frame-phone{right:2%;}
}
@media(min-width:1400px){
  .plh-root:hover .plh-frame-phone{right:-2%;}
  .plh-root:hover .plh-frame-dash{transform:translateX(-70px);}
}
@media(min-width:1700px){
  .plh-root:hover .plh-frame-phone{right:-5%;}
  .plh-root:hover .plh-frame-dash{transform:translateX(-100px);}
}
/* Top tier starts at 1900 and travels a further ~50px each way than the
   one below it. There is room: at 1900 the stage has 330px of margin
   beside it, so -180px still leaves the dashboard's left edge 150px
   inside the viewport, and -12% puts the phone 149px past the stage edge
   with ~180px to spare. */
@media(min-width:1900px){
  .plh-root:hover .plh-frame-phone{right:-12%;}
  .plh-root:hover .plh-frame-dash{transform:translateX(-180px);}
}

/* ── Narrow: nothing overlaps anything. Dashboard first, phone under it,
      both in normal flow and centred. An absolutely-positioned phone on a
      390px screen would sit on top of the only thing worth reading. ── */
@media(max-width:900px){
  .plh-stage{margin-top:44px;display:flex;flex-direction:column;align-items:center;gap:26px;}
  .plh-frame-phone{position:static;right:auto;top:auto;width:300px;}
}

/* Dashboard ────────────────────────────────────────────── */
/* Real dimensions - 256px sidebar, 14px body text - which is the whole
   reason the frame is full width. Height is 450px: 150 shorter than the
   first cut, which was mostly empty table. */
.plh-dash{
  display:flex;height:450px;overflow:hidden;min-width:0;max-width:100%;
  border-radius:9px 9px 0 0;background:${C.fillWeak};
  font-size:14px;color:${C.textStrong};
}
@media(max-width:900px){ .plh-dash{height:400px;font-size:12px;} }
.plh-side{
  width:256px;flex:0 0 256px;background:${C.sidebarBg};
  display:flex;flex-direction:column;padding-bottom:14px;
}
@media(max-width:1040px){ .plh-side{width:200px;flex-basis:200px;} }
@media(max-width:700px){ .plh-side{display:none;} }
.plh-side-logo{
  height:60px;display:flex;align-items:center;padding:0 24px;flex:0 0 60px;
  color:${C.white};font-size:17px;font-weight:800;letter-spacing:-.02em;font-style:italic;
}
.plh-nav{display:flex;flex-direction:column;gap:4px;padding:0 16px;flex:1 1 auto;}
.plh-nav-item{
  display:flex;align-items:center;gap:10px;height:42px;padding:0 16px;
  border-radius:8px;color:${C.sidebarText};font-size:14px;white-space:nowrap;
  transition:background .3s ease,color .3s ease;
}
.plh-nav-item.is-active{background:${C.sidebarItemActive};color:${C.accent};}
.plh-side-foot{
  display:flex;flex-direction:column;gap:5px;padding:0 24px;
  font-size:11px;color:#6E6E6E;
}
.plh-main{flex:1 1 0;min-width:0;display:flex;flex-direction:column;background:${C.fillWeak};}
.plh-head{
  height:60px;flex:0 0 60px;display:flex;align-items:center;justify-content:space-between;
  padding:0 22px;background:${C.white};border-bottom:1px solid ${C.strokeMedium};
}
@media(max-width:900px){ .plh-head{height:50px;flex-basis:50px;padding:0 14px;} }
.plh-head-title{font-size:16px;font-weight:500;}
.plh-head-right{display:flex;align-items:center;gap:12px;}
.plh-ico{font-size:14px;color:${C.textWeak};}
.plh-ico-sm{font-size:11px;}
.plh-avatar{
  width:30px;height:30px;border-radius:999px;background:${C.strokeMedium};
  display:grid;place-items:center;font-size:11px;font-weight:600;color:${C.textStrong};
}
.plh-whoami{display:flex;flex-direction:column;line-height:1.15;}
.plh-whoami b{font-size:13px;font-weight:600;}
.plh-whoami i{font-size:11px;font-style:normal;color:${C.textWeak};}
@media(max-width:1180px){ .plh-whoami{display:none;} }

.plh-body{flex:1 1 0;min-height:0;padding:16px 22px 0;display:flex;flex-direction:column;}
@media(max-width:900px){ .plh-body{padding:12px 14px 0;} }
.plh-h2{margin:0;font-size:26px;line-height:31px;font-weight:400;letter-spacing:-.01em;}
.plh-sub{margin:3px 0 0;font-size:13px;color:${C.textWeak};}

/* Underlined text tabs - the real ones are not pills. */
.plh-tabs{display:flex;gap:28px;margin-top:12px;border-bottom:1px solid ${C.strokeMedium};}
.plh-tab{
  padding:0 0 9px;font-size:14px;color:${C.textWeak};font-weight:400;
  border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap;
  transition:color .24s ease,border-color .24s ease;
}
.plh-tab.is-active{color:${C.textStrong};font-weight:600;border-bottom-color:${C.textStrong};}
/* Three two-word tabs do not fit across a phone at 14px. */
@media(max-width:900px){
  .plh-tabs{gap:16px;}
  .plh-tab{font-size:12px;padding-bottom:7px;}
}
@media(max-width:520px){ .plh-tabs{gap:12px;} .plh-tab{font-size:11px;} }

.plh-toolbar{display:flex;align-items:center;gap:12px;margin-top:12px;}
.plh-search{
  flex:1 1 auto;min-width:0;height:36px;display:flex;align-items:center;gap:9px;
  padding:0 14px;border-radius:9px;background:${C.white};
  border:1px solid ${C.strokeMedium};color:${C.textWeaker};font-size:13px;
}
.plh-search span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.plh-filters{display:flex;gap:8px;flex:0 0 auto;}
.plh-filter{
  height:36px;display:flex;align-items:center;gap:7px;padding:0 13px;
  border-radius:9px;background:${C.white};border:1px solid ${C.strokeMedium};
  font-size:13px;color:${C.textStrong};white-space:nowrap;
}
.plh-filter i{font-style:normal;font-size:10px;color:${C.textWeak};}
@media(max-width:1280px){ .plh-filters{display:none;} }

.plh-table{
  flex:1 1 0;min-height:0;min-width:0;background:${C.white};margin-top:12px;
  border:1px solid ${C.strokeMedium};border-radius:12px 12px 0 0;overflow:hidden;
  display:flex;flex-direction:column;
}
.plh-thead{
  display:flex;gap:10px;padding:10px 18px;flex:0 0 auto;
  border-bottom:1px solid ${C.strokeMedium};
  font-size:10px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:${C.textWeaker};
}
.plh-thead span,.plh-row span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.plh-thead .plh-phglyph{display:none;}

/* Column widths live here, not in the JSX. As inline styles they beat any
   media query, so the narrow layout could not drop or shrink a column and
   the table forced the whole page wider than the viewport.

   Columns leave in order of how little they carry. What survives at 430px
   is the booking, the spot, when it starts and its status. */
.plh-c-id{flex:0 0 72px}
.plh-c-unit{flex:0 0 48px}
.plh-c-resident{flex:1 1 104px}
.plh-c-spot{flex:0 0 76px}
.plh-c-owner{flex:1 1 104px}
.plh-c-guest{flex:1 1 104px}
.plh-c-plate{flex:0 0 90px}
.plh-c-start{flex:0 0 100px}
.plh-c-end{flex:0 0 100px}
.plh-c-status{flex:0 0 86px}
@media(max-width:1440px){ .plh-c-owner{display:none} }
@media(max-width:1260px){ .plh-c-end{display:none} }
@media(max-width:1100px){ .plh-c-plate{display:none} }
@media(max-width:900px){ .plh-c-guest{display:none} }
@media(max-width:700px){
  .plh-c-resident{display:none}
  .plh-c-unit{flex:0 0 38px}
  .plh-c-id{flex:0 0 64px}
  .plh-c-spot{flex:0 0 52px}
  .plh-c-start{flex:1 1 78px}
  .plh-c-status{flex:0 0 84px}
  .plh-pill{font-size:10px;padding:4px 8px;}
}
@media(max-width:520px){ .plh-c-unit{display:none} }
.plh-rows{flex:1 1 0;min-height:0;}
.plh-row{
  display:flex;gap:10px;align-items:center;padding:0 18px;height:50px;
  border-bottom:1px solid ${C.strokeWeak};font-size:13px;color:${C.textStrong};
  animation:plh-row-in .55s cubic-bezier(.16,1,.3,1) both;
}
/* A flex row, so the handset sits beside the name instead of being an
   inline box that wraps the moment the name is too long for the column. */
.plh-hasphone{display:flex;align-items:center;gap:6px;}
.plh-celltxt{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.plh-phglyph{flex:0 0 auto;}
.plh-tfoot{
  flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;
  padding:9px 18px;border-top:1px solid ${C.strokeMedium};
  font-size:12px;color:${C.textWeak};
}
.plh-pager{display:flex;align-items:center;gap:7px;}
.plh-pager i{font-style:normal;padding:2px 6px;border-radius:5px;border:1px solid ${C.strokeMedium};}
.plh-pager b{padding:2px 7px;border-radius:5px;background:${C.textStrong};color:${C.white};}
@media(max-width:900px){
  .plh-row{height:44px;padding:0 12px;font-size:12px;}
  .plh-thead{padding:9px 12px;}
  .plh-tfoot{display:none;}
}
@keyframes plh-row-in{
  from{opacity:0;transform:translateY(8px)}
  to{opacity:1;transform:none}
}
/* The row arriving. One animation rather than two stacked, because the
   entrance and the highlight both want transform, and the second would
   simply win. Scale is nudged from the left edge so the row grows into
   the table instead of drifting sideways. */
.plh-row.is-flash{
  position:relative;z-index:1;transform-origin:left center;
  animation:plh-land 2.6s cubic-bezier(.16,1,.3,1) both;
}
@keyframes plh-land{
  0%{
    opacity:0;transform:translateY(10px) scale(.985);
    background:rgba(199,229,31,.55);
    box-shadow:inset 4px 0 0 ${C.accent},0 6px 18px rgba(199,229,31,.30);
  }
  18%{
    opacity:1;transform:translateY(0) scale(1.018);
    background:rgba(199,229,31,.5);
    box-shadow:inset 4px 0 0 ${C.accent},0 10px 24px rgba(199,229,31,.38);
  }
  55%{
    transform:scale(1.012);background:rgba(199,229,31,.2);
    box-shadow:inset 4px 0 0 ${C.accent},0 6px 16px rgba(199,229,31,.18);
  }
  100%{
    transform:scale(1);background:transparent;
    box-shadow:inset 4px 0 0 transparent,0 0 0 rgba(199,229,31,0);
  }
}
.plh-trunc{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.plh-mono{font-variant-numeric:tabular-nums;letter-spacing:-.01em;}
.plh-pill{
  display:inline-block;padding:4px 10px;border-radius:999px;
  font-size:11px;font-weight:600;white-space:nowrap;
}

/* Phone ──────────────────────────────────────────────────
   DESIGNED AT THE APP'S REAL WIDTH, THEN SCALED.

   The previous pass hand-picked sizes to suit a 300px-wide box, which is
   why it never quite read as the app: every radius, gap and type size was
   a guess at 77% rather than the real value. Now the screen is laid out at
   390px - the width the app is actually designed for - with the app's own
   numbers, and the whole device is scaled down by transform. Proportions
   are therefore exact by construction, and the only thing that changes
   when the device resizes is one number. */
.plh-phone{
  position:relative;width:300px;height:560px;
  border-radius:38px 38px 0 0;background:${C.white};
  overflow:hidden;box-shadow:0 26px 70px rgba(0,0,0,.5);
}
@media(max-width:900px){ .plh-phone{width:290px;height:540px;} }
/* 300 / 390 = .7692 - the factor that maps the design width onto the box. */
.plh-scale{
  position:absolute;top:0;left:0;width:390px;height:728px;
  transform:scale(.7692);transform-origin:top left;
}
@media(max-width:900px){ .plh-scale{transform:scale(.7436);} }

.plh-statusbar{
  position:absolute;top:0;left:0;right:0;height:54px;z-index:4;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 30px;font-size:16px;font-weight:600;color:${C.textStrong};
}
.plh-sb-icons{font-size:12px;letter-spacing:1px;}
.plh-notch{
  position:absolute;top:11px;left:50%;transform:translateX(-50%);
  width:120px;height:33px;border-radius:999px;background:${C.textStrong};
}
.plh-homebar{
  position:absolute;bottom:9px;left:50%;transform:translateX(-50%);z-index:6;
  width:150px;height:5px;border-radius:999px;background:rgba(34,34,34,.32);
}
.plh-screenwrap{position:absolute;inset:0;}
/* The outgoing screen clears FAST and the incoming one arrives slower.
   Cross-fading both over one curve left them legible on top of each other
   through the middle, which reads as a glitch rather than a navigation. */
.plh-slide{position:absolute;inset:0;}
.plh-slide-a{
  opacity:1;transform:translateX(0) scale(1);
  transition:opacity .22s ease-in,transform .55s cubic-bezier(.16,1,.3,1);
}
.plh-slide-b{
  opacity:0;transform:translateX(14%) scale(.99);
  transition:opacity .34s ease-out .2s,transform .62s cubic-bezier(.16,1,.3,1) .12s;
}
.plh-screenwrap.is-home .plh-slide-a{opacity:0;transform:translateX(-8%) scale(.99);}
.plh-screenwrap.is-home .plh-slide-b{opacity:1;transform:translateX(0) scale(1);}

.plh-screen{
  position:absolute;inset:0;padding:66px 20px 0;overflow:hidden;
  display:flex;flex-direction:column;align-items:center;background:${C.white};
}
.plh-screen-home{align-items:stretch;padding-top:62px;}

/* Confirmation */
.plh-splash{position:relative;display:grid;place-items:center;margin-top:10px;}
/* Tight to the icon. It was 190px at .38 behind a 96px check, which read
   as a lens flare rather than a glow. Roughly half the radius, a bit over
   half the opacity, and a far gentler pulse. */
.plh-halo{
  position:absolute;width:104px;height:104px;border-radius:999px;
  background:rgba(184,212,27,.22);filter:blur(13px);
  animation:plh-pulse 2.8s ease-in-out infinite;
}
@keyframes plh-pulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.06);opacity:.9}}
.plh-ph-title{
  margin:26px 0 0;font-size:26px;line-height:32px;font-weight:700;
  color:${C.textStrong};text-align:center;letter-spacing:-.01em;
}
.plh-ph-sub{margin:12px 0 0;font-size:16px;line-height:22px;color:${C.textWeak};text-align:center;}

/* Booking card - one component, both screens. */
.plh-ph-card{
  width:100%;padding:16px;border-radius:20px;
  background:${C.fillWeak};display:flex;flex-direction:column;gap:10px;
}
.plh-ph-cardwrap{animation:plh-card-in .7s cubic-bezier(.16,1,.3,1) .2s both;}
@keyframes plh-card-in{
  from{opacity:0;transform:translateY(14px) scale(.97)}
  to{opacity:1;transform:none}
}
.plh-ph-card{margin-top:22px;}
.plh-ph-cardwrap .plh-ph-card{margin-top:0;}
.plh-ph-cardtop{display:flex;align-items:center;gap:8px;}
.plh-spotpill{
  height:30px;display:inline-flex;align-items:center;padding:0 14px;
  border-radius:999px;background:${C.textStrong};
  color:${C.white};font-size:14px;font-weight:600;white-space:nowrap;
}
.plh-bolt{
  width:40px;height:30px;border-radius:999px;background:${C.white};
  display:inline-flex;align-items:center;justify-content:center;
}
.plh-ph-startsin{
  margin-left:auto;display:inline-flex;align-items:center;gap:6px;
  font-size:14px;font-weight:600;color:${C.textStrong};white-space:nowrap;
}
.plh-ph-namerow{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.plh-ph-name{font-size:26px;line-height:30px;font-weight:700;color:${C.textStrong};white-space:nowrap;}
.plh-ph-statuspill{height:28px;display:inline-flex;align-items:center;padding:0 13px;font-size:14px;}
.plh-ph-row{display:flex;align-items:center;justify-content:space-between;gap:14px;font-size:15px;line-height:21px;color:${C.textWeak};white-space:nowrap;}
.plh-ph-row b{font-size:15px;line-height:21px;font-weight:700;color:${C.textStrong};text-align:right;white-space:nowrap;}
.plh-manage{
  align-self:flex-end;font-size:15px;font-weight:700;color:${C.textStrong};
  text-decoration:underline;
}

.plh-ph-ctas{width:100%;margin-top:auto;padding-bottom:26px;display:flex;flex-direction:column;gap:10px;}
.plh-btn{
  position:relative;overflow:hidden;height:56px;border-radius:14px;
  display:grid;place-items:center;font-size:17px;font-weight:700;
  transition:transform .22s cubic-bezier(.16,1,.3,1),filter .22s ease;
}
.plh-btn-primary{background:${C.accent};color:${C.textStrong};}
.plh-btn-secondary{background:${C.white};color:${C.textStrong};border:1px solid ${C.strokeMedium};}
.plh-btn.is-pressed{transform:scale(.967);filter:brightness(.97);}
.plh-touch{
  position:absolute;left:50%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;
  border-radius:999px;background:rgba(34,34,34,.18);
  animation:plh-touch .62s cubic-bezier(.16,1,.3,1) both;
}
@keyframes plh-touch{
  from{transform:scale(.4);opacity:.85}
  to{transform:scale(8);opacity:0}
}

/* Home tab */
.plh-ph-appbar{display:flex;align-items:center;justify-content:space-between;}
.plh-wordmark{font-size:25px;font-weight:800;font-style:italic;letter-spacing:-.03em;color:${C.textStrong};}
.plh-credits{
  height:40px;display:inline-flex;align-items:center;gap:8px;padding:0 16px;
  border-radius:999px;border:1px solid ${C.strokeMedium};
  background:${C.white};font-size:15px;font-weight:700;color:${C.textStrong};white-space:nowrap;
}
.plh-star{
  width:22px;height:22px;border-radius:999px;background:${C.textStrong};
  color:${C.white};display:inline-grid;place-items:center;font-size:11px;font-style:normal;
}
.plh-ph-section{
  display:flex;align-items:center;gap:9px;margin:12px 0 8px;
  font-size:13px;font-weight:700;letter-spacing:.08em;color:${C.textStrong};
}
.plh-ph-section i{width:9px;height:9px;border-radius:999px;background:${C.accent};}
.plh-promo{
  position:relative;overflow:hidden;margin-top:12px;padding:16px;border-radius:20px;
  background:${C.textStrong};display:flex;flex-direction:column;
}
.plh-promo b{font-size:20px;line-height:25px;font-weight:700;color:${C.white};max-width:210px;}
.plh-promo>span:not(.plh-promo-cta):not(.plh-promo-cal):not(.plh-promo-car){
  margin-top:6px;font-size:15px;color:rgba(255,255,255,.72);
}
.plh-promo-cta{
  align-self:flex-start;margin-top:12px;height:44px;display:inline-flex;align-items:center;
  padding:0 20px;border-radius:12px;
  background:${C.accent};color:${C.textStrong};font-size:16px;font-weight:700;
}
.plh-promo-cal{position:absolute;right:26px;top:20px;font-size:30px;}
.plh-promo-car{position:absolute;right:18px;bottom:16px;font-size:40px;}
.plh-avail{
  margin-top:10px;padding:14px;border-radius:20px;background:${C.fillWeak};
  display:flex;align-items:center;justify-content:space-between;gap:14px;
}
.plh-avail-txt b{display:block;font-size:17px;font-weight:700;color:${C.textStrong};line-height:22px;}
.plh-avail-txt span{display:block;margin-top:5px;font-size:14px;color:${C.textWeak};}
.plh-avail-cta{
  flex:0 0 auto;height:44px;display:inline-flex;align-items:center;padding:0 16px;
  border-radius:12px;background:${C.accent};color:${C.textStrong};font-size:16px;font-weight:700;
}
/* Floating tab bar, as in the app. */
.plh-tabbar{
  position:absolute;left:18px;right:18px;bottom:16px;height:66px;
  display:flex;align-items:center;justify-content:space-around;
  border-radius:999px;background:${C.white};
  box-shadow:0 8px 30px rgba(0,0,0,.16);border:1px solid ${C.strokeWeak};
  font-size:11px;font-weight:600;color:${C.textWeaker};
}
.plh-tabbar span{display:flex;flex-direction:column;align-items:center;gap:4px;}
.plh-tabbar .is-on{color:${C.textStrong};font-weight:700;}

/* Cursor ───────────────────────────────────────────────── */
/* Positioned by transform, not by left/top.
   Two reasons. Animating left/top asks the browser to lay the page out
   again on every frame of a one-second glide; a transform is composited
   and touches no layout at all. And it is unambiguous: the element is
   pinned at the frame's origin and MOVED, so nothing about the
   containing block can quietly relocate it. */
.plh-cursor{
  position:absolute;left:0;top:0;z-index:6;
  opacity:0;
  transform:translate3d(var(--plh-x,0),var(--plh-y,0),0) scale(.9);
  transition:transform 1s cubic-bezier(.33,0,.15,1),opacity .45s ease;
  filter:drop-shadow(0 3px 7px rgba(0,0,0,.45));
  will-change:transform;
}
.plh-cursor.is-on{opacity:1;transform:translate3d(var(--plh-x,0),var(--plh-y,0),0) scale(1);}
.plh-cursor.is-click{transform:translate3d(var(--plh-x,0),var(--plh-y,0),0) scale(.84);}
.plh-ripple{
  position:absolute;left:2px;top:2px;width:14px;height:14px;margin:-7px 0 0 -7px;
  border-radius:999px;border:1.5px solid ${C.accent};opacity:0;
}
.plh-cursor.is-click .plh-ripple{animation:plh-ripple .6s cubic-bezier(.16,1,.3,1) both;}
@keyframes plh-ripple{
  from{transform:scale(.5);opacity:.9}
  to{transform:scale(3.4);opacity:0}
}

@media(prefers-reduced-motion:reduce){
  .plh-root *,.plh-root *::before,.plh-root *::after{
    animation:none!important;transition:none!important;
  }
}
`;
