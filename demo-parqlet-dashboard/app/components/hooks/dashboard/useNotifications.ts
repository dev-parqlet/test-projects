/**
 * useNotifications — fetches the latest alert/notification feed.
 *
 * Returns up to `pageSize` alerts from the backend. Backed by TanStack Query
 * so multiple consumers (NotificationDropdown, AccountMenu, etc.) dedupe.
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiAlert } from "./types";

const BACKEND_URL =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "https://api.parqlet.com"
    : "https://api.parqlet.com";

export const notificationKeys = {
  feed: (pageSize: number) => ["alerts", "feed", pageSize] as const,
};

async function fetchNotifications(pageSize: number): Promise<ApiAlert[]> {
  const res = await fetch(`${BACKEND_URL}/api/alerts?pageSize=${pageSize}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load notifications");
  const json = (await res.json()) as { data?: ApiAlert[] };
  return json.data ?? [];
}

export function useNotifications(pageSize: number = 10) {
  const query = useQuery<ApiAlert[]>({
    queryKey: notificationKeys.feed(pageSize),
    queryFn: () => fetchNotifications(pageSize),
    staleTime: 30_000,
  });

  return {
    notifications: query.data ?? [],
    loading: query.isLoading,
  };
}