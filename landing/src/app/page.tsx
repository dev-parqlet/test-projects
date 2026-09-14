"use client";

import React from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import CornerLines from "../components/CornerLines";
import CarTopDown from "../components/CarTopDown";
import GlowCross from "../components/GlowCross";
import HowItWorksSection from "../components/HowItWorksSection";
import FaqSection from "../components/FaqSection";

/* ── 6-spoke asterisk icon — placed at grid intersections ── */
function AsteriskIcon({ size = 44, opacity = 0.28 }: { size?: number; opacity?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.44, inner = size * 0.06;
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 * Math.PI) / 180;
    return { x1: cx + Math.cos(a) * inner, y1: cy + Math.sin(a) * inner, x2: cx + Math.cos(a) * r, y2: cy + Math.sin(a) * r };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" style={{ opacity }}>
      {spokes.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#C7E51F" strokeWidth="1.5" strokeLinecap="round"/>
      ))}
    </svg>
  );
}

/* ── Glowing park asterisk ── */
function ParkStar() {
  const cx = 12, cy = 12, r = 8;
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 * Math.PI) / 180;
    return { x1: cx + Math.cos(a) * 2.5, y1: cy + Math.sin(a) * 2.5, x2: cx + Math.cos(a) * r, y2: cy + Math.sin(a) * r };
  });
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {spokes.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#C7E51F" strokeWidth="2" strokeLinecap="round"/>
      ))}
      <circle cx={cx} cy={cy} r="2.5" fill="#C7E51F"/>
    </svg>
  );
}

/* ── Bullet list item ── */
export function BulletItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <Image
        src="/images/bullet-dot.svg"
        alt=""
        width={13}
        height={13}
        className="mt-1 shrink-0"
      />
      <span className="text-base font-medium leading-6 text-primary">{text}</span>
    </li>
  );
}

