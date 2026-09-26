/**
 * Client-side "notifications" synthesized from data the dashboard already
 * fetches for other pages. As of the real-notifications feature
 * (api-backend admin-notifications.ts + GET /api/notifications), this is
 * down to just ONE category: "subscription" has no discrete backend event
 * to hook (it's a computed status pointer, not something that "happens"),
 * so it stays synthesized here. Every other category this file used to
 * synthesize (bookings, resident management, staff & admin, sync) is now
 * backed by real `notifications` table rows — see useNotificationFeed.ts.
 */
import type { Building } from "./api/buildings";
import { fmtDate } from "./dates";

export type NotificationCategory = "bookings" | "subscription" | "access" | "residents" | "sync" | "tickets";

export interface SyntheticNotification {
  id: string;
  category: NotificationCategory;
  initials: string;
  name: string;
  message: string;
  timestamp: string; // ISO
  synthetic: true;
}

const RENEWAL_REMINDER_DAYS = 7;
const MS_DAY = 86_400_000;

/**
 * Always exactly one item (when `building` is present), so the tab isn't
 * empty just because nothing urgent is happening — the HOA already sees
 * full subscription detail on /subscription; this is a one-line pointer,
 * not a duplicate of that page. Priority: something wrong with payment/
 * status > renewing soon > a plain "you're all set" baseline.
 */
export function buildSyntheticNotifications(building: Building | null | undefined): SyntheticNotification[] {
  if (!building) return [];
  const now = new Date();

  let renewalDaysUntil: number | null = null;
  if (building.nextRenewalDate) {
    const renewal = new Date(building.nextRenewalDate);
    if (!Number.isNaN(renewal.getTime())) {
      renewalDaysUntil = Math.ceil((renewal.getTime() - now.getTime()) / MS_DAY);
    }
  }

  let id: string;
  let message: string;
  if (building.subscriptionStatus === "Past Due") {
    id = "subscription:past-due";
    message = "Your subscription payment is past due.";
  } else if (building.subscriptionStatus === "Overdue") {
    id = "subscription:overdue";
    message = "Your subscription payment is overdue.";
  } else if (building.subscriptionStatus === "Paused") {
    id = "subscription:paused";
    message = "Your subscription is currently paused.";
  } else if (building.subscriptionStatus === "Inactive") {
    id = "subscription:inactive";
    message = "Your subscription is inactive.";
  } else if (building.subscriptionStatus === "Expiring Soon") {
    id = "subscription:expiring-soon";
    message = "Your subscription is expiring soon.";
  } else if (renewalDaysUntil != null && renewalDaysUntil >= 0 && renewalDaysUntil <= RENEWAL_REMINDER_DAYS) {
    // Bucketed by day (not a live countdown) so this doesn't get a new id
    // — and re-appear as "unread" — on every single render.
    id = `subscription:renewal:${renewalDaysUntil}`;
    message = `Your subscription renews in ${renewalDaysUntil} day${renewalDaysUntil === 1 ? "" : "s"}.`;
  } else {
    id = "subscription:active";
    message = renewalDaysUntil != null
      ? `Your plan is active, renews on ${fmtDate(building.nextRenewalDate)}.`
      : "Your plan is active.";
  }

  return [{ id, category: "subscription", initials: "P", name: "Parqlet", message, timestamp: now.toISOString(), synthetic: true }];
}
