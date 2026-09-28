/**
 * ParqletDemo — animated product demo for parqlet.com
 * ---------------------------------------------------------------
 * Zero dependencies besides React 17+. Drop it in and render:
 *
 *   import ParqletDemo from "./ParqletDemo";
 *   <ParqletDemo />
 *
 * Props (all optional):
 *   appStoreUrl  string   App Store link used by the final CTA
 *   demoUrl      string   "Book a demo" link used by the final CTA
 *   autoPlay     boolean  start playing on mount (default true)
 *   loop         boolean  loop forever (default true)
 *   loadFonts    boolean  inject Rubik + Inter from Google Fonts (default true)
 *   rounded      number   corner radius of the stage in px (default 28)
 *   startAt      number   start time in ms (default 0)
 *   className / style     passed to the outer wrapper
 *
 * - Fully responsive: 16:9 stage on desktop, portrait layout under 640px.
 * - Pauses automatically when scrolled out of view or tab is hidden.
 * - Timeline is clickable (seek to any chapter); Space / click toggles play.
 * - Respects prefers-reduced-motion (starts paused on a finished frame).
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Rubik:ital,wght@0,400;0,500;0,600;0,700;0,800;1,800&display=swap";

/* Styles live inside a Shadow DOM so the host site's CSS (h1/p/span rules,
   Tailwind preflight, inherited white-space, etc.) can never leak in. */
const SHADOW_CSS = `
  :host { all: initial; display: block; contain: content; }
  .pq-root { all: initial; display: block; position: absolute; inset: 0; overflow: hidden;
    font-family: Inter, 'Inter Fallback', system-ui, -apple-system, sans-serif; color: #fff;
    line-height: 1.35; white-space: normal; letter-spacing: normal; text-align: left;
    -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }
  .pq-root *, .pq-root *::before, .pq-root *::after { box-sizing: border-box; }
  .pq-root h1, .pq-root h2, .pq-root p { margin: 0; padding: 0; font: inherit; background: none; border: 0; text-transform: none; }
  .pq-root span, .pq-root div { background-clip: border-box; }
  .pq-root button { font: inherit; color: inherit; appearance: none; -webkit-appearance: none; margin: 0; }
  .pq-root button:focus-visible, .pq-root a:focus-visible { outline: 2px solid #C7E51F; outline-offset: 3px; }
  .pq-root a { color: inherit; text-decoration: none; }
  .pq-root a.pq-cta { transition: transform .2s ease, box-shadow .2s ease; }
  .pq-root a.pq-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(0,0,0,.35); }
  .pq-root svg { display: inline-block; vertical-align: middle; overflow: visible; }
  .pq-root .pq-tl:hover .pq-tl-label { color: #fff !important; }
`;

function Shadow({ children }) {
  const hostRef = useRef(null);
  const [root, setRoot] = useState(null);
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setRoot(host.shadowRoot || host.attachShadow({ mode: "open" }));
  }, []);
  return (
    <div ref={hostRef} style={{ position: "absolute", inset: 0 }}>
      {root &&
        createPortal(
          <>
            <style>{SHADOW_CSS}</style>
            <div className="pq-root">{children}</div>
          </>,
          root
        )}
    </div>
  );
}

function useBrandFonts(enabled) {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;
    if (document.querySelector('link[data-parqlet-fonts]')) return;
    const pre = document.createElement("link");
    pre.rel = "preconnect"; pre.href = "https://fonts.gstatic.com"; pre.crossOrigin = "";
    const l = document.createElement("link");
    l.rel = "stylesheet"; l.href = FONT_HREF; l.setAttribute("data-parqlet-fonts", "");
    document.head.appendChild(pre); document.head.appendChild(l);
  }, [enabled]);
}

/* ------------------------------------------------------------------ */
/* Brand                                                               */
/* ------------------------------------------------------------------ */
const C = {
  lime: "#C7E51F",
  limeSoft: "#EEF7C2",
  ink: "#222222",
  ink2: "#2C2C2C",
  bg: "#1B1B1B",
  cream: "#F8F6F2",
  card: "#F4F4F1",
  line: "#E7E6E1",
  gray: "#8C8C87",
  gray2: "#B9B9B3",
  orange: "#F29A38",
  orangeDk: "#D57A22",
  green: "#3DBE6B",
};
const RUBIK = "Rubik, 'Rubik Fallback', system-ui, sans-serif";
const INTER = "Inter, 'Inter Fallback', system-ui, -apple-system, sans-serif";

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */
const SCENES = [
  { key: "intro", label: "Parqlet", dur: 3800 },
  { key: "share", label: "Share", dur: 5600 },
  { key: "book", label: "Book", dur: 6800 },
  { key: "park", label: "Park", dur: 4600 },
  { key: "earn", label: "Earn", dur: 4600 },
  { key: "manage", label: "Manage", dur: 5600 },
  { key: "outro", label: "Get the app", dur: 5200 },
];
const STARTS = SCENES.reduce((a, s, i) => (a.push(i ? a[i - 1] + SCENES[i - 1].dur : 0), a), []);
const TOTAL = STARTS[STARTS.length - 1] + SCENES[SCENES.length - 1].dur;

const CAPTIONS = {
  1: {
    kicker: "01 · Share",
    title: [{ t: "Away for the weekend?" }, { t: "Share your spot.", hl: true }],
    body: "Ryan · Unit 1708 marks spot #135 as available while he's out of town.",
  },
  2: {
    kicker: "02 · Book",
    title: [{ t: "Kate books it for" }, { t: "her in-laws.", hl: true }],
    body: "Pick the car, pick the guest, pay with 1 credit or Apple Pay.",
  },
  3: {
    kicker: "03 · Park",
    title: [{ t: "Confirmed", hl: true }, { t: "in seconds." }],
    body: "Her guests get a digital permit. No scrambling at the gate.",
  },
  4: {
    kicker: "04 · Earn",
    title: [{ t: "Ryan earns" }, { t: "credits.", hl: true }],
    body: "Spend them on his own guests next time, or exchange for a gift card.",
  },
  5: {
    kicker: "For building management",
    title: [{ t: "Full visibility." }, { t: "Zero added workload.", hl: true }],
    bullets: [
      "Private, resident-only community",
      "Every guest vehicle, in real time",
      "License plate verification",
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Easing helpers                                                      */
/* ------------------------------------------------------------------ */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const outCubic = (x) => 1 - Math.pow(1 - x, 3);
const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const outBack = (x) => {
  const c1 = 1.6, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const linear = (x) => x;
const seg = (t, start, dur, fn = outCubic) => fn(clamp((t - start) / dur));
const lerp = (a, b, p) => a + (b - a) * p;

/* ------------------------------------------------------------------ */
/* Small graphics                                                      */
/* ------------------------------------------------------------------ */
function CarTop({ w = 22, color = C.lime, style }) {
  // top-down car, nose pointing up
  return (
    <svg width={w} height={w * 1.9} viewBox="0 0 24 46" style={style} aria-hidden>
      <rect x="1.5" y="1" width="21" height="44" rx="7.5" fill={color} />
      <rect x="4.2" y="10" width="15.6" height="8.5" rx="2.6" fill="#161616" opacity=".88" />
      <rect x="4.6" y="31" width="14.8" height="6.5" rx="2.2" fill="#161616" opacity=".72" />
      <rect x="5.2" y="19.8" width="13.6" height="10" rx="1.6" fill="#fff" opacity=".18" />
      <rect x="3" y="2.5" width="4" height="2.4" rx="1.2" fill="#fff" opacity=".85" />
      <rect x="17" y="2.5" width="4" height="2.4" rx="1.2" fill="#fff" opacity=".85" />
    </svg>
  );
}

function Vehicle({ kind, w = 64 }) {
  const body = C.orange, dk = C.orangeDk, win = "#2C2C2C";
  const wheel = (cx, r = 5.2) => (
    <g key={cx}>
      <circle cx={cx} cy="25" r={r} fill="#222" />
      <circle cx={cx} cy="25" r={r * 0.42} fill="#9a9a95" />
    </g>
  );
  let el;
  if (kind === "compact")
    el = (
      <>
        <path d="M9 24 L10.5 16 Q12.5 10 19 10 L35 10 Q41 10 45 15.5 L51 17.5 Q55 18.6 55 22.5 L55 25 L9 25Z" fill={body} />
        <path d="M18 12.3 L27 12.3 L27 17 L14.5 17 Q15.4 12.3 18 12.3Z M29.5 12.3 L35 12.3 Q39 12.3 42 17 L29.5 17Z" fill={win} />
        <rect x="9" y="21" width="46" height="2" fill={dk} opacity=".5" />
        {wheel(19)}
        {wheel(45)}
      </>
    );
  else if (kind === "standard")
    el = (
      <>
        <path d="M4 24 L5.5 18 Q7.5 15.2 14 14.4 L20.5 9.2 Q22.5 8 26.5 8 L38 8 Q42 8 45.2 11 L50 14 Q58.5 15 60 19.5 L60 25 L4 25Z" fill={body} />
        <path d="M22 10.4 L31 10.4 L31 14.6 L17.6 14.6Z M33.4 10.4 L38 10.4 Q41.2 10.4 44.2 14.6 L33.4 14.6Z" fill={win} />
        <rect x="4" y="20.6" width="56" height="2" fill={dk} opacity=".5" />
        {wheel(15)}
        {wheel(49)}
      </>
    );
  else if (kind === "suv")
    el = (
      <>
        <path d="M4 24 L4 13 Q4 6.5 10.5 6.5 L42 6.5 Q46 6.5 49 10.5 L53.5 14.5 Q60 15.8 60 20.5 L60 25 L4 25Z" fill={body} />
        <path d="M8 9 L22 9 L22 14.4 L8 14.4Z M24.5 9 L36 9 L36 14.4 L24.5 14.4Z M38.4 9 L42 9 Q44.8 9 47.8 14.4 L38.4 14.4Z" fill={win} />
        <rect x="4" y="19.6" width="56" height="2" fill={dk} opacity=".5" />
        {wheel(16, 5.8)}
        {wheel(48, 5.8)}
      </>
    );
  else
    el = (
      <>
        <circle cx="14" cy="24" r="6.6" fill="none" stroke="#222" strokeWidth="3" />
        <circle cx="50" cy="24" r="6.6" fill="none" stroke="#222" strokeWidth="3" />
        <path d="M14 24 L24 14 L38 14 L44 19 L50 24" fill="none" stroke="#555" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M22 13 Q30 7 40 10 L44 14 L26 16Z" fill={body} />
        <path d="M40 10 L46 6 L49 7" fill="none" stroke="#333" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M18 12 L26 11" stroke={dk} strokeWidth="3" strokeLinecap="round" />
      </>
    );
  return (
    <svg width={w} height={w / 2} viewBox="0 0 64 32" aria-hidden>
      {el}
    </svg>
  );
}

function Check({ size = 12, color = C.ink, stroke = 2.4 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden>
      <path d="M2.2 6.4 L4.9 9 L9.8 3.3" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarCoin({ size = 40, spin = 0 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", background: C.ink,
        display: "grid", placeItems: "center",
        transform: `rotateY(${spin}deg)`, boxShadow: "0 6px 16px rgba(0,0,0,.18)",
      }}
    >
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2.6 L14.9 8.6 L21.4 9.4 L16.6 13.9 L17.9 20.4 L12 17.2 L6.1 20.4 L7.4 13.9 L2.6 9.4 L9.1 8.6Z" fill={C.lime} stroke={C.lime} strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function AppIcon({ size = 34 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.26, background: C.ink, display: "grid", placeItems: "center", flex: "none" }}>
      <span style={{ fontFamily: RUBIK, fontWeight: 800, fontStyle: "italic", color: "#fff", fontSize: size * 0.58, lineHeight: 1, transform: "translateX(-1px)" }}>P</span>
    </div>
  );
}

function Wordmark({ size = 28, color = "#fff" }) {
  return (
    <span style={{ fontFamily: RUBIK, fontWeight: 800, fontStyle: "italic", fontSize: size, letterSpacing: "-0.01em", color, lineHeight: 1 }}>
      PARQLET
    </span>
  );
}

function QR({ size = 64, seed = 135 }) {
  const n = 13;
  const cells = [];
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const finder = (x, y) => (x < 4 && y < 4) || (x > n - 5 && y < 4) || (x < 4 && y > n - 5);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (finder(x, y)) continue;
      if (rnd() > 0.52) cells.push(<rect key={x + "-" + y} x={x} y={y} width="1" height="1" />);
    }
  const F = ({ x, y }) => (
    <g>
      <rect x={x} y={y} width="3.4" height="3.4" fill="none" stroke="#222" strokeWidth=".7" />
      <rect x={x + 1} y={y + 1} width="1.4" height="1.4" />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`-1 -1 ${n + 2} ${n + 2}`} style={{ background: "#fff", borderRadius: 8 }} aria-hidden>
      <g fill="#222">
        {cells}
        <F x={0.3} y={0.3} />
        <F x={n - 3.7} y={0.3} />
        <F x={0.3} y={n - 3.7} />
      </g>
    </svg>
  );
}

/* Animated tap indicator (coordinates inside the phone screen) */
function Tap({ lt, at, x, y }) {
  const d = lt - at;
  if (d < -420 || d > 650) return null;
  const appear = seg(d, -420, 260);
  const press = d < 0 ? 1 : d < 110 ? 1 - 0.22 * (d / 110) : 0.78 + 0.22 * seg(d, 110, 220);
  const ripple = seg(d, 0, 560);
  const fade = 1 - seg(d, 360, 260);
  return (
    <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none", zIndex: 60 }}>
      <div
        style={{
          position: "absolute", width: 46, height: 46, marginLeft: -23, marginTop: -23, borderRadius: "50%",
          border: `2px solid ${C.lime}`, opacity: d > 0 ? (1 - ripple) * 0.95 : 0,
          transform: `scale(${0.5 + ripple * 1.25})`,
        }}
      />
      <div
        style={{
          position: "absolute", width: 34, height: 34, marginLeft: -17, marginTop: -17, borderRadius: "50%",
          background: "rgba(34,34,34,.26)", boxShadow: "0 0 0 2px rgba(255,255,255,.9), 0 6px 14px rgba(0,0,0,.2)",
          opacity: appear * fade, transform: `scale(${press})`,
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Phone chrome                                                        */
/* ------------------------------------------------------------------ */
const SW = 272; // screen width
const SH = 582; // screen height

function StatusBar({ dark }) {
  const c = dark ? "#fff" : C.ink;
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 40, zIndex: 40, pointerEvents: "none" }}>
      <span style={{ position: "absolute", left: 28, top: 15, fontSize: 12.5, fontWeight: 600, color: c, fontFamily: INTER }}>22:20</span>
      <div style={{ position: "absolute", left: "50%", top: 9, width: 86, height: 25, marginLeft: -43, borderRadius: 14, background: "#0b0b0b" }} />
      <svg style={{ position: "absolute", right: 22, top: 16 }} width="58" height="11" viewBox="0 0 58 11" aria-hidden>
        <g fill={c}>
          <rect x="0" y="7" width="2.6" height="4" rx=".6" />
          <rect x="4" y="5" width="2.6" height="6" rx=".6" />
          <rect x="8" y="3" width="2.6" height="8" rx=".6" />
          <rect x="12" y="1" width="2.6" height="10" rx=".6" />
          <path d="M24.5 3.2 Q28.5 -0.2 32.5 3.2 L31.3 4.4 Q28.5 2 25.7 4.4Z M26.4 5.3 Q28.5 3.6 30.6 5.3 L29.4 6.5 Q28.5 5.8 27.6 6.5Z M28.5 9.6 L27.3 8.4 Q28.5 7.6 29.7 8.4Z" />
          <rect x="37.5" y="1" width="18" height="9.4" rx="2.6" fill="none" stroke={c} strokeOpacity=".4" />
          <rect x="39" y="2.5" width="13.6" height="6.4" rx="1.4" />
          <rect x="56.2" y="3.8" width="1.4" height="3.6" rx=".7" opacity=".4" />
        </g>
      </svg>
    </div>
  );
}

function TopBar({ title, sub, action }) {
  return (
    <div style={{ position: "absolute", top: 44, left: 0, right: 0, height: 36, textAlign: "center" }}>
      <svg style={{ position: "absolute", left: 16, top: 4 }} width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <path d="M13 8 H3.5 M7.5 3.5 L3 8 L7.5 12.5" fill="none" stroke={C.ink} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{title}</div>
      {sub && <div style={{ fontSize: 10.5, color: C.gray, marginTop: 3 }}>{sub}</div>}
      {action && <div style={{ position: "absolute", right: 16, top: 1, fontSize: 10.5, color: C.ink, textDecoration: "underline" }}>{action}</div>}
    </div>
  );
}

function Screen({ children, style }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", overflow: "hidden", fontFamily: INTER, color: C.ink, ...style }}>
      {children}
    </div>
  );
}

function Phone({ x, y, scale = 1, style, children }) {
  return (
    <div
      style={{
        position: "absolute", left: x, top: y, width: 290, height: 600, transformOrigin: "0 0",
        ...style,
        transform: `${style?.transform || ""} scale(${scale})`,
      }}
    >
      <div
        style={{
          position: "absolute", inset: 0, borderRadius: 48, background: "linear-gradient(145deg,#3a3a3a,#0e0e0e 40%,#1f1f1f)",
          boxShadow: "0 40px 80px -20px rgba(0,0,0,.65), 0 0 0 1.5px #4a4a4a inset, 0 0 0 1px rgba(255,255,255,.06)",
        }}
      />
      <div style={{ position: "absolute", left: 9, top: 9, width: SW, height: SH, borderRadius: 40, overflow: "hidden", background: "#fff", isolation: "isolate" }}>
        {children}
        <div style={{ position: "absolute", bottom: 7, left: "50%", width: 104, height: 4, marginLeft: -52, borderRadius: 4, background: "#111", opacity: 0.85, zIndex: 70 }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Screens                                                             */
/* ------------------------------------------------------------------ */
const JULY_OFFSET = 3; // July 1, 2026 is a Wednesday

function ScreenShare({ lt }) {
  const sel = seg(lt, 650, 260);
  const sheet = seg(lt, 1050, 620);
  const startSet = lt > 1800;
  const fill = clamp((lt - 2000) / 850);
  const endDay = startSet ? 24 + Math.min(3, Math.floor(fill * 4)) : 0;
  const endSet = lt > 2900;
  const done = lt > 3720;
  const toast = seg(lt, 3950, 420, outBack) * (1 - seg(lt, 5200, 300));
  const sheetTop = 252;

  const card = (id, desc, ev, i) => {
    const active = i === 0 ? sel : 0;
    return (
      <div
        style={{
          position: "absolute", left: 14, right: 14, top: 136 + i * 74, height: 64, borderRadius: 14,
          background: active > 0.5 ? "#F8FBE8" : C.card, border: `1.6px solid ${active > 0.5 ? C.lime : "transparent"}`,
          padding: "10px 12px", boxSizing: "border-box", transition: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ background: C.ink, color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 6px", borderRadius: 6 }}>P #{id}</span>
          {ev && (
            <span style={{ color: C.green, fontSize: 11 }} aria-hidden>
              <svg width="10" height="12" viewBox="0 0 10 12"><path d="M6 0 L0 7 H4.5 L3.5 12 L10 4.5 H5.5Z" fill={C.green} /></svg>
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "#555", marginTop: 8 }}>{desc}</div>
        <div
          style={{
            position: "absolute", right: 12, top: 21, width: 20, height: 20, borderRadius: "50%",
            border: `1.6px solid ${active > 0.5 ? C.lime : C.gray2}`, background: active > 0.5 ? C.lime : "#fff",
            display: "grid", placeItems: "center", transform: `scale(${1 + Math.sin(active * Math.PI) * 0.25})`,
          }}
        >
          {active > 0.5 && <Check size={11} />}
        </div>
      </div>
    );
  };

  const days = [];
  for (let d = 1; d <= 31; d++) {
    const idx = JULY_OFFSET + d - 1;
    const r = Math.floor(idx / 7), c = idx % 7;
    const inRange = startSet && d >= 24 && d <= endDay;
    const isStart = startSet && d === 24;
    const isEnd = endSet && d === 27;
    const past = d < 22;
    const band = inRange && !(d === 24 && endDay === 24);
    days.push(
      <div key={d} style={{ position: "absolute", left: 17 + c * 34, top: 72 + r * 34, width: 34, height: 34 }}>
        {band && (
          <div
            style={{
              position: "absolute", top: 4, bottom: 4,
              left: d === 24 ? 17 : 0, right: d === endDay ? (endSet ? 17 : 6) : 0,
              background: C.limeSoft, borderRadius: d === endDay && !endSet ? "0 13px 13px 0" : 0,
            }}
          />
        )}
        {(isStart || isEnd) && (
          <div
            style={{
              position: "absolute", inset: 3, borderRadius: "50%", background: C.lime,
              transform: `scale(${isStart ? outBack(clamp((lt - 1800) / 300)) : outBack(clamp((lt - 2900) / 300))})`,
            }}
          />
        )}
        <div
          style={{
            position: "relative", lineHeight: "34px", textAlign: "center", fontSize: 11.5,
            fontWeight: isStart || isEnd ? 700 : 500, color: past ? "#C8C8C2" : C.ink,
          }}
        >
          {d}
        </div>
      </div>
    );
  }

  return (
    <Screen>
      <StatusBar />
      <div style={{ opacity: 1 - clamp(toast * 1.4) }}><TopBar title="Share your spot" sub="1 of 2" /></div>
      <div style={{ position: "absolute", top: 90, left: 20, right: 20, textAlign: "center", fontSize: 16, fontWeight: 700, lineHeight: 1.25, fontFamily: RUBIK, opacity: 1 - clamp(toast * 1.4) }}>
        Which spot do you want to share?
      </div>
      {card(135, "For standard car · Level P2", true, 0)}
      {card(519, "For standard car · Level P3", false, 1)}

      <div
        style={{
          position: "absolute", left: 0, right: 0, top: sheetTop, height: 330, background: "#fff", borderRadius: "22px 22px 0 0",
          boxShadow: "0 -12px 30px rgba(0,0,0,.12)", transform: `translateY(${(1 - sheet) * 345}px)`,
        }}
      >
        <div style={{ position: "absolute", top: 7, left: "50%", width: 34, height: 4, marginLeft: -17, borderRadius: 3, background: "#DDD" }} />
        <div style={{ position: "absolute", top: 22, left: 20, fontSize: 15, fontWeight: 700, fontFamily: RUBIK }}>July</div>
        <div style={{ position: "absolute", top: 24, right: 20, fontSize: 10.5, color: C.gray }}>
          {endSet ? "4 days selected" : startSet ? "Pick end date" : "Pick start date"}
        </div>
        {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
          <div key={i} style={{ position: "absolute", top: 52, left: 17 + i * 34, width: 34, textAlign: "center", fontSize: 9.5, color: C.gray, fontWeight: 600 }}>
            {w}
          </div>
        ))}
        {days}
        <div
          style={{
            position: "absolute", left: 14, right: 14, top: 254, height: 46, borderRadius: 12,
            background: done ? C.ink : C.lime, color: done ? C.lime : C.ink, display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, fontSize: 13, fontWeight: 600, opacity: endSet ? 1 : 0.45,
            transform: `scale(${lt > 3700 && lt < 3820 ? 0.96 : 1})`,
          }}
        >
          {done ? (<><Check size={12} color={C.lime} /> Shared · Jul 24 – 27</>) : "Share spot #135"}
        </div>
      </div>

      <div
        style={{
          position: "absolute", top: 44, left: 16, right: 16, borderRadius: 16, background: C.ink, color: "#fff",
          padding: "11px 13px", display: "flex", gap: 10, alignItems: "center", zIndex: 30,
          transform: `translateY(${(1 - toast) * -120}px)`, opacity: toast > 0.02 ? 1 : 0,
          boxShadow: "0 12px 26px rgba(0,0,0,.25)",
        }}
      >
        <div style={{ width: 28, height: 28, borderRadius: 8, background: C.lime, display: "grid", placeItems: "center" }}><Check size={13} /></div>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 600 }}>Spot #135 is live</div>
          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>You'll earn credits when it's booked</div>
        </div>
      </div>

      <Tap lt={lt} at={650} x={136} y={168} />
      <Tap lt={lt} at={1800} x={204} y={sheetTop + 72 + 3 * 34 + 17} />
      <Tap lt={lt} at={2900} x={68} y={sheetTop + 72 + 4 * 34 + 17} />
      <Tap lt={lt} at={3700} x={136} y={sheetTop + 277} />
    </Screen>
  );
}

function ScreenBook({ lt }) {
  const pickStd = lt > 1300;
  const cont = lt > 2200;
  const slide = seg(lt, 2450, 520, inOut);
  const pickMax = lt > 3300;
  const match = seg(lt, 3550, 500, outBack);
  const sheet = seg(lt, 4300, 560);
  const booking = lt > 5520 && lt < 6250;
  const booked = lt >= 6250;

  const types = [
    ["compact", "Compact"],
    ["standard", "Standard"],
    ["suv", "Large SUV"],
    ["moto", "Motorcycle"],
  ];

  const guests = [
    ["Max Johnson", "Tesla Model Y", "APC 1234", true],
    ["Linda Park", "Honda CR-V", "KTR 5521", true],
  ];

  return (
    <Screen>
      <StatusBar />
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${-slide * SW}px)` }}>
        {/* Panel 1: vehicle type */}
        <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH }}>
          <TopBar title="Booking parking spot" sub="1 of 3" />
          <div style={{ position: "absolute", top: 94, left: 24, right: 24, textAlign: "center", fontSize: 17, fontWeight: 700, fontFamily: RUBIK, lineHeight: 1.22 }}>
            Select your guest's vehicle type
          </div>
          <div style={{ position: "absolute", top: 146, left: 24, right: 24, textAlign: "center", fontSize: 10.5, color: C.gray }}>
            We'll match a compatible spot
          </div>
          {types.map(([k, label], i) => {
            const r = Math.floor(i / 2), c = i % 2;
            const on = pickStd && k === "standard";
            const pop = k === "standard" ? outBack(clamp((lt - 1300) / 300)) : 0;
            return (
              <div
                key={k}
                style={{
                  position: "absolute", left: 14 + c * 128, top: 176 + r * 112, width: 116, height: 100, borderRadius: 14,
                  background: on ? "#F8FBE8" : C.card, border: `1.6px solid ${on ? C.lime : "transparent"}`, boxSizing: "border-box",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                  transform: `scale(${on ? 1 + Math.sin(pop * Math.PI) * 0.05 : 1})`,
                }}
              >
                <Vehicle kind={k} w={70} />
                <div style={{ fontSize: 11.5, fontWeight: 600 }}>{label}</div>
                {on && (
                  <div style={{ position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: "50%", background: C.lime, display: "grid", placeItems: "center", transform: `scale(${pop})` }}>
                    <Check size={10} />
                  </div>
                )}
              </div>
            );
          })}
          <div
            style={{
              position: "absolute", left: 14, right: 14, top: 500, height: 46, borderRadius: 12, background: C.lime,
              display: "grid", placeItems: "center", fontSize: 13, fontWeight: 600, opacity: pickStd ? 1 : 0.4,
              transform: `scale(${cont && lt < 2330 ? 0.96 : 1})`,
            }}
          >
            Continue
          </div>
        </div>

        {/* Panel 2: guest */}
        <div style={{ position: "absolute", left: SW, top: 0, width: SW, height: SH }}>
          <TopBar title="Booking parking spot" sub="2 of 3" />
          <div style={{ position: "absolute", top: 94, left: 24, right: 24, textAlign: "center", fontSize: 17, fontWeight: 700, fontFamily: RUBIK }}>
            Who's visiting?
          </div>
          <div style={{ position: "absolute", top: 122, left: 24, right: 24, textAlign: "center", fontSize: 10.5, color: C.gray }}>
            Choose a guest from your favorites
          </div>
          {guests.map(([n, car, plate], i) => {
            const on = pickMax && i === 0;
            return (
              <div
                key={n}
                style={{
                  position: "absolute", left: 14, right: 14, top: 152 + i * 72, height: 62, borderRadius: 14, boxSizing: "border-box",
                  background: on ? "#F8FBE8" : C.card, border: `1.6px solid ${on ? C.lime : "transparent"}`, padding: "11px 12px",
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{n}</div>
                <div style={{ fontSize: 10.5, color: "#666", marginTop: 5, display: "flex", justifyContent: "space-between", paddingRight: 26 }}>
                  <span>{car}</span>
                  <span style={{ fontWeight: 600, color: C.ink }}>{plate}</span>
                </div>
                <svg style={{ position: "absolute", right: 12, top: 12 }} width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 2.6 L14.9 8.6 L21.4 9.4 L16.6 13.9 L17.9 20.4 L12 17.2 L6.1 20.4 L7.4 13.9 L2.6 9.4 L9.1 8.6Z" fill={C.lime} stroke={C.ink} strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 14, right: 14, top: 298, height: 40, borderRadius: 12, border: `1.4px dashed ${C.gray2}`, display: "grid", placeItems: "center", fontSize: 11.5, color: "#555" }}>
            + Add a new guest
          </div>
          <div
            style={{
              position: "absolute", left: 14, right: 14, top: 352, borderRadius: 16, background: C.ink, color: "#fff", padding: "13px 14px",
              opacity: match, transform: `translateY(${(1 - match) * 20}px) scale(${0.94 + 0.06 * match})`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 9.5, letterSpacing: ".12em", textTransform: "uppercase", color: C.lime, fontWeight: 700 }}>Best match</span>
              <span style={{ fontSize: 9.5, background: "rgba(199,229,31,.16)", color: C.lime, padding: "3px 7px", borderRadius: 99 }}>Available</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
              <span style={{ fontFamily: RUBIK, fontSize: 26, fontWeight: 700 }}>#135</span>
              <span style={{ fontSize: 11, opacity: 0.7 }}>Standard · Level P2</span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>Sat, Jul 25 7PM → Mon, Jul 27 9AM</div>
          </div>
        </div>
      </div>

      {/* Pay sheet */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.28)", opacity: sheet, pointerEvents: "none" }} />
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: 312, height: 270, background: "#fff", borderRadius: "22px 22px 0 0",
          transform: `translateY(${(1 - sheet) * 290}px)`, boxShadow: "0 -12px 30px rgba(0,0,0,.14)",
        }}
      >
        <div style={{ position: "absolute", top: 7, left: "50%", width: 34, height: 4, marginLeft: -17, borderRadius: 3, background: "#DDD" }} />
        <div style={{ position: "absolute", top: 22, left: 18, fontSize: 16, fontWeight: 700, fontFamily: RUBIK }}>Confirm booking</div>
        <div style={{ position: "absolute", top: 48, left: 18, fontSize: 10.5, color: C.gray }}>Spot #135 · Jul 25 – 27 · Max Johnson</div>
        {[
          ["1 credit", "Balance: 3 credits", true],
          ["Apple Pay", "or any card", false],
        ].map(([a, b, on], i) => (
          <div
            key={a}
            style={{
              position: "absolute", left: 14, right: 14, top: 76 + i * 56, height: 48, borderRadius: 12, boxSizing: "border-box",
              border: `1.6px solid ${on ? C.lime : C.line}`, background: on ? "#F8FBE8" : "#fff",
              display: "flex", alignItems: "center", gap: 10, padding: "0 12px",
            }}
          >
            {on ? <StarCoin size={24} /> : (
              <div style={{ width: 24, height: 24, borderRadius: 6, background: "#111", color: "#fff", fontSize: 9, fontWeight: 700, display: "grid", placeItems: "center" }}>Pay</div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{a}</div>
              <div style={{ fontSize: 9.5, color: C.gray, marginTop: 2 }}>{b}</div>
            </div>
            <div style={{ width: 18, height: 18, borderRadius: "50%", border: `1.6px solid ${on ? C.lime : C.gray2}`, background: on ? C.lime : "#fff", display: "grid", placeItems: "center" }}>
              {on && <Check size={10} />}
            </div>
          </div>
        ))}
        <div
          style={{
            position: "absolute", left: 14, right: 14, top: 200, height: 46, borderRadius: 12, background: booked ? C.lime : C.ink,
            color: booked ? C.ink : "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 600,
            transform: `scale(${lt > 5500 && lt < 5620 ? 0.96 : 1})`,
          }}
        >
          {booking ? (
            <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,.25)", borderTopColor: C.lime, transform: `rotate(${lt * 0.9}deg)` }} />
          ) : booked ? (<><Check size={12} /> Booked</>) : "Book spot #135"}
        </div>
      </div>

      <Tap lt={lt} at={1300} x={200} y={226} />
      <Tap lt={lt} at={2200} x={136} y={523} />
      <Tap lt={lt} at={3300} x={136} y={183} />
      <Tap lt={lt} at={5500} x={136} y={535} />
    </Screen>
  );
}

function ScreenPark({ lt }) {
  const circle = seg(lt, 0, 450, outBack);
  const tick = seg(lt, 250, 450);
  const text = seg(lt, 350, 500);
  const permit = seg(lt, 550, 700);
  const sent = lt > 2850;
  const burst = seg(lt, 150, 800);
  return (
    <Screen style={{ background: C.cream }}>
      <StatusBar />
      <div style={{ position: "absolute", left: 136 - 34, top: 70, width: 68, height: 68 }}>
        {[...Array(10)].map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          const r = 30 + burst * 26;
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: 34 + Math.cos(a) * r - 3, top: 34 + Math.sin(a) * r - 3, width: 6, height: 6,
                borderRadius: i % 2 ? 2 : "50%", background: i % 3 ? C.lime : C.ink, opacity: burst > 0 ? 1 - burst : 0,
              }}
            />
          );
        })}
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: C.lime, transform: `scale(${circle})`, display: "grid", placeItems: "center" }}>
          <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden>
            <path d="M5 12.5 L10 17.3 L19.5 7" fill="none" stroke={C.ink} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset={24 * (1 - tick)} />
          </svg>
        </div>
      </div>
      <div style={{ position: "absolute", top: 152, left: 0, right: 0, textAlign: "center", opacity: text, transform: `translateY(${(1 - text) * 10}px)` }}>
        <div style={{ fontFamily: RUBIK, fontSize: 19, fontWeight: 700 }}>You're all set!</div>
        <div style={{ fontSize: 11, color: C.gray, marginTop: 5 }}>Confirmed in 2 seconds</div>
      </div>

      <div
        style={{
          position: "absolute", left: 14, right: 14, top: 216, height: 236, borderRadius: 20, background: C.ink, color: "#fff",
          padding: 16, boxSizing: "border-box", overflow: "hidden",
          transform: `translateY(${(1 - permit) * 60}px) rotate(${(1 - permit) * -3}deg)`, opacity: permit,
          boxShadow: "0 18px 34px rgba(0,0,0,.22)",
        }}
      >
        <div style={{ position: "absolute", right: -40, top: -40, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(199,229,31,.35), transparent 70%)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 9, letterSpacing: ".14em", fontWeight: 700, color: C.ink, background: C.lime, padding: "4px 8px", borderRadius: 99 }}>GUEST PERMIT</span>
          <Wordmark size={11} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
          <div>
            <div style={{ fontSize: 9.5, opacity: 0.55 }}>Spot</div>
            <div style={{ fontFamily: RUBIK, fontSize: 40, fontWeight: 700, color: C.lime, lineHeight: 1.05 }}>#135</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>Level P2 · Standard</div>
          </div>
          <QR size={70} />
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,.12)", margin: "14px 0 10px", backgroundImage: "none" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 9, fontSize: 10.5 }}>
          {[
            ["Guest", "Max Johnson"],
            ["Plate", "APC 1234"],
            ["From", "Jul 25 · 7 PM"],
            ["Until", "Jul 27 · 9 AM"],
          ].map(([a, b]) => (
            <div key={a}>
              <div style={{ opacity: 0.5, fontSize: 9 }}>{a}</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute", left: 14, right: 14, top: 486, height: 44, borderRadius: 12, border: `1.5px solid ${sent ? C.lime : C.ink}`,
          background: sent ? C.lime : "transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontSize: 12.5, fontWeight: 600, opacity: permit,
        }}
      >
        {sent ? (<><Check size={12} /> Sent to Max</>) : "Send permit to guest"}
      </div>
      <Tap lt={lt} at={2800} x={136} y={508} />
    </Screen>
  );
}

function ScreenEarn({ lt }) {
  const banner = seg(lt, 200, 520, outBack) * (1 - seg(lt, 3300, 400, inOut));
  const count = seg(lt, 1300, 900, inOut);
  const bal = Math.round(lerp(8, 12, count));
  const spin = lt > 1200 && lt < 2300 ? seg(lt, 1200, 1100, inOut) * 720 : 0;
  const push = seg(lt, 1400, 520);
  const burst = seg(lt, 1350, 900);
  const bump = lt > 1300 && lt < 2300 ? 1 + Math.sin(((lt - 1300) / 1000) * Math.PI) * 0.08 : 1;
  const rows = [
    ["Shared spot", "#135", "Jul 25 – 27", "+4 credits", true],
    ["Booked spot", "#519", "Jul 12 · 6 – 11 PM", "−1 credit", false],
    ["Shared spot", "#135", "Jul 3 – 5", "+4 credits", true],
    ["Shared spot", "#135", "Jun 20 · 7 – 9 PM", "+1 credit", true],
  ];
  return (
    <Screen>
      <StatusBar />
      <TopBar title="Credits" action="What are credits?" />
      <div
        style={{
          position: "absolute", left: 14, right: 14, top: 84, height: 92, borderRadius: 16, background: C.card, padding: "14px 16px", boxSizing: "border-box",
        }}
      >
        <div style={{ fontSize: 11, color: "#666" }}>Credit balance</div>
        <div style={{ fontFamily: RUBIK, fontSize: 38, fontWeight: 700, marginTop: 4, transform: `scale(${bump})`, transformOrigin: "left center", display: "inline-block" }}>{bal}</div>
        <div style={{ position: "absolute", right: 16, top: 24, perspective: 400 }}>
          <StarCoin size={44} spin={spin} />
        </div>
        {[...Array(14)].map((_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const r = 10 + burst * (40 + (i % 3) * 10);
          return (
            <div
              key={i}
              style={{
                position: "absolute", right: 16 + 22 - Math.cos(a) * r - 3, top: 24 + 22 + Math.sin(a) * r - 3, width: 6, height: 6,
                borderRadius: i % 2 ? 2 : "50%", background: i % 3 ? C.lime : C.ink,
                opacity: burst > 0 && burst < 1 ? 1 - burst : 0, transform: `rotate(${i * 30 + burst * 180}deg)`,
              }}
            />
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 18, top: 194, fontSize: 12, fontWeight: 600 }}>History</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 218, height: 280, overflow: "hidden" }}>
        {rows.map(([a, id, when, amt, plus], i) => {
          const isNew = i === 0;
          const top = isNew ? 0 : lerp((i - 1) * 64, i * 64, push);
          return (
            <div
              key={i}
              style={{
                position: "absolute", left: 14, right: 14, top, height: 56, display: "flex", alignItems: "center", gap: 10,
                borderBottom: `1px solid ${C.line}`, opacity: isNew ? push : 1,
                transform: isNew ? `translateX(${(1 - push) * -30}px)` : "none",
                background: isNew ? `rgba(199,229,31,${0.18 * (1 - seg(lt, 2600, 900))})` : "transparent", borderRadius: isNew ? 10 : 0,
                padding: isNew ? "0 6px" : 0, boxSizing: "border-box",
              }}
            >
              <div style={{ width: 26, height: 26, borderRadius: 8, background: plus ? C.limeSoft : C.card, display: "grid", placeItems: "center", fontSize: 13 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                  <path d={plus ? "M10 6 H2 M5.5 2.5 L2 6 L5.5 9.5" : "M2 6 H10 M6.5 2.5 L10 6 L6.5 9.5"} fill="none" stroke={C.ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600 }}>{a} <span style={{ fontWeight: 500, color: C.gray }}>{id}</span></div>
                <div style={{ fontSize: 10, color: C.gray, marginTop: 3 }}>{when}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: plus ? C.ink : C.gray }}>{amt}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 14, right: 14, top: 510, height: 44, borderRadius: 12, border: `1.5px solid ${C.ink}`, display: "grid", placeItems: "center", fontSize: 12.5, fontWeight: 600 }}>
        Exchange for a gift card
      </div>

      <div
        style={{
          position: "absolute", top: 8, left: 10, right: 10, borderRadius: 18, background: "rgba(245,245,242,.96)", backdropFilter: "blur(10px)",
          padding: "10px 12px", display: "flex", gap: 10, alignItems: "center", zIndex: 45,
          transform: `translateY(${(1 - banner) * -110}px)`, boxShadow: "0 14px 30px rgba(0,0,0,.18)",
        }}
      >
        <AppIcon size={32} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700 }}>+4 credits earned!</span>
            <span style={{ fontSize: 9.5, color: C.gray }}>now</span>
          </div>
          <div style={{ fontSize: 10, color: "#555", marginTop: 2, lineHeight: 1.3 }}>Your spot #135 was used for a neighbor's guest.</div>
        </div>
      </div>
    </Screen>
  );
}

const PHONE_SCREENS = { 1: ScreenShare, 2: ScreenBook, 3: ScreenPark, 4: ScreenEarn };

/* ------------------------------------------------------------------ */
/* Stage layers                                                        */
/* ------------------------------------------------------------------ */
function Caption({ data, lt, dur, box, portrait }) {
  const out = seg(lt, dur - 480, 420, inOut);
  const k = seg(lt, 100, 500);
  const words = [];
  data.title.forEach((part, pi) => {
    part.t.split(" ").forEach((w) => words.push({ w, hl: part.hl, br: false }));
    if (pi < data.title.length - 1) words[words.length - 1].br = true;
  });
  const body = seg(lt, 700, 600);
  const size = portrait ? 34 : 54;
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, opacity: 1 - out, transform: `translateY(${-out * 18}px)` }}>
      <div
        style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: portrait ? "6px 12px" : "7px 14px", borderRadius: 99,
          background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.08)", color: "#D8D8D2",
          fontSize: portrait ? 11 : 12, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", fontFamily: RUBIK,
          opacity: k, transform: `translateY(${(1 - k) * 10}px)`,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.lime, boxShadow: `0 0 10px ${C.lime}` }} />
        {data.kicker}
      </div>
      <h2 style={{ margin: portrait ? "14px 0 0" : "22px 0 0", fontFamily: RUBIK, fontWeight: 500, fontSize: size, lineHeight: 1.06, letterSpacing: "-0.02em", color: "#fff" }}>
        {words.map((w, i) => {
          const p = seg(lt, 220 + i * 60, 650);
          return (
            <React.Fragment key={i}>
              <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", padding: "0.04em 0.02em 0.2em", margin: "-0.04em -0.02em -0.2em" }}>
                <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 105}%)`, color: w.hl ? C.lime : undefined }}>{w.w}</span>
              </span>
              {w.br && !portrait ? <br /> : " "}
            </React.Fragment>
          );
        })}
      </h2>
      {data.body && (
        <p style={{ margin: portrait ? "12px 0 0" : "22px 0 0", fontSize: portrait ? 15 : 19, lineHeight: 1.5, color: "rgba(255,255,255,.66)", maxWidth: 440, opacity: body, transform: `translateY(${(1 - body) * 12}px)` }}>
          {data.body}
        </p>
      )}
      {data.bullets && (
        <div style={{ marginTop: portrait ? 18 : 28, display: "grid", gap: portrait ? 9 : 14 }}>
          {data.bullets.map((b, i) => {
            const p = seg(lt, 800 + i * 180, 500);
            return (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,.82)", fontSize: portrait ? 14 : 17, opacity: p, transform: `translateX(${(1 - p) * -16}px)` }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: "rgba(199,229,31,.14)", display: "grid", placeItems: "center" }}>
                  <Check size={11} color={C.lime} />
                </span>
                {b}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Garage({ lt, dur, box }) {
  const inP = seg(lt, 300, 600);
  const out = seg(lt, dur - 480, 420, inOut);
  const spots = [133, 134, 135, 136, 137];
  const spotW = 64;
  const target = 2; // #135
  const tx = 24 + target * (spotW + 8) + spotW / 2;
  const drive = seg(lt, 900, 1100, inOut);
  const turn = seg(lt, 1900, 700, inOut);
  const carX = lerp(-30, tx, drive);
  const carY = lerp(140, 76, turn);
  const rot = lerp(90, 0, turn);
  const verified = seg(lt, 2650, 450, outBack);
  const pulse = 0.5 + 0.5 * Math.sin(lt / 180);
  return (
    <div
      style={{
        position: "absolute", left: box.x, top: box.y, width: box.w, height: 176, borderRadius: 20, overflow: "hidden",
        background: "linear-gradient(180deg,#2A2A2A,#232323)", border: "1px solid rgba(255,255,255,.08)",
        opacity: inP * (1 - out), transform: `translateY(${(1 - inP) * 24}px)`,
      }}
    >
      <div style={{ position: "absolute", left: 20, top: 14, fontSize: 11, letterSpacing: ".14em", color: "rgba(255,255,255,.5)", fontWeight: 600, fontFamily: RUBIK }}>
        GARAGE · LEVEL P2
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 36, height: 84 }}>
        {spots.map((s, i) => {
          const on = i === target;
          return (
            <div
              key={s}
              style={{
                position: "absolute", left: 24 + i * (spotW + 8), top: 0, width: spotW, height: 78, boxSizing: "border-box",
                borderLeft: "2px solid rgba(255,255,255,.18)", borderRight: "2px solid rgba(255,255,255,.18)", borderTop: "2px solid rgba(255,255,255,.18)",
                background: on ? `rgba(199,229,31,${0.06 + 0.08 * pulse * (1 - turn)})` : "transparent",
                boxShadow: on ? `inset 0 0 0 1.5px rgba(199,229,31,${0.5 + 0.5 * pulse})` : "none", borderRadius: "4px 4px 0 0",
              }}
            >
              <div style={{ position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center", fontSize: 10, color: on ? C.lime : "rgba(255,255,255,.35)", fontWeight: 600 }}>#{s}</div>
              {(i === 0 || i === 3) && <div style={{ position: "absolute", left: "50%", top: 8, transform: "translateX(-50%)", opacity: 0.55 }}><CarTop w={22} color="#8a8a86" /></div>}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 16, right: 16, top: 146, height: 0, borderTop: "2px dashed rgba(255,255,255,.12)" }} />
      <div style={{ position: "absolute", left: carX, top: carY, transform: `translate(-50%,-50%) rotate(${rot}deg)`, filter: "drop-shadow(0 6px 10px rgba(0,0,0,.5))" }}>
        <CarTop w={24} />
      </div>
      <div
        style={{
          position: "absolute", right: 16, top: 10, display: "flex", alignItems: "center", gap: 6, background: C.lime, color: C.ink,
          padding: "5px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, transform: `scale(${verified})`, transformOrigin: "right center",
        }}
      >
        <Check size={10} /> Plate APC 1234 verified
      </div>
    </div>
  );
}

function Dashboard({ lt, dur, box, portrait }) {
  const inP = seg(lt, 150, 750);
  const out = seg(lt, dur - 480, 420, inOut);
  const rows = [
    ["APC 1234", "#135", "Unit 1305", "Mon 9 AM"],
    ["KTR 5521", "#519", "Unit 2104", "Today 11 PM"],
    ["ZLM 8830", "#204", "Unit 0907", "Sun 6 PM"],
    ["BRX 4177", "#312", "Unit 1511", "Tue 8 AM"],
  ];
  const kpi = (label, val, suffix, i) => {
    const p = seg(lt, 500 + i * 120, 900, inOut);
    return (
      <div key={label} style={{ flex: 1, background: C.card, borderRadius: 14, padding: "12px 14px" }}>
        <div style={{ fontSize: 10.5, color: "#666" }}>{label}</div>
        <div style={{ fontFamily: RUBIK, fontSize: 26, fontWeight: 700, marginTop: 4 }}>
          {Math.round(val * p)}
          <span style={{ fontSize: 14 }}>{suffix}</span>
        </div>
      </div>
    );
  };
  const scan = seg(lt, 1500, 900, inOut);
  const verified = lt > 2400;
  return (
    <div
      style={{
        position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: 22, background: "#fff", color: C.ink,
        fontFamily: INTER, padding: portrait ? 18 : 24, boxSizing: "border-box", overflow: "hidden",
        opacity: inP * (1 - out), transform: `perspective(1400px) rotateY(${(1 - inP) * -14}deg) translateY(${(1 - inP) * 30 - out * 20}px)`,
        boxShadow: "0 40px 80px -20px rgba(0,0,0,.6)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10.5, color: C.gray, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600 }}>Management dashboard</div>
          <div style={{ fontFamily: RUBIK, fontSize: 20, fontWeight: 700, marginTop: 4 }}>Guest parking</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#F1F8D2", padding: "6px 11px", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
          <span style={{ position: "relative", width: 8, height: 8 }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: C.green }} />
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: C.green, transform: `scale(${1 + ((lt % 1400) / 1400) * 1.8})`, opacity: 1 - (lt % 1400) / 1400 }} />
          </span>
          LIVE
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {kpi("Guests parked now", 4, "", 0)}
        {kpi("Bookings this week", 27, "", 1)}
        {kpi("Plates verified", 100, "%", 2)}
      </div>
      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1.1fr .7fr 1fr 1fr 1fr", fontSize: 10, color: C.gray, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", padding: "0 10px" }}>
        <span>Plate</span><span>Spot</span><span>Guest of</span><span>Until</span><span style={{ textAlign: "right" }}>Status</span>
      </div>
      <div style={{ position: "relative", marginTop: 8 }}>
        {rows.map((r, i) => {
          const p = seg(lt, 800 + i * 200, 500);
          const first = i === 0;
          const status = first ? (verified ? "Verified" : lt > 1500 ? "Matching…" : "Arriving") : "Verified";
          return (
            <div
              key={r[0]}
              style={{
                position: "relative", display: "grid", gridTemplateColumns: "1.1fr .7fr 1fr 1fr 1fr", alignItems: "center",
                padding: "0 10px", height: 46, borderRadius: 12, fontSize: 12, marginBottom: 6, overflow: "hidden",
                background: first ? `rgba(199,229,31,${verified ? 0.16 * (1 - seg(lt, 3600, 1000)) + 0.04 : 0.1})` : C.card,
                opacity: p, transform: `translateY(${(1 - p) * 14}px)`,
              }}
            >
              {first && lt > 1500 && lt < 2500 && (
                <div style={{ position: "absolute", top: 0, bottom: 0, left: `${scan * 100}%`, width: 60, marginLeft: -30, background: `linear-gradient(90deg, transparent, rgba(199,229,31,.55), transparent)` }} />
              )}
              <span style={{ position: "relative", fontWeight: 700, fontFamily: RUBIK, letterSpacing: ".04em" }}>
                <span style={{ border: `1.4px solid ${C.ink}`, borderRadius: 5, padding: "2px 6px", fontSize: 11 }}>{r[0]}</span>
              </span>
              <span style={{ position: "relative", fontWeight: 600 }}>{r[1]}</span>
              <span style={{ position: "relative", color: "#555" }}>{r[2]}</span>
              <span style={{ position: "relative", color: "#555" }}>{r[3]}</span>
              <span style={{ position: "relative", justifySelf: "end", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 600, padding: "4px 8px", borderRadius: 99, background: status === "Verified" ? C.ink : "#fff", color: status === "Verified" ? C.lime : C.ink, border: status === "Verified" ? "none" : `1px solid ${C.line}` }}>
                {status === "Verified" && <Check size={9} color={C.lime} />}
                {status}
              </span>
            </div>
          );
        })}
      </div>
      {!portrait && (
        <div style={{ position: "absolute", left: 24, right: 24, bottom: 20, display: "flex", justifyContent: "space-between", fontSize: 10.5, color: C.gray }}>
          <span>Private building · residents only</span>
          <span>Updated just now</span>
        </div>
      )}
    </div>
  );
}

function Intro({ lt, dur, W, H, portrait }) {
  const out = seg(lt, dur - 500, 450, inOut);
  const chip = seg(lt, 150, 600);
  const words = ["No", "guest", "parking", "in", "your", "building?"];
  const size = portrait ? 42 : 78;
  const props = ["Private building", "Real-time visibility", "Rewards for residents"];

  // parking row + car that drives in and parks in the free (lime) spot
  const roadY = portrait ? H * 0.72 : H * 0.8;
  const n = portrait ? 7 : 13;
  const sw = portrait ? 50 : 60;
  const gap = 8;
  const rowW = n * sw + (n - 1) * gap;
  const rx = (W - rowW) / 2;
  const free = portrait ? 4 : 8;
  const spotX = rx + free * (sw + gap) + sw / 2;
  const spotH = 64;
  const drive = seg(lt, 250, 2000, inOut);
  const turn = seg(lt, 2150, 800, inOut);
  const carX = lerp(-50, spotX, drive);
  const carY = lerp(roadY + 22, roadY - spotH / 2 - 4, turn);
  const pulse = 0.5 + 0.5 * Math.sin(lt / 170);
  const parked = [1, 2, 4, 5, 6, 9, 10, 12].map((k) => k % n);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `scale(${1 + out * 0.03})` }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: portrait ? H * 0.17 : H * 0.15, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 28px" }}>
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 9, padding: portrait ? "7px 13px" : "8px 16px", borderRadius: 99,
            background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#E2E2DC",
            fontSize: portrait ? 10.5 : 12, letterSpacing: ".14em", fontWeight: 600, fontFamily: RUBIK, whiteSpace: "nowrap",
            opacity: chip, transform: `translateY(${(1 - chip) * 10}px)`,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.lime, boxShadow: `0 0 0 ${3 + pulse * 3}px rgba(199,229,31,${0.18 - pulse * 0.1})` }} />
          {portrait ? "LIVE IN AUSTIN, TX" : "LIVE IN SELECT HIGH-RISE BUILDINGS IN AUSTIN, TX"}
        </div>
        <h1 style={{ marginTop: portrait ? 20 : 28, fontFamily: RUBIK, fontWeight: 500, fontSize: size, lineHeight: 1.04, letterSpacing: "-0.03em", color: "#fff" }}>
          {words.map((w, i) => {
            const p = seg(lt, 350 + i * 90, 750);
            const hl = i === 1 || i === 2;
            return (
              <React.Fragment key={i}>
                <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", padding: "0.04em 0.02em 0.2em", margin: "-0.04em -0.02em -0.2em" }}>
                  <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 110}%)`, color: hl ? C.lime : "#fff" }}>{w}</span>
                </span>
                {i === 2 ? <br /> : " "}
              </React.Fragment>
            );
          })}
        </h1>
        <p style={{ marginTop: portrait ? 16 : 22, maxWidth: portrait ? 380 : 560, color: "rgba(255,255,255,.64)", fontSize: portrait ? 15.5 : 19, lineHeight: 1.5, opacity: seg(lt, 1000, 700), transform: `translateY(${(1 - seg(lt, 1000, 700)) * 10}px)` }}>
          Parqlet turns unused resident spots into secure guest parking for your building.
        </p>
        <div style={{ marginTop: portrait ? 20 : 28, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: portrait ? "8px 8px" : 10, maxWidth: portrait ? 400 : "none" }}>
          {props.map((t, i) => {
            const p = seg(lt, 1300 + i * 140, 500, outBack);
            return (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: portrait ? "6px 11px" : "8px 14px", borderRadius: 99, border: "1px solid rgba(199,229,31,.28)", background: "rgba(199,229,31,.06)", color: "#EDEDE7", fontSize: portrait ? 12 : 14, fontWeight: 500, opacity: clamp(p), transform: `scale(${0.85 + 0.15 * p})` }}>
                <Check size={portrait ? 10 : 11} color={C.lime} /> {t}
              </span>
            );
          })}
        </div>
      </div>

      {/* parking row */}
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity: seg(lt, 100, 700) }}>
        {[...Array(n)].map((_, k) => {
          const x = rx + k * (sw + gap);
          const isFree = k === free;
          return (
            <div
              key={k}
              style={{
                position: "absolute", left: x, top: roadY - spotH - 4, width: sw, height: spotH,
                borderLeft: "2px solid rgba(255,255,255,.14)", borderRight: "2px solid rgba(255,255,255,.14)", borderTop: "2px solid rgba(255,255,255,.14)",
                borderRadius: "4px 4px 0 0",
                background: isFree ? `rgba(199,229,31,${(0.05 + 0.07 * pulse) * (1 - turn)})` : "transparent",
                boxShadow: isFree ? `inset 0 0 0 1.5px rgba(199,229,31,${(0.35 + 0.5 * pulse) * (1 - turn * 0.6)})` : "none",
              }}
            >
              {parked.includes(k) && !isFree && (
                <div style={{ position: "absolute", left: "50%", top: 8, transform: "translateX(-50%)", opacity: 0.4 }}>
                  <CarTop w={portrait ? 20 : 22} color="#9a9a94" />
                </div>
              )}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, right: 0, top: roadY + 22, height: 0, borderTop: "2px dashed rgba(255,255,255,.1)" }} />
      </div>
      <div style={{ position: "absolute", left: carX, top: carY, transform: `translate(-50%,-50%) rotate(${lerp(90, 0, turn)}deg)`, filter: "drop-shadow(0 0 14px rgba(199,229,31,.55))" }}>
        <CarTop w={portrait ? 22 : 24} />
      </div>
    </div>
  );
}

function Outro({ lt, W, H, portrait, appStoreUrl, demoUrl }) {
  const logo = seg(lt, 100, 700, outBack);
  const tag = seg(lt, 450, 600);
  const btns = seg(lt, 800, 600);
  const foot = seg(lt, 1200, 600);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", paddingBottom: portrait ? 60 : 40 }}>
      <div style={{ transform: `scale(${0.8 + logo * 0.2})`, opacity: clamp(logo), borderRadius: 24, boxShadow: `0 0 0 1px rgba(199,229,31,.35), 0 0 60px rgba(199,229,31,${0.25 + 0.15 * Math.sin(lt / 500)})` }}>
        <AppIcon size={portrait ? 64 : 84} />
      </div>
      <div style={{ marginTop: 22, opacity: tag, transform: `translateY(${(1 - tag) * 14}px)` }}>
        <Wordmark size={portrait ? 40 : 64} />
      </div>
      <div style={{ marginTop: 14, fontFamily: RUBIK, fontSize: portrait ? 20 : 28, color: "rgba(255,255,255,.75)", opacity: tag }}>
        Guest parking. <span style={{ color: C.lime }}>Sorted.</span>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: portrait ? 26 : 36, opacity: btns, transform: `translateY(${(1 - btns) * 14}px)`, flexDirection: portrait ? "column" : "row", pointerEvents: btns > 0.5 ? "auto" : "none" }}>
        <a
          href={appStoreUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
          style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#fff", color: C.ink, padding: "12px 20px", borderRadius: 12, textDecoration: "none", fontFamily: INTER }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><rect x="6" y="2" width="12" height="20" rx="3" fill="none" stroke={C.ink} strokeWidth="2" /><rect x="10" y="18" width="4" height="1.6" rx=".8" fill={C.ink} /></svg>
          <span style={{ textAlign: "left", lineHeight: 1.1 }}>
            <span style={{ display: "block", fontSize: 10, opacity: 0.7 }}>Download on the</span>
            <span style={{ display: "block", fontSize: 15, fontWeight: 700 }}>App Store</span>
          </span>
        </a>
        <a
          href={demoUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: C.lime, color: C.ink, padding: "12px 24px", borderRadius: 12, textDecoration: "none", fontFamily: RUBIK, fontWeight: 500, fontSize: 16 }}
        >
          Book a demo →
        </a>
      </div>
      <div style={{ marginTop: 26, fontSize: portrait ? 11 : 12, color: "rgba(255,255,255,.4)", letterSpacing: ".14em", fontFamily: RUBIK, opacity: foot }}>
        PRIVATE · VERIFIED RESIDENTS ONLY · AUSTIN, TX
      </div>
    </div>
  );
}

function Timeline({ t, y, W, portrait, playing, onToggle, onSeek, si }) {
  const x0 = portrait ? 70 : 84;
  const x1 = W - (portrait ? 28 : 48);
  const len = x1 - x0;
  const carX = x0 + (t / TOTAL) * len;
  return (
    <div style={{ position: "absolute", left: 0, top: y, width: W, height: 40 }} onClick={(e) => e.stopPropagation()}>
      <button
        type="button" onClick={onToggle} aria-label={playing ? "Pause demo" : "Play demo"}
        style={{
          position: "absolute", left: portrait ? 24 : 36, top: 4, width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,.14)",
          background: "rgba(255,255,255,.06)", display: "grid", placeItems: "center", cursor: "pointer", padding: 0,
        }}
      >
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><rect x="2" y="1.5" width="3" height="9" rx="1" fill="#fff" /><rect x="7" y="1.5" width="3" height="9" rx="1" fill="#fff" /></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M3 1.5 L10.5 6 L3 10.5Z" fill="#fff" /></svg>
        )}
      </button>
      <div style={{ position: "absolute", left: x0, width: len, top: 20, height: 2, background: "rgba(255,255,255,.12)", borderRadius: 2 }} />
      <div style={{ position: "absolute", left: x0, width: carX - x0, top: 20, height: 2, background: C.lime, borderRadius: 2, boxShadow: `0 0 10px rgba(199,229,31,.6)` }} />
      {SCENES.map((s, i) => {
        const sx = x0 + (STARTS[i] / TOTAL) * len;
        const w = (s.dur / TOTAL) * len;
        const active = i === si;
        return (
          <button
            key={s.key} type="button" onClick={() => onSeek(STARTS[i] + 1)} aria-label={`Jump to ${s.label}`}
            style={{ position: "absolute", left: sx, top: 0, width: w, height: 40, background: "transparent", border: 0, padding: 0, cursor: "pointer", textAlign: "left" }}
          >
            <span style={{ position: "absolute", left: 0, top: 16, width: 2, height: 10, background: "rgba(255,255,255,.18)" }} />
            {!portrait && (
              <span style={{ position: "absolute", left: 8, top: -2, fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, fontFamily: RUBIK, color: active ? "#fff" : "rgba(255,255,255,.38)", whiteSpace: "nowrap" }}>
                {s.label}
              </span>
            )}
          </button>
        );
      })}
      {portrait && (
        <span style={{ position: "absolute", left: x0, top: -2, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, fontFamily: RUBIK, color: "#fff" }}>
          {SCENES[si].label}
        </span>
      )}
      <div style={{ position: "absolute", left: carX, top: 21, transform: "translate(-50%,-50%) rotate(90deg)", pointerEvents: "none", filter: "drop-shadow(0 0 8px rgba(199,229,31,.6))" }}>
        <CarTop w={12} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
export default function ParqletDemo({
  appStoreUrl = "https://apps.apple.com/us/app/parqlet/id6781688486",
  demoUrl = "https://parqlet.com",
  autoPlay = true,
  loop = true,
  loadFonts = true,
  rounded = 28,
  startAt = 0,
  className,
  style,
}) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [t, setT] = useState(startAt);
  const [playing, setPlaying] = useState(autoPlay);
  const tRef = useRef(startAt);
  const playRef = useRef(autoPlay);
  const visRef = useRef(true);

  useEffect(() => { playRef.current = playing; }, [playing]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      tRef.current = STARTS[3] + 3200;
      setT(tRef.current);
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    let io;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(([e]) => { visRef.current = e.isIntersecting; }, { threshold: 0.1 });
      io.observe(el);
    }
    return () => { ro.disconnect(); io && io.disconnect(); };
  }, []);

  useEffect(() => {
    let raf, last = performance.now();
    const tick = (now) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (playRef.current && visRef.current && !document.hidden) {
        let nt = tRef.current + dt;
        if (nt >= TOTAL) {
          if (loop) nt = nt % TOTAL;
          else { nt = TOTAL - 1; playRef.current = false; setPlaying(false); }
        }
        tRef.current = nt;
        setT(nt);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loop]);

  useBrandFonts(loadFonts);

  const seek = (ms) => { tRef.current = ms; setT(ms); };
  const toggle = () => {
    if (!playing && tRef.current >= TOTAL - 2) seek(0);
    setPlaying((p) => !p);
  };

  const portrait = width > 0 && width < 640;
  const L = portrait
    ? {
        W: 480, H: 900,
        caption: { x: 28, y: 40, w: 424 },
        phone: { x: 101, y: 236, scale: 0.96 },
        garage: null,
        dash: { x: 18, y: 318, w: 444, h: 420 },
        timeline: 852,
      }
    : {
        W: 1280, H: 720,
        caption: { x: 96, y: 150, w: 640 },
        phone: { x: 820, y: 44, scale: 1 },
        garage: { x: 96, y: 448, w: 400 },
        dash: { x: 640, y: 110, w: 580, h: 450 },
        timeline: 664,
      };
  const scale = width ? width / L.W : 1;

  // current scene
  let si = SCENES.length - 1;
  for (let i = 0; i < SCENES.length; i++) if (t < STARTS[i] + SCENES[i].dur) { si = i; break; }
  const lt = t - STARTS[si];

  // phone
  const pIn = seg(t, STARTS[1] - 300, 900);
  const pOut = seg(t, STARTS[5] - 200, 650, inOut);
  const phoneVisible = t > STARTS[1] - 300 && t < STARTS[5] + 500;
  const float = Math.sin(t / 1100) * 5;
  const screenIdx = clamp(si, 1, 4);
  const screenLt = si < 1 ? 0 : si > 4 ? SCENES[4].dur : lt;
  const CurScreen = PHONE_SCREENS[screenIdx];
  const trans = si >= 2 && si <= 4 ? seg(lt, 0, 520, inOut) : 1;
  const PrevScreen = si >= 2 && si <= 4 && trans < 1 ? PHONE_SCREENS[si - 1] : null;

  // ambient glow follows focus
  const glowX = si === 0 || si === 6 ? L.W / 2 : si === 5 ? L.dash.x + L.dash.w / 2 : L.phone.x + 145 * L.phone.scale;
  const glowY = si === 0 || si === 6 ? L.H * 0.45 : L.H * 0.5;

  const srText =
    si === 0 ? "No guest parking in your building? Here's how Parqlet works."
    : si === 6 ? "Parqlet. Guest parking, sorted. Download on the App Store or book a demo."
    : `${CAPTIONS[si].kicker}: ${CAPTIONS[si].title.map((x) => x.t).join(" ")} ${CAPTIONS[si].body || ""}`;

  return (
    <div
      ref={wrapRef}
      className={className}
      role="region"
      aria-roledescription="animated demo"
      aria-label="Parqlet product demo"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === " " || e.key === "k") { e.preventDefault(); toggle(); } }}
      onClick={toggle}
      style={{
        position: "relative", width: "100%", aspectRatio: `${L.W} / ${L.H}`, overflow: "hidden", borderRadius: rounded,
        background: C.bg, cursor: "pointer", outline: "none", userSelect: "none", WebkitTapHighlightColor: "transparent", ...style,
      }}
    >
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }} aria-live="polite">{srText}</span>

      <Shadow>
      {width > 0 && (
        <div style={{ position: "absolute", left: 0, top: 0, width: L.W, height: L.H, transform: `scale(${scale})`, transformOrigin: "0 0", fontFamily: INTER }}>
          {/* background grid + glow */}
          <div
            style={{
              position: "absolute", inset: 0,
              backgroundImage: "linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)",
              backgroundSize: portrait ? "60px 60px" : "84px 84px", backgroundPosition: `${-(t / 60) % 84}px 0`,
            }}
          />
          <div
            style={{
              position: "absolute", left: glowX - 380, top: glowY - 380, width: 760, height: 760, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(199,229,31,.16), rgba(199,229,31,.04) 40%, transparent 68%)",
              transition: "left 1.2s cubic-bezier(.2,.8,.2,1), top 1.2s cubic-bezier(.2,.8,.2,1)",
            }}
          />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.45))" }} />
          {/* twinkle */}
          <svg style={{ position: "absolute", left: L.W * (portrait ? 0.82 : 0.9), top: L.H * (portrait ? 0.05 : 0.08), opacity: 0.3 + 0.5 * Math.abs(Math.sin(t / 900)) }} width="40" height="40" viewBox="0 0 40 40" aria-hidden>
            <path d="M20 0 L21.4 18.6 L40 20 L21.4 21.4 L20 40 L18.6 21.4 L0 20 L18.6 18.6Z" fill={C.lime} />
          </svg>

          {/* brand mark top-left */}
          <div style={{ position: "absolute", left: portrait ? 28 : 40, top: portrait ? 14 : 30, opacity: si === 0 || si === 6 ? 0 : 0.9, transition: "opacity .6s" }}>
            {!portrait && <Wordmark size={18} />}
          </div>

          {si === 0 && <Intro lt={lt} dur={SCENES[0].dur} W={L.W} H={L.H} portrait={portrait} />}

          {si >= 1 && si <= 5 && (
            <Caption key={si} data={CAPTIONS[si]} lt={lt} dur={SCENES[si].dur} box={L.caption} portrait={portrait} />
          )}

          {si === 3 && L.garage && <Garage lt={lt} dur={SCENES[3].dur} box={L.garage} />}

          {phoneVisible && (
            <Phone
              x={L.phone.x}
              y={L.phone.y}
              scale={L.phone.scale}
              style={{
                opacity: pIn * (1 - pOut),
                transform: `perspective(1600px) translateY(${(1 - pIn) * 140 + float - pOut * 40}px) rotateY(${(1 - pIn) * -22 + pOut * 18}deg) rotateX(${(1 - pIn) * 8}deg)`,
              }}
            >
              {PrevScreen && (
                <div style={{ position: "absolute", inset: 0, transform: `translateX(${-trans * 30}%)`, opacity: 1 - trans * 0.6 }}>
                  <PrevScreen lt={SCENES[si - 1].dur} />
                </div>
              )}
              <div
                style={{
                  position: "absolute", inset: 0, transform: `translateX(${(1 - trans) * 100}%)`,
                  boxShadow: trans < 1 ? "-20px 0 40px rgba(0,0,0,.25)" : "none",
                }}
              >
                <CurScreen lt={screenLt} />
              </div>
            </Phone>
          )}

          {si === 5 && <Dashboard lt={lt} dur={SCENES[5].dur} box={L.dash} portrait={portrait} />}

          {si === 6 && <Outro lt={lt} W={L.W} H={L.H} portrait={portrait} appStoreUrl={appStoreUrl} demoUrl={demoUrl} />}

          <Timeline t={t} y={L.timeline} W={L.W} portrait={portrait} playing={playing} onToggle={toggle} onSeek={seek} si={si} />
        </div>
      )}
      </Shadow>
    </div>
  );
}
