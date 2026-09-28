/**
 * Static mock data for the Gift Cards report (designer/mock mode only).
 * Read-only report — no create/edit UI — so unlike
 * admin-broadcasts-mock-store.ts this doesn't need mutable in-memory
 * state, just representative sample rows.
 */

export interface MockGiftCardResidentSummary {
  residentId: string;
  residentName: string | null;
  residentEmail: string | null;
  residentPhone: string | null;
  unit: string | null;
  buildingId: string;
  buildingName: string;
  creditBalance: number;
  giftCardCount: number;
}

export interface MockGiftCardRedemption {
  id: string;
  brand: string;
  valueCents: number;
  creditsSpent: number;
  redeemedAt: string;
}

export interface MockCreditHistoryEntry {
  id: string;
  type: "Purchase" | "Earned" | "Spent" | "Refund";
  credits: number;
  amountInCents: number | null;
  paymentMethod: string | null;
  createdAt: string;
}

const MOCK_RESIDENTS: MockGiftCardResidentSummary[] = [
  {
    residentId: "mock-resident-1",
    residentName: "Jordan Reyes",
    residentEmail: "jordan.reyes@email.com",
    residentPhone: "+16502299567",
    unit: "204",
    buildingId: "mock-building-1",
    buildingName: "The Meridian",
    creditBalance: 2,
    giftCardCount: 1,
  },
  {
    residentId: "mock-resident-2",
    residentName: "Priya Natarajan",
    residentEmail: "priya.n@email.com",
    residentPhone: "+14155550101",
    unit: "12B",
    buildingId: "mock-building-2",
    buildingName: "Oakline Park",
    creditBalance: 4,
    giftCardCount: 2,
  },
  {
    residentId: "mock-resident-3",
    residentName: "Sam Okafor",
    residentEmail: "sam.okafor@email.com",
    residentPhone: "+13105550199",
    unit: "7",
    buildingId: "mock-building-1",
    buildingName: "The Meridian",
    creditBalance: 14,
    giftCardCount: 0,
  },
  {
    residentId: "mock-resident-4",
    residentName: "Lena Kowalski",
    residentEmail: "lena.k@email.com",
    residentPhone: "+12065550123",
    unit: "3A",
    buildingId: "mock-building-2",
    buildingName: "Oakline Park",
    creditBalance: 10,
    giftCardCount: 0,
  },
];

const MOCK_REDEMPTIONS_BY_RESIDENT: Record<string, MockGiftCardRedemption[]> = {
  "mock-resident-1": [
    {
      id: "mock-gc-tx-1",
      brand: "Amazon",
      valueCents: 2500,
      creditsSpent: 10,
      redeemedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  "mock-resident-2": [
    {
      id: "mock-gc-tx-2",
      brand: "Amazon",
      valueCents: 2500,
      creditsSpent: 10,
      redeemedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-gc-tx-3",
      brand: "Amazon",
      valueCents: 2500,
      creditsSpent: 10,
      redeemedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

const MOCK_CREDIT_HISTORY_BY_RESIDENT: Record<string, MockCreditHistoryEntry[]> = {
  "mock-resident-1": [
    {
      id: "mock-ct-1",
      type: "Spent",
      credits: -10,
      amountInCents: 2500,
      paymentMethod: "gift_card:tremendous",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-ct-2",
      type: "Earned",
      credits: 12,
      amountInCents: null,
      paymentMethod: null,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

export function listMockGiftCardReport(): { residents: MockGiftCardResidentSummary[] } {
  return { residents: MOCK_RESIDENTS };
}

export function getMockGiftCardResidentDetail(residentId: string) {
  const resident = MOCK_RESIDENTS.find((r) => r.residentId === residentId);
  if (!resident) return null;
  return {
    resident: {
      id: resident.residentId,
      name: resident.residentName,
      email: resident.residentEmail,
      phone: resident.residentPhone,
      unit: resident.unit,
      buildingId: resident.buildingId,
      buildingName: resident.buildingName,
      creditBalance: resident.creditBalance,
    },
    giftCards: MOCK_REDEMPTIONS_BY_RESIDENT[residentId] ?? [],
    creditHistory: MOCK_CREDIT_HISTORY_BY_RESIDENT[residentId] ?? [],
  };
}
