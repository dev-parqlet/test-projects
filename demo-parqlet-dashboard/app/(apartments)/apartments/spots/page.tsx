"use client";

/**
 * /apartment/spots — kept as a redirect, not a page.
 *
 * The spot list is the first tab of Parking Spots. This route stays
 * because the URL was in the nav for months and is linked from the Credit
 * Price help text in Settings; a 404 would be a worse answer than the
 * screen the visitor was asking for.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SpotsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/apartment/parking-spots?tab=spots");
  }, [router]);
  return null;
}
