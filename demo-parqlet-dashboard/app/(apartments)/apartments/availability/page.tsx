"use client";

/**
 * Parking Spots — Apartments only.
 *
 * Two tabs over one subject: which of the building's spots can be booked,
 * and when. They were two sidebar entries until an operator pricing a
 * level had to keep crossing the nav to check whether the spots they had
 * just repriced were even open - the spot list and the windows it is free
 * in are the same job, so they are now one screen.
 *
 * The route is still /availability because the URL has been in the nav and
 * in sent links for months; only what it is CALLED changed.
 *
 * The tab is in the URL rather than in state alone, so /apartment/spots
 * still opens the spot list (see ../spots/page.tsx) and so an operator can
 * send a colleague a link to the tab they mean. An unknown ?tab= value
 * falls back to Parking Spots rather than rendering nothing.
 */

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { TabBar } from "../../../components/ui/TabBar";
import { AvailabilityPanel } from "./availability-panel";
import { SpotsPanel } from "./spots-panel";

type ParkingTab = "availability" | "spots";

const TABS = [
  { id: "spots", label: "Parking Spots" },
  { id: "availability", label: "Availability" },
] as const satisfies readonly { id: ParkingTab; label: string }[];

function AvailabilityTabs() {
  const router = useRouter();
  const params = useSearchParams();
  // Spots is the default: it is the list an operator opens this screen to
  // see, and the windows only make sense once you know which spots they
  // belong to. An unknown ?tab= falls back here rather than rendering
  // nothing.
  const active: ParkingTab = params.get("tab") === "availability" ? "availability" : "spots";

  // replace(), not push(): flicking between two tabs of one screen should
  // not fill the back button with steps that all look like the same page.
  const select = (tab: ParkingTab) =>
    router.replace(tab === "availability" ? "?tab=availability" : "?", { scroll: false });

  return (
    <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column" }}>
      <div>
        <h1 style={st.h1}>Parking Spots</h1>
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
