"use client";

/**
 * Super Admin -> Gift Cards. Shared report component — see
 * app/components/gift-cards/GiftCardsReport.tsx. `isSuperAdmin` adds the
 * Building column and the "Send Reminder" row action, and collapses
 * "View Details" to an icon-only button to make room for it.
 */

import { GiftCardsReport } from "../../../components/gift-cards/GiftCardsReport";

export default function SuperAdminGiftCardsPage() {
  return <GiftCardsReport isSuperAdmin />;
}
