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
 * ONE EXCEPTION, added when the glyphs were replaced with the product's
 * real ones: three image files under `public/landing-hero/` (see ASSET
 * below). The SVG icons are all inlined as markup, but those three are
 * PNG/SVG files whose base64 would be ~90KB of string here. Copy that
 * folder alongside the file, or repoint BASE.
 *
 * Every glyph in here is now COPIED from the thing it depicts, not drawn
 * to resemble it - the sidebar icons out of app/components/icons (which
 * diff clean against web-dashboard's), the bottom-nav icons out of
 * mobile-app/components/ui/TabIcons.tsx, the sandwatch out of its
 * BookingCard. A designer spotted the hand-drawn ones immediately, and
 * the lesson is the same one the type pass learned: measure and copy,
 * never approximate.
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
  tagUpcomingText: "#417893",
  tagActive: "#D2EBC3",
  tagActiveText: "#457D25",
  tagNeutral: "#F8F6F2",
  tagNeutralText: "#3D3D3D",
  tagWarn: "#E5D9AB",
  tagWarnText: "#69644F",
  heroBg: "#222222",
  heroCard: "#222222",
} as const;

/**
 * The home card's artwork, taken from the resident app itself
 * (assets/images/home/car-compact-small.png and calendar-17.png) rather
 * than approximated with emoji - the emoji were both the wrong drawing
 * and, being glyphs, impossible to place against the card's corner.
 *
 * Re-encoded as WebP at twice their on-screen size, which takes 572KB and
 * 248KB down to 7KB and 2.7KB, then inlined so the component still
 * travels as one file.
 */
const ART_CAR =
  "data:image/webp;base64,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";
/**
 * Three files that travel WITH this component, under
 * public/landing-hero/, copied straight out of the app:
 *
 *   il-ev.png               assets/images/booking/il-ev.png
 *   success-check-glow.png  assets/images/onboarding/ (downscaled 1024 -> 256)
 *   ic_credit_basic.svg     assets/images/ic_credit_basic.svg
 *
 * Not base64-inlined like the two card illustrations below, because at
 * their real sizes that is ~90KB of string in a source file. They are
 * the one exception to the "copy one file" note at the top: copy the
 * folder too, and change BASE if it lands somewhere else.
 */
const BASE = "/landing-hero";
const ASSET = {
  ev: `${BASE}/il-ev.png`,
  check: `${BASE}/success-check-glow.png`,
  credit: `${BASE}/ic_credit_basic.svg`,
} as const;

const ART_CALENDAR =
  "data:image/webp;base64,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";

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
  activeNote: "Ends in 2d 4h",
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

const ROWS: Record<OpenTabId, Row[]> = {
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

/**
 * All three tabs are DRAWN. The real page has three, and a dashboard
 * missing one is a dashboard a reader has to wonder about.
 *
 * Only two are ever OPENED - see OpenTabId and SCENES. Past bookings
 * is a third list of the same table, and the loop's first act (the
 * Dashboard page) is a better use of those seconds. So it sits there
 * as a heading, unvisited, exactly as it would if you were watching
 * somebody work in the other two.
 */
const TABS = [
  { id: "current", label: "Current bookings" },
  { id: "future", label: "Upcoming bookings" },
  { id: "past", label: "Past bookings" },
] as const;
type TabId = (typeof TABS)[number]["id"];
/** The tabs the film opens, and the only keys ROWS holds. */
type OpenTabId = Exclude<TabId, "past">;

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
  /** Which dashboard PAGE is open. Bookings is no longer the only one. */
  view: "dashboard" | "bookings";
  tab: OpenTabId;
  phone: "confirmed" | "home";
  /**
   * What the cursor is pointing at, named rather than measured by hand.
   *
   * It used to be literal pixels inside the frame, derived in a comment
   * from "SIDEBAR(256) + BODY_PAD(24) ... half a 34px pill". That
   * arithmetic was already stale - the tabs stopped being pills - and
   * every type change since moved the targets under it without anything
   * failing. Now the element carries `data-hit` and the cursor is placed
   * from its real box, so a padding change cannot leave the pointer
   * clicking empty space.
   */
  target: string | null;
  /** Two separate presses, because the point of the film is that one beat
      carries both: the thumb on the phone and the click on the dashboard
      happen together, not one after the other. */
  pressCursor?: boolean;
  pressTouch?: boolean;
  /** The row lands with the green line and a nudge of scale. */
  flash?: boolean;
  /** The booking has started: both screens say Active, together. */
  active?: boolean;
  /**
   * Pan the table to its right-hand end.
   *
   * The Status column is the payoff of every beat in this film and it
   * sits past the fold of a 1310px table, so without this the row
   * lands and the one thing it is meant to say is off screen. It
   * doubles as the hint that the table scrolls at all, which is not
   * discoverable on a page where nothing else takes a pointer.
   */
  panRight?: boolean;
};

/** Where the cursor rests before it has anywhere to be. */
const HIT_NAV_BOOKINGS = "nav:bookings";

/**
 * THE LOOP, in four acts.
 *
 *   dashboard frame          phone frame
 *   1 Dashboard page         confirmation splash
 *   2 Bookings / Current     confirmation splash
 *   3 Bookings / Upcoming  <- the booking lands here AND on the phone's
 *                             home tab, on the same beat
 *   4 both say Active        both say Active
 *   -> back to 1
 *
 * Act 3 is the whole point of the film and the reason both frames are
 * one component: the row that flashes into the dashboard and the card
 * that appears on the phone are the SAME booking object (FEATURED).
 * Act 4 is new - the booking starting is the one thing that happens to
 * it without anybody touching either screen, so neither press fires.
 */
const SCENES: Scene[] = [
  // ── ACT 1. The Dashboard page, and the phone fresh off a booking. ──
  { hold: 2600, view: "dashboard", tab: "current", phone: "confirmed", target: null },
  // The cursor arrives and reaches for Bookings in the sidebar.
  { hold: 1000, view: "dashboard", tab: "current", phone: "confirmed", target: "nav:bookings" },
  { hold: 600,  view: "dashboard", tab: "current", phone: "confirmed", target: "nav:bookings", pressCursor: true },

  // ── ACT 2. Bookings, on Current. ──
  { hold: 2000, view: "bookings", tab: "current", phone: "confirmed", target: "nav:bookings" },
  { hold: 1000, view: "bookings", tab: "current", phone: "confirmed", target: "tab:future" },

  // ── ACT 3. THE BEAT: the thumb presses "Go to home screen" and the
  //    cursor clicks "Upcoming bookings" at the same instant. ──
  { hold: 650,  view: "bookings", tab: "current", phone: "confirmed", target: "tab:future", pressCursor: true, pressTouch: true },
  { hold: 2200, view: "bookings", tab: "future", phone: "home", target: "tab:future", flash: true },
  // The row has landed; now show what it SAYS. Status is past the fold
  // of a 1310px table, so the beat is only half told until this pans.
  { hold: 2600, view: "bookings", tab: "future", phone: "home", target: null, panRight: true },

  // ── ACT 4. The booking starts, and in doing so changes which list
  //    it belongs to. The cursor reaches for Current bookings... ──
  { hold: 1100, view: "bookings", tab: "future", phone: "home", target: "tab:current" },
  // ...and THE SECOND BEAT: the click lands at the same instant the
  // booking goes live on the phone.
  { hold: 650,  view: "bookings", tab: "future", phone: "home", target: "tab:current", pressCursor: true },
  // It is gone from Upcoming and sitting at the top of Current, Active
  // and highlighted, while the phone card says Active too.
  { hold: 2000, view: "bookings", tab: "current", phone: "home", target: "tab:current", active: true, flash: true },
  // ...and the table pans again, to the pill that now reads Active.
  { hold: 2600, view: "bookings", tab: "current", phone: "home", target: null, active: true, panRight: true },

  // Back to the Dashboard page, and round again.
  { hold: 900,  view: "bookings", tab: "current", phone: "home", target: "nav:dashboard", active: true },
  { hold: 600,  view: "bookings", tab: "current", phone: "home", target: "nav:dashboard", active: true, pressCursor: true },
  { hold: 1600, view: "dashboard", tab: "current", phone: "home", target: null },
];

/* ══════════════════════════════════════════════════════════════════
   ICONS — inline, so the component carries no asset dependencies.
   24x24, currentColor, stroked at 1.5 to sit with the UI's weight.
   ══════════════════════════════════════════════════════════════════ */
/**
 * The dashboard's OWN sidebar glyphs, copied verbatim.
 *
 * These were eight `d` strings I traced by eye, and a designer called it:
 * the frames read as "close, not the same". The real components were in
 * this repo the whole time (app/components/icons), byte-identical to
 * web-dashboard/app/components/icons - verified with diff.
 *
 * COPIED, NOT IMPORTED. The header contract above is that this file goes
 * to the `landing` repo as one piece with React as its only dependency,
 * and an import would quietly add seven more files to that move. The
 * markup below is lifted straight out of those components, so the glyph
 * here and the glyph a logged-in building admin sees are the same
 * drawing - but this file still travels alone.
 */
function NavIcon({ name, color }: { name: string; color: string }) {
  if (name === "dashboard") return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <g transform="translate(3,3)">
      <rect x="1.5"   y="1.5"   width="5.83" height="7.5"  rx="0.83" stroke={color} strokeWidth="1.5" />
      <rect x="10.67" y="1.5"   width="5.83" height="4.17" rx="0.83" stroke={color} strokeWidth="1.5" />
      <rect x="1.5"   y="12.33" width="5.83" height="4.17" rx="0.83" stroke={color} strokeWidth="1.5" />
      <rect x="10.67" y="9"     width="5.83" height="7.5"  rx="0.83" stroke={color} strokeWidth="1.5" />
      </g>
      </svg>
  );
  if (name === "residents") return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <g transform="translate(2.25, 3.25)">
      <path
      d="M9.75 4.30556C9.75 3.36256 9.37072 2.45819 8.69558 1.7914C8.02045 1.1246 7.10478 0.75 6.15 0.75H0.75V14.0833H7.05C7.76608 14.0833 8.45284 14.3643 8.95919 14.8644C9.46554 15.3645 9.75 16.0428 9.75 16.75M9.75 4.30556V16.75M9.75 4.30556C9.75 3.36256 10.1293 2.45819 10.8044 1.7914C11.4795 1.1246 12.3952 0.75 13.35 0.75H18.75V14.0833H12.45C11.7339 14.0833 11.0472 14.3643 10.5408 14.8644C10.0345 15.3645 9.75 16.0428 9.75 16.75"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      </g>
      </svg>
  );
  if (name === "bookings") return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="4.75" y="5.75" width="14.5" height="14.5" rx="1.25" stroke={color} strokeWidth="1.5" />
      <line x1="8"  y1="3" x2="8"  y2="7"  stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="3" x2="16" y2="7"  stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5"  y1="11" x2="19" y2="11" stroke={color} strokeWidth="1.5" />
      </svg>
  );
  if (name === "tickets") return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <path d="M10 9.5C10 8.4 10.9 7.5 12 7.5C13.1 7.5 14 8.4 14 9.5C14 10.3 13.5 11 12.8 11.4L12 11.9V13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="15.5" r="0.75" fill={color} />
      </svg>
  );
  if (name === "subscription") return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="3" stroke={color} strokeWidth="1.5" />
      <line x1="3"  y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.5" />
      <circle cx="7.01" cy="15" r="0.75" fill={color} />
      <line x1="11" y1="15" x2="13" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
  );
  if (name === "settings") return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
      transform="translate(3,3)"
      d="M 7.325 1.317 C 7.751 -0.439 10.249 -0.439 10.675 1.317 C 10.739 1.581 10.864 1.826 11.041 2.032 C 11.217 2.238 11.44 2.4 11.691 2.504 C 11.941 2.608 12.213 2.651 12.484 2.63 C 12.754 2.609 13.016 2.524 13.248 2.383 C 14.791 1.443 16.558 3.209 15.618 4.753 C 15.477 4.985 15.392 5.246 15.372 5.517 C 15.351 5.787 15.394 6.059 15.498 6.309 C 15.601 6.56 15.763 6.783 15.969 6.959 C 16.175 7.136 16.419 7.261 16.683 7.325 C 18.439 7.751 18.439 10.249 16.683 10.675 C 16.419 10.739 16.174 10.864 15.968 11.041 C 15.762 11.217 15.6 11.44 15.496 11.691 C 15.392 11.941 15.349 12.213 15.37 12.484 C 15.391 12.754 15.476 13.016 15.617 13.248 C 16.557 14.791 14.791 16.558 13.247 15.618 C 13.015 15.477 12.754 15.392 12.483 15.372 C 12.213 15.351 11.941 15.394 11.691 15.498 C 11.44 15.601 11.217 15.763 11.041 15.969 C 10.864 16.175 10.739 16.419 10.675 16.683 C 10.249 18.439 7.751 18.439 7.325 16.683 C 7.261 16.419 7.136 16.174 6.959 15.968 C 6.783 15.762 6.56 15.6 6.309 15.496 C 6.059 15.392 5.787 15.349 5.516 15.37 C 5.246 15.391 4.984 15.476 4.752 15.617 C 3.209 16.557 1.442 14.791 2.382 13.247 C 2.523 13.015 2.608 12.754 2.628 12.483 C 2.649 12.213 2.606 11.941 2.502 11.691 C 2.399 11.44 2.237 11.217 2.031 11.041 C 1.825 10.864 1.581 10.739 1.317 10.675 C -0.439 10.249 -0.439 7.751 1.317 7.325 C 1.581 7.261 1.826 7.136 2.032 6.959 C 2.238 6.783 2.4 6.56 2.504 6.309 C 2.608 6.059 2.651 5.787 2.63 5.516 C 2.609 5.246 2.524 4.984 2.383 4.752 C 1.443 3.209 3.209 1.442 4.753 2.382 C 5.753 2.99 7.049 2.452 7.325 1.317 Z"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
      </svg>
  );
  if (name === "notifications") return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
      d="M10 5.5C7.79 6.24 6 8.22 6 10.5V14L4 17H20L18 14V10.5C18 8.22 16.21 6.24 14 5.5M10 5.5C10.1 4.37 10.95 3.5 12 3.5C13.05 3.5 13.9 4.37 14 5.5"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
      d="M9 17V18C9 19.66 10.34 21 12 21C13.66 21 15 19.66 15 18V17"
      stroke={color} strokeWidth="1.5" strokeLinecap="round"
      />
      </svg>
  );
  return null;
}

