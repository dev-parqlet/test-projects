"use client";

/**
 * Availability — Apartments only.
 *
 * Two tabs over one subject: which of the building's spots can be booked,
 * and when. They were two sidebar entries until an operator pricing a
 * level had to keep crossing the nav to check whether the spots they had
 * just repriced were even open - the spot list and the windows it is free
 * in are the same job, so they are now one screen.
 *
 * The tab is in the URL rather than in state alone, so /apartment/spots
 * still opens the spot list (see ../spots/page.tsx) and so an operator can
 * send a colleague a link to the tab they mean. An unknown ?tab= value
 * falls back to Availability rather than rendering nothing.
 */

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { TabBar } from "../../../components/ui/TabBar";
import { AvailabilityPanel } from "./availability-panel";
import { SpotsPanel } from "./spots-panel";

type ParkingTab = "availability" | "spots";

const TABS = [
  { id: "availability", label: "Availability" },
  { id: "spots", label: "Parking Spots" },
] as const satisfies readonly { id: ParkingTab; label: string }[];

function AvailabilityTabs() {
  const router = useRouter();
  const params = useSearchParams();
  const active: ParkingTab = params.get("tab") === "spots" ? "spots" : "availability";

  // replace(), not push(): flicking between two tabs of one screen should
  // not fill the back button with steps that all look like the same page.
  const select = (tab: ParkingTab) =>
    router.replace(tab === "spots" ? "?tab=spots" : "?", { scroll: false });

  return (
    <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column" }}>
      <div>
        <h1 style={st.h1}>Availability</h1>
        <p style={st.sub}>
          The spots your building owns, and the windows they are free to
          book in.
        </p>
      </div>

      <div style={{ marginTop: "var(--spacing-16)" }}>
        <TabBar active={active} onChange={select} tabs={TABS} />
      </div>

      {active === "availability" ? <AvailabilityPanel /> : <SpotsPanel />}
    </div>
  );
}

export default function AvailabilityPage() {
  // useSearchParams() needs a Suspense boundary to prerender.
  return (
    <Suspense fallback={null}>
      <AvailabilityTabs />
    </Suspense>
  );
}

const st: Record<string, React.CSSProperties> = {
  h1: {
    margin: 0,
    fontSize: "var(--font-size-heading-1)",
    lineHeight: "var(--line-height-heading-1)",
    fontWeight: "var(--font-weight-regular)" as React.CSSProperties["fontWeight"],
    color: "var(--color-text-strong)",
    fontFamily: "var(--font-family-heading)",
  },
  sub: {
    margin: "var(--spacing-8) 0 0",
    fontSize: "var(--font-size-body)",
    lineHeight: "var(--line-height-body)",
    color: "var(--color-text-weak)",
    fontFamily: "var(--font-family-body)",
    maxWidth: 560,
  },
};