/* ── Pill / Tag ── */
export function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-[20px] bg-bg-warm py-1 font-[family-name:var(--font-heading)] text-xs font-medium uppercase tracking-wider text-text-muted ${className}`}
      style={{ paddingLeft: 20, paddingRight: 20 }}
    >
      {children}
    </span>
  );
}

/* ── Arrow SVG ── */
export function ArrowIcon() {
  return (
    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
      <path
        d="M7.5 1L12 5M12 5L7.5 9M12 5H1"
        stroke="#222"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */
export default function Home() {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [heroEmail, setHeroEmail] = useState("");
  const [heroSubmitting, setHeroSubmitting] = useState(false);
  const [heroError, setHeroError] = useState("");
  const heroInputRef = useRef<HTMLInputElement>(null);
  const [isMobileHero, setIsMobileHero] = useState(false);
  const gamifSectionRef = useRef<HTMLElement>(null);
  const gamifCoinRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const section = gamifSectionRef.current;
    const coin = gamifCoinRef.current;
    if (!section || !coin) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          coin.style.animation = "none";
          void coin.offsetWidth; // force reflow to restart
          coin.style.animation = "coinModalPop 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards";
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  const [heroGridSmall, setHeroGridSmall] = useState(false);
  useEffect(() => {
    const check = () => {
      setIsMobileHero(window.innerWidth < 768);
      setHeroGridSmall(window.innerWidth < 1024);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* CTA email form state */
  const [ctaEmail, setCtaEmail] = useState("");
  const [ctaSubmitting, setCtaSubmitting] = useState(false);
  const [ctaError, setCtaError] = useState("");
  const ctaInputRef = useRef<HTMLInputElement>(null);

  /* Car animation refs */
  const heroContainerRef = useRef<HTMLDivElement>(null);

  /* Demo form state */
  const [demoForm, setDemoForm] = useState({
    fullName: "",
    email: "",
    company: "",
    building: "",
    city: "",
    role: "",
    details: "",
    website: "", // honeypot
  });
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoStatus, setDemoStatus] = useState<"idle" | "success" | "error">("idle");

  /* Intersection observer for scroll-triggered fade-in */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            el.classList.add("scroll-revealed");
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll(".scroll-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* Close modal on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowDemoModal(false);
        setShowConfirmPopup(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /* Lock body scroll when modal is open */
  useEffect(() => {
    document.body.style.overflow = showDemoModal || showConfirmPopup ? "hidden" : "";
  }, [showDemoModal, showConfirmPopup]);

  /* ── Car animation along inner border ── */
  useEffect(() => {
    const container = heroContainerRef.current;
    const wrapper = container?.querySelector('[data-car="wrapper"]') as HTMLElement | null;
    const rotEl = container?.querySelector('[data-car="rot"]') as HTMLElement | null;
    if (!container || !wrapper || !rotEl) return;

    const DURATION = 12000;
    const PAD = 38;

    // Waypoints — all on grid intersections (136px grid)
    const STAR_X  = 816;  // 6th vertical grid line
    const STAR_Y  = 544;  // 4th horizontal grid line
    const START_Y = 136;  // 1st horizontal grid line

    // Rotations: car PNG has hood at the "back" visually, so add 180° offset
    const ROT_LEFT = 0;    // hood faces left
    const ROT_DOWN = 270;  // hood faces down

    let start: number | null = null;
    let raf: number;

    const tick = (now: number) => {
      if (!start) start = now;
      const t = ((now - start) % DURATION) / DURATION;

      const { width } = container.getBoundingClientRect();
      const startX = width - PAD;

      // L-shaped path:
      // seg1: LEFT (startX, START_Y) → (STAR_X, START_Y)
      // seg2: DOWN (STAR_X, START_Y) → (STAR_X, STAR_Y)
      const seg1 = startX - STAR_X;
      const seg2 = STAR_Y - START_Y;
      const totalPath = seg1 + seg2;

      const DRIVE_END = 0.68;
      const PAUSE_END = 0.85;

      let x = startX, y = START_Y, rotation = ROT_LEFT, opacity = 1;

      if (t < DRIVE_END) {
        const dist = (t / DRIVE_END) * totalPath;

        if (dist <= seg1) {
          // Moving left — snap to ROT_LEFT
          x = startX - dist;
          y = START_Y;
          rotation = ROT_LEFT;
        } else {
          // Moving down — snap to ROT_DOWN instantly
          x = STAR_X;
          y = START_Y + (dist - seg1);
          rotation = ROT_DOWN;
        }

        // No fade-in: full opacity from frame one
        opacity = 1;

      } else if (t < PAUSE_END) {
        // Parked at star — keep facing down, no rotation change
        x = STAR_X;
        y = STAR_Y;
        rotation = ROT_DOWN;
        opacity = 1;

      } else {
        // Keep moving down on the same line while fading out
        const exitP = (t - PAUSE_END) / (1 - PAUSE_END);
        const { height } = container.getBoundingClientRect();
        x = STAR_X;
        y = STAR_Y + exitP * (height - STAR_Y + PAD);
        rotation = ROT_DOWN;
        opacity = 1;
      }

      wrapper.style.left = `${x}px`;
      wrapper.style.top = `${y}px`;
      wrapper.style.opacity = String(Math.max(0, Math.min(1, opacity)));
      rotEl.style.transform = `rotate(${rotation}deg)`;

      raf = requestAnimationFrame(tick);
    };

    // Force correct heading immediately — hood faces left before first RAF fires
    rotEl.style.transform = `rotate(${ROT_LEFT}deg)`;
    wrapper.style.left = `${container.getBoundingClientRect().width - PAD}px`;
    wrapper.style.top = `${START_Y}px`;
    wrapper.style.opacity = "1";

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  async function handleHeroSubmit() {
    if (!heroEmail || !heroInputRef.current?.validity.valid) {
      heroInputRef.current?.focus();
      if (heroInputRef.current) {
        heroInputRef.current.style.borderColor = "#e53935";
        setTimeout(() => {
          if (heroInputRef.current) heroInputRef.current.style.borderColor = "";
        }, 1500);
      }
      return;
    }
    setHeroSubmitting(true);
    setHeroError("");
    try {
      const res = await fetch("https://api.parqlet.com/api/leads/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: heroEmail }),
      });
      if (!res.ok) throw new Error();
      setShowConfirmPopup(true);
    } catch {
      setHeroError("Something went wrong. Please try again.");
    } finally {
      setHeroSubmitting(false);
    }
  }

  async function handleCtaSubmit() {
    if (!ctaEmail || !ctaInputRef.current?.validity.valid) {
      ctaInputRef.current?.focus();
      return;
    }
    setCtaSubmitting(true);
    setCtaError("");
    try {
      const res = await fetch("https://api.parqlet.com/api/leads/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ctaEmail }),
      });
      if (!res.ok) throw new Error();
      setShowConfirmPopup(true);
      setCtaEmail("");
    } catch {
      setCtaError("Something went wrong. Please try again.");
    } finally {
      setCtaSubmitting(false);
    }
  }

  async function handleDemoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDemoSubmitting(true);
    setDemoStatus("idle");
    try {
      const res = await fetch("https://api.parqlet.com/api/leads/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demoForm),
      });
      if (!res.ok) throw new Error();
      setDemoStatus("success");
      setDemoForm({ fullName: "", email: "", company: "", building: "", city: "", role: "", details: "", website: "" });
    } catch {
      setDemoStatus("error");
    } finally {
      setDemoSubmitting(false);
    }
  }

  return (
    <>
      {/* ── Hero entrance animations — injected directly to bypass CSS compilation ── */}
      <style>{`
        @keyframes heroIn {
          from { opacity: 0; transform: translateY(24px); filter: blur(8px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0);   }
        }
        @keyframes heroGlowBloom {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1);    }
        }
        @keyframes heroGridFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .hero-in-1 { animation: heroIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s  both; }
        .hero-in-2 { animation: heroIn 1s   cubic-bezier(0.16,1,0.3,1) 0.22s both; }
        .hero-in-3 { animation: heroIn 1s   cubic-bezier(0.16,1,0.3,1) 0.36s both; }
        .hero-in-4 { animation: heroIn 1s   cubic-bezier(0.16,1,0.3,1) 0.5s  both; }
        .hero-glow-init {
          animation: heroGlowBloom 1.8s cubic-bezier(0.16,1,0.3,1) 0s both,
                     glowPulse     5s  ease-in-out 2s infinite;
        }
        .hero-grid-init { animation: heroGridFadeIn 2s ease-out 0.15s both; }

        /* CTA section content entrance */
        .cta-section .cta-in-1,
        .cta-section .cta-in-2,
        .cta-section .cta-in-3,
        .cta-section .cta-in-4 {
          opacity: 0; transform: translateY(24px); filter: blur(8px);
        }
        .cta-section.scroll-revealed .cta-in-1 { animation: heroIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s  both; }
        .cta-section.scroll-revealed .cta-in-2 { animation: heroIn 1s   cubic-bezier(0.16,1,0.3,1) 0.22s both; }
        .cta-section.scroll-revealed .cta-in-3 { animation: heroIn 1s   cubic-bezier(0.16,1,0.3,1) 0.36s both; }
        .cta-section.scroll-revealed .cta-in-4 { animation: heroIn 1s   cubic-bezier(0.16,1,0.3,1) 0.5s  both; }
      `}</style>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-black/5 bg-[#F8F6F2]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1160px] items-center justify-between px-5 py-16">
          <Image src="/images/logo.svg" alt="ParQlet" width={341} height={85} className="h-24 w-auto max-sm:h-16" priority />
          <div className="flex items-center gap-3 max-sm:gap-2">
            <a
              href="https://dashboard.parqlet.com"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer rounded-lg border border-[#222]/20 px-5 py-2 font-[family-name:var(--font-heading)] text-sm font-normal text-[#222] transition-all hover:border-[#222]/40 hover:bg-black/4 max-sm:text-xs max-sm:px-3 max-sm:py-1.5"
            >
              Log in
            </a>
            <button
              onClick={() => setShowDemoModal(true)}
              className="flex items-center gap-2 cursor-pointer rounded-lg bg-[#C7E51F] px-5 py-2 font-[family-name:var(--font-heading)] text-sm font-normal text-[#222] transition-all hover:opacity-88 max-sm:text-xs max-sm:px-3 max-sm:py-1.5"
            >
              Book a demo <Image src="/images/ic_arrow-right.svg" alt="" width={16} height={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="mx-auto max-w-[1160px] px-5 pt-5 pb-6">
        {/* Dark hero container */}
        <div
          ref={heroContainerRef}
          className="relative min-h-[702px] max-md:min-h-[480px] max-md:flex max-md:items-center overflow-hidden rounded-[16px] bg-[#222222]"
        >
          {/* Full grid — both directions */}
          <div
            aria-hidden
            className="hero-grid-init pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: heroGridSmall ? "68px 68px" : "136px 136px",
            }}
          />
          {/* Content-area overlay — hides grid inside the empty rectangle (6 cols × 3 rows) */}
          <div
            aria-hidden
            className="pointer-events-none absolute max-md:inset-x-0"
            style={isMobileHero
              ? { left: 0, top: 68, right: 0, height: 358, background: "#222222" }
              : { left: 0, top: 137, width: 816, height: 407, background: "#222222" }
            }
          />

          {/* Green ambient glow — full-container so no visible rectangle boundary */}
          <div
            aria-hidden
            className="hero-glow-init pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 22% 58%, rgba(199,229,31,0.16) 0%, rgba(59,109,17,0.08) 40%, transparent 65%)",
            }}
          />

          {/* Glowing cross at bottom-right corner of empty rectangle */}
          <div
            aria-hidden
            className="pointer-events-none absolute max-md:hidden"
            style={{ left: 816, top: 544, transform: "translate(-50%, -50%)", opacity: 0.65 }}
          >
            <GlowCross />
          </div>

{/* Left text block — absolutely spans the empty rectangle, content centered within it */}
<div
            className="z-10 flex items-center w-full"
            style={isMobileHero
              ? { position: "relative", width: "100%", paddingTop: "24px", paddingBottom: "24px" }
              : { position: "absolute", top: 137, height: 407, left: 0, right: 0 }
            }
          >
          <div className="flex flex-col gap-5 max-md:gap-4 max-md:w-full max-md:px-5 px-14">
            {/* Pill badge */}
            <span
              className="hero-in-1 inline-flex w-fit items-center rounded-full bg-white/8 px-4 py-1.5 font-[family-name:var(--font-heading)] text-[10px] font-medium uppercase tracking-[0.12em] text-white max-md:text-[9px] max-md:leading-tight max-md:px-5"
            >
              LIVE IN SELECT HIGH RISE BUILDINGS IN AUSTIN, TX
            </span>

            {/* Heading */}
            <div className="flex flex-col">
              <h1 className="hero-in-2 mb-4 font-[family-name:var(--font-heading)] text-[44px] font-normal leading-[1.05] text-white max-md:text-[26px] max-md:leading-[1.15] max-md:mb-0">
                No{" "}
                <span className="text-[#C7E51F]">guest parking</span>
                {" "}in your building?
              </h1>
              <p className="hero-in-3 mb-6 font-[family-name:var(--font-heading)] text-[18px] font-normal leading-[1.5] text-white max-md:text-[16px] max-md:mb-[24px] max-md:mt-[16px]">
                Parqlet is a peer-to-peer platform where residents securely share unused parking with neighbors and earn credits toward rewards.
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={() => setShowDemoModal(true)}
              className="hero-in-4 flex items-center gap-2 w-fit cursor-pointer rounded-[10px] bg-[#C7E51F] px-6 py-3 font-[family-name:var(--font-heading)] text-[15px] font-normal text-[#222] transition-all hover:opacity-90 hover:-translate-y-px"
            >
              Book a demo <Image src="/images/ic_arrow-right.svg" alt="" width={16} height={16} />
            </button>
          </div>
          </div>

          {/* ── Animated car ── */}
          <div
            data-car="wrapper"
            className="pointer-events-none absolute max-md:hidden"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            <div data-car="rot">
              <CarTopDown />
            </div>
          </div>
        </div>

        {/* ── Tagline below hero container ── */}
        <div className="mt-4 pt-[24px] text-center">
          <span className="font-[family-name:var(--font-heading)] text-[16px] font-normal tracking-wide text-text-muted">
            Private building environment&nbsp;&nbsp;·&nbsp;&nbsp;Real-time visibility&nbsp;&nbsp;·&nbsp;&nbsp;Unique incentive for residents
          </span>
        </div>
      </div>


      {/* ── HOA SECTION ── */}
      <div id="next-section" className="scroll-mt-20 mx-auto max-w-[1160px] px-5">
        <section
          className="scroll-reveal my-[120px] flex gap-[24px] max-lg:flex-col max-lg:items-stretch"
          style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
        >
          <div className="flex w-[480px] shrink flex-col gap-12 min-w-[280px] max-lg:w-full">
            <div className="flex flex-col gap-[16px]">
              <Pill className="self-start rounded-full bg-[#EEECE8]">For Building Management</Pill>
              <div className="flex flex-col gap-[16px]">
                <h2 className="font-[family-name:var(--font-heading)] text-[34px] font-normal leading-[1.1] text-primary max-md:text-[26px]">
                  <div>Full visibility and control</div>
                  <div>without added workload</div>
                </h2>
                <p className="text-base font-normal leading-6 text-[#504F4D] pb-6">
                  ParQlet gives Building Management a clear, real-time view of guest parking activity while keeping
                  the system private, secure, and easy to operate.
                </p>
              </div>
            </div>
            <ul className="flex list-none flex-col gap-5">
              <BulletItem text="Access private, resident-only system. No public access" />
              <BulletItem text="See which guest vehicles are parked in the building in real time" />
              <BulletItem text="Verify vehicles through license plate matching" />
              <BulletItem text="No technical maintenance needed. Cancel anytime" />
            </ul>
          </div>

          {/* Visual */}
          <div className="relative min-w-0 flex-1 max-lg:w-full max-lg:max-w-[520px] max-lg:mx-auto p-[10px]">
            <CornerLines />
            <Image src="/images/hoa-dashboard-v3.png" alt="HOA dashboard" width={661} height={527} sizes="(max-width: 1024px) 100vw, 60vw" className="w-full h-auto rounded-[20px] max-lg:aspect-[661/527] max-lg:object-cover" />
          </div>
        </section>

        {/* ── RESIDENTS SECTION ── */}
        <section
          className="scroll-reveal my-[120px] flex flex-row-reverse gap-[24px] max-lg:flex-col max-lg:items-stretch"
          style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
        >
          <div className="flex w-[480px] shrink flex-col gap-12 min-w-[280px] max-lg:w-full">
            <div className="flex flex-col gap-[16px]">
              <Pill className="self-start rounded-full bg-[#EEECE8]">For Residents</Pill>
              <div className="flex flex-col gap-[16px]">
                <h2 className="font-[family-name:var(--font-heading)] text-[34px] font-normal leading-[1.1] text-primary max-md:text-[26px]">
                  <div>Guest parking is a new perk</div>
                  <div>without a hustle</div>
                </h2>
                <p className="text-base font-normal leading-6 text-[#504F4D] pb-6">
                  ParQlet makes it easy for residents to coordinate parking within their building while turning
                  unused parking spots into a valuable resource.
                </p>
              </div>
            </div>
            <ul className="flex list-none flex-col gap-5">
              <BulletItem text="Sharing parking spot with neighbors when not using it" />
              <BulletItem text="Booking parking spots for your guests directly within the building" />
              <BulletItem text="Earning credits each time a spot is used" />
              <BulletItem text="Using credits later to book parking for guests or exchange to a gift card" />
            </ul>
          </div>

          {/* Residents visual */}
          <div className="relative min-w-0 flex-1 max-lg:w-full max-lg:max-w-[520px] max-lg:self-center p-[10px]">
            <CornerLines />
            <Image src="/images/residence.png" alt="ParQlet resident app screens" width={661} height={527} sizes="(max-width: 1024px) 100vw, 60vw" className="w-full h-auto rounded-[20px]" />
          </div>
        </section>

        {/* ── HOW IT WORKS SECTION ── */}
        <div
          className="scroll-reveal my-[120px]"
          style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
        >
          <HowItWorksSection />
        </div>

        {/* ── GAMIFICATION SECTION ── */}
        <section
          ref={gamifSectionRef}
          className="scroll-reveal my-[120px] flex flex-col items-center text-center"
          style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
        >
          <Pill className="rounded-full bg-[#EEECE8] mb-[24px]">Gamification</Pill>
          <h2 className="max-w-[760px] font-[family-name:var(--font-heading)] text-[34px] font-normal leading-[1.1] text-primary max-md:text-[26px] mb-[16px]">
            Turn your parking spot into a simple,<br />rewarding system
          </h2>
          <p className="max-w-[848px] text-base font-normal leading-6 text-[#504F4D]">
            Parqlet introduces a coin-based system that makes sharing your parking spot easy, fun, and rewarding
            — encouraging residents to make their spots available when not in use
          </p>
          <div className="relative w-full mt-[32px] p-[10px]">
            <CornerLines />
            <div className="relative w-full max-md:block">
              <Image
                src="/images/Gamification_image.png"
                alt="ParQlet gamification"
                width={1120}
                height={600}
                className="w-full h-auto rounded-[20px]"
              />
              {/* Credits earned modal — glass card */}
              <div
                className="absolute right-[3%] top-1/2 -translate-y-1/2 rounded-[20px] p-5 shadow-2xl max-md:relative max-md:shadow-none max-md:inset-auto max-md:translate-y-0 max-md:mt-4 max-md:!w-full max-md:right-auto max-md:left-auto max-md:top-auto max-md:bottom-auto max-md:rounded-2xl"
                style={{
                  width: "23%",
                  background: "rgba(255,255,255,0.60)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                }}
              >
                {/* Coin icon */}
                <div className="mb-3 flex justify-center">
                  <Image ref={gamifCoinRef} src="/images/il_coin.png" alt="credit coin" width={44} height={44} className="h-11 w-11 object-contain" />
                </div>
                {/* Title */}
                <p className="mb-1 font-[family-name:var(--font-heading)] text-[15px] max-md:text-[11px] font-semibold leading-snug" style={{ color: "#222222" }}>
                  + 4 credits earned!
                </p>
                {/* Subtitle */}
                <p className="font-[family-name:var(--font-heading)] text-[11px] font-normal leading-relaxed text-left" style={{ color: "#504F4D" }}>
                  Your parking spot #519 was used for a neighbor's guest parking. Credits are ready to spend
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ SECTION ── */}
        <FaqSection />

        {/* ── CTA SECTION ── */}
        <section
          className="cta-section scroll-reveal relative mb-20 overflow-hidden rounded-[16px] bg-[#222222]"
          style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
        >
          {/* Grid — same as hero, fading toward top-right */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              zIndex: 0,
              backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "136px 136px",
              WebkitMaskImage: "linear-gradient(to top right, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.4) 55%, transparent 80%)",
              maskImage: "linear-gradient(to top right, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.4) 55%, transparent 80%)",
            }}
          />

          {/* Mini cards — absolutely anchored to bottom-right, bleeding into edge */}
          <Image
            src="/images/mini cards.png"
            alt="ParQlet activity cards"
            width={240}
            height={180}
            className="absolute right-0 top-1/2 h-auto w-[240px] -translate-y-1/2 hidden lg:block"
          />

          <div className="relative flex items-center gap-12 px-14 max-lg:flex-col max-md:px-5 max-md:gap-8" style={{ paddingTop: 80, paddingBottom: 80, zIndex: 1 }}>
            {/* Left: text + form */}
            <div className="flex flex-col gap-7 flex-1">
              <span
                className="cta-in-1 inline-flex w-fit items-center rounded-full bg-[#292929] px-5 font-[family-name:var(--font-heading)] text-[11px] font-medium uppercase tracking-[0.14em] text-[#A7A7A7]"
                style={{ paddingTop: 8, paddingBottom: 8 }}
              >
                Ready to move forward?
              </span>
              <h2 className="cta-in-2 font-[family-name:var(--font-heading)] text-[34px] font-normal leading-[1.1] text-white max-md:text-[26px]">
                Let&apos;s bring <span className="text-[#C7E51F]">structure</span> to guest parking at<br className="hidden md:block" /> your high rise
              </h2>
              <p className="cta-in-3 text-base font-normal leading-6 text-[#A7A7A7]">
                Book a demo with us and see how your residents and management<br />can benefit from our solution
              </p>
              {/* Mobile-only image — shown above the CTA on small screens */}
              <Image
                src="/images/mini-cards-mobile-v2.png"
                alt="ParQlet activity cards"
                width={400}
                height={200}
                className="block h-auto lg:hidden max-md:w-[90%] max-md:mx-auto max-sm:mt-2"
              />

              <div className="cta-in-4 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3 max-md:flex-col max-md:items-stretch">
                  <input
                    ref={ctaInputRef}
                    type="email"
                    value={ctaEmail}
                    onChange={(e) => setCtaEmail(e.target.value)}
                    placeholder="Enter your work email"
                    className="h-[42px] w-60 rounded-lg border border-white/20 bg-[#292929] text-[15px] text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/50 max-md:w-full" style={{ paddingLeft: 16, paddingRight: 16 }}
                  />
                  <button
                    onClick={handleCtaSubmit}
                    disabled={ctaSubmitting}
                    className="flex h-[42px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#C7E51F] px-5 font-[family-name:var(--font-heading)] text-[15px] font-normal text-[#222] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 max-md:w-full"
                  >
                    {ctaSubmitting ? "Sending..." : "Request early access"}
                    {!ctaSubmitting && <Image src="/images/ic_arrow-right.svg" alt="" width={16} height={16} />}
                  </button>
                </div>
                {ctaError && <p className="text-sm text-red-400">{ctaError}</p>}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── FOOTER ── */}
      <footer className="mx-auto mb-6 max-w-[1242px] px-5">
        {/* Desktop: single row */}
        <div className="hidden lg:flex items-center justify-between">
          <span className="font-[family-name:var(--font-heading)] text-xs font-normal uppercase tracking-wider text-text-muted">
            <a href="mailto:hello@parqlet.com" className="text-inherit no-underline">hello@parqlet.com</a>
          </span>
          <div className="flex items-center gap-6 font-[family-name:var(--font-heading)] text-xs font-normal uppercase tracking-wider text-text-muted">
            <a href="/faq" className="text-inherit no-underline hover:underline">FAQ</a>
            <a href="https://parqlet-terms-and-privacy.notion.site/Privacy-Policy-35d38574a76480a0be27c1cac5735ebe" target="_blank" rel="noopener noreferrer" className="text-inherit no-underline hover:underline">Privacy Policy</a>
            <a href="https://parqlet-terms-and-privacy.notion.site/Terms-of-Service-35d38574a76480228d7bc194bc23c6de" target="_blank" rel="noopener noreferrer" className="text-inherit no-underline hover:underline">Terms of Service</a>
          </div>
          <span className="font-[family-name:var(--font-heading)] text-xs font-normal uppercase tracking-wider text-text-muted">
            All rights reserved
          </span>
        </div>

        {/* Mobile: two rows */}
        <div className="flex lg:hidden flex-col gap-3 font-[family-name:var(--font-heading)] text-xs font-normal uppercase tracking-wider text-text-muted">
          {/* Row 1: Privacy Policy + Terms of Service */}
          <div className="flex items-center justify-between">
            <a href="/faq" className="whitespace-nowrap text-inherit no-underline hover:underline">FAQ</a>
            <a href="https://parqlet-terms-and-privacy.notion.site/Privacy-Policy-35d38574a76480a0be27c1cac5735ebe" target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-inherit no-underline hover:underline">Privacy Policy</a>
            <a href="https://parqlet-terms-and-privacy.notion.site/Terms-of-Service-35d38574a76480228d7bc194bc23c6de" target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-inherit no-underline hover:underline">Terms of Service</a>
          </div>
          {/* Row 2: Email + All rights reserved */}
          <div className="flex items-center justify-between">
            <a href="mailto:hello@parqlet.com" className="text-inherit no-underline">hello@parqlet.com</a>
            <span>All rights reserved</span>
          </div>
        </div>
      </footer>

      {/* ── EMAIL CONFIRMATION POPUP ── */}
      {showConfirmPopup && (
        <div
          className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/45 p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfirmPopup(false);
              setHeroEmail("");
            }
          }}
        >
          <div className="relative w-full max-w-[420px] rounded-2xl bg-white p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="mx-auto mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-lime">
              <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
                <path d="M2 11L10 19L26 3" stroke="#222" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="mb-3 font-[family-name:var(--font-heading)] text-[22px] font-normal text-primary">
              You&apos;re on the list!
            </h3>
            <p className="mb-7 text-[15px] leading-relaxed text-text-muted">
              Your email was sent to us. We will reach back to you shortly.
            </p>
            <button
              onClick={() => {
                setShowConfirmPopup(false);
                setHeroEmail("");
              }}
              className="w-full cursor-pointer rounded-lg bg-primary py-3 font-[family-name:var(--font-heading)] text-[15px] font-normal text-white transition-opacity hover:opacity-85"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── BOOK DEMO MODAL ── */}
      {showDemoModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDemoModal(false);
          }}
        >
          <div className="relative max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white p-10">
            <button
              onClick={() => setShowDemoModal(false)}
              className="absolute right-4 top-4 cursor-pointer border-none bg-transparent px-2 py-1 text-xl text-primary"
            >
              ✕
            </button>

            <h2 className="mb-3 font-[family-name:var(--font-heading)] text-[28px] font-normal text-primary">Book a Demo</h2>
            <p className="mb-2 text-[15px] leading-normal text-text-muted">
              Tell us a bit about your building and we&apos;ll show you how ParQlet can work for your community.
            </p>
            <p className="mb-7 flex items-center gap-1.5 text-[13px] text-[#504F4D]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6.5" stroke="#a7a7a7" />
                <path d="M7 4v3.5l2 1.5" stroke="#a7a7a7" strokeLinecap="round" />
              </svg>
              Typical demo: 30 minutes.
            </p>

            {/* Honeypot */}
            <input
              type="text"
              name="website"
              value={demoForm.website}
              onChange={(e) => setDemoForm((f) => ({ ...f, website: e.target.value }))}
              tabIndex={-1}
              autoComplete="off"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />

            {demoStatus === "success" ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <Image src="/images/il_check_in_the_square.svg" alt="" width={80} height={80} />
                <h3 className="font-[family-name:var(--font-heading)] text-[22px] font-normal text-primary">Request sent!</h3>
                <p className="text-[15px] text-text-muted">We&apos;ll get back to you within 24 hours.</p>
                <button
                  onClick={() => { setDemoStatus("idle"); setShowDemoModal(false); }}
                  className="mt-2 w-full cursor-pointer rounded-lg bg-primary py-3 font-[family-name:var(--font-heading)] text-[15px] font-normal text-white transition-opacity hover:opacity-85"
                >
                  Got it
                </button>
              </div>
            ) : (
            <form
              className="flex flex-col gap-5"
              onSubmit={handleDemoSubmit}
            >
              {/* Full name + Work email */}
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <FormField label="Full name" required placeholder="Jane Smith" value={demoForm.fullName} onChange={(v) => setDemoForm((f) => ({ ...f, fullName: v }))} />
                <FormField label="Work email" required placeholder="jane@company.com" type="email" value={demoForm.email} onChange={(v) => setDemoForm((f) => ({ ...f, email: v }))} />
              </div>

              {/* Company */}
              <FormField label="Company / HOA management company" required placeholder="FirstService Residential" value={demoForm.company} onChange={(v) => setDemoForm((f) => ({ ...f, company: v }))} />

              {/* Building + City */}
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <FormField label="Building or community name" placeholder="Your building name" value={demoForm.building} onChange={(v) => setDemoForm((f) => ({ ...f, building: v }))} />
                <FormField label="City" required placeholder="Your city" value={demoForm.city} onChange={(v) => setDemoForm((f) => ({ ...f, city: v }))} />
              </div>

              {/* Role */}
              <div>
                <label className="mb-1.5 block text-[13px] font-normal text-primary">
                  Role <span className="text-red-600">*</span>
                </label>
                <select
                  required
                  value={demoForm.role}
                  onChange={(e) => setDemoForm((f) => ({ ...f, role: e.target.value }))}
                  className="h-11 w-full appearance-none rounded-lg border-[1.5px] border-[#d4d4d4] bg-[#fafafa] bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%3E%3Cpath%20d%3D%22M1%201l5%205%205-5%22%20stroke%3D%22%23222%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-[position:right_14px_center] bg-no-repeat px-3.5 text-sm text-primary outline-none focus:border-primary"
                >
                  <option value="" disabled>
                    Select your role
                  </option>
                  <option>HOA Board Member</option>
                  <option>Property Manager</option>
                  <option>Building Manager</option>
                  <option>Resident</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Details */}
              <div>
                <label className="mb-1.5 block text-[13px] font-normal text-primary">
                  Any details we should know about your community?
                </label>
                <textarea
                  rows={4}
                  value={demoForm.details}
                  onChange={(e) => setDemoForm((f) => ({ ...f, details: e.target.value }))}
                  placeholder="Number of units, parking capacity, current parking challenges, or anything you'd like us to know."
                  className="w-full resize-y rounded-lg border-[1.5px] border-[#d4d4d4] bg-[#fafafa] p-3.5 text-sm leading-normal text-primary outline-none focus:border-primary"
                />
              </div>

              {/* Error */}
              {demoStatus === "error" && (
                <p className="text-center text-sm text-red-600">Something went wrong. Please try again.</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={demoSubmitting}
                className="h-[52px] w-full cursor-pointer rounded-[10px] bg-[#C7E51F] font-[family-name:var(--font-heading)] text-base font-normal text-[#222] transition-opacity hover:opacity-85 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="flex items-center gap-2">
                  {demoSubmitting ? "Sending..." : "Book a Demo"}
                  {!demoSubmitting && (
                    <Image src="/images/ic_arrow-right.svg" alt="" width={16} height={16} className="flex-shrink-0" />
                  )}
                </span>
              </button>

              <p className="text-center text-[13px] text-[#504F4D]">We&apos;ll respond within 24 hours.</p>
            </form>
            )}

          </div>
        </div>
      )}
    </>
  );
}

/* ── Form field helper ── */
function FormField({
  label,
  required,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-normal text-primary">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="h-11 w-full rounded-lg border-[1.5px] border-[#d4d4d4] bg-[#fafafa] px-3.5 text-sm text-primary outline-none focus:border-primary"
      />
    </div>
  );
}