/**
 * The product's own wordmark, inlined from public/parqlet-logo-light.svg.
 *
 * Inlined rather than referenced as /parqlet-logo-light.svg because this
 * component is meant to be lifted into another repo, where that path does
 * not exist - a broken logo is a worse failure than 9KB of path data. It
 * also saves a request, and the file gzips to very little.
 */
function ParqletLogo() {
  return (
    <svg className="plh-logo" viewBox="0 0 329 85" fill="none" aria-label="Parqlet" role="img">
      <path d="M31.1363 16.7989C34.0505 16.7989 36.6782 17.134 39.0191 17.8028C41.4076 18.4716 43.3899 19.4986 44.9664 20.8839C46.5429 22.2693 47.6422 24.0133 48.2633 26.1153C48.8843 28.1695 48.9078 30.5819 48.3346 33.3526C47.1402 38.8465 44.7044 42.9077 41.026 45.5352C37.3952 48.1627 32.4982 49.4766 26.3355 49.4766H16.6607L13.3648 65.17C13.2693 65.6954 13.0067 66.1256 12.5767 66.46C12.1947 66.7943 11.7407 66.9609 11.2154 66.961H1.46932C0.991695 66.961 0.609454 66.7943 0.322836 66.46C0.0362319 66.1257 -0.0597605 65.6954 0.0357266 65.17L5.05916 41.5089C5.48494 41.5187 5.91069 41.5158 6.30526 41.5157L9.36678 41.5137L20.5299 41.5176C20.4493 41.8233 20.0195 43.4193 20.064 43.587C20.1508 43.6855 20.1983 43.7061 20.3336 43.7139C21.484 43.7804 22.1545 42.4706 22.2584 41.4981C22.6125 41.5135 23.0124 41.5282 23.3726 41.5157C25.5173 41.4418 27.8823 41.6539 29.9947 41.4258C31.313 41.2835 32.7691 39.4468 33.0465 38.213C33.2164 37.4559 33.9198 36.883 34.0504 35.9737C34.0768 35.7893 34.3854 34.3702 34.4176 34.2969V32.084L34.4078 32.0557C34.241 31.5821 34.2346 30.8869 34.0416 30.4044C33.9316 30.1298 33.7962 29.5153 33.6275 29.3096C33.1634 28.7565 33.0726 28.1944 32.8258 27.5596C32.4601 26.6197 31.5412 25.6607 30.6373 25.2208C29.6635 24.7471 28.2369 24.8905 27.1461 24.8907L22.2486 24.8887C22.1885 24.4984 22.1244 24.2039 21.9478 23.8467C21.6372 23.2183 21.0312 22.5907 20.2672 22.7071C20.1817 22.72 20.1103 22.7518 20.0523 22.8184C20.0235 23.0065 20.4409 24.5084 20.5191 24.8741C19.0939 24.9176 17.5865 24.8936 16.1558 24.8936H8.91268L8.58651 24.8926L9.92538 18.5909C10.0209 18.0654 10.2835 17.6352 10.7135 17.3008C11.1433 16.9665 11.5972 16.7989 12.0748 16.7989H31.1363ZM13.3902 39.2999C14.4069 39.2908 20.193 39.3277 20.4801 40.3839L16.1109 40.3887C15.6017 40.3886 14.3479 40.4199 13.9019 40.3555C13.6319 40.0829 13.4292 39.6831 13.3902 39.2999ZM12.8014 39.2872C12.8762 39.7744 13.0163 39.9537 13.3092 40.3204L13.2994 40.3604L13.1207 40.3858L7.90975 40.3868C7.09544 40.3865 6.12918 40.4054 5.30038 40.3692L5.39803 39.9102C5.47697 39.8024 5.55796 39.6967 5.64217 39.5958C5.99886 39.5128 6.69097 39.4776 7.08553 39.4405C8.98224 39.2618 10.9164 39.3597 12.8014 39.2872ZM32.19 37.0645C32.1347 38.0125 31.8708 38.7782 31.3033 39.5596C30.8972 40.1187 30.2896 40.2712 29.6392 40.3526C29.4038 40.3765 29.13 40.375 28.8902 40.379C29.9948 39.7815 31.1516 38.6386 31.8541 37.6163C31.9866 37.4449 32.0847 37.254 32.19 37.0645ZM19.607 27.6426C20.1371 27.5992 23.1948 26.9186 23.3785 27.3008C24.5307 29.7266 24.5337 32.7003 24.3463 35.3282C24.2878 36.1477 23.8078 38.7748 23.2154 39.2589C22.6701 39.3232 19.7114 38.7504 18.9723 38.6563C18.8555 38.6414 18.622 38.5559 18.5142 38.4942C18.2529 38.1271 18.7773 35.6223 18.8424 34.9825C18.9997 33.4039 18.9455 31.8115 18.6822 30.2471C18.6421 29.9953 18.5899 29.7337 18.5582 29.4805C18.3758 28.0221 18.0414 27.869 19.607 27.6426ZM28.9683 26.0294C29.6551 25.9927 30.7388 26.1541 31.1939 26.713C31.6924 27.3251 32.218 28.4297 32.1666 29.2325C32.0759 29.1328 31.9952 29.0136 31.9215 28.9024C31.2451 27.883 30.3892 27.0442 29.3853 26.3497C29.2635 26.2653 29.0534 26.145 28.9683 26.0294ZM8.35116 26.004C10.0341 25.9995 11.7358 26.0049 13.3648 26.0274C13.0087 26.4586 12.9175 26.5672 12.7994 27.126C12.553 27.1057 12.3189 27.1027 12.0719 27.1006C10.7588 27.09 9.44333 27.1031 8.13143 27.0381L8.35116 26.004ZM18.0758 26.0186C18.8775 26.0174 19.7944 25.9974 20.5846 26.0323C19.2199 26.9908 17.3352 26.9978 15.7223 27.0684C14.9908 27.1116 14.0932 27.0961 13.3531 27.0948C13.5009 26.6265 13.5975 26.3881 13.9371 26.0264C14.3182 26.0006 14.9305 26.0197 15.3248 26.0196L18.0758 26.0186Z" fill="currentColor" />
      <path d="M44.4215 67C44.0393 67 43.681 66.8567 43.3466 66.57C43.0599 66.2356 42.9166 65.8773 42.9166 65.4951C42.9166 65.2563 42.9405 65.0413 42.9883 64.8502L59.8284 18.8445C59.9717 18.319 60.2583 17.8652 60.6883 17.483C61.166 17.053 61.8109 16.838 62.6231 16.838H73.2288C74.0409 16.838 74.662 17.053 75.0919 17.483C75.5697 17.8652 75.8802 18.319 76.0235 18.8445L92.7919 64.8502C92.8875 65.0413 92.9352 65.2563 92.9352 65.4951C92.9352 65.8773 92.768 66.2356 92.4336 66.57C92.147 66.8567 91.7887 67 91.3587 67H82.5446C81.828 67 81.2786 66.8328 80.8964 66.4984C80.562 66.1162 80.347 65.7818 80.2514 65.4951L77.4567 58.1858H58.3235L55.6004 65.4951C55.5049 65.7818 55.2899 66.1162 54.9555 66.4984C54.6211 66.8328 54.0478 67 53.2356 67H44.4215ZM61.2616 47.8668H74.5903L67.8543 28.9486L61.2616 47.8668ZM100.375 67C99.8495 67 99.4195 66.8328 99.0851 66.4984C98.7507 66.164 98.5835 65.734 98.5835 65.2085V18.6295C98.5835 18.104 98.7507 17.6741 99.0851 17.3397C99.4195 17.0052 99.8495 16.838 100.375 16.838H119.867C126.029 16.838 130.878 18.2712 134.413 21.1376C137.996 23.9563 139.788 27.9692 139.788 33.1765C139.788 36.5684 138.952 39.4348 137.28 41.7757C135.656 44.1166 133.506 45.8842 130.83 47.0785L140.72 64.7069C140.863 64.9935 140.935 65.2563 140.935 65.4951C140.935 65.8773 140.767 66.2356 140.433 66.57C140.146 66.8567 139.788 67 139.358 67H129.899C128.991 67 128.322 66.785 127.892 66.3551C127.462 65.8773 127.152 65.4474 126.961 65.0652L118.792 49.3H111.411V65.2085C111.411 65.734 111.243 66.164 110.909 66.4984C110.575 66.8328 110.145 67 109.619 67H100.375ZM111.411 39.1959H119.723C121.969 39.1959 123.641 38.6465 124.739 37.5478C125.886 36.449 126.459 34.9441 126.459 33.0332C126.459 31.17 125.91 29.6652 124.811 28.5186C123.76 27.372 122.064 26.7988 119.723 26.7988H111.411V39.1959ZM179.88 71.6579C179.116 71.6579 178.518 71.4429 178.089 71.013C177.706 70.6308 177.396 70.2964 177.157 70.0097L174.721 66.785C172.857 67.4061 170.731 67.7166 168.343 67.7166C163.948 67.7166 160.126 67 156.877 65.5668C153.676 64.1336 151.144 61.9838 149.281 59.1174C147.466 56.2032 146.487 52.5725 146.343 48.2251C146.295 46.1708 146.272 44.1166 146.272 42.0623C146.272 40.0081 146.295 37.9299 146.343 35.8279C146.487 31.5283 147.49 27.9214 149.353 25.0073C151.216 22.0453 153.772 19.8239 157.021 18.3429C160.269 16.8619 164.043 16.1214 168.343 16.1214C172.69 16.1214 176.488 16.8619 179.737 18.3429C182.985 19.8239 185.541 22.0453 187.404 25.0073C189.267 27.9214 190.271 31.5283 190.414 35.8279C190.51 37.9299 190.557 40.0081 190.557 42.0623C190.557 44.1166 190.51 46.1708 190.414 48.2251C190.127 54.149 188.408 58.7352 185.255 61.9838L190.486 69.4364C190.533 69.4842 190.581 69.5798 190.629 69.7231C190.677 69.8664 190.701 70.0097 190.701 70.153C190.748 70.5352 190.629 70.8696 190.342 71.1563C190.056 71.4907 189.697 71.6579 189.267 71.6579H179.88ZM168.343 57.3976C170.875 57.3976 172.929 56.6332 174.506 55.1044C176.13 53.5757 176.99 51.1393 177.085 47.7951C177.181 45.6931 177.229 43.7105 177.229 41.8474C177.229 39.9842 177.181 38.0494 177.085 36.0429C177.038 33.7976 176.631 31.9822 175.867 30.5967C175.103 29.1635 174.076 28.1125 172.786 27.4437C171.496 26.7749 170.015 26.4405 168.343 26.4405C166.718 26.4405 165.261 26.7749 163.972 27.4437C162.682 28.1125 161.655 29.1635 160.89 30.5967C160.126 31.9822 159.72 33.7976 159.672 36.0429C159.624 38.0494 159.6 39.9842 159.6 41.8474C159.6 43.7105 159.624 45.6931 159.672 47.7951C159.767 51.1393 160.604 53.5757 162.18 55.1044C163.804 56.6332 165.859 57.3976 168.343 57.3976ZM200.727 67C200.201 67 199.771 66.8328 199.437 66.4984C199.103 66.164 198.935 65.734 198.935 65.2085V18.6295C198.935 18.104 199.103 17.6741 199.437 17.3397C199.771 17.0052 200.201 16.838 200.727 16.838H210.186C210.664 16.838 211.07 17.0052 211.404 17.3397C211.786 17.6741 211.978 18.104 211.978 18.6295V56.1793H233.619C234.144 56.1793 234.574 56.3704 234.909 56.7526C235.291 57.087 235.482 57.517 235.482 58.0425V65.2085C235.482 65.734 235.291 66.164 234.909 66.4984C234.574 66.8328 234.144 67 233.619 67H200.727ZM243.485 67C242.959 67 242.529 66.8328 242.195 66.4984C241.861 66.164 241.693 65.734 241.693 65.2085V18.6295C241.693 18.104 241.861 17.6741 242.195 17.3397C242.529 17.0052 242.959 16.838 243.485 16.838H276.95C277.476 16.838 277.906 17.0052 278.24 17.3397C278.574 17.6741 278.742 18.104 278.742 18.6295V25.3656C278.742 25.8911 278.574 26.321 278.24 26.6555C277.906 26.9899 277.476 27.1571 276.95 27.1571H254.091V36.8312H275.374C275.899 36.8312 276.329 37.0223 276.663 37.4044C276.998 37.7389 277.165 38.1688 277.165 38.6943V44.9287C277.165 45.4065 276.998 45.8364 276.663 46.2186C276.329 46.553 275.899 46.7202 275.374 46.7202H254.091V56.681H277.523C278.049 56.681 278.479 56.8482 278.813 57.1826C279.148 57.517 279.315 57.947 279.315 58.4725V65.2085C279.315 65.734 279.148 66.164 278.813 66.4984C278.479 66.8328 278.049 67 277.523 67H243.485ZM300.288 67C299.762 67 299.332 66.8328 298.998 66.4984C298.663 66.164 298.496 65.734 298.496 65.2085V28.0886H285.741C285.215 28.0886 284.785 27.9214 284.451 27.587C284.117 27.2048 283.949 26.7749 283.949 26.2972V18.6295C283.949 18.104 284.117 17.6741 284.451 17.3397C284.785 17.0052 285.215 16.838 285.741 16.838H324.294C324.819 16.838 325.249 17.0052 325.584 17.3397C325.918 17.6741 326.085 18.104 326.085 18.6295V26.2972C326.085 26.7749 325.918 27.2048 325.584 27.587C325.249 27.9214 324.819 28.0886 324.294 28.0886H311.538V65.2085C311.538 65.734 311.371 66.164 311.037 66.4984C310.702 66.8328 310.272 67 309.747 67H300.288Z" fill="currentColor" />
    </svg>
  );
}

