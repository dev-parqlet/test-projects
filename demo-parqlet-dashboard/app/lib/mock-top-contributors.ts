/**
 * Top contributors, computed from the booking corpus.
 *
 * There is no `top-contributors.json`: a second file listing the same
 * residents would drift from `bookings.json` the moment the seeder ran,
 * and the card would credit people for shares the Bookings page cannot
 * show. So it is aggregated from the bookings themselves, the way the
 * real endpoint aggregates over `offerer_resident_id`.
 *
 * A contributor is a resident whose OWN spot someone booked - the
 * `spotOwnerName` on the booking. A building's own spot has no owner, so
 * it contributes to nobody, which is why an Apartment's list is short and
 * a Condo's is long.
 *
 * Credits earned follow the product rule: the owner earns one credit per
 * day their spot is used, whether the renter paid with a credit or a card.
 */

import fs from "node:fs";
import path from "node:path";

const MOCK_DATA_DIR = path.join(process.cwd(), "app/lib/mock-data");

/** The base credit, for reading day counts back out of a card payment. */
const BASE_PRICE_CENTS = 600;

type RawBooking = {
  buildingId: string;
  status: string;
  spotOwnerName?: string | null;
  creditsSpent?: number | null;
  amountCents?: number | null;
};

type RawResident = { name?: string; unit?: string; buildingId?: string };

export type MockContributor = {
  rank: number;
  name: string;
  unit: string;
  shares: number;
  credits: number;
};

function readJson<T>(file: string): T[] {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(MOCK_DATA_DIR, file), "utf-8"));
    return (Array.isArray(raw) ? raw : raw.data) ?? [];
  } catch {
    return [];
  }
}

export function buildMockTopContributors(buildingId: string | null): MockContributor[] {
  const bookings = readJson<RawBooking>("bookings.json");
  const residents = readJson<RawResident>("residents.json");

  const unitOf = new Map<string, string>();
  for (const r of residents) {
    if (r.name && r.unit) unitOf.set(r.name, r.unit);
  }

  const tally = new Map<string, { shares: number; credits: number }>();
  for (const b of bookings) {
    if (buildingId && b.buildingId !== buildingId) continue;
    // A cancelled booking paid nobody, so it earned the owner nothing.
    if (b.status === "Cancelled") continue;
    const owner = b.spotOwnerName;
    if (!owner) continue;

    const credits = b.creditsSpent || Math.max(1, Math.round((b.amountCents ?? 0) / BASE_PRICE_CENTS) || 1);
    const row = tally.get(owner) ?? { shares: 0, credits: 0 };
    row.shares += 1;
    row.credits += credits;
    tally.set(owner, row);
  }

  return [...tally.entries()]
    .sort((a, b) => b[1].credits - a[1].credits || b[1].shares - a[1].shares)
    .slice(0, 10)
    .map(([name, row], i) => ({
      rank: i + 1,
      name,
      unit: unitOf.get(name) ?? "—",
      shares: row.shares,
      credits: row.credits,
    }));
}
