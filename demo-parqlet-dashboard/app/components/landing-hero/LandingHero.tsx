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
  id: "BK-48217",
  unit: "1412",
  resident: "Elena Ruiz",
  spot: "#135",
  owner: "Daniel Okafor",
  ownerUnit: "1708",
  guest: "Marcus Webb",
  plate: "TX 8KJ-2049",
  vehicle: "Tesla Model 3",
  dayLabel: "Fri, May 16",
  timeLabel: "6:00 PM – 11:00 PM",
  startsIn: "Starts in 3h",
  // One line, so the confirmation card cannot push the CTAs out of frame.
  shortWhen: "Fri, May 16 · 6–11 PM",
  credits: 1,
};

type Row = {
  id: string;
  unit: string;
  resident: string;
  spot: string;
  guest: string;
  plate: string;
  when: string;
  status: "Upcoming" | "Active" | "Completed" | "Cancelled";
};

const FEATURED_ROW: Row = {
  id: FEATURED.id,
  unit: FEATURED.unit,
  resident: FEATURED.resident,
  spot: FEATURED.spot,
  guest: FEATURED.guest,
  plate: FEATURED.plate,
  when: `${FEATURED.dayLabel} · 6:00 PM`,
  status: "Upcoming",
};

const ROWS: Record<"current" | "future" | "past", Row[]> = {
  current: [
    { id: "BK-48203", unit: "0907", resident: "Priya N.",     spot: "#042", guest: "Jonah Feldt",    plate: "TX 4RK-1180", when: "Today · 2:15 PM",  status: "Active" },
    { id: "BK-48198", unit: "2104", resident: "Marcus D.",  spot: "#211", guest: "Ana Petrova",    plate: "TX 9ML-3321", when: "Today · 1:40 PM",  status: "Active" },
    { id: "BK-48191", unit: "0612", resident: "Hannah Lind.",spot: "#088", guest: "Tomas Ruiz",     plate: "TX 2WD-7764", when: "Today · 11:05 AM", status: "Active" },
  ],
  future: [
    FEATURED_ROW,
    { id: "BK-48219", unit: "1806", resident: "Owen B.",   spot: "#174", guest: "Clara Nwosu",    plate: "TX 6PH-0912", when: "Sat, May 17 · 9:00 AM", status: "Upcoming" },
    { id: "BK-48224", unit: "0321", resident: "Sofia B.",  spot: "#029", guest: "Victor Hale",    plate: "TX 1JN-5508", when: "Sun, May 18 · 4:30 PM", status: "Upcoming" },
  ],
  past: [
    { id: "BK-48102", unit: "1105", resident: "Nadia H.",    spot: "#119", guest: "Eli Thornton",   plate: "TX 7QS-2240", when: "May 12 · 7:00 PM", status: "Completed" },
    { id: "BK-48077", unit: "0450", resident: "Jonas E.",   spot: "#061", guest: "Maya Bhatt",     plate: "TX 3CF-8816", when: "May 11 · 5:30 PM", status: "Completed" },
    { id: "BK-48061", unit: "1930", resident: "Camille R.",spot: "#203", guest: "Dev Patel",      plate: "TX 5TG-4493", when: "May 10 · 8:15 PM", status: "Cancelled" },
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
  { id: "current", label: "Current" },
  { id: "future", label: "Upcoming" },
  { id: "past", label: "Past" },
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
  { key: "id",       label: "Booking ID", flex: "0 0 72px",  cls: "plh-mono" },
  { key: "unit",     label: "Unit",       flex: "0 0 40px",  cls: "" },
  { key: "resident", label: "Resident",   flex: "1 1 92px",  cls: "plh-trunc" },
  { key: "spot",     label: "Spot",       flex: "0 0 42px",  cls: "" },
  { key: "guest",    label: "Guest",      flex: "1 1 92px",  cls: "plh-trunc" },
  { key: "plate",    label: "Plate",      flex: "0 0 86px",  cls: "plh-mono plh-col-plate" },
  { key: "when",     label: "When",       flex: "0 0 110px", cls: "plh-trunc" },
  { key: "status",   label: "Status",     flex: "0 0 76px",  cls: "" },
] as const satisfies readonly { key: keyof Row; label: string; flex: string; cls: string }[];

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
  cursor: { x: number; y: number } | null;
  press?: "cursor" | "touch";
  /** Highlights the featured row as it lands. */
  flash?: boolean;
};

