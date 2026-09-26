/**
 * In-memory mock store for SAdmin broadcast campaigns (designer/mock mode
 * only). Unlike the JSON-file mock data elsewhere, this isn't seed data —
 * it's runtime state (schedules an admin creates/edits/deletes), so a
 * plain module-level array mirrors the real backend's pg-boss-backed
 * behavior closely enough for design/QA without a JSON file to keep in
 * sync. Resets on dev-server restart — acceptable for mock mode.
 */
import { randomUUID } from "crypto";

export interface MockBroadcastCampaign {
  id: string;
  title: string;
  message: string;
  buildingIds: string[] | null;
  startDate: string;
  endDate: string;
  times: string[];
  timeZone: string;
}

const store: MockBroadcastCampaign[] = [];

export function listMockBroadcasts(): MockBroadcastCampaign[] {
  return store;
}

export function createMockBroadcast(data: Omit<MockBroadcastCampaign, "id">): MockBroadcastCampaign {
  const campaign: MockBroadcastCampaign = { id: randomUUID(), ...data };
  store.push(campaign);
  return campaign;
}

export function updateMockBroadcast(id: string, data: Omit<MockBroadcastCampaign, "id">): MockBroadcastCampaign | null {
  const idx = store.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  store[idx] = { id, ...data };
  return store[idx];
}

export function deleteMockBroadcast(id: string): boolean {
  const idx = store.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  store.splice(idx, 1);
  return true;
}
