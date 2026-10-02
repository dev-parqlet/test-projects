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

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { ImportDataCard } from "../../../components/import/ImportDataCard";
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

  // Owned here because the buttons that set them sit on the title row,
  // which this component renders. The modals themselves stay in the panel.
  const [creating, setCreating] = useState(false);
  const [bulkEditing, setBulkEditing] = useState(false);
  const [importing, setImporting] = useState(false);

  return (
    <div style={{ padding: "var(--spacing-24)", display: "flex", flexDirection: "column" }}>
      {/* Title and actions on ONE row, the way every other screen with
          actions does it. They were under the tab bar, which put three
          buttons between the tabs and the table they act on. */}
      <div style={st.titleRow}>
        <div>
          <h1 style={st.h1}>Parking Spots</h1>
          <p style={st.sub}>
            The spots your building owns, and which ones you can rent out.
          </p>
        </div>
        {active === "spots" && (
          <div style={st.actions}>
            {/* ONE bulk control, not two. "Add spots in bulk" and "Set
                prices by range" asked for the same thing - a range of
                numbers and what those spots are - and differed only in
                whether the numbers already existed, which is a fact the
                operator had to establish before they could pick a button.
                See bulk-spots-modal.tsx. */}
            {/* The SAME import as Settings - one file, one parser, one
                preview. The feed carries each resident's unit alongside
                their details, which is what tells this screen whose lease
                a spot sits on, so uploading it from here rather than from
                Settings is a shortcut, not a second feature. See
                components/import/ImportDataCard. */}
            <Button variant="secondary" size="small" style={st.action} onClick={() => setImporting(true)}>
              Import Parking Data
            </Button>
            <Button variant="secondary" size="small" style={st.action} onClick={() => setBulkEditing(true)}>
              Add or edit in bulk
            </Button>
            <Button variant="primary" size="small" style={st.action} onClick={() => setCreating(true)}>
              Add spot
            </Button>
          </div>
        )}
      </div>

      <div style={{ marginTop: "var(--spacing-16)" }}>
        <TabBar active={active} onChange={select} tabs={TABS} />
      </div>

      {active === "availability" ? (
        <AvailabilityPanel />
      ) : (
        <SpotsPanel
          creating={creating}
          setCreating={setCreating}
          bulkEditing={bulkEditing}
          setBulkEditing={setBulkEditing}
        />
      )}

      {/* `bare`, because the Modal already draws the frame and the title -
          a card inside a dialog is a box inside a box. */}
      <Modal
        open={importing}
        onClose={() => setImporting(false)}
        title="Import parking data"
        size="xlarge"
      >
        <ImportDataCard
          product="apartment"
          variant="bare"
          blurb="Upload the export from Yardi or whatever your building runs on. Residents arrive with their unit and lease dates, which is what sets each spot's status here."
        />
      </Modal>
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
  titleRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "var(--spacing-16)",
    flexWrap: "wrap",
  },
  actions: { display: "flex", gap: "var(--spacing-8)", flexShrink: 0 },
  action: { width: "auto", whiteSpace: "nowrap" },
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
