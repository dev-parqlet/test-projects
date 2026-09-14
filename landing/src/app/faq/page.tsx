"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

/* ── FAQ data ── */
const FAQ_DATA = [
  {
    category: "General",
    items: [
      { q: "What is Parqlet?", a: "Parqlet is a guest parking management platform built for high-rise buildings and HOA communities. It gives residents a private mobile app to book and share parking spots, and gives buildings a web dashboard to manage all parking activity. When a neighbor books your spot, you earn credits toward your own future guest bookings." },
      { q: "Who is Parqlet for?", a: "Parqlet is designed for two groups: Residents — who want an easy app-based way to book guest parking and share their spot when they're not using it. And HOAs and building management companies — who want full visibility into who is parking in their building, reduce unauthorized parking, and optionally generate revenue from parking reservations." },
      { q: "Where is Parqlet available?", a: "Parqlet is currently launching in Texas and expanding nationally. The platform is available in any building whose HOA has signed a Parqlet agreement. If your building isn't on Parqlet yet, ask your building manager to reach out to us at hello@parqlet.com." },
      { q: "How much does Parqlet cost for residents?", a: "For most residents, Parqlet is free. The platform runs on a credit economy — you earn credits when your spot is used and spend them when booking for guests. Some buildings may configure monetary fees for bookings. If so, the fee is always shown before you confirm. There are never hidden charges." },
      { q: "How do I contact Parqlet?", a: "Email us at hello@parqlet.com. Standard response is within 24–48 business hours. For urgent issues during an active booking, use the in-app Report Issue feature." },
    ],
  },
  {
    category: "For Residents",
    items: [
      { q: "How do I join Parqlet?", a: "You need an invitation from your building. Once your HOA activates Parqlet, you'll receive an invite link by email. Your email is verified against the building's resident database — if your email isn't on file, contact your building management to add it. Registration takes about 2 minutes." },
      { q: "Is there a mobile app?", a: "Yes. Parqlet has a resident mobile app for both iOS and Android. Your building's Parqlet is private — only verified residents of your building can access it." },
      { q: "What is the Neighbor Broadcast?", a: "If no spots are available when you're trying to book, you can send a Neighbor Broadcast — an anonymous in-app notification asking if any resident wants to open up their spot. Responses are completely voluntary. No one is required to respond." },
      { q: "What notifications will I receive?", a: "Push notifications for booking confirmations, expiry alerts, occupied-spot alerts, and account activity — no extra consent needed. If you provide a phone number and opt in, you can also receive SMS texts for the same events. SMS is fully optional." },
      { q: "Do I have to give my phone number?", a: "No. Your phone number is optional. If you provide it, a separate consent screen asks if you want SMS alerts. You can tap 'No Thanks' and still use every Parqlet feature through push notifications only." },
      { q: "How do I delete my account?", a: "Email hello@parqlet.com to request account deletion. Your data will be deleted or anonymized per our Privacy Policy. Any remaining credits are forfeited upon deletion." },
    ],
  },
  {
    category: "Hosting a Spot",
    items: [
      { q: "How do I list my parking spot?", a: "In the app, go to your spot and set availability windows — the days and times your spot will be vacant. Your spot only shows as bookable during those windows. You can adjust or remove availability at any time before a booking is confirmed." },
      { q: "Can I list any spot I want?", a: "You can only list your assigned parking spot. You must have the right to make it available under your lease, ownership agreement, or condo documents. You cannot list ADA spots, loading zones, building visitor spots, or any spot subject to an HOA restriction." },
      { q: "What if I need my spot back unexpectedly?", a: "If a booking is already confirmed, contact hello@parqlet.com immediately with your Booking ID. Parqlet will attempt to move the guest to another spot. Repeated last-minute cancellations may result in suspension of your listing privileges." },
      { q: "What if a guest damages my spot?", a: "Photograph the damage and contact hello@parqlet.com with your Booking ID and photos. Parqlet will provide the booking record showing which Member was responsible. Under the Terms of Service, the Member who made the booking is financially responsible for their guest's conduct — including damage to your spot." },
      { q: "As a Host, am I responsible for what guests do?", a: "No. As a Spot Owner, you are not responsible for guest behavior — that's entirely on the Member who booked. Your obligations are: list your spot accurately, vacate it on time, keep it in usable condition, and respond to occupied-spot notifications promptly." },
    ],
  },
  {
    category: "Bookings & Guests",
    items: [
      { q: "How do I book a parking spot for my guest?", a: "In the app, select an available spot, choose your time window, and enter your guest's license plate. Before confirming, you'll complete a quick liability acknowledgment. Once confirmed, you receive a digital permit to share with your guest — by text, screenshot, or QR code." },
      { q: "How does my guest know their parking is confirmed?", a: "A booking is only valid once you receive both an in-app confirmation screen AND a confirmation notification to your email. It's your responsibility to verify you received both before your guest arrives. Share the permit screen with your guest so they have the spot number, time window, and license plate on record." },
      { q: "What if the spot is occupied when my guest arrives?", a: "Tap Report Issue in the app immediately. Parqlet notifies the Spot Owner anonymously. If the spot isn't cleared within 15 minutes, Parqlet tries to find an alternative at no extra cost. If none is available, your credit is refunded automatically. Enforcement decisions — including towing — are made by the HOA, not Parqlet." },
      { q: "My guest got towed despite having a valid permit — what do I do?", a: "Contact hello@parqlet.com immediately with your Booking ID and your guest's license plate. Parqlet will verify the booking was active and provide documentation. Bring that documentation to your HOA — they are required to honor valid Parqlet permits. If the HOA wrongfully authorized the tow, your claim is against the HOA and/or towing company. Parqlet is not financially responsible for towing fees." },
      { q: "What happens if my guest overstays the booking window?", a: "At booking expiry, the app sends automatic reminders to you and the Spot Owner. Overstay is a building rule violation and may result in towing at your expense, plus a penalty fee. It is your responsibility to ensure your guest leaves on time." },
      { q: "What if I entered the wrong license plate?", a: "An incorrect plate may make the permit invalid for enforcement. Contact hello@parqlet.com as soon as you notice — Parqlet may be able to update it if the booking is still active. Always double-check the plate before confirming." },
      { q: "Can I cancel a booking?", a: "Yes. If you cancel more than 24 hours before the booking window starts, your credit is refunded immediately. If you cancel less than 24 hours before the window, no credit is refunded — the Spot Owner earns their credit regardless, as compensation for keeping their spot available. Monetary fees for late cancellations are also non-refundable." },
      { q: "Am I responsible if my guest causes damage?", a: "Yes — fully. Under the Terms of Service, you are personally and financially responsible for 100% of all costs from your guest's presence in the parking facility: vehicle damage, structural damage, towing fees, building fines, and legal costs. This is absolute — it doesn't matter if you were present or if the damage was accidental. The HOA can pursue you directly for any guest-related damage." },
    ],
  },
  {
    category: "Credits & Payments",
    items: [
      { q: "How do Parqlet credits work?", a: "Credits are Parqlet's exchange system. You earn 1 credit each time another resident's guest uses your parking spot. You spend 1 credit when you book a spot for your own guest. Credits are building-specific — they can only be used in the building where earned and cannot be transferred between accounts." },
      { q: "Can I cash out my credits?", a: "No. Credits have no cash value and cannot be redeemed for money or any other product. They exist to make spot-sharing fair and self-sustaining within your building community." },
      { q: "Do credits expire?", a: "Credits do not expire during your active membership. If your building terminates its Parqlet agreement, all credits expire on the termination date. Credits are also forfeited if your account is terminated for cause." },
      { q: "How are payments processed?", a: "All monetary payments are processed by Stripe, Inc. Parqlet never stores your raw card data. Accepted methods include credit cards, debit cards, and Apple Pay where available. The fee for any booking is always shown before you confirm." },
      { q: "What is a penalty fee?", a: "Penalty fees may apply for: parking your guest in the wrong spot, guest overstay after a reminder is ignored, or other material violations tied to your booking. Penalty fees are disclosed in writing before your card is charged. You have 14 days to dispute any penalty fee by contacting hello@parqlet.com." },
      { q: "When do I get a refund?", a: "Credit refunds are instant and automatic when: the spot was occupied with no alternative available, or you cancelled more than 24 hours before the window started. Late cancellations (under 24 hours) are not refunded — the Spot Owner earns the credit. Monetary refunds are processed within 5–10 business days depending on the reason. See our full Refund Policy at parqlet.com/refunds." },
      { q: "Are credits taxable income?", a: "Parqlet takes no position on this. Credits have no fixed dollar value and are not exchangeable for cash. We do not issue tax forms in connection with credits. Consult a qualified tax advisor for your individual situation." },
    ],
  },
  {
    category: "For HOAs",
    items: [
      { q: "What does the HOA dashboard include?", a: "The HOA dashboard gives building managers real-time visibility into all parking activity: live booking logs searchable by unit, spot, license plate, and date; resident account management; data sync with your property management platform (Yardi, RealPage, BuildingLink, and others); subscription and billing management; and full audit records for enforcement." },
      { q: "Can our building earn revenue from guest parking?", a: "Yes. Buildings can configure monetary fees for guest parking bookings and set up a revenue share arrangement where the HOA earns a percentage of every parking transaction processed through Parqlet. The specific percentage is negotiated and agreed upon per building in your Order Form. Parqlet handles all payment processing and provides monthly revenue reports." },
      { q: "How does our building get started?", a: "Email hello@parqlet.com to start a conversation. We'll send you a Master Service Agreement and Order Form covering your building's configuration, fees, and features. Once both parties sign, we onboard your building and residents can start registering. Typical setup takes a few days." },
      { q: "Does our HOA need legal authority to use Parqlet?", a: "Yes. As part of signing the Master Service Agreement, your HOA certifies that it has authority under its governing documents and applicable state HOA statutes to authorize residents to share and monetize their assigned parking spots. We recommend your HOA confirm this with legal counsel before signing." },
      { q: "Does Parqlet control enforcement decisions?", a: "No. All physical enforcement — towing, citations, vehicle removal — is entirely the HOA's decision. Parqlet provides software coordination and audit records to support enforcement. The HOA retains full authority over the parking facility at all times." },
      { q: "How does Parqlet support Fair Housing compliance?", a: "We recommend buildings use automatic permit issuance — no manual resident approval gates — to minimize Fair Housing exposure. The HOA must certify Fair Housing compliance in the Master Service Agreement. All Members are prohibited from discriminating on any protected basis. Report concerns to hello@parqlet.com with subject line 'Fair Housing Concern.'" },
      { q: "What happens if our building stops using Parqlet?", a: "Either party may terminate with 60 days' written notice. Residents receive at least 30 days' notice, all credits expire, active paid bookings within the notice period are refunded, building data is exported on request, and all resident data is deleted or anonymized within 90 days." },
      { q: "Does Parqlet integrate with LPR camera systems?", a: "Yes, as a Phase 2 feature. LPR integration matches real-time plate reads from your building's cameras against active bookings. All enforcement decisions remain with the HOA — Parqlet acts only as a data-matching layer." },
    ],
  },
  {
    category: "Privacy & Data",
    items: [
      { q: "What personal data does Parqlet collect?", a: "At registration: name, email, unit number, parking spot number, and account credentials. At booking: your guest's license plate and optionally vehicle make, model, year, and color. We also collect approximate location from your IP address (city level only — not precise GPS). In LPR-enabled buildings, vehicle entry/exit times are logged. We do not collect building access credentials or precise GPS location from your device." },
      { q: "Does Parqlet sell my data?", a: "No. Parqlet does not sell, rent, or share your personal information with third parties for commercial or advertising purposes. We are not a data broker. Data is shared only with your HOA for parking management, with service providers who help operate the platform, and as required by law." },
      { q: "What do you do with my license plate data?", a: "License plate data is used only for permit validation, enforcement support, and building security within your specific building. It is never shared for commercial purposes, never used for insurance or credit decisions, and never aggregated across buildings. It is retained for 90 days after your booking expires and then deleted." },
      { q: "What are my privacy rights?", a: "Depending on your state, you may have the right to access, correct, delete, or receive a copy of your personal data. Texas residents have rights under TDPSA. California residents have rights under CCPA/CPRA. To make a request, email hello@parqlet.com. We respond within 45 days." },
      { q: "What happens if there's a data breach?", a: "If a breach is likely to result in harm to you, Parqlet will notify you as soon as reasonably practicable — and regulatory authorities within 72 hours where required. Notification goes to your account email and through in-app alerts." },
      { q: "Which third-party services does Parqlet use?", a: "Our primary data processors: Stripe (payments), our cloud infrastructure provider, Google Analytics and MixPanel (anonymized usage analytics), and Sentry and DataDog (error monitoring). All subprocessors are bound by data processing agreements. Full list at parqlet.com/subprocessors." },
    ],
  },
  {
    category: "Legal",
    items: [
      { q: "Where can I read the Terms of Service?", a: "Our Terms of Service are presented during registration and available at parqlet.com/terms. By creating an account you agree to be bound by them. Questions? Email hello@parqlet.com." },
      { q: "What happens if I have a legal dispute with Parqlet?", a: "The Terms of Service include a mandatory arbitration clause. Most disputes are resolved through binding arbitration administered by the American Arbitration Association, with Austin, Texas as the seat. You have 30 days from account creation to opt out of arbitration by emailing hello@parqlet.com. We encourage you to contact us directly first — most issues can be resolved quickly without formal proceedings." },
      { q: "How do I opt out of arbitration?", a: "Email hello@parqlet.com within 30 days of accepting the Terms of Service. Include your full name and a statement that you decline the arbitration agreement. All other Terms remain in effect if you opt out." },
      { q: "Which state's law governs my agreement with Parqlet?", a: "Delaware law governs the Terms of Service — standard practice for SaaS companies. However, mandatory consumer protection laws of your state of residence always apply and are never overridden by this." },
      { q: "Is Parqlet liable if something goes wrong in the parking facility?", a: "Parqlet is a software platform, not a parking operator. Parqlet has no liability for vehicle damage, theft, towing decisions, enforcement actions, or physical conditions of the parking facility. These responsibilities belong to the HOA and the Member who made the booking. Parqlet's total liability for any claim is capped at the greater of $100 or the fees you paid in the 30 days preceding the claim." },
      { q: "Where can I read the Privacy Policy?", a: "Our full Privacy Policy is at parqlet.com/privacy. It covers all data we collect, how we use it, retention periods, and your rights. Questions? Email hello@parqlet.com." },
      { q: "How do I stop receiving text messages from Parqlet?", a: "Reply STOP to any Parqlet text message at any time. You'll receive one confirmation and no further texts. Opting out of SMS does not affect your ability to use the platform — all features remain available through push notifications and email." },
    ],
  },
];