const SCENES: Scene[] = [
  // 1. Settle. The phone is on the confirmation splash, dashboard on Current.
  { hold: 1500, tab: "current", phone: "confirmed", cursor: null },
  // 2. A thumb presses "Go to home screen".
  { hold: 700,  tab: "current", phone: "confirmed", cursor: null, press: "touch" },
  // 3. The phone lands on Home, the new booking sitting there as Upcoming.
  { hold: 1900, tab: "current", phone: "home", cursor: null },
  // 4. The cursor arrives and travels to the Upcoming tab.
  { hold: 1100, tab: "current", phone: "home", cursor: { x: 30.5, y: 25.5 } },
  // 5. Click. The dashboard switches, and the same booking flashes in.
  { hold: 600,  tab: "current", phone: "home", cursor: { x: 30.5, y: 25.5 }, press: "cursor" },
  { hold: 2600, tab: "future",  phone: "home", cursor: { x: 30.5, y: 25.5 }, flash: true },
  // 6. On to Past.
  { hold: 900,  tab: "future",  phone: "home", cursor: { x: 38.5, y: 25.5 } },
  { hold: 600,  tab: "future",  phone: "home", cursor: { x: 38.5, y: 25.5 }, press: "cursor" },
  { hold: 2000, tab: "past",    phone: "home", cursor: { x: 38.5, y: 25.5 } },
  // 7. Back to Current, and the cursor leaves.
  { hold: 900,  tab: "past",    phone: "home", cursor: { x: 23.0, y: 25.5 } },
  { hold: 600,  tab: "past",    phone: "home", cursor: { x: 23.0, y: 25.5 }, press: "cursor" },
  { hold: 1800, tab: "current", phone: "home", cursor: { x: 23.0, y: 25.5 } },
  { hold: 1200, tab: "current", phone: "home", cursor: null },
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
  const map = {
    Upcoming:  { bg: C.tagUpcoming, fg: C.tagUpcomingText },
    Active:    { bg: C.tagActive,   fg: C.tagActiveText },
    Completed: { bg: C.tagActive,   fg: C.tagActiveText },
    Cancelled: { bg: C.tagNeutral,  fg: C.tagNeutralText },
  }[status];
  return (
    <span className="plh-pill" style={{ background: map.bg, color: map.fg }}>
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
        <div className="plh-side-logo">
          <svg width={86} height={18} viewBox="0 0 86 18" fill="none" aria-hidden>
            <text x="0" y="14" fill={C.white} fontFamily="Inter, system-ui, sans-serif" fontSize="15" fontWeight="700" letterSpacing="-0.4">
              parqlet
            </text>
          </svg>
        </div>
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
      </aside>

      {/* ── Main ── */}
      <div className="plh-main">
        <header className="plh-head">
          <span className="plh-head-title">Bookings</span>
          <div className="plh-head-right">
            <span className="plh-building">The Meridian</span>
            <span className="plh-avatar">ER</span>
          </div>
        </header>

        <div className="plh-body">
          <div className="plh-tabs">
            {TABS.map((t) => (
              <div key={t.id} className={`plh-tab${t.id === tab ? " is-active" : ""}`}>
                {t.label}
              </div>
            ))}
          </div>

          <div className="plh-table">
            <div className="plh-thead">
              {COLS.map((c) => (
                <span key={c.key} className={c.cls} style={{ flex: c.flex }}>
                  {c.label}
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
                    {COLS.map((c) => (
                      <span key={c.key} className={c.cls} style={{ flex: c.flex }}>
                        {c.key === "status" ? <StatusPill status={r.status} /> : r[c.key]}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
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

function PhoneConfirmed({ pressing }: { pressing: boolean }) {
  return (
    <div className="plh-screen">
      <CheckSplash />
      <h3 className="plh-ph-title">Booking confirmed</h3>
      <p className="plh-ph-sub">
        Reserved. We&apos;ve sent {FEATURED.guest.split(" ")[0]} the details.
      </p>

      <div className="plh-ph-card">
        <div className="plh-ph-cardtop">
          <span className="plh-ph-startsin">⏳ {FEATURED.startsIn}</span>
        </div>
        <div className="plh-ph-namerow">
          <span className="plh-ph-name">{FEATURED.guest}</span>
          <span className="plh-pill" style={{ background: C.tagUpcoming, color: C.tagUpcomingText }}>
            Upcoming
          </span>
        </div>
        <div className="plh-ph-row"><span>Model &amp; make</span><b>{FEATURED.vehicle}</b></div>
        <div className="plh-ph-row"><span>Date &amp; time</span><b>{FEATURED.shortWhen}</b></div>
        <div className="plh-ph-row"><span>Credits paid</span><b>◉ {FEATURED.credits} credit</b></div>
      </div>

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
      <div className="plh-ph-greet">
        <div>
          <span className="plh-ph-hi">Hi, {FEATURED.resident.split(" ")[0]}</span>
          <span className="plh-ph-unit">Unit {FEATURED.unit} · The Meridian</span>
        </div>
        <span className="plh-ph-credits">◉ 4</span>
      </div>

      <div className="plh-ph-hero">
        <span className="plh-ph-herotitle">Need a spot for a guest?</span>
        <span className="plh-ph-herocta">Book a spot</span>
      </div>

      <span className="plh-ph-section">Your bookings</span>

      {/* The booking just made on the previous screen, now on the home tab. */}
      <div className="plh-ph-card plh-ph-card-new">
        <div className="plh-ph-cardtop">
          <span className="plh-ph-startsin">⏳ {FEATURED.startsIn}</span>
        </div>
        <div className="plh-ph-namerow">
          <span className="plh-ph-name">{FEATURED.guest}</span>
          <span className="plh-pill" style={{ background: C.tagUpcoming, color: C.tagUpcomingText }}>
            Upcoming
          </span>
        </div>
        <div className="plh-ph-row"><span>Spot</span><b>{FEATURED.spot}</b></div>
        <div className="plh-ph-row"><span>Date &amp; time</span><b>{FEATURED.shortWhen}</b></div>
      </div>

      <div className="plh-ph-card plh-ph-card-ghost">
        <div className="plh-ph-namerow">
          <span className="plh-ph-name">Clara Nwosu</span>
          <span className="plh-pill" style={{ background: C.tagNeutral, color: C.tagNeutralText }}>
            Completed
          </span>
        </div>
        <div className="plh-ph-row"><span>Spot</span><b>#174</b></div>
      </div>
    </div>
  );
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
  const pinned = useMemo(() => {
    if (typeof window === "undefined") return null;
    const raw = new URLSearchParams(window.location.search).get("scene");
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 && n < SCENES.length ? n : null;
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
          Run guest parking <span>without the front-desk calls</span>
        </h1>
        <p className="plh-lede">
          Residents share the spots they are not using. Guests arrive to a space that is
          already theirs. Management sees every vehicle in the building, in real time.
        </p>
        <div className="plh-cta">Book a demo <span aria-hidden>→</span></div>
      </div>

      {/* The stage is inert: a film, not a control surface. */}
      <div className="plh-stage" ref={stageRef} aria-hidden>
        <div className="plh-frame plh-frame-dash">
          <Dashboard tab={scene.tab} flash={!!scene.flash} />
        </div>

        <div className="plh-frame plh-frame-phone">
          <div className="plh-phone">
            <span className="plh-notch" />
            <div className={`plh-screenwrap${scene.phone === "home" ? " is-home" : ""}`}>
              <div className="plh-slide plh-slide-a">
                <PhoneConfirmed pressing={scene.press === "touch"} />
              </div>
              <div className="plh-slide plh-slide-b">
                <PhoneHome />
              </div>
            </div>
          </div>
        </div>

        {/* Scripted cursor */}
        <div
          className={`plh-cursor${scene.cursor ? " is-on" : ""}${scene.press === "cursor" ? " is-click" : ""}`}
          style={scene.cursor ? { left: `${scene.cursor.x}%`, top: `${scene.cursor.y}%` } : undefined}
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 2.5 19 11l-6.2 1.6L10 19.5z" fill={C.white} stroke={C.textStrong} strokeWidth={1.2} strokeLinejoin="round" />
          </svg>
          <span className="plh-ripple" />
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
  position:relative;overflow:hidden;isolation:isolate;
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
  margin:56px auto 0;max-width:1240px;
  display:flex;align-items:flex-end;justify-content:center;gap:28px;
  pointer-events:none; /* a film, not a control surface */
}
@media(max-width:1100px){ .plh-stage{gap:18px;} }
@media(max-width:860px){ .plh-stage{flex-direction:column;align-items:center;gap:28px;} }

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
  animation:plh-rise 1.1s cubic-bezier(.16,1,.3,1) .5s both;
}
.plh-frame-dash{flex:1 1 0;min-width:0;max-width:860px;}
.plh-frame-phone{flex:0 0 auto;animation-delay:.64s;}
@media(max-width:860px){ .plh-frame-dash{width:100%;} }
@keyframes plh-rise{
  from{opacity:0;transform:translateY(42px) scale(.985)}
  to{opacity:1;transform:none}
}

/* Dashboard ────────────────────────────────────────────── */
.plh-dash{
  display:flex;height:430px;overflow:hidden;
  border-radius:9px 9px 0 0;background:${C.fillWeak};
  font-size:11px;color:${C.textStrong};
}
@media(max-width:860px){ .plh-dash{height:360px;} }
.plh-side{
  width:178px;flex:0 0 178px;background:${C.sidebarBg};
  display:flex;flex-direction:column;padding-bottom:12px;
}
@media(max-width:1100px){ .plh-side{width:150px;flex-basis:150px;} }
@media(max-width:620px){ .plh-side{display:none;} }
.plh-side-logo{height:52px;display:flex;align-items:center;padding:0 16px;}
.plh-nav{display:flex;flex-direction:column;gap:3px;padding:0 10px;}
.plh-nav-item{
  display:flex;align-items:center;gap:9px;height:34px;padding:0 11px;
  border-radius:7px;color:${C.sidebarText};font-size:11px;white-space:nowrap;
  transition:background .3s ease,color .3s ease;
}
.plh-nav-item.is-active{background:${C.sidebarItemActive};color:${C.accent};}
.plh-main{flex:1 1 0;min-width:0;display:flex;flex-direction:column;background:${C.fillWeak};}
.plh-head{
  height:52px;flex:0 0 52px;display:flex;align-items:center;justify-content:space-between;
  padding:0 18px;background:${C.white};border-bottom:1px solid ${C.strokeMedium};
}
.plh-head-title{font-size:14px;font-weight:500;}
.plh-head-right{display:flex;align-items:center;gap:10px;}
.plh-building{font-size:11px;color:${C.textWeak};}
.plh-avatar{
  width:26px;height:26px;border-radius:999px;background:${C.accent};
  display:grid;place-items:center;font-size:10px;font-weight:600;color:${C.textStrong};
}
.plh-body{flex:1 1 0;min-height:0;padding:14px 18px;display:flex;flex-direction:column;gap:12px;}

.plh-tabs{display:flex;gap:6px;}
.plh-tab{
  padding:7px 15px;border-radius:999px;font-size:11px;font-weight:500;
  color:${C.textWeak};background:transparent;border:1px solid transparent;
  transition:background .24s cubic-bezier(.16,1,.3,1),color .24s ease,border-color .24s ease;
}
.plh-tab.is-active{background:${C.textStrong};color:${C.white};}

.plh-table{
  flex:1 1 0;min-height:0;background:${C.white};
  border:1px solid ${C.strokeMedium};border-radius:10px;overflow:hidden;
  display:flex;flex-direction:column;
}
.plh-thead{
  display:flex;gap:8px;padding:9px 14px;flex:0 0 auto;
  border-bottom:1px solid ${C.strokeMedium};background:${C.fillWeak};
  font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:${C.textWeaker};
}
.plh-thead span,.plh-row span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
/* The plate is the first thing to go when the frame narrows - it is the
   least load-bearing column in a marketing still. */
@media(max-width:1180px){ .plh-col-plate{display:none!important;} }
.plh-rows{flex:1 1 0;min-height:0;}
.plh-row{
  display:flex;gap:8px;align-items:center;padding:0 14px;height:48px;
  border-bottom:1px solid ${C.strokeWeak};font-size:11px;color:${C.textWeak};
  animation:plh-row-in .55s cubic-bezier(.16,1,.3,1) both;
}
@keyframes plh-row-in{
  from{opacity:0;transform:translateY(8px)}
  to{opacity:1;transform:none}
}
.plh-row.is-flash{animation:plh-row-in .55s cubic-bezier(.16,1,.3,1) both,plh-flash 2.4s ease-out .25s both;}
@keyframes plh-flash{
  0%{background:rgba(199,229,31,.42);box-shadow:inset 3px 0 0 ${C.accent}}
  70%{background:rgba(199,229,31,.14);box-shadow:inset 3px 0 0 ${C.accent}}
  100%{background:transparent;box-shadow:inset 3px 0 0 transparent}
}
.plh-trunc{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.plh-mono{font-variant-numeric:tabular-nums;letter-spacing:-.01em;}
.plh-pill{
  display:inline-block;padding:4px 9px;border-radius:999px;
  font-size:9px;font-weight:600;white-space:nowrap;
}

/* Phone ────────────────────────────────────────────────── */
.plh-phone{
  position:relative;width:258px;height:430px;
  border-radius:30px 30px 0 0;background:${C.white};
  overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.42);
}
@media(max-width:860px){ .plh-phone{height:360px;} }
.plh-notch{
  position:absolute;top:8px;left:50%;transform:translateX(-50%);
  width:84px;height:20px;border-radius:999px;background:${C.textStrong};z-index:3;
}
.plh-screenwrap{position:absolute;inset:0;}
/* The outgoing screen clears FAST and the incoming one arrives slower.
   Cross-fading both over the same curve left the two legible on top of
   each other through the middle of the transition, which reads as a
   glitch rather than a navigation. iOS does the same thing: the screen
   you are leaving is gone before the one you are entering has settled. */
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
  position:absolute;inset:0;padding:36px 16px 0;overflow:hidden;
  display:flex;flex-direction:column;align-items:center;background:${C.white};
}
.plh-screen-home{align-items:stretch;padding-top:38px;}

.plh-splash{position:relative;display:grid;place-items:center;margin-top:2px;transform:scale(.86);}
.plh-halo{
  position:absolute;width:112px;height:112px;border-radius:999px;
  background:rgba(184,212,27,.22);filter:blur(10px);
  animation:plh-pulse 2.8s ease-in-out infinite;
}
@keyframes plh-pulse{0%,100%{transform:scale(1);opacity:.75}50%{transform:scale(1.12);opacity:1}}
.plh-ph-title{margin:8px 0 0;font-size:16px;font-weight:600;color:${C.textStrong};}
.plh-ph-sub{margin:4px 0 0;font-size:10.5px;line-height:1.45;color:${C.textWeak};text-align:center;}

.plh-ph-card{
  width:100%;margin-top:10px;padding:10px;border-radius:13px;
  background:${C.fillWeak};display:flex;flex-direction:column;gap:6px;
}
.plh-ph-card-new{
  border:1px solid ${C.accentSoft};
  animation:plh-card-in .7s cubic-bezier(.16,1,.3,1) .2s both;
}
@keyframes plh-card-in{
  from{opacity:0;transform:translateY(14px) scale(.97)}
  to{opacity:1;transform:none}
}
.plh-ph-card-ghost{opacity:.5;}
.plh-ph-cardtop{display:flex;align-items:center;justify-content:flex-start;}
.plh-ph-startsin{font-size:9px;color:${C.textWeak};}
.plh-ph-namerow{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.plh-ph-name{font-size:13px;font-weight:600;color:${C.textStrong};}
.plh-ph-row{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:10px;color:${C.textWeak};}
.plh-ph-row b{font-size:10px;font-weight:600;color:${C.textStrong};text-align:right;}

.plh-ph-ctas{width:100%;margin-top:10px;display:flex;flex-direction:column;gap:6px;}
.plh-btn{
  position:relative;overflow:hidden;height:37px;border-radius:11px;
  display:grid;place-items:center;font-size:12px;font-weight:500;
  transition:transform .22s cubic-bezier(.16,1,.3,1),filter .22s ease;
}
.plh-btn-primary{background:${C.accent};color:${C.textStrong};}
.plh-btn-secondary{background:${C.white};color:${C.textStrong};border:1px solid ${C.strokeMedium};}
.plh-btn.is-pressed{transform:scale(.967);filter:brightness(.97);}
.plh-touch{
  position:absolute;left:50%;top:50%;width:18px;height:18px;margin:-9px 0 0 -9px;
  border-radius:999px;background:rgba(34,34,34,.18);
  animation:plh-touch .62s cubic-bezier(.16,1,.3,1) both;
}
@keyframes plh-touch{
  from{transform:scale(.4);opacity:.85}
  to{transform:scale(7);opacity:0}
}

.plh-ph-greet{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
.plh-ph-hi{display:block;font-size:15px;font-weight:600;color:${C.textStrong};}
.plh-ph-unit{display:block;margin-top:2px;font-size:10px;color:${C.textWeak};}
.plh-ph-credits{
  flex:0 0 auto;padding:5px 10px;border-radius:999px;background:${C.fillWeak};
  font-size:10px;font-weight:600;color:${C.textStrong};
}
.plh-ph-hero{
  margin-top:12px;padding:13px;border-radius:14px;background:${C.textStrong};
  display:flex;flex-direction:column;gap:9px;
}
.plh-ph-herotitle{font-size:12px;font-weight:500;color:${C.white};}
.plh-ph-herocta{
  align-self:flex-start;padding:7px 13px;border-radius:9px;
  background:${C.accent};color:${C.textStrong};font-size:10px;font-weight:600;
}
.plh-ph-section{display:block;margin:15px 0 8px;font-size:11px;font-weight:600;color:${C.textStrong};}

/* Cursor ───────────────────────────────────────────────── */
.plh-cursor{
  position:absolute;left:50%;top:50%;z-index:6;
  opacity:0;transform:translate(-2px,-2px) scale(.9);
  transition:left 1s cubic-bezier(.33,0,.15,1),top 1s cubic-bezier(.33,0,.15,1),opacity .45s ease,transform .3s ease;
  filter:drop-shadow(0 3px 7px rgba(0,0,0,.45));
}
.plh-cursor.is-on{opacity:1;transform:translate(-2px,-2px) scale(1);}
.plh-cursor.is-click{transform:translate(-2px,-2px) scale(.84);}
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
