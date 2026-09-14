"use client";

import { useState } from "react";
import Image from "next/image";
import { Pill } from "../app/page";

const FAQ_ITEMS = [
  {
    q: "How does Parqlet work?",
    a: "Residents make their parking spot available when they are not using it. Other residents can book that spot for their guests through the app. The spot owner earns credits, and the guest receives a digital parking permit.",
  },
  {
    q: "Is Parqlet private to my building?",
    a: "Yes. Every Parqlet community is private and only accessible to verified residents of that specific building. Residents must join through an invitation from their HOA or building management.",
  },
  {
    q: "What does the HOA dashboard include?",
    a: "The dashboard provides real-time parking activity, booking logs, resident management tools, enforcement records, and integrations with property management systems.",
  },
  {
    q: "Can buildings generate revenue from guest parking?",
    a: "Yes. Buildings can configure guest parking fees and optionally participate in revenue sharing from parking transactions processed through Parqlet.",
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="scroll-reveal mt-[180px] mb-[180px] flex flex-col items-center text-center"
      style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
    >
      <Pill className="rounded-full bg-[#EEECE8] mb-[24px]">FAQ</Pill>
      <h2 className="mb-[16px] font-[family-name:var(--font-heading)] text-[34px] font-normal leading-[1.1] text-primary max-md:text-[26px]">
        Learn more about Parqlet
      </h2>
      <p className="mb-[32px] text-base font-normal leading-6 text-[#504F4D] whitespace-nowrap max-lg:whitespace-normal max-lg:text-[14px]">
        A quick guide to how Parqlet works for residents, guest parking, and building management
      </p>

      {/* Accordion */}
      <div className="w-full max-w-[620px] text-left">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i}>
            {/* No top divider on first item */}
            {i > 0 && <div style={{ height: "1px", width: "100%", background: "linear-gradient(to right, #E7E4E0, transparent)", display: "block" }} />}
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left"
            >
              <span className="font-[family-name:var(--font-heading)] text-[16px] font-normal text-primary">
                {item.q}
              </span>
              <Image
                src="/images/ic_chewron right.svg"
                alt=""
                width={20}
                height={20}
                className="shrink-0 transition-transform duration-300"
                style={{ transform: open === i ? "rotate(90deg)" : "rotate(0deg)" }}
              />
            </button>
            {/* Smooth grid-rows transition */}
            <div
              style={{
                display: "grid",
                gridTemplateRows: open === i ? "1fr" : "0fr",
                transition: "grid-template-rows 0.32s ease",
              }}
            >
              <div style={{ overflow: "hidden" }}>
                <p className="pb-5 font-[family-name:var(--font-heading)] text-[15px] font-normal leading-relaxed text-[#504F4D]">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        ))}
        {/* Bottom divider */}
        <div style={{ height: "1px", width: "100%", background: "linear-gradient(to right, #E7E4E0, transparent)", display: "block" }} />
      </div>
    </section>
  );
}