/**
 * The marketing site's wordmark, inlined from parqlet.com/images/logo.svg.
 *
 * A different lockup from the dashboard's (165x28 against 329x85), which
 * is why it is a second component rather than the same paths recoloured -
 * the resident app's header uses this one. Inlined for the same reason as
 * the other: this component is meant to be lifted into another repo, and
 * a logo fetched by URL would be a cross-origin request that can fail,
 * where a broken wordmark is the most visible failure a hero can have.
 *
 * currentColor on every path, so the dark-on-light it needs here comes
 * from the container rather than from the file.
 */
function ParqletWordmark() {
  return (
    <svg className="plh-wordmark-svg" viewBox="0 0 165 28" fill="none" aria-label="Parqlet" role="img">
      <path d="M15.6675 0.341297C17.1339 0.341297 18.4563 0.509628 19.6343 0.84618C20.8359 1.18267 21.8333 1.69911 22.6264 2.39598C23.4197 3.09313 23.9731 3.97106 24.2856 5.0288C24.5981 6.06241 24.6102 7.27627 24.3218 8.6704C23.7208 11.4347 22.4948 13.4781 20.644 14.8003C18.817 16.1225 16.3525 16.7837 13.2514 16.7837H8.38328L6.72508 24.6811C6.67701 24.9453 6.54463 25.1614 6.3286 25.3296C6.13628 25.4979 5.90748 25.5825 5.64305 25.5825H0.738752C0.498481 25.5824 0.305787 25.4978 0.161603 25.3296C0.0177138 25.1614 -0.0299383 24.9453 0.0180487 24.6811L2.54539 12.7749C2.75966 12.7799 2.97379 12.7779 3.17235 12.7778L4.71336 12.7768L10.3296 12.7798C10.2888 12.9344 10.0738 13.7328 10.0952 13.8198C10.139 13.8697 10.1636 13.8803 10.2319 13.8843C10.8107 13.9176 11.1474 13.2583 11.1997 12.769C11.3778 12.7768 11.579 12.7841 11.7602 12.7778C12.8395 12.7406 14.0302 12.8477 15.0932 12.7329C15.7567 12.6611 16.489 11.7365 16.6284 11.1157C16.714 10.735 17.0675 10.447 17.1333 9.98973C17.1466 9.89704 17.3024 9.18393 17.3188 9.14598V8.03173L17.313 8.01805C17.2291 7.77971 17.2265 7.42981 17.1294 7.187C17.0741 7.04893 17.0062 6.73996 16.9214 6.63622C16.6878 6.3579 16.6422 6.07475 16.518 5.75536C16.3341 5.28237 15.8713 4.79997 15.4165 4.5786C14.9265 4.34017 14.2086 4.41246 13.6597 4.41259L11.1948 4.41161C11.1646 4.21515 11.1323 4.06701 11.0434 3.8872C10.8871 3.57092 10.5823 3.25525 10.1977 3.31395C10.1549 3.32047 10.1194 3.33627 10.0903 3.36962C10.0758 3.46429 10.2854 4.22104 10.3247 4.40477C9.60762 4.42667 8.84921 4.41452 8.12938 4.41454H4.48485L4.31981 4.41356L4.99363 1.24266C5.04171 0.97823 5.17474 0.761526 5.3911 0.59325C5.60731 0.42519 5.83545 0.341321 6.07567 0.341297H15.6675ZM6.73778 11.6626C7.2497 11.658 10.1602 11.6772 10.3052 12.2085L8.10692 12.2114C7.85099 12.2113 7.2205 12.2271 6.99559 12.1948C6.85965 12.0576 6.75734 11.8555 6.73778 11.6626ZM6.4409 11.6567C6.47856 11.902 6.54934 11.9926 6.69676 12.1772L6.69188 12.1968L6.60203 12.2095H3.97996C3.57011 12.2093 3.08361 12.2199 2.66649 12.2016L2.71531 11.9712C2.75524 11.9166 2.79673 11.8631 2.83934 11.812C3.01895 11.7703 3.36654 11.7526 3.56492 11.7339C4.51934 11.644 5.49238 11.6932 6.4409 11.6567ZM16.1977 10.5386C16.1699 11.0155 16.0369 11.4003 15.7514 11.7934C15.5471 12.0748 15.2417 12.1519 14.9145 12.1929C14.7961 12.2049 14.6582 12.2046 14.5376 12.2065C15.0934 11.9059 15.6753 11.3303 16.0288 10.8159C16.0954 10.7297 16.1448 10.6338 16.1977 10.5386ZM9.8657 5.79735C10.132 5.77564 11.6726 5.4327 11.7641 5.62548C12.3439 6.84608 12.3448 8.34224 12.2505 9.66454C12.2211 10.0769 11.9793 11.3997 11.6811 11.6431C11.4055 11.675 9.91809 11.3866 9.54637 11.3393C9.48759 11.3318 9.3701 11.2883 9.3159 11.2573C9.185 11.0713 9.44821 9.81247 9.48094 9.49071C9.56011 8.69641 9.53336 7.89505 9.40086 7.1079C9.38069 6.98118 9.3543 6.84955 9.33836 6.72216C9.24659 5.98822 9.07786 5.91126 9.8657 5.79735ZM14.5766 4.98583C14.9222 4.96739 15.4678 5.04839 15.6968 5.32958C15.9475 5.6376 16.2118 6.19332 16.186 6.59716C16.1404 6.54707 16.1001 6.48705 16.063 6.43114C15.7227 5.9183 15.2916 5.49643 14.7866 5.14696C14.7254 5.10458 14.6196 5.04391 14.5766 4.98583ZM6.72508 4.98485C6.54588 5.20182 6.49936 5.25636 6.43992 5.53759C6.31612 5.52736 6.19884 5.5259 6.07469 5.52489C5.41385 5.51953 4.75156 5.52436 4.09129 5.49169L4.20067 4.97313C5.04799 4.97088 5.9049 4.97352 6.72508 4.98485ZM10.3579 4.9868C9.67133 5.46905 8.72315 5.47279 7.9116 5.50829C7.54362 5.53002 7.0916 5.52263 6.71922 5.52196C6.79366 5.28616 6.84211 5.16602 7.01317 4.98388C7.20482 4.97092 7.51207 4.981 7.71043 4.98095L9.0952 4.97997C9.49861 4.97936 9.96029 4.96923 10.3579 4.9868Z" fill="currentColor" />
      <path d="M151.104 25.6021C150.839 25.6021 150.623 25.518 150.455 25.3497C150.286 25.1814 150.202 24.9651 150.202 24.7006V6.02199H143.784C143.519 6.02199 143.303 5.93785 143.135 5.76958C142.966 5.57726 142.882 5.36091 142.882 5.12051V1.26219C142.882 0.997751 142.966 0.781396 143.135 0.613121C143.303 0.444844 143.519 0.360706 143.784 0.360706H163.184C163.448 0.360706 163.664 0.444844 163.833 0.613121C164.001 0.781396 164.085 0.997751 164.085 1.26219V5.12051C164.085 5.36091 164.001 5.57726 163.833 5.76958C163.664 5.93785 163.448 6.02199 163.184 6.02199H156.765V24.7006C156.765 24.9651 156.681 25.1814 156.513 25.3497C156.344 25.518 156.128 25.6021 155.864 25.6021H151.104Z" fill="currentColor" />
      <path d="M122.521 25.6021C122.256 25.6021 122.04 25.518 121.872 25.3497C121.703 25.1814 121.619 24.9651 121.619 24.7006V1.26219C121.619 0.997751 121.703 0.781396 121.872 0.613121C122.04 0.444844 122.256 0.360706 122.521 0.360706H139.36C139.625 0.360706 139.841 0.444844 140.009 0.613121C140.178 0.781396 140.262 0.997751 140.262 1.26219V4.65174C140.262 4.91618 140.178 5.13253 140.009 5.30081C139.841 5.46908 139.625 5.55322 139.36 5.55322H127.857V10.4212H138.567C138.831 10.4212 139.048 10.5174 139.216 10.7097C139.384 10.878 139.468 11.0943 139.468 11.3587V14.4959C139.468 14.7363 139.384 14.9526 139.216 15.145C139.048 15.3132 138.831 15.3974 138.567 15.3974H127.857V20.4096H139.649C139.913 20.4096 140.13 20.4937 140.298 20.662C140.466 20.8303 140.55 21.0466 140.55 21.3111V24.7006C140.55 24.9651 140.466 25.1814 140.298 25.3497C140.13 25.518 139.913 25.6021 139.649 25.6021H122.521Z" fill="currentColor" />
      <path d="M101.005 25.6021C100.741 25.6021 100.524 25.518 100.356 25.3497C100.188 25.1814 100.104 24.9651 100.104 24.7006V1.26219C100.104 0.997751 100.188 0.781396 100.356 0.613121C100.524 0.444844 100.741 0.360706 101.005 0.360706H105.765C106.005 0.360706 106.21 0.444844 106.378 0.613121C106.57 0.781396 106.666 0.997751 106.666 1.26219V20.1572H117.556C117.821 20.1572 118.037 20.2533 118.205 20.4456C118.398 20.6139 118.494 20.8303 118.494 21.0947V24.7006C118.494 24.9651 118.398 25.1814 118.205 25.3497C118.037 25.518 117.821 25.6021 117.556 25.6021H101.005Z" fill="currentColor" />
      <path d="M90.5148 27.9458C90.1301 27.9458 89.8296 27.8377 89.6133 27.6213C89.421 27.429 89.2647 27.2607 89.1445 27.1165L87.9185 25.4938C86.981 25.8063 85.9112 25.9626 84.7092 25.9626C82.4976 25.9626 80.5745 25.602 78.9398 24.8808C77.3291 24.1596 76.055 23.0779 75.1175 21.6355C74.204 20.1691 73.7112 18.3421 73.6391 16.1545C73.615 15.1208 73.603 14.0871 73.603 13.0534C73.603 12.0197 73.615 10.974 73.6391 9.91628C73.7112 7.75273 74.216 5.93775 75.1536 4.47135C76.0911 2.98091 77.3772 1.86307 79.0119 1.11785C80.6466 0.372627 82.5457 1.52588e-05 84.7092 1.52588e-05C86.8968 1.52588e-05 88.808 0.372627 90.4426 1.11785C92.0773 1.86307 93.3634 2.98091 94.301 4.47135C95.2385 5.93775 95.7433 7.75273 95.8155 9.91628C95.8635 10.974 95.8876 12.0197 95.8876 13.0534C95.8876 14.0871 95.8635 15.1208 95.8155 16.1545C95.6712 19.1354 94.8058 21.4432 93.2192 23.0779L95.8515 26.828C95.8756 26.8521 95.8996 26.9001 95.9236 26.9723C95.9477 27.0444 95.9597 27.1165 95.9597 27.1886C95.9837 27.3809 95.9236 27.5492 95.7794 27.6934C95.6352 27.8617 95.4549 27.9458 95.2385 27.9458H90.5148ZM84.7092 20.7701C85.9833 20.7701 87.017 20.3854 87.8103 19.6162C88.6277 18.8469 89.0604 17.6209 89.1085 15.9382C89.1565 14.8804 89.1806 13.8828 89.1806 12.9452C89.1806 12.0077 89.1565 11.0341 89.1085 10.0245C89.0844 8.8946 88.8801 7.98111 88.4955 7.28396C88.1108 6.56278 87.594 6.03391 86.9449 5.69736C86.2958 5.36081 85.5506 5.19253 84.7092 5.19253C83.8919 5.19253 83.1587 5.36081 82.5096 5.69736C81.8606 6.03391 81.3437 6.56278 80.9591 7.28396C80.5745 7.98111 80.3701 8.8946 80.3461 10.0245C80.322 11.0341 80.31 12.0077 80.31 12.9452C80.31 13.8828 80.322 14.8804 80.3461 15.9382C80.3942 17.6209 80.8149 18.8469 81.6082 19.6162C82.4255 20.3854 83.4592 20.7701 84.7092 20.7701Z" fill="currentColor" />
      <path d="M50.5079 25.6021C50.2435 25.6021 50.0271 25.518 49.8589 25.3497C49.6906 25.1814 49.6064 24.9651 49.6064 24.7006V1.26219C49.6064 0.997751 49.6906 0.781396 49.8589 0.613121C50.0271 0.444844 50.2435 0.360706 50.5079 0.360706H60.316C63.4171 0.360706 65.8571 1.08189 67.636 2.52425C69.439 3.94258 70.3404 5.96189 70.3404 8.58219C70.3404 10.289 69.9198 11.7314 69.0784 12.9093C68.261 14.0872 67.1793 14.9767 65.8331 15.5777L70.8092 24.4482C70.8813 24.5924 70.9174 24.7247 70.9174 24.8449C70.9174 25.0372 70.8333 25.2175 70.665 25.3857C70.5207 25.53 70.3404 25.6021 70.1241 25.6021H65.3643C64.9075 25.6021 64.571 25.4939 64.3546 25.2776C64.1383 25.0372 63.982 24.8208 63.8859 24.6285L59.7751 16.6955H56.061V24.7006C56.061 24.9651 55.9769 25.1814 55.8086 25.3497C55.6403 25.518 55.424 25.6021 55.1596 25.6021H50.5079ZM56.061 11.6112H60.2439C61.3737 11.6112 62.2151 11.3347 62.768 10.7818C63.345 10.2289 63.6334 9.47165 63.6334 8.51007C63.6334 7.57253 63.357 6.81529 62.8041 6.23835C62.2752 5.6614 61.4218 5.37293 60.2439 5.37293H56.061V11.6112Z" fill="currentColor" />
      <path d="M22.3525 25.6021C22.1601 25.6021 21.9798 25.53 21.8116 25.3857C21.6673 25.2175 21.5952 25.0372 21.5952 24.8449C21.5952 24.7247 21.6072 24.6165 21.6313 24.5203L30.1052 1.37036C30.1773 1.10593 30.3215 0.877554 30.5379 0.685239C30.7783 0.468884 31.1028 0.360706 31.5115 0.360706H36.8482C37.2569 0.360706 37.5694 0.468884 37.7858 0.685239C38.0262 0.877554 38.1824 1.10593 38.2545 1.37036L46.6924 24.5203C46.7405 24.6165 46.7645 24.7247 46.7645 24.8449C46.7645 25.0372 46.6804 25.2175 46.5121 25.3857C46.3678 25.53 46.1875 25.6021 45.9712 25.6021H41.5359C41.1753 25.6021 40.8989 25.518 40.7066 25.3497C40.5383 25.1574 40.4301 24.9891 40.382 24.8449L38.9757 21.1668H29.3479L27.9777 24.8449C27.9296 24.9891 27.8214 25.1574 27.6531 25.3497C27.4849 25.518 27.1964 25.6021 26.7877 25.6021H22.3525ZM30.8264 15.9743H37.5334L34.1438 6.4547L30.8264 15.9743Z" fill="currentColor" />
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

/**
 * The Dashboard page: title, four stat cards, two list cards.
 *
 * Built from the demo's own /dashboard - StatCard's uppercase 12/16
 * label over a 24/28 REGULAR figure (400, not 500: the size already
 * carries it), on a white card with a 12 radius and 16 padding, and
 * the list cards share that shell with a 24 gap.
 */
function DashboardPage() {
  return (
    <>
      <h2 className="plh-h2">Dashboard</h2>
      <p className="plh-sub">Overview of parking activity in your building</p>

      <div className="plh-stats">
        {[
          ["Bookings today", "14", "today"],
          ["Bookings this month", "28", "this month"],
          ["Bookings year to date", "28", "year to date"],
          ["Gift cards redeemed", "4", "year to date"],
        ].map(([label, value, tag]) => (
          <div key={label} className="plh-stat">
            <span className="plh-stat-label">{label}</span>
            <span className="plh-stat-value">{value}</span>
            {/* Bottom RIGHT, which is where the real card puts it - it
                reads as a footnote on the figure, not a second label. */}
            <span className="plh-stat-tag">{tag}</span>
          </div>
        ))}
      </div>

      <div className="plh-cards">
        <div className="plh-card">
          <span className="plh-card-title">Recent Activity</span>
          <div className="plh-seg">
            <span className="is-on">Week</span>
            <span>Month</span>
            <span className="plh-seg-custom">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="4.75" y="5.75" width="14.5" height="14.5" rx="1.25" stroke="currentColor" strokeWidth={1.5} />
                <path d="M8 3v4M16 3v4M5 11h14" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
              </svg>
              Custom
            </span>
          </div>
          {/* The bar chart is the thing that makes this card recognisable
              at a glance, and a list of names was never going to stand in
              for it. Heights are a week's shape, not data. */}
          <div className="plh-chart">
            {[
              ["Sat", 26],
              ["Sun", 62],
              ["Mon", 24],
              ["Tue", 22],
              ["Wed", 58],
              ["Thu", 0],
              ["Fri", 100],
            ].map(([day, h]) => (
              <span key={day as string} className="plh-bar">
                <i style={{ height: `${h}%` }} />
                <b>{day}</b>
              </span>
            ))}
          </div>
        </div>

        <div className="plh-card">
          <span className="plh-card-title">Recent Bookings</span>
          {[
            ["7A", "419", "Oct 19, 2026, 08:00 AM to Oct 19, 2026, 09:00 PM"],
            ["6F", "330", "Oct 18, 2026, 11:30 PM to Oct 19, 2026, 11:30 AM"],
            ["5E", "108", "Oct 18, 2026, 02:00 PM to Oct 19, 2026, 01:00 AM"],
            ["4D", "519", "Oct 18, 2026, 05:30 AM to Oct 18, 2026, 03:30 PM"],
          ].map(([unit, spot, when]) => (
            <div key={unit} className="plh-bkrow">
              <span className="plh-bktext">
                <b>
                  {unit} <i>booked spot</i> #{spot}
                </b>
                <span>{when}</span>
              </span>
              <StatusPill status="Upcoming" />
            </div>
          ))}
          <span className="plh-seeall">See all activity</span>
        </div>
      </div>
    </>
  );
}

function Dashboard({
  view,
  tab,
  flash,
  active,
  panRight,
}: {
  view: "dashboard" | "bookings";
  tab: OpenTabId;
  flash: boolean;
  active: boolean;
  panRight: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  /**
   * Once the reader scrolls it themselves, stop driving it.
   *
   * The pan exists to teach that the table moves. The moment somebody
   * has done it by hand that lesson has landed, and continuing to yank
   * the viewport back on a timer is the film fighting its own reader.
   */
  const taken = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || taken.current) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: panRight ? max : 0, behavior: still ? "auto" : "smooth" });
  }, [panRight, tab, view]);
  /**
   * The featured booking lives in whichever tab its status puts it in.
   *
   * Upcoming while it is still ahead, and the moment it starts it is a
   * CURRENT booking - so it leaves the Upcoming list and appears at the
   * top of Current. That is the whole reason the film switches tabs on
   * that beat rather than just recolouring a pill: a booking that had
   * started but was still filed under "Upcoming" would be the dashboard
   * telling the truth in one column and not the other.
   */
  const rows = !active
    ? ROWS[tab]
    : tab === "current"
      // Top of Current, Active - where a booking that has started goes.
      ? [{ ...FEATURED_ROW, status: "Active" as const }, ...ROWS.current]
      // ...and gone from Upcoming, because it is not upcoming any more.
      // The film never shows this list while active, but the data should
      // not depend on the film's running order to be true.
      : ROWS.future.filter((r) => r.id !== FEATURED.id);
  return (
    <div className="plh-dash">
      {/* ── Sidebar ── */}
      <aside className="plh-side">
        <div className="plh-side-logo"><ParqletLogo /></div>
        <nav className="plh-nav">
          {NAV.map((item) => {
            const on = item.id === (view === "dashboard" ? "dashboard" : "bookings");
            return (
              <div
                key={item.id}
                data-hit={`nav:${item.id}`}
                className={`plh-nav-item${on ? " is-active" : ""}`}
              >
                <NavIcon name={item.id} color={on ? C.accent : C.sidebarText} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ── Main ── */}
      <div className="plh-main">
        <header className="plh-head">
          <span className="plh-head-title">Your Building</span>
          <div className="plh-head-right">
            {/* HeaderThemeToggle's moon, 18x18 in a 36x36 hit box. */}
            <span className="plh-iconbtn">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
              </svg>
            </span>
            {/* IcNotification. The real header has a bell here and this
                did not have one at all. */}
            <span className="plh-iconbtn">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M10 5.5C7.79 6.24 6 8.22 6 10.5V14L4 17H20L18 14V10.5C18 8.22 16.21 6.24 14 5.5M10 5.5C10.1 4.37 10.95 3.5 12 3.5C13.05 3.5 13.9 4.37 14 5.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 17V18C9 19.66 10.34 21 12 21C13.66 21 15 19.66 15 18V17" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
              </svg>
            </span>
            <span className="plh-account">
              <span className="plh-avatar">SJ</span>
              <span className="plh-whoami">
                <b>Sarah Johnson</b>
                <i>Admin</i>
              </span>
              <svg className="plh-chev-sm" width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 9l6 6 6-6" stroke={C.textWeak} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {/* IcQuestion, not a question mark character. */}
            <span className="plh-iconbtn">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.5} />
                <path d="M10 9.5C10 8.4 10.9 7.5 12 7.5C13.1 7.5 14 8.4 14 9.5C14 10.3 13.5 11 12.8 11.4L12 11.9V13" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
                <circle cx="12" cy="15.5" r="0.75" fill="currentColor" />
              </svg>
            </span>
          </div>
        </header>

        <div className="plh-body">
          {view === "dashboard" ? <DashboardPage /> : <>
          <h2 className="plh-h2">Bookings</h2>
          <p className="plh-sub">View current bookings and complete booking history</p>

          {/* Underlined text tabs, not pills. */}
          <div className="plh-tabs">
            {TABS.map((t) => (
              <div
                key={t.id}
                data-hit={`tab:${t.id}`}
                className={`plh-tab${t.id === tab ? " is-active" : ""}`}
              >
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
                <span key={f} className="plh-filter">
                  {f}
                  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M6 9l6 6 6-6" stroke={C.textWeak} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              ))}
            </div>
          </div>

          <div className="plh-table">
            {/* The one thing on this stage that takes a pointer. The
                frame is a film everywhere else; a table the reader
                cannot reach the right-hand end of is just a cropped
                picture of a table. Head and body are inside the SAME
                scroller, so they cannot drift apart. */}
            <div className="plh-tscroll" ref={scrollRef} onPointerDown={() => { taken.current = true; }} onWheel={() => { taken.current = true; }}>
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
                          {/* Glyph first, then the name. */}
                          {hasPhone && <PhoneGlyph />}
                          {hasPhone ? (
                            <span className="plh-celltxt">{r[c.key]}</span>
                          ) : c.key === "status" ? (
                            <StatusPill status={r.status} />
                          ) : (
                            r[c.key]
                          )}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            </div>
            <div className="plh-tfoot">
              <span>Showing 1 to {rows.length} of 28 bookings</span>
              <span className="plh-pager">
                Rows per page <i>10</i> <i>‹</i> <b>1</b> <i>2</i> <i>3</i> <i>›</i>
              </span>
            </div>
          </div>
          </>}
        </div>
      </div>
    </div>
  );
}

/**
 * The handset beside every name column, copied from the dashboard's own
 * `IcPhone` (residents/components/icons.tsx) at its real 16x16. What
 * was here was a 13px silhouette I drew, which is the sort of thing
 * nobody notices until a designer puts the two side by side.
 */
function PhoneGlyph() {
  return (
    <svg className="plh-phglyph" width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 4H9L11 9L8.5 10.5C9.57096 12.6715 11.3285 14.429 13.5 15.5L15 13L20 15V19C20 19.5304 19.7893 20.0391 19.4142 20.4142C19.0391 20.7893 18.5304 21 18 21C14.0993 20.763 10.4202 19.0669 7.65683 16.3032C4.89348 13.5395 3.19732 9.86016 2.96 5.96C2.96 5.42956 3.17071 4.92085 3.54579 4.54578C3.92086 4.1707 4.42957 3.96 4.96 3.96L5 4Z"
        stroke={C.textWeak}
        strokeWidth={1.5}
        strokeLinecap="round"
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

/**
 * The app's own success artwork - assets/images/onboarding/
 * success-check-glow.png, the same file SuccessSplash renders.
 *
 * It was a rounded square I drew in SVG with a linear gradient faked
 * over it. The real asset is a 3D mark with the lime glow baked in, so
 * the drawing was never going to land: it is a different object, not a
 * slightly-off version of the same one. Downscaled to 256px (it ships
 * at 1024) because it renders at ~150.
 *
 * The CSS halo stays. It is the pulse, which is motion the PNG has no
 * way to carry.
 */
function CheckSplash() {
  return (
    <div className="plh-splash">
      <span className="plh-halo" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ASSET.check} alt="" width={88} height={88} className="plh-checkart" />
    </div>
  );
}

/**
 * The app's OWN bottom-nav glyphs, copied verbatim.
 *
 * mobile-app/components/ui/TabIcons.tsx says it best: each one is "the
 * EXACT SVG export from Figma's Parqlet-Library (node 11029:155), no
 * path math, no re-composition". What stood here instead were four
 * one-line `d` strings I drew from memory, with no active/inactive
 * distinction at all - the app has eight glyphs, a filled one per tab.
 *
 * Two substitutions, the same two TabIcons.tsx makes at render time:
 * the baked `#222222` (Figma Text/Strong) becomes `currentColor` so the
 * glyph tracks its label, and the literal `white` - a Figma compositing
 * trick that paints the profile body the colour of whatever is behind
 * it, masking the head-circle's stroke - becomes the tab bar's own
 * white. The clip ids are prefixed because eight copies share one
 * document here, where in the app each is its own SvgXml.
 */
const TAB_SVG: Record<string, string> = {
  HOME_DEFAULT: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19.0013 8.70977L13.6683 4.56177C13.2002 4.19768 12.6242 4 12.0312 4C11.4383 4 10.8623 4.19768 10.3942 4.56177L5.06025 8.70977C4.73969 8.95905 4.48034 9.2783 4.30201 9.64312C4.12367 10.0079 4.03106 10.4087 4.03125 10.8148V18.0148C4.03125 18.5452 4.24196 19.0539 4.61704 19.429C4.99211 19.8041 5.50082 20.0148 6.03125 20.0148H18.0313C18.5617 20.0148 19.0704 19.8041 19.4455 19.429C19.8205 19.0539 20.0312 18.5452 20.0312 18.0148V10.8148C20.0312 9.99177 19.6513 9.21477 19.0013 8.70977Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M9 20V14C9 13.4696 9.21071 12.9609 9.58579 12.5858C9.96086 12.2107 10.4696 12 11 12H13C13.5304 12 14.0391 12.2107 14.4142 12.5858C14.7893 12.9609 15 13.4696 15 14V20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  HOME_ACTIVE: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19.0013 8.70977L13.6683 4.56177C13.2002 4.19768 12.6242 4 12.0312 4C11.4383 4 10.8623 4.19768 10.3942 4.56177L5.06025 8.70977C4.73969 8.95905 4.48034 9.2783 4.30201 9.64312C4.12367 10.0079 4.03106 10.4087 4.03125 10.8148V18.0148C4.03125 18.5452 4.24196 19.0539 4.61704 19.429C4.99211 19.8041 5.50082 20.0148 6.03125 20.0148H18.0313C18.5617 20.0148 19.0704 19.8041 19.4455 19.429C19.8205 19.0539 20.0312 18.5452 20.0312 18.0148V10.8148C20.0312 9.99177 19.6513 9.21477 19.0013 8.70977Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M4.5 10V18.5L6 19.5L8.5 19L9 17.5L8.5 15L9.5 13L10 12.5L11.5 12H13.5L15 12.5V14V16.5V18.5L16 19.5H18H19L20 17.5V14V12L19 10L18 8L15 6L12 4.5L8.5 6.5L4.5 10Z" fill="currentColor" stroke="currentColor"/>
<path d="M9 20V14C9 13.4696 9.21071 12.9609 9.58579 12.5858C9.96086 12.2107 10.4696 12 11 12H13C13.5304 12 14.0391 12.2107 14.4142 12.5858C14.7893 12.9609 15 13.4696 15 14V20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  AVAILABILITY_DEFAULT: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#plhclip_avail_default)">
<path d="M12 3.75C14.188 3.75 16.2868 4.61884 17.834 6.16602C19.3812 7.71319 20.25 9.81196 20.25 12C20.25 13.0834 20.0367 14.1563 19.6221 15.1572C19.2075 16.1581 18.6001 17.0679 17.834 17.834C17.0679 18.6001 16.1581 19.2075 15.1572 19.6221C14.1563 20.0367 13.0834 20.25 12 20.25C10.9166 20.25 9.84371 20.0367 8.84277 19.6221C7.84186 19.2075 6.93209 18.6001 6.16602 17.834C5.39995 17.0679 4.79253 16.1581 4.37793 15.1572C3.96333 14.1563 3.75 13.0834 3.75 12C3.75 9.81196 4.61884 7.71319 6.16602 6.16602C7.71319 4.61884 9.81196 3.75 12 3.75Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 7V12L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<defs>
<clipPath id="plhclip_avail_default">
<rect width="24" height="24" fill="#FFFFFF"/>
</clipPath>
</defs>
</svg>`,
  AVAILABILITY_ACTIVE: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#plhclip_avail_active)">
<path d="M12 3C14.3869 3 16.6764 3.94791 18.3643 5.63574C20.0521 7.32357 21 9.61305 21 12C21 13.1819 20.7667 14.3524 20.3145 15.4443C19.8622 16.5361 19.1999 17.5286 18.3643 18.3643C17.5286 19.1999 16.5361 19.8622 15.4443 20.3145C14.3524 20.7667 13.1819 21 12 21C10.8181 21 9.64759 20.7667 8.55566 20.3145C7.46386 19.8622 6.47139 19.1999 5.63574 18.3643C4.8001 17.5286 4.13784 16.5361 3.68555 15.4443C3.23325 14.3524 3 13.1819 3 12C3 9.61305 3.94791 7.32357 5.63574 5.63574C7.32357 3.94791 9.61305 3 12 3ZM12 6.25C11.5858 6.25 11.25 6.58579 11.25 7V12C11.25 12.1989 11.3291 12.3896 11.4697 12.5303L14.4697 15.5303C14.7626 15.8232 15.2374 15.8232 15.5303 15.5303C15.8232 15.2374 15.8232 14.7626 15.5303 14.4697L12.75 11.6895V7C12.75 6.58579 12.4142 6.25 12 6.25Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="plhclip_avail_active">
<rect width="24" height="24" fill="#FFFFFF"/>
</clipPath>
</defs>
</svg>`,
  BOOKINGS_DEFAULT: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#plhclip_book_default)">
<path d="M6 5.75H18C18.3315 5.75 18.6494 5.88179 18.8838 6.11621C19.1182 6.35063 19.25 6.66848 19.25 7V19C19.25 19.3315 19.1182 19.6494 18.8838 19.8838C18.6494 20.1182 18.3315 20.25 18 20.25H6C5.66848 20.25 5.35063 20.1182 5.11621 19.8838C4.88179 19.6494 4.75 19.3315 4.75 19V7C4.75 6.66848 4.88179 6.35063 5.11621 6.11621C5.35063 5.88179 5.66848 5.75 6 5.75Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M16 3V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8 3V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5 11L19 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<defs>
<clipPath id="plhclip_book_default">
<rect width="24" height="24" fill="#FFFFFF"/>
</clipPath>
</defs>
</svg>`,
  BOOKINGS_ACTIVE: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#plhclip_book_active)">
<path d="M16 3V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8 3V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18 5C18.5304 5 19.039 5.21086 19.4141 5.58594C19.7891 5.96101 20 6.46957 20 7V19C20 19.5304 19.7891 20.039 19.4141 20.4141C19.039 20.7891 18.5304 21 18 21H6C5.53581 21 5.08833 20.8385 4.73242 20.5469L4.58594 20.4141C4.21086 20.039 4 19.5304 4 19V7C4 6.53581 4.16145 6.08833 4.45312 5.73242L4.58594 5.58594C4.96101 5.21086 5.46957 5 6 5H18ZM6 6.5C5.86739 6.5 5.74025 6.55272 5.64648 6.64648C5.55272 6.74025 5.5 6.86739 5.5 7V19C5.5 19.1326 5.55272 19.2597 5.64648 19.3535C5.74025 19.4473 5.86739 19.5 6 19.5H18C18.1326 19.5 18.2597 19.4473 18.3535 19.3535C18.4473 19.2597 18.5 19.1326 18.5 19V7C18.5 6.86739 18.4473 6.74025 18.3535 6.64648C18.2597 6.55272 18.1326 6.5 18 6.5H6Z" fill="currentColor"/>
<path d="M5 10.75H19C19.0962 10.75 19.1788 10.7508 19.25 10.752V19C19.25 19.3315 19.1182 19.6494 18.8838 19.8838C18.6494 20.1182 18.3315 20.25 18 20.25H6C5.66848 20.25 5.35063 20.1182 5.11621 19.8838C4.88179 19.6494 4.75 19.3315 4.75 19V10.7529C4.8218 10.7526 4.9043 10.75 5 10.75Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<defs>
<clipPath id="plhclip_book_active">
<rect width="24" height="24" fill="#FFFFFF"/>
</clipPath>
</defs>
</svg>`,
  PROFILE_DEFAULT: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#plhclip_profile_default)">
<path d="M12 3.75C12.862 3.75 13.6884 4.09266 14.2979 4.70215C14.9073 5.31164 15.25 6.13805 15.25 7C15.25 7.86195 14.9073 8.68836 14.2979 9.29785C13.6884 9.90734 12.862 10.25 12 10.25C11.138 10.25 10.3116 9.90734 9.70215 9.29785C9.09266 8.68836 8.75 7.86195 8.75 7L8.75391 6.83887C8.79375 6.03558 9.13074 5.27356 9.70215 4.70215C10.2736 4.13074 11.0356 3.79375 11.8389 3.75391L12 3.75Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 14.75H14C15.7949 14.75 17.25 16.2051 17.25 18V20C17.25 20.1381 17.1381 20.25 17 20.25H7C6.86193 20.25 6.75 20.1381 6.75 20V18C6.75 16.2051 8.20507 14.75 10 14.75Z" fill="#FFFFFF" stroke="currentColor" stroke-width="1.5"/>
</g>
<defs>
<clipPath id="plhclip_profile_default">
<rect width="24" height="24" fill="#FFFFFF"/>
</clipPath>
</defs>
</svg>`,
  PROFILE_ACTIVE: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#plhclip_profile_active)">
<path d="M12 3.75C12.862 3.75 13.6884 4.09266 14.2979 4.70215C14.9073 5.31164 15.25 6.13805 15.25 7C15.25 7.86195 14.9073 8.68836 14.2979 9.29785C13.6884 9.90734 12.862 10.25 12 10.25C11.138 10.25 10.3116 9.90734 9.70215 9.29785C9.09266 8.68836 8.75 7.86195 8.75 7L8.75391 6.83887C8.79375 6.03558 9.13074 5.27356 9.70215 4.70215C10.2736 4.13074 11.0356 3.79375 11.8389 3.75391L12 3.75Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 14.75H14C15.7949 14.75 17.25 16.2051 17.25 18V20C17.25 20.1381 17.1381 20.25 17 20.25H7C6.86193 20.25 6.75 20.1381 6.75 20V18C6.75 16.2051 8.20507 14.75 10 14.75Z" fill="currentColor" stroke="currentColor" stroke-width="1.5"/>
</g>
<defs>
<clipPath id="plhclip_profile_active">
<rect width="24" height="24" fill="#FFFFFF"/>
</clipPath>
</defs>
</svg>`,
};

/** Figma `ic_sandwatch` (956:2423), copied from the booking card. */
function Hourglass() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M7.99849 11.4286C7.99849 11.4286 7.99844 10.4073 8.4831 9.67782C8.96777 8.94834 12.1108 7.43684 11.997 4.57143L4 4.57143C4 7.13238 6.66566 8.65655 7.39266 9.67782C7.87733 10.2614 7.99849 11.4286 7.99849 11.4286Z"
        fill={C.textStrong}
      />
      <path
        d="M4.67202 6.87342C5.55466 7.59472 6.75178 7.99994 8.00003 7.99994C9.24827 7.99994 10.4454 7.59472 11.328 6.87342C13.4917 5.1053 12.3369 2.94565 11.698 0.857083L4.30206 0.857082C3.66309 2.94565 2.50835 5.1053 4.67202 6.87342Z"
        stroke={C.textStrong} strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M4.67202 9.12646C5.55466 8.40517 6.75178 7.99995 8.00003 7.99995C9.24827 7.99995 10.4454 8.40517 11.328 9.12646C13.4917 10.8946 12.3369 13.0543 11.698 15.1428L4.30206 15.1428C3.66309 13.0543 2.50835 10.8946 4.67202 9.12646Z"
        stroke={C.textStrong} strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M14.0439 15.1428L1.956 15.1428" stroke={C.textStrong} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.0439 0.857087L1.956 0.857086" stroke={C.textStrong} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The spot pill + EV bolt + countdown that heads every booking card. */
function CardTop({ note }: { note: string }) {
  return (
    <div className="plh-ph-cardtop">
      <span className="plh-spotpill">P #{FEATURED.spot}</span>
      <span className="plh-bolt">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ASSET.ev} alt="" width={14} height={16} />
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
          key={status}
          className="plh-pill plh-ph-statuspill plh-turnover"
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
      <div className="plh-ph-row"><span>Date &amp; time</span><b>{FEATURED.whenApp}</b></div>
      {/* The real card has this row and this glyph (ic_credit_basic.svg);
          leaving it out was why the card looked a line short. */}
      <div className="plh-ph-row">
        <span>Credits paid</span>
        <b className="plh-credrow">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSET.credit} alt="" width={16} height={16} />
          {FEATURED.credits}
        </b>
      </div>
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
        {/* The halo is a sibling of the button, not a child of it: the
            button is overflow:hidden so the ring could not grow past its
            own 56px height, and a ring clipped to a letterbox does not
            read as a fingertip. */}
        <div className="plh-ctawrap">
          <div className={`plh-btn plh-btn-secondary${pressing ? " is-pressed" : ""}`}>
            Go to home screen
          </div>
          {pressing && (
            <span className="plh-touchpoint" aria-hidden>
              <span className="plh-touchdot" />
              <span className="plh-touchring" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PhoneHome({ active }: { active: boolean }) {
  return (
    <div className="plh-screen plh-screen-home">
      <div className="plh-ph-appbar">
        <span className="plh-wordmark"><ParqletWordmark /></span>
        <span className="plh-credits">
          <i className="plh-star">★</i> {FEATURED.credits} Credits
        </span>
      </div>

      {/* The section header turns over with the card: the app calls it
          CURRENT once the booking has started, not UPCOMING. */}
      <span className="plh-ph-section">
        <i /> {active ? "CURRENT GUEST BOOKING" : "UPCOMING GUEST BOOKING"}
      </span>
      <div className="plh-ph-cardwrap">
        <BookingCard
          note={active ? FEATURED.activeNote : FEATURED.startsIn}
          status={active ? "Active" : "Upcoming"}
        />
      </div>

      <div className="plh-promo">
        <b>Book parking for your guest</b>
        <span>Reserve a spot in seconds</span>
        <span className="plh-promo-cta">Book parking spot →</span>
        {/* Geometry copied from the app: a 140x116 box pinned to the card's
            bottom-right, the car 130x87 in its corner and the calendar
            46x46 at the top, inset 10. */}
        <span className="plh-promo-art">
          {/* eslint-disable-next-line @next/next/no-img-element -- inlined data URIs; next/image adds a loader for no benefit */}
          <img className="plh-promo-car" src={ART_CAR} alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element -- inlined data URIs; next/image adds a loader for no benefit */}
          <img className="plh-promo-cal" src={ART_CALENDAR} alt="" />
        </span>
      </div>

      <div className="plh-avail">
        <div className="plh-avail-txt">
          <b>Add availability for your&nbsp;parking&nbsp;spot</b>
          <span>Earn credits while sharing your spot</span>
        </div>
        <span className="plh-avail-cta">Add +</span>
      </div>

      <div className="plh-tabbar">
        {(["Home", "Availability", "Bookings", "Profile"] as const).map((l) => {
          const on = l === "Home";
          const key = `${l === "Home" ? "HOME" : l.toUpperCase()}_${on ? "ACTIVE" : "DEFAULT"}`;
          return (
            <span key={l} className={on ? "is-on" : ""}>
              <span
                className="plh-tabglyph"
                aria-hidden
                dangerouslySetInnerHTML={{ __html: TAB_SVG[key] }}
              />
              {l}
            </span>
          );
        })}
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
  /** The dashboard frame, which `data-hit` boxes are measured against. */
  const dashRef = useRef<HTMLDivElement>(null);

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
    const id = setTimeout(() => setI((n) => n + 1), SCENES[i % SCENES.length].hold);
    return () => clearTimeout(id);
  }, [i, running, reduced, pinned]);

  const scene = useMemo<Scene>(
    () =>
      reduced
        ? { hold: 0, view: "bookings", tab: "future", phone: "home", target: null, flash: true }
        : SCENES[(pinned ?? i) % SCENES.length],
    [i, reduced, pinned],
  );

  /**
   * How many full passes the film has made.
   *
   * Both phone screens stay mounted (they slide), so a CSS animation on
   * the confirmation check would fire once on mount and never again.
   * Keying the splash on the pass number remounts it each time round,
   * which is what replays the pop.
   */
  const cycle = reduced || pinned !== null ? 0 : Math.floor(i / SCENES.length);

  /**
   * Put the cursor on whatever the scene names, measured.
   *
   * `data-hit` marks the element; this reads its box relative to the
   * dashboard frame. Hard-coded pixels went stale every time a padding
   * changed, silently - the pointer kept clicking, just not on
   * anything. A missing target leaves the cursor where it was, which is
   * what a null `target` wants anyway (it fades out in place).
   */
  const [hit, setHit] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const frame = dashRef.current;
    if (!frame || !scene.target) return;
    const el = frame.querySelector<HTMLElement>(`[data-hit="${scene.target}"]`);
    if (!el) return;
    const f = frame.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setHit({ x: r.left - f.left + r.width / 2, y: r.top - f.top + r.height / 2 });
  }, [scene.target, scene.view, scene.tab]);

  return (
    <section className="plh-root" aria-label="Parqlet product demo">
      <style>{CSS}</style>

      {/* ── Backdrop: the landing hero's grid + lime bloom ── */}
      <div className="plh-grid" aria-hidden />
      {/* Design's 83x83 spark, sitting on a grid intersection out at the
          left. Verbatim from the file: soft-light at 40%, a radial from
          the brand lime at its centre out to transparent. The id is
          prefixed because this component can be dropped onto a page
          that already has gradients of its own. */}
      <svg className="plh-spark" width="83" height="83" viewBox="0 0 83 83" fill="none" aria-hidden>
        <g opacity="0.4" style={{ mixBlendMode: "soft-light" }}>
          <path
            d="M42.252 40.6416H82.8936V42.2529H42.252V82.8936H40.6416V42.2529H0V40.6416H40.6416V0H42.252V40.6416Z"
            fill="url(#plh-spark-grad)"
          />
        </g>
        <defs>
          <radialGradient
            id="plh-spark-grad"
            cx="0" cy="0" r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(41.4467 41.4467) rotate(-180) scale(41.4467)"
          >
            <stop stopColor="#C7E51F" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
      {/* Clears the grid from behind the copy. Sits above the grid and
          BELOW the glow, so the lime bloom still reaches the headline -
          it is the ruled lines that make the text hard to read, not the
          light. */}
      <div className="plh-copyveil" aria-hidden />
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
        <div className="plh-frame plh-frame-dash" ref={dashRef}>
          <Dashboard
            view={scene.view}
            tab={scene.tab}
            flash={!!scene.flash}
            active={!!scene.active}
            panRight={!!scene.panRight}
          />

          {/* The cursor lives INSIDE the dashboard frame and is positioned in
              pixels, not stage percentages. The tabs it clicks are at fixed
              offsets from this box (sidebar + padding), so pixels land on them
              at any viewport; percentages of a stage that changes height with
              the phone's overhang did not. */}
          <div
            className={`plh-cursor${scene.target && hit ? " is-on" : ""}${scene.pressCursor ? " is-click" : ""}`}
            style={
              {
                "--plh-x": `${hit?.x ?? 128}px`,
                "--plh-y": `${hit?.y ?? 200}px`,
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
              {/* Keyed on the pass number so the check's pop replays
                  each time round. Both slides stay mounted, so without
                  this the animation would fire once, on first mount,
                  and the loop would be silent from then on. */}
              <div className="plh-slide plh-slide-a" key={`c${cycle}`}>
                <PhoneConfirmed pressing={!!scene.pressTouch} />
              </div>
              <div className="plh-slide plh-slide-b">
                <PhoneHome active={!!scene.active} />
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
  /* overflow:hidden, not overflow-x:clip. The frames are meant to run off
     the bottom of the hero, and the phone's drop shadow was spilling past
     the section edge and smudging the first few pixels of the white
     section below it. Clipping both axes cuts them on the section's own
     line. */
  position:relative;overflow:hidden;isolation:isolate;max-width:100vw;
  background:${C.heroBg};
  padding:72px 24px 0;
  font-family:Rubik,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
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
/* Parked on a grid line rather than at a round percentage: the grid is
   136px square from the top-left, so 3 cells down and half a cell in
   puts the spark's centre ON an intersection, which is what it is
   drawing attention to. It fades in with the grid it belongs to. */
.plh-spark{
  position:absolute;z-index:0;pointer-events:none;
  left:calc(136px - 41.5px);top:calc(408px - 41.5px);
  animation:plh-fade 1.6s ease-out both;
}
@media(max-width:1024px){
  .plh-spark{left:calc(68px - 41.5px);top:calc(204px - 41.5px);transform:scale(.72);}
}
/* Below the copy it would sit behind the text rather than beside it. */
@media(max-width:760px){ .plh-spark{display:none;} }
/**
 * The grid, cleared from behind the copy.
 *
 * A 1px rule crossing a letterform is the sort of thing that reads as
 * dirt on the screen rather than as a background, and the headline
 * runs the full width of the hero, so it was catching two of them.
 *
 * It is a radial of the hero's OWN background rather than a panel: a
 * rectangle would need an edge, and any edge over a ruled grid is more
 * conspicuous than the rules it hides. Fading to rgba of the same
 * colour rather than to transparent matters too - browsers
 * interpolate toward transparent BLACK, which would smear a grey halo
 * across a dark-but-not-black background.
 *
 * Above .plh-grid, below .plh-glow, by DOM order - all three are
 * z-index 0 and the copy is z-index 2.
 */
.plh-copyveil{
  position:absolute;z-index:0;pointer-events:none;
  left:50%;transform:translateX(-50%);
  top:0;width:min(1240px,100%);height:560px;
  background:radial-gradient(
    ellipse 62% 56% at 50% 40%,
    ${C.heroBg} 0%,
    ${C.heroBg} 42%,
    rgba(34,34,34,.72) 64%,
    rgba(34,34,34,0) 88%
  );
  animation:plh-fade 1.6s ease-out both;
}
@media(max-width:760px){ .plh-copyveil{height:460px;} }
.plh-glow{
  position:absolute;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse at 50% 42%,rgba(199,229,31,.17) 0%,rgba(59,109,17,.09) 38%,transparent 66%);
  animation:plh-bloom 2s cubic-bezier(.16,1,.3,1) both;
}
@keyframes plh-fade{from{opacity:0}to{opacity:1}}
@keyframes plh-bloom{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}

/* Copy ─────────────────────────────────────────────────── */
/* Wide enough to hold the headline on one line at 52px. It was 760,
   which broke "Meet Parqlet" onto a second row. The lede keeps its own
   narrower measure below. */
.plh-copy{position:relative;z-index:2;max-width:1120px;margin:0 auto;text-align:center;}
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
/* On hover the two frames MOVE. Nothing scales and nothing reflows.
   
   Both were tried and both were wrong. Scaling the dashboard shrank its
   height along with its width, so it stopped ending on the same line as
   the phone - the alignment the 460px height exists to produce. Narrowing
   it by width instead reflowed the table, and because the three name
   columns are the flexible ones, every pixel came out of Resident, Spot
   Owner and Guest until they disappeared. Moving costs neither.
   
   The cost of moving is that it is bounded: the frames can only travel
   into the margin beside the 1240px stage, and that margin is what grows
   with the viewport. So the ladder is sized to each breakpoint's own
   worst case, each tier roughly 115px further than the one below it, with
   ~30px of clearance left at the narrow end of every tier.
   
   At ~1400 this is close to the limit. More separation there needs a
   narrower stage, not a larger offset. */
@media(min-width:1280px){
  .plh-root:hover .plh-frame-phone{right:2%;}
}
@media(min-width:1400px){
  .plh-root:hover .plh-frame-phone{right:-5%;}
  .plh-root:hover .plh-frame-dash{transform:translateX(-56px);}
}
@media(min-width:1700px){
  .plh-root:hover .plh-frame-phone{right:-14%;}
  .plh-root:hover .plh-frame-dash{transform:translateX(-171px);}
}
@media(min-width:1900px){
  .plh-root:hover .plh-frame-phone{right:-23%;}
  .plh-root:hover .plh-frame-dash{transform:translateX(-286px);}
}

/* The copy block is not a hover target.
   
   Reading the headline should not move the product shot out from under
   you - the gesture is meant to be "look closer at the frames", and the
   hero's own words are not the frames. The hover still hangs off the
   section, because the stage is pointer-events:none and could never
   receive one; this just cancels it again whenever the pointer is over
   the copy.
   
   :has() carries the specificity of its argument, so these two land at
   (0,4,0) against the (0,3,0) of the rules above and win without needing
   !important or a later source position. */
.plh-root:has(.plh-copy:hover) .plh-frame-phone{right:15%;}
.plh-root:has(.plh-copy:hover) .plh-frame-dash{transform:none;}

/* ── Narrow: nothing overlaps anything. Dashboard first, phone under it,
      both in normal flow and centred. An absolutely-positioned phone on a
      390px screen would sit on top of the only thing worth reading. ── */
@media(max-width:900px){
  .plh-stage{margin-top:44px;display:flex;flex-direction:column;align-items:center;gap:26px;}
  /* Phone only. See the note above the desktop stage rules. */
  .plh-frame-dash{display:none;}
  /* width:max-content, matching the desktop rule. A fixed 300px here was
     a border-box width, so the frame's content box came to 274px around a
     290px phone and the device hung out of its own glass by 16px on the
     narrow layout - the same bug that was fixed for desktop, reintroduced
     by this override. Let it size to the phone. */
  .plh-frame-phone{position:static;right:auto;top:auto;width:max-content;}

  /* Rounded on all four corners here, and padded on the bottom to match.
     The square bottom is for the desktop composition, where the frames
     are deliberately cut off by the edge of the hero. Stacked in normal
     flow they are not cut off by anything, so a flat bottom just reads as
     an unfinished card. */
  .plh-frame{border-radius:.75em;padding-bottom:.75em;}
  .plh-dash{border-radius:9px;}
  .plh-phone{border-radius:38px;}
}

/* Dashboard ────────────────────────────────────────────── */
/* Real dimensions - 256px sidebar, 14px body text - which is the whole
   reason the frame is full width.

   460px is not arbitrary. The phone frame hangs at top:-100 and stands
   1 + 12 + 560 + 1 = 574 tall, so its bottom edge falls 474 below the top
   of the stage. The dashboard frame starts at that top and adds the same
   14px of border and padding, so 460 is the height at which the two
   frames finish on exactly the same line. Change the phone and this
   follows it. */
.plh-dash{
  display:flex;height:460px;overflow:hidden;min-width:0;max-width:100%;
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
  height:64px;display:flex;align-items:center;padding:0 24px;flex:0 0 64px;
  color:${C.white};
}
/* Height-constrained, width auto, so the wordmark keeps its own ratio
   whatever the sidebar does. currentColor on the paths means the one
   colour above drives it. */
.plh-logo{height:22px;width:auto;display:block;}
.plh-nav{display:flex;flex-direction:column;gap:8px;padding:0 16px;flex:1 1 auto;}
.plh-nav-item{
  display:flex;align-items:center;gap:10px;height:48px;padding:12px 16px;
  border-radius:8px;color:${C.sidebarText};
  font-size:16px;line-height:20px;font-weight:400;white-space:nowrap;
  transition:background .3s ease,color .3s ease;
}
.plh-nav-item.is-active{background:${C.sidebarItemActive};color:${C.accent};}

.plh-main{flex:1 1 0;min-width:0;display:flex;flex-direction:column;background:${C.fillWeak};}
.plh-head{
  height:64px;flex:0 0 64px;display:flex;align-items:center;justify-content:space-between;
  padding:0 24px;background:${C.white};border-bottom:1px solid ${C.strokeMedium};
}
@media(max-width:900px){ .plh-head{height:50px;flex-basis:50px;padding:0 14px;} }
.plh-head-title{font-size:16px;line-height:20px;font-weight:500;}
.plh-head-right{display:flex;align-items:center;gap:4px;}
/* HeaderThemeToggle / the bell / IcQuestion all sit in a 36x36 box. */
.plh-iconbtn{
  width:36px;height:36px;border-radius:8px;flex:0 0 auto;
  display:inline-flex;align-items:center;justify-content:center;
  color:${C.textStrong};
}
/* AccountMenu's trigger: gap 8, 4x8 padding, 8-dp corners. */
.plh-account{display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:8px;}
.plh-chev-sm{flex:0 0 auto;margin-left:2px;display:block;}
.plh-avatar{
  width:32px;height:32px;border-radius:50%;background:${C.textStrong};
  display:grid;place-items:center;font-size:13px;font-weight:600;color:${C.white};
}
.plh-whoami{display:flex;flex-direction:column;}
.plh-whoami b{font-size:13px;line-height:16px;font-weight:500;}
.plh-whoami i{font-size:11px;line-height:14px;font-style:normal;color:${C.textWeak};}
@media(max-width:1180px){ .plh-whoami{display:none;} }

.plh-body{flex:1 1 0;min-height:0;padding:16px 24px 0;display:flex;flex-direction:column;}
@media(max-width:900px){ .plh-body{padding:12px 14px 0;} }
.plh-h2{margin:0;font-size:24px;line-height:28px;font-weight:400;}
.plh-sub{margin:4px 0 0;font-size:16px;line-height:20px;color:${C.textWeak};}
.plh-body .plh-h2+.plh-sub{margin-bottom:0;}

/* Dashboard page ───────────────────────────────────────────────
   StatCard: white, 12 radius, 16 padding; an uppercase 12/16 label
   over a 24/28 figure at REGULAR weight - 400 and not 500, because
   the size already carries it - and the period pill pushed to the
   BOTTOM RIGHT, where it reads as a footnote on the number rather
   than a second label. */
.plh-stats{
  display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:24px;
  flex:0 0 auto;min-width:0;
}
.plh-stat{
  min-width:0;background:${C.white};border:1px solid ${C.strokeMedium};
  border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:8px;
  overflow:hidden;
}
.plh-stat-label{
  font-size:12px;line-height:16px;font-weight:500;color:${C.textWeak};
  text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.plh-stat-value{font-size:24px;line-height:28px;font-weight:400;color:${C.textStrong};white-space:nowrap;}
.plh-stat-tag{
  align-self:flex-end;margin-top:4px;padding:4px 8px;border-radius:48px;
  background:${C.fillWeak};color:${C.textStrong};
  font-size:12px;line-height:16px;white-space:nowrap;
}

.plh-cards{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;flex:1 1 0;min-height:0;}
.plh-card{
  min-width:0;background:${C.white};border:1px solid ${C.strokeMedium};
  border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:12px;
  overflow:hidden;
}
.plh-card-title{
  font-size:12px;line-height:16px;font-weight:500;color:${C.textWeak};
  text-transform:uppercase;
}

/* Week / Month / Custom, as one rounded track with the selected
   option as a dark pill inside it. */
.plh-seg{
  align-self:flex-start;display:flex;align-items:center;gap:4px;
  padding:4px;border-radius:999px;border:1px solid ${C.strokeMedium};
  font-size:14px;line-height:16px;color:${C.textStrong};
}
.plh-seg span{padding:7px 14px;border-radius:999px;white-space:nowrap;}
.plh-seg .is-on{background:${C.textStrong};color:${C.white};font-weight:500;}
.plh-seg-custom{display:inline-flex;align-items:center;gap:6px;color:${C.textStrong};}

/* The bar chart. Bars grow from a baseline with the day under them;
   Thursday is deliberately empty, because a week with no gap in it
   looks like decoration rather than data. */
.plh-chart{
  flex:1 1 0;min-height:0;display:flex;align-items:flex-end;gap:8px;
  padding-top:8px;border-bottom:1px solid ${C.strokeMedium};
}
.plh-bar{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:6px;}
.plh-bar i{display:block;width:34px;max-width:100%;background:${C.accent};border-radius:3px 3px 0 0;}
.plh-bar b{font-size:12px;line-height:16px;font-weight:400;color:${C.textWeak};transform:translateY(20px);}

/* Recent bookings rows: the unit and spot in one line, the window
   under it, then the status and the link. */
.plh-bkrow{
  display:flex;align-items:center;gap:12px;min-width:0;
  padding-bottom:10px;border-bottom:1px solid ${C.strokeWeak};
}
.plh-bktext{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1 1 auto;}
.plh-bktext b{font-size:14px;line-height:18px;font-weight:500;color:${C.textStrong};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.plh-bktext b i{font-style:normal;font-weight:400;}
.plh-bktext>span{font-size:12px;line-height:16px;color:${C.textWeak};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.plh-seeall{align-self:flex-end;margin-top:auto;font-size:14px;line-height:16px;color:${C.textStrong};}
.plh-card .plh-pill{flex:0 0 auto;}

@media(max-width:1100px){ .plh-stats{grid-template-columns:repeat(2,1fr);} }

/* Underlined text tabs - the real ones are not pills. */
.plh-tabs{display:flex;gap:28px;margin-top:12px;border-bottom:1px solid ${C.strokeMedium};}
.plh-tab{
  padding:0 0 12px;font-size:14px;line-height:16px;color:${C.textWeak};font-weight:400;
  border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap;
  transition:color .24s ease,border-color .24s ease;
}
.plh-tab.is-active{color:${C.textStrong};font-weight:500;border-bottom-color:${C.textStrong};}
/* Three two-word tabs do not fit across a phone at 14px. */
@media(max-width:900px){
  .plh-tabs{gap:16px;}
  .plh-tab{font-size:12px;padding-bottom:7px;}
}
@media(max-width:520px){ .plh-tabs{gap:12px;} .plh-tab{font-size:11px;} }

.plh-toolbar{display:flex;align-items:center;gap:12px;margin-top:12px;}
.plh-search{
  flex:1 1 auto;min-width:0;height:40px;box-sizing:border-box;
  display:flex;align-items:center;gap:8px;
  padding:0 10px;border-radius:8px;background:${C.white};
  border:1px solid ${C.strokeMedium};color:${C.textWeaker};font-size:14px;line-height:16px;
}
.plh-search span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.plh-filters{display:flex;gap:8px;flex:0 0 auto;}
.plh-filter{
  height:40px;box-sizing:border-box;
  display:flex;align-items:center;gap:8px;padding:0 10px;
  border-radius:12px;background:${C.white};border:1px solid ${C.strokeMedium};
  font-size:14px;line-height:16px;color:${C.textWeak};white-space:nowrap;
}
.plh-filter svg{flex:0 0 auto;display:block;}
@media(max-width:1280px){ .plh-filters{display:none;} }

.plh-table{
  flex:1 1 0;min-height:0;min-width:0;background:${C.white};margin-top:12px;
  border:1px solid ${C.strokeMedium};border-radius:12px 12px 0 0;overflow:hidden;
  display:flex;flex-direction:column;
}
/**
 * The one interactive thing on the stage.
 *
 * .plh-stage is pointer-events:none because the frames are a film.
 * A table whose right-hand half is simply cut off is not a film of a
 * table though, it is a cropped screenshot - so this one element takes
 * the pointer back and scrolls. Head and rows are both inside it, so
 * they move together.
 *
 * MIN-WIDTH, NOT SHRINKING COLUMNS. The columns used to be squeezed by
 * media query until the headers ellipsed ("BOOKED S..."). Now the
 * content keeps a width at which every header fits on one line and the
 * reader pans to the rest, which is what the real table does.
 */
.plh-tscroll{
  flex:1 1 0;min-height:0;display:flex;flex-direction:column;
  overflow-x:auto;overflow-y:hidden;
  pointer-events:auto;
  scrollbar-width:thin;
  overscroll-behavior-x:contain;
  -webkit-overflow-scrolling:touch;
}
.plh-tscroll::-webkit-scrollbar{height:8px;}
.plh-tscroll::-webkit-scrollbar-thumb{background:${C.strokeMedium};border-radius:999px;}
.plh-tscroll::-webkit-scrollbar-track{background:transparent;}
.plh-tscroll>*{min-width:1310px;}
.plh-thead{
  display:flex;align-items:center;gap:8px;padding:0 24px;height:48px;flex:0 0 auto;
  position:sticky;top:0;z-index:1;
  border-bottom:1px solid ${C.strokeMedium};background:${C.white};
  font-size:12px;line-height:16px;font-weight:500;text-transform:uppercase;color:${C.textWeak};
}
.plh-row span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
/* Real TableHeadLabel WRAPS rather than truncating - a header reading
   "BOOKED S..." cannot be recovered without a hover, and there is no
   hover here at all. */
.plh-thead span{min-width:0;white-space:normal;overflow:visible;text-overflow:clip;}
.plh-thead .plh-phglyph{display:none;}

/* Column widths live here, not in the JSX.
   
   EVERY COLUMN IS ALWAYS PRESENT NOW. They used to drop out one by one
   by media query - owner at 1440, end at 1260, plate at 1100 - until a
   phone saw four of ten, and the survivors were squeezed until their
   headers ellipsed. With the scroller above there is nothing to hide
   from: the reader pans, exactly as they do on the real table.
   
   Each width is sized for its own HEADER at 12px on one line, which is
   what gets rid of the "BOOKED S..." - the widest of the pair is
   usually the heading, not the value. They sum (with 9 gaps of 8 and
   48 of padding) to the min-width set on .plh-tscroll > *. */
.plh-c-id{flex:0 0 96px}
.plh-c-unit{flex:0 0 64px}
.plh-c-resident{flex:1 1 150px}
.plh-c-spot{flex:0 0 110px}
.plh-c-owner{flex:1 1 150px}
.plh-c-guest{flex:1 1 150px}
.plh-c-plate{flex:0 0 120px}
.plh-c-start{flex:0 0 120px}
.plh-c-end{flex:0 0 120px}
.plh-c-status{flex:0 0 110px}
.plh-rows{flex:1 1 0;min-height:0;overflow:hidden;}
/* Scroll lives on the wrapper; the body must not clip it horizontally. */
.plh-tscroll .plh-rows{overflow-x:visible;}
.plh-row{
  display:flex;gap:8px;align-items:center;padding:0 24px;height:57px;
  border-bottom:1px solid ${C.strokeMedium};font-size:14px;line-height:16px;color:${C.textStrong};
  animation:plh-row-in .55s cubic-bezier(.16,1,.3,1) both;
}
/* A flex row, so the handset sits beside the name instead of being an
   inline box that wraps the moment the name is too long for the column. */
.plh-hasphone{display:flex;align-items:center;gap:6px;}
.plh-celltxt{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.plh-phglyph{flex:0 0 auto;}
.plh-tfoot{
  display:none;
  flex:0 0 auto;align-items:center;justify-content:space-between;
  height:57px;padding:0 24px;border-top:1px solid ${C.strokeMedium};
  font-size:14px;line-height:16px;color:${C.textWeak};
}
.plh-pager{display:flex;align-items:center;gap:7px;}
.plh-pager i{font-style:normal;padding:2px 6px;border-radius:5px;border:1px solid ${C.strokeMedium};}
.plh-pager b{padding:2px 7px;border-radius:5px;background:${C.textStrong};color:${C.white};}
@media(max-width:900px){
  .plh-row{height:48px;padding:0 14px;font-size:12px;}
  .plh-thead{height:40px;padding:0 14px;}
  .plh-tfoot{display:none;}
}
@keyframes plh-row-in{
  from{opacity:0;transform:translateY(8px)}
  to{opacity:1;transform:none}
}
/**
 * The row arriving: a highlight, and nothing else.
 *
 * It used to grow from its left edge (scale 0.985 -> 1.018 -> 1, with
 * transform-origin:left) and carry a 4px lime rule down that edge plus
 * an outer glow. Client's call: the row should light up, not move.
 * Scaling from the left is read as the row sliding sideways, which is
 * exactly the thing a reader's eye follows instead of the content, and
 * a left rule that then shrinks looks like a rendering fault.
 *
 * So the row arrives the way EVERY other row arrives - plh-row-in, the
 * same drop and fade - and the only thing distinguishing it is a wash
 * that clears. Two animations rather than one now that nothing fights
 * over transform: the entrance owns opacity and transform, the wash
 * owns background. (They could not be stacked before, which is why
 * this was one keyframe doing both jobs.)
 *
 * The real table's own highlight is gray-5 at a 0.6s transition. Lime
 * here because the film has to make the arrival legible in one pass
 * at a glance, where the product can afford to be quiet about it.
 */
.plh-row.is-flash{
  position:relative;z-index:1;
  animation:
    plh-row-in .55s cubic-bezier(.16,1,.3,1) both,
    plh-highlight 2.6s ease-out both;
}
@keyframes plh-highlight{
  0%{background:rgba(199,229,31,.48)}
  40%{background:rgba(199,229,31,.34)}
  100%{background:transparent}
}
.plh-trunc{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.plh-mono{font-variant-numeric:tabular-nums;letter-spacing:-.01em;}
.plh-pill{
  display:inline-flex;align-items:center;padding:4px 8px;border-radius:48px;
  font-size:12px;line-height:16px;font-weight:400;white-space:nowrap;
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
  overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,.32);
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
  padding:0 30px;font-size:16px;font-weight:500;color:${C.textStrong};
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
  margin:24px 0 0;font-size:24px;line-height:28px;font-weight:500;
  color:${C.textStrong};text-align:center;
}
.plh-ph-sub{margin:12px 0 0;font-size:16px;line-height:20px;color:${C.textWeak};text-align:center;}

/* Booking card - one component, both screens. */
.plh-ph-card{
  width:100%;padding:16px;border-radius:16px;
  background:${C.fillWeak};display:flex;flex-direction:column;gap:12px;
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
  display:inline-flex;align-items:center;padding:4px 8px;
  border-radius:48px;background:${C.textStrong};
  color:${C.white};font-size:12px;line-height:16px;font-weight:400;white-space:nowrap;
}
.plh-bolt{
  padding:4px 8px;border-radius:48px;background:${C.white};
  display:inline-flex;align-items:center;justify-content:center;
}
.plh-ph-startsin{
  margin-left:auto;display:inline-flex;align-items:center;gap:4px;
  font-size:12px;line-height:16px;font-weight:500;color:${C.textStrong};white-space:nowrap;
}
.plh-ph-namerow{display:flex;align-items:center;justify-content:space-between;gap:8px;}
/* The app's bottom-nav glyphs are 24x24 Figma exports; the wrapper only
   has to stop them inheriting the label's line box. */
.plh-tabglyph{display:block;width:24px;height:24px;}
.plh-tabglyph svg{display:block;width:24px;height:24px;}
/* Credits value sits beside its glyph, Spacing.xs apart as in the app. */
.plh-credrow{display:inline-flex;align-items:center;gap:4px;}
.plh-checkart{
  display:block;width:88px;height:88px;object-fit:contain;
  animation:plh-checkpop .72s cubic-bezier(.16,1,.3,1) .4s both;
}
/* The app's useSuccessPop: a 400ms wait, 180ms up to 1.18, then a
   spring back (damping 8, stiffness 200). A keyframe cannot BE a
   spring, so the settle is written out as its first two bounces -
   which is all of it that the eye reads at this duration. */
@keyframes plh-checkpop{
  0%{transform:scale(1)}
  25%{transform:scale(1.18)}
  52%{transform:scale(.972)}
  74%{transform:scale(1.014)}
  90%{transform:scale(.996)}
  100%{transform:scale(1)}
}
/* Upcoming -> Active, as a turn rather than a cut. */
.plh-turnover{animation:plh-turnover .5s cubic-bezier(.16,1,.3,1) both;}
@keyframes plh-turnover{
  from{opacity:0;transform:translateY(-4px) scale(.94)}
  to{opacity:1;transform:none}
}
.plh-ph-name{font-size:18px;line-height:24px;font-weight:500;color:${C.textStrong};white-space:nowrap;}
.plh-ph-statuspill{align-self:center;}
.plh-ph-row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:16px;line-height:20px;color:${C.textWeak};white-space:nowrap;}
.plh-ph-row b{font-size:14px;line-height:16px;font-weight:500;color:${C.textStrong};text-align:right;white-space:nowrap;}
.plh-manage{
  align-self:flex-end;font-size:14px;line-height:16px;font-weight:500;color:${C.textStrong};
  text-decoration:underline;
}

.plh-ph-ctas{width:100%;margin-top:auto;padding-bottom:26px;display:flex;flex-direction:column;gap:10px;}
.plh-btn{
  position:relative;overflow:hidden;height:56px;border-radius:8px;
  display:grid;place-items:center;font-size:18px;line-height:24px;font-weight:400;
  transition:transform .22s cubic-bezier(.16,1,.3,1),filter .22s ease;
}
.plh-btn-primary{background:${C.accent};color:${C.textStrong};}
.plh-btn-secondary{background:${C.white};color:${C.textStrong};border:1px solid ${C.strokeMedium};}
.plh-btn.is-pressed{transform:scale(.967);filter:brightness(.97);}
/* The simulated fingertip.
   
   A soft filled disc roughly the size of a real contact patch, plus a
   ring leaving it - the same pair iOS draws when touch visualisation is
   turned on. Sized in design pixels like everything else inside the
   phone, so the 52px disc arrives on screen at about 40. */
.plh-ctawrap{position:relative;}
.plh-touchpoint{position:absolute;left:50%;top:50%;width:0;height:0;pointer-events:none;}
.plh-touchdot,.plh-touchring{
  position:absolute;left:0;top:0;width:52px;height:52px;margin:-26px 0 0 -26px;
  border-radius:999px;
}
.plh-touchdot{
  background:rgba(34,34,34,.22);
  box-shadow:inset 0 0 0 1px rgba(34,34,34,.10);
  animation:plh-dot .62s cubic-bezier(.16,1,.3,1) both;
}
@keyframes plh-dot{
  0%{transform:scale(.35);opacity:0}
  28%{transform:scale(1);opacity:1}
  100%{transform:scale(.94);opacity:0}
}
.plh-touchring{
  border:2px solid rgba(34,34,34,.44);
  animation:plh-ring .72s cubic-bezier(.16,1,.3,1) both;
}
@keyframes plh-ring{
  0%{transform:scale(.45);opacity:.85}
  100%{transform:scale(2.7);opacity:0}
}

/* Home tab */
.plh-ph-appbar{display:flex;align-items:center;justify-content:space-between;}
.plh-wordmark{display:flex;align-items:center;color:${C.textStrong};}
/* Height-constrained, width auto, so the lockup keeps its own ratio. */
.plh-wordmark-svg{height:26px;width:auto;display:block;}
.plh-credits{
  height:40px;display:inline-flex;align-items:center;gap:8px;padding:0 16px;
  border-radius:48px;border:1px solid ${C.strokeMedium};
  background:${C.white};font-size:14px;line-height:16px;font-weight:500;color:${C.textStrong};white-space:nowrap;
}
.plh-star{
  width:22px;height:22px;border-radius:999px;background:${C.textStrong};
  color:${C.white};display:inline-grid;place-items:center;font-size:12px;font-style:normal;
}
.plh-ph-section{
  display:flex;align-items:center;gap:8px;margin:16px 0 8px;
  font-size:12px;line-height:16px;font-weight:500;color:${C.textStrong};
}
.plh-ph-section i{width:9px;height:9px;border-radius:999px;background:${C.accent};}
.plh-promo{
  position:relative;overflow:hidden;margin-top:12px;padding:16px;border-radius:16px;
  background:${C.textStrong};display:flex;flex-direction:column;
}
.plh-promo b{
  font-size:16px;line-height:20px;font-weight:500;color:${C.white};
  max-width:240px;white-space:nowrap;position:relative;z-index:1;
}
.plh-promo>span:not(.plh-promo-cta):not(.plh-promo-cal):not(.plh-promo-car){
  margin-top:8px;font-size:16px;line-height:20px;color:rgba(255,255,255,.72);
}
.plh-promo-cta{
  align-self:flex-start;margin-top:16px;height:42px;display:inline-flex;align-items:center;
  padding:0 16px;border-radius:8px;
  background:${C.accent};color:${C.textStrong};font-size:14px;line-height:16px;font-weight:500;
}
.plh-promo-art{position:absolute;right:0;bottom:0;width:140px;height:116px;}
.plh-promo-car{position:absolute;right:0;bottom:0;width:130px;height:87px;object-fit:contain;}
.plh-promo-cal{position:absolute;right:10px;top:0;width:46px;height:46px;object-fit:contain;}
.plh-avail{
  margin-top:12px;padding:16px;border-radius:16px;background:${C.fillWeak};
  display:flex;align-items:center;justify-content:space-between;gap:12px;
}
/* The text column must be allowed to shrink or nowrap pushes the
   Add button off the card instead of fitting beside it. */
.plh-avail-txt{min-width:0;}
.plh-avail-txt b{display:block;font-size:16px;line-height:20px;font-weight:500;color:${C.textStrong};}
.plh-avail-txt span{display:block;margin-top:4px;font-size:14px;line-height:16px;color:${C.textWeak};}
.plh-avail-cta{
  flex:0 0 auto;height:42px;display:inline-flex;align-items:center;padding:0 16px;
  border-radius:8px;background:${C.accent};color:${C.textStrong};font-size:14px;line-height:16px;font-weight:500;
}
/* Floating tab bar, as in the app. */
.plh-tabbar{
  position:absolute;left:18px;right:18px;bottom:16px;height:66px;
  display:flex;align-items:center;justify-content:space-around;
  border-radius:999px;background:${C.white};
  box-shadow:0 8px 30px rgba(0,0,0,.16);border:1px solid ${C.strokeWeak};
  font-size:12px;line-height:16px;font-weight:400;color:${C.textWeaker};
}
.plh-tabbar span{display:flex;flex-direction:column;align-items:center;gap:4px;}
.plh-tabbar .is-on{color:${C.textStrong};font-weight:500;}

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
