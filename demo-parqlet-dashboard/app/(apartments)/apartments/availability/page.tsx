"use client";

/**
 * /apartment/availability — kept as a redirect, not a page.
 *
 * The screen is called Parking Spots, and Availability is its second tab.
 * This URL was in the nav, so a 404 would be a worse answer than the screen
 * the visitor was asking for. It lands on the Availability tab, which is
 * what someone typing this URL meant.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AvailabilityRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/apartment/parking-spots?tab=availability");
  }, [router]);
  return null;
}
