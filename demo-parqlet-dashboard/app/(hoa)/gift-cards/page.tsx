"use client";

/**
 * HOA -> Gift Cards. Shared report component — see
 * app/components/gift-cards/GiftCardsReport.tsx. The Actions column
 * here is "View Details" only — "Send Reminder" is Super Admin only.
 */

import { GiftCardsReport } from "../../components/gift-cards/GiftCardsReport";

export default function HoaGiftCardsPage() {
  return <GiftCardsReport />;
}
