"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listAlerts, acknowledgeAlert, type Alert } from "@/lib/api/super-admin";
import { getBuilding } from "@/lib/api/buildings";
import { listNotifications, markNotificationRead, markAllNotificationsRead, type RealNotification } from "@/lib/api/notifications";
import { preferencesApi } from "@/lib/api/preferences";
import { buildSyntheticNotifications, type NotificationCategory } from "@/lib/synthetic-notifications";
import { useAuth } from "@/components/auth/auth-provider";

export const notificationsFeedKey = ["notifications-feed"] as const;
const SYNTHETIC_SEEN_KEY = "parqlet:seen-synthetic-notifications";
const SYNTHETIC_SEEN_CAP = 200;

// Real alerts (manually-dispatched incidents) have no natural fit in the
// Bookings/Subscription/Access/Residents/Sync taxonomy below — they still
// show up in the "All" view, just not under any of the specific tabs.
export type NotificationFeedCategory = NotificationCategory | "alerts";

export interface NotificationFeedItem {
  id: string;
  category: NotificationFeedCategory;
  initials: string;
  name: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  /**
   * "alert" = /api/alerts, real acknowledged state, ack via acknowledgeAlert.
   * "notification" = real GET /api/notifications row (admin-notifications.ts
   *   on the backend), real isRead state, ack via markNotificationRead.
   * "synthetic" = computed client-side (currently: subscription pointer
   *   only), no backend row to ack — tracked in localStorage instead.
   */
  kind: "alert" | "notification" | "synthetic";
}

/** Maps a Settings > Notifications page id (e.g. "book-new") to this feed's tab category. */
const CATEGORY_TO_TAB: Record<string, NotificationCategory> = {
  "res-invite": "residents",
  "res-updated": "residents",
  "res-removed": "residents",
  "staff-invite": "access",
  "new-admin": "access",
  "book-new": "bookings",
  "book-cancel": "bookings",
  "book-issue": "bookings",
  "sync-ok": "sync",
  "sync-error": "sync",
  "ticket-reply": "tickets",
};

function initialOf(s: string | null | undefined, fallback: string): string {
  const c = s?.trim()?.[0];
  return (c ?? fallback).toUpperCase();
}

function readSeenSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SYNTHETIC_SEEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeSeenSet(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    // Cap so this can't grow unbounded across months of daily use.
    const capped = Array.from(ids).slice(-SYNTHETIC_SEEN_CAP);
    window.localStorage.setItem(SYNTHETIC_SEEN_KEY, JSON.stringify(capped));
  } catch {
    // Best-effort — localStorage can throw in private-browsing/quota cases.
  }
}

/**
 * Merges three sources:
 *   - Real alerts (/api/alerts — manually-dispatched incidents)
 *   - Real admin notifications (/api/notifications, residentId NULL rows —
 *     written by api-backend's notifyAdmins() at the same event points
 *     piped to Slack). Filtered by the CURRENT user's own
 *     notificationPreferences[category].web flag from the Settings >
 *     Notifications page — that preference is per-user, and this table has
 *     no per-user recipient/read-state column, so every admin in the
 *     building gets the same rows and each browser filters+tracks its own
 *     "seen" state for what its own toggles allow.
 *   - One synthesized "subscription" pointer item (no discrete backend
 *     event exists for "your plan renews soon").
 */
