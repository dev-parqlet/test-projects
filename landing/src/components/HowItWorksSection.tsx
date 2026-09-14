"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Pill } from "../app/page";
import CoinExplosion from "./CoinExplosion";

export default function HowItWorksSection() {
  const [activeTab, setActiveTab] = useState<"resident" | "hoa">("resident");
  const [activeStep, setActiveStep] = useState(0);
  const [fillPct, setFillPct] = useState(0);
  const [showExplosion, setShowExplosion] = useState(false);
  const prevStep = useRef(-1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const STEP_MS = 5000;
  const PAUSE_MS = 3500;
  const TOTAL_MS = STEP_MS * 2 + PAUSE_MS;

  useEffect(() => {
    setActiveStep(0);
    setFillPct(0);
    const t0 = Date.now();
    const id = setInterval(() => {
      const e = (Date.now() - t0) % TOTAL_MS;
      if (e < STEP_MS) {
        setActiveStep(0);
        setFillPct((e / STEP_MS) * 50);
      } else if (e < STEP_MS * 2) {
        setActiveStep(1);
        setFillPct(50 + ((e - STEP_MS) / STEP_MS) * 50);
      } else {
        setActiveStep(2);
        setFillPct(100);
      }
    }, 50);
    return () => clearInterval(id);
  }, [activeTab]);

  useEffect(() => {
    if (activeStep === 2 && prevStep.current !== 2) {
      setShowExplosion(true);
      setTimeout(() => setShowExplosion(false), 900);
    }
    prevStep.current = activeStep;
  }, [activeStep]);

  const residentSteps = [
    { title: "Ryan/Unit 1708 is away for the weekend",  body: "He marks his parking spot #135 as available those days" },
    { title: "Kate/Unit 1305 books it for her in-laws", body: "She spends 1 credit or pays with Apple Pay or any other payment method" },
    { title: "Ryan earns credits",                       body: "Ready to use next time he has a guest" },
  ];
  const hoaSteps = [
    { title: "Set up your team and invite all residents",  body: "Add building staff and set their access anytime. Send the initial invite to all residents in one go." },
    { title: "Auto-invites for new residents",             body: "New residents get invited automatically as they move in — no manual outreach needed." },
    { title: "Full visibility, zero overhead",             body: "Every booking is logged automatically. Open the platform anytime to see what's happening, and add a note to any booking if needed." },
  ];
  const steps = activeTab === "resident" ? residentSteps : hoaSteps;
  const nodeFilled = [true, activeStep >= 1, activeStep >= 2];
  const lineW = `${fillPct * 0.6667}%`;

  return (
    <div className="rounded-[16px] bg-[#222222] px-[65px] py-[72px] text-center max-md:px-[20px] max-md:py-[48px]">
      <span className="mb-8 inline-flex items-center rounded-full bg-[#292929] px-5 font-[family-name:var(--font-heading)] text-[11px] font-medium uppercase tracking-[0.14em] text-[#A7A7A7] leading-none" style={{ paddingTop: 8, paddingBottom: 8 }}>
        The Parqlet Loop
      </span>

      <h2 className="mb-10 font-[family-name:var(--font-heading)] text-[42px] font-normal leading-[1.1] text-white max-md:text-[24px] max-md:mb-7">
        How guest parking powered <span className="max-md:whitespace-nowrap">by Parqlet</span><br />
        <span className="text-[#C7E51F]">works in your building</span>
      </h2>

      <div className="mb-16 inline-flex items-center rounded-[8px] bg-[#292929]" style={{ height: 40, padding: 4 }}>
        {(["resident", "hoa"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ borderRadius: 6, height: 32 }}
            className={`cursor-pointer px-10 max-md:px-6 font-[family-name:var(--font-heading)] text-base font-normal transition-all ${
              activeTab === tab
                ? "bg-[#3D3D3D] text-white"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            {tab === "resident" ? "Resident" : "HOA"}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative mb-10">
        <div className="absolute top-1/2 -translate-y-1/2 h-px bg-white/15" style={{ left: "16.67%", right: "16.67%" }} />
        <div className="absolute top-1/2 -translate-y-1/2 h-px bg-[#C7E51F]" style={{ left: "16.67%", width: lineW, boxShadow: "0 0 4px 1px rgba(199,229,31,0.12), 0 0 8px 2px rgba(199,229,31,0.06)" }} />
        <div className="relative z-[1] grid grid-cols-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex justify-center py-3">
              {i === 2 ? (
                <div className="relative">
                  {showExplosion && <CoinExplosion />}
                  <Image key={nodeFilled[2] ? "coin-active" : "coin-idle"} src="/images/il_coin.png" alt="" width={44} height={44} className={nodeFilled[2] ? "coin-pop" : ""} />
                </div>
              ) : nodeFilled[i] ? (
                <Image src="/images/Indicator.svg" alt="" width={13} height={13} />
              ) : (
                <Image src="/images/Indicator_non active.svg" alt="" width={13} height={13} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-6 text-left max-lg:grid-cols-1 max-md:gap-4">
        {steps.map((step, i) => (
          <div
            key={isMobile && i === activeStep ? `${activeTab}-step-${activeStep}` : `${activeTab}-${i}`}
            className="relative"
            style={{
              display: isMobile && i !== activeStep ? "none" : undefined,
              animation: isMobile && i === activeStep ? "cardSlideIn 0.38s ease-out forwards" : undefined,
            }}
          >
            {/* Gradient glow behind card */}
            <div
              className="absolute rounded-[40px] blur-[50px] transition-opacity duration-700 pointer-events-none"
              style={{
                inset: "-24px",
                background: "radial-gradient(ellipse at 30% 55%, rgba(199,229,31,0.45) 0%, rgba(59,109,17,0.22) 50%, transparent 80%)",
                opacity: activeStep === i ? 1 : 0,
                zIndex: 0,
              }}
            />
            {/* Card with moving shimmer border */}
            <div className="relative overflow-hidden rounded-[20px]" style={{ zIndex: 1 }}>
              {/* Shimmer layer — spins clockwise behind 1.5px gap */}
              <div
                className="absolute inset-0"
                style={{
                  background: activeStep === i
                    ? "conic-gradient(from 0deg, transparent 0%, transparent 70%, rgba(199,229,31,0.4) 80%, #C7E51F 88%, rgba(199,229,31,0.4) 96%, transparent 100%)"
                    : "rgba(255,255,255,0.07)",
                  animation: activeStep === i ? "shimmerSpin 3s linear infinite" : "none",
                }}
              />
              <div className="relative m-[1.5px] rounded-[19px] p-7 min-h-[200px] max-md:p-5 max-md:min-h-[160px]" style={{ zIndex: 1, background: "#2A2A2A" }}>
                <h3 className="mb-3 font-[family-name:var(--font-heading)] text-[17px] font-semibold leading-snug text-white">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/55">{step.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