const TABS = ["All Questions", ...FAQ_DATA.map((c) => c.category)];

export default function FaqPage() {
  const [activeTab, setActiveTab] = useState("All Questions");
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  /* Filtered items */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q) {
      const results: { category: string; q: string; a: string; key: string }[] = [];
      FAQ_DATA.forEach((cat) =>
        cat.items.forEach((item, i) => {
          if (item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)) {
            results.push({ category: cat.category, ...item, key: `${cat.category}-${i}` });
          }
        })
      );
      return results;
    }
    const cats = activeTab === "All Questions" ? FAQ_DATA : FAQ_DATA.filter((c) => c.category === activeTab);
    return cats.flatMap((cat) =>
      cat.items.map((item, i) => ({ category: cat.category, ...item, key: `${cat.category}-${i}` }))
    );
  }, [search, activeTab]);

  const isSearching = search.trim().length > 0;

  function handleTabClick(tab: string) {
    setActiveTab(tab);
    setSearch("");
    setOpenIndex(null);
  }

  function toggleItem(key: string) {
    setOpenIndex((prev) => (prev === key ? null : key));
  }

  return (
    <div className="min-h-screen font-[family-name:var(--font-heading)]" style={{ background: "#F8F6F2" }}>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-black/5 bg-[#F8F6F2]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1160px] items-center justify-between px-5" style={{ height: '70px' }}>
          <Link href="/">
            <Image src="/images/logo.svg" alt="Parqlet" width={341} height={85} className="h-24 w-auto" priority />
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm font-normal text-[#504F4D] hover:text-[#222] transition-colors">
            <Image src="/images/ic_arrow left.svg" alt="" width={16} height={16} />
            Back to home
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="mx-auto max-w-[760px] px-5 pt-16 pb-10 text-center">
        <h1 className="mb-[16px] text-[40px] font-normal leading-[1.1] text-[#222]">
          Frequently asked questions
        </h1>
        <p className="mb-[32px] text-base font-normal text-[#504F4D]">
          Everything you need to know about Parqlet
        </p>

        {/* Search bar */}
        <div className="relative mx-auto max-w-[520px]">
          <svg className="absolute top-1/2 -translate-y-1/2 text-[#A7A7A7]" style={{ left: 16 }} width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all questions…"
            className="h-[46px] w-full rounded-[10px] border border-[#E7E4E0] bg-white pr-4 text-[15px] text-[#222] outline-none transition-colors placeholder:text-[#A7A7A7] focus:border-[#222]" style={{ paddingLeft: 44 }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A7A7A7] hover:text-[#222]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Two-column layout: vertical tabs + FAQ ── */}
      <div className="mx-auto max-w-[1160px] px-5 py-10 flex gap-16 items-start">

        {/* ── Left: vertical tabs (desktop) ── */}
        <div className="hidden lg:block w-[180px] shrink-0 sticky top-[90px]">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className="block w-full text-left py-2 text-[14px] transition-colors"
              style={{
                fontFamily: "var(--font-rubik), sans-serif",
                fontWeight: (!isSearching && activeTab === tab) ? 500 : 400,
                color: (!isSearching && activeTab === tab) ? "#222" : "#504F4D",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Right: FAQ content ── */}
        <div className="flex-1 min-w-0">

          {/* Mobile: horizontal tabs */}
          <div className="lg:hidden mb-6 overflow-x-auto no-scrollbar" style={{ borderBottom: "1px solid #E7E4E0" }}>
            <div className="flex gap-0">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className="shrink-0 whitespace-nowrap px-4 py-3 text-[14px] transition-colors"
                  style={{
                    fontFamily: "var(--font-rubik), sans-serif",
                    fontWeight: (!isSearching && activeTab === tab) ? 500 : 400,
                    color: (!isSearching && activeTab === tab) ? "#222" : "#504F4D",
                    borderBottom: (!isSearching && activeTab === tab) ? "2px solid #222" : "2px solid transparent",
                    marginBottom: "-1px",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Search label */}
          {isSearching && filtered.length > 0 && (
            <p className="mb-6 text-sm text-[#A7A7A7]">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "<span className="text-[#222]">{search}</span>"
            </p>
          )}

          {/* No results */}
          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-base text-[#A7A7A7]">No results found — try a different search</p>
            </div>
          )}

          {/* Category grouping */}
          {!isSearching && filtered.length > 0 && (
            <>
              {(activeTab === "All Questions" ? FAQ_DATA : FAQ_DATA.filter((c) => c.category === activeTab)).map((cat) => (
                <div key={cat.category} className="mb-10">
                  {activeTab === "All Questions" && (
                    <h2 className="mb-4 text-[13px] font-medium uppercase tracking-[0.1em] text-[#A7A7A7]">
                      {cat.category}
                    </h2>
                  )}
                  <div style={{ border: "1px solid #E7E4E0", borderRadius: 12, overflow: "hidden" }}>
                    {cat.items.map((item, i) => {
                      const key = `${cat.category}-${i}`;
                      const isOpen = openIndex === key;
                      return (
                        <div key={key} style={{ borderTop: i > 0 ? "1px solid #E7E4E0" : "none" }}>
                          <button
                            onClick={() => toggleItem(key)}
                            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-black/[0.02]"
                          >
                            <span className="text-[15px] font-normal text-[#222]">
                              {item.q}
                            </span>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 transition-transform duration-300" style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", color: "#A7A7A7" }}>
                              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <div style={{ display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr", transition: "grid-template-rows 0.3s ease" }}>
                            <div style={{ overflow: "hidden" }}>
                              <p className="px-6 pb-5 text-[15px] font-normal leading-relaxed text-[#504F4D]">
                                {item.a}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Search results */}
          {isSearching && filtered.length > 0 && (
            <div style={{ border: "1px solid #E7E4E0", borderRadius: 12, overflow: "hidden" }}>
              {filtered.map((item, i) => {
                const isOpen = openIndex === item.key;
                return (
                  <div key={item.key} style={{ borderTop: i > 0 ? "1px solid #E7E4E0" : "none" }}>
                    <button onClick={() => toggleItem(item.key)} className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-black/[0.02]">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#A7A7A7]">{item.category}</span>
                        <span className="text-[15px] font-normal text-[#222]">{item.q}</span>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-1 shrink-0 transition-transform duration-300" style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", color: "#A7A7A7" }}>
                        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <div style={{ display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr", transition: "grid-template-rows 0.3s ease" }}>
                      <div style={{ overflow: "hidden" }}>
                        <p className="px-6 pb-5 text-[15px] font-normal leading-relaxed text-[#504F4D]">{item.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Contact strip — no container, inline ── */}
          <div className="mt-16 pb-10 text-center">
            <p className="text-[15px] text-[#504F4D]">
              Still have a question?{" "}
              <a href="mailto:hello@parqlet.com" className="font-normal text-[#222] underline-offset-2 hover:underline">
                email hello@parqlet.com
              </a>
            </p>
          </div>

        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="mx-auto mb-6 flex max-w-[1160px] items-center justify-between px-5">
        <span className="text-xs font-normal uppercase tracking-wider text-[#A7A7A7]">
          <a href="mailto:hello@parqlet.com" className="text-inherit no-underline">hello@parqlet.com</a>
        </span>
        <span className="text-xs font-normal uppercase tracking-wider text-[#A7A7A7]">
          All rights reserved
        </span>
      </footer>

      {/* Scrollbar hide */}
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}