export function useNotificationFeed() {
  const { user } = useAuth();
  const buildingId = user?.buildingIds?.[0] ?? null;
  const queryClient = useQueryClient();
  const [seenIds, setSeenIds] = useState<Set<string>>(() => readSeenSet());

  const alertsQuery = useQuery({
    queryKey: notificationsFeedKey,
    queryFn: () => listAlerts({}),
    staleTime: 30_000,
  });

  const buildingQuery = useQuery({
    queryKey: ["notifications-feed", "building", buildingId ?? ""],
    queryFn: () => getBuilding(buildingId!),
    enabled: !!buildingId,
    staleTime: 30_000,
  });

  const realNotificationsQuery = useQuery({
    queryKey: ["notifications-feed", "real", buildingId ?? ""],
    queryFn: () => listNotifications({ buildingId: buildingId! }),
    enabled: !!buildingId,
    staleTime: 15_000,
  });

  const prefsQuery = useQuery({
    queryKey: ["notifications-feed", "prefs"],
    queryFn: () => preferencesApi.get(),
    staleTime: 60_000,
  });

  const isLoading = alertsQuery.isLoading ||
    (!!buildingId && (buildingQuery.isLoading || realNotificationsQuery.isLoading || prefsQuery.isLoading));
  // Real alerts are the primary feed — a failure there is worth surfacing
  // with a retry. The other sources failing just means fewer rows show up;
  // not worth a hard error state for what's largely an enhancement on top.
  const isError = alertsQuery.isError;

  const items = useMemo<NotificationFeedItem[]>(() => {
    const alertItems: NotificationFeedItem[] = (alertsQuery.data?.data ?? []).map((a: Alert) => ({
      id: a.id,
      category: "alerts",
      initials: (a.buildingName?.trim()?.[0] ?? a.type?.trim()?.[0] ?? "!").toUpperCase(),
      name: a.buildingName || a.type,
      message: a.description,
      timestamp: a.timestamp,
      acknowledged: a.acknowledged,
      kind: "alert",
    }));

    const webPrefs = prefsQuery.data?.notificationPreferences ?? {};
    const notificationItems: NotificationFeedItem[] = (realNotificationsQuery.data?.data ?? [])
      .filter((n: RealNotification) => webPrefs[n.category]?.web === true)
      .map((n: RealNotification) => ({
        id: n.id,
        category: CATEGORY_TO_TAB[n.category] ?? "bookings",
        initials: initialOf(n.message, "!"),
        name: n.message.split(" ").slice(0, 3).join(" "),
        message: n.message,
        timestamp: n.createdAt,
        acknowledged: n.isRead,
        kind: "notification",
      }));

    const synthetic: NotificationFeedItem[] = buildSyntheticNotifications(buildingQuery.data ?? null).map((n) => ({
      id: n.id,
      category: n.category,
      initials: n.initials,
      name: n.name,
      message: n.message,
      timestamp: n.timestamp,
      acknowledged: seenIds.has(n.id),
      kind: "synthetic",
    }));

    return [...alertItems, ...notificationItems, ...synthetic].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [alertsQuery.data, buildingQuery.data, realNotificationsQuery.data, prefsQuery.data, seenIds]);

  // Cross-tab/cross-component sync — another tab (or the dropdown vs. the
  // full page in the same tab) marking something seen should update here too.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === SYNTHETIC_SEEN_KEY) setSeenIds(readSeenSet());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const acknowledge = useCallback(
    async (item: NotificationFeedItem) => {
      if (item.acknowledged) return;

      if (item.kind === "synthetic") {
        setSeenIds((prev) => {
          const next = new Set(prev).add(item.id);
          writeSeenSet(next);
          return next;
        });
        return;
      }

      if (item.kind === "notification") {
        queryClient.setQueryData(
          ["notifications-feed", "real", buildingId ?? ""],
          (old: typeof realNotificationsQuery.data) =>
            old ? { ...old, data: old.data.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)) } : old
        );
        try {
          await markNotificationRead(item.id);
        } finally {
          queryClient.invalidateQueries({ queryKey: ["notifications-feed", "real", buildingId ?? ""] });
        }
        return;
      }

      // kind === "alert"
      queryClient.setQueryData(notificationsFeedKey, (old: typeof alertsQuery.data) =>
        old ? { ...old, data: old.data.map((a) => (a.id === item.id ? { ...a, acknowledged: true } : a)) } : old
      );
      try {
        await acknowledgeAlert(item.id);
      } finally {
        queryClient.invalidateQueries({ queryKey: notificationsFeedKey });
      }
    },
    [queryClient, alertsQuery.data, realNotificationsQuery.data, buildingId]
  );

  const acknowledgeAll = useCallback(async () => {
    const unread = items.filter((i) => !i.acknowledged);

    const syntheticIds = unread.filter((i) => i.kind === "synthetic").map((i) => i.id);
    if (syntheticIds.length > 0) {
      setSeenIds((prev) => {
        const next = new Set(prev);
        syntheticIds.forEach((id) => next.add(id));
        writeSeenSet(next);
        return next;
      });
    }

    const hasUnreadNotification = unread.some((i) => i.kind === "notification");
    if (hasUnreadNotification && buildingId) {
      await markAllNotificationsRead(buildingId);
      queryClient.invalidateQueries({ queryKey: ["notifications-feed", "real", buildingId] });
    }

    const alertUnread = unread.filter((i) => i.kind === "alert");
    if (alertUnread.length > 0) {
      await Promise.all(alertUnread.map((i) => acknowledgeAlert(i.id)));
      queryClient.invalidateQueries({ queryKey: notificationsFeedKey });
    }
  }, [items, queryClient, buildingId]);

  return {
    items,
    unreadCount: items.filter((i) => !i.acknowledged).length,
    isLoading,
    isError,
    refetch: alertsQuery.refetch,
    acknowledge,
    acknowledgeAll,
  };
}
