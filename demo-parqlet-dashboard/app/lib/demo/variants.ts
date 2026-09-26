/**
 * The two dashboards this demo site shows.
 *
 * demo.parqlet.com exists to be shown to a prospect, so it has to present
 * BOTH products: the HOA dashboard that exists today, and the Apartments
 * dashboard for public parking. A visitor flips between them from the
 * header — there is no sign-in, and no real account behind either.
 *
 * Both identities are `admin`, never `super_admin`: the super-admin console
 * is an internal tool and showing it would misrepresent what a client buys.
 *
 * The building ids are real entries in app/lib/mock-data/buildings.json. If
 * one is ever changed there without being changed here, every
 * building-scoped screen silently renders empty, because the mock API
 * filters on exactly these ids.
 */

export type DemoVariant = 'hoa' | 'apartments';

export type DemoIdentity = {
  variant: DemoVariant;
  /** Shown in the header switcher. */
  label: string;
  /** One line explaining the product, for the switcher menu. */
  blurb: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin';
    buildingId: string;
    buildingIds: string[];
    buildings: { id: string; name: string }[];
    phone: string;
    createdAt: string;
  };
};

const HOA_BUILDING = {
  id: 'e6565d1b-1f25-4c51-bfa6-7db4932702cd',
  name: '44 East Avenue',
};

const APARTMENTS_BUILDING = {
  id: '80f9ac2e-b884-4634-ac02-0682a9a12662',
  name: 'Riverside Towers',
};

export const DEMO_IDENTITIES: Record<DemoVariant, DemoIdentity> = {
  hoa: {
    variant: 'hoa',
    label: 'HOA — 44 East Avenue',
    blurb: 'Residents share their own spots. Guests are paid for in credits.',
    user: {
      id: '11111111-2222-4333-8444-555555555555',
      name: 'Sarah Johnson',
      email: 'sarah@44east.com',
      role: 'admin',
      buildingId: HOA_BUILDING.id,
      buildingIds: [HOA_BUILDING.id],
      buildings: [HOA_BUILDING],
      phone: '+1 (555) 100-0003',
      createdAt: '2026-05-15T06:55:06.103Z',
    },
  },
  apartments: {
    variant: 'apartments',
    label: 'Apartments — Riverside Towers',
    blurb: 'The building owns the spots, sets prices, and is paid in dollars.',
    user: {
      id: '66666666-7777-4888-8999-000000000000',
      name: 'Daniel Reyes',
      email: 'daniel@riversidetowers.com',
      role: 'admin',
      buildingId: APARTMENTS_BUILDING.id,
      buildingIds: [APARTMENTS_BUILDING.id],
      buildings: [APARTMENTS_BUILDING],
      phone: '+1 (555) 200-0007',
      createdAt: '2026-04-02T09:12:00.000Z',
    },
  },
};

export const DEFAULT_VARIANT: DemoVariant = 'hoa';

/** localStorage key holding the visitor's choice. */
const STORAGE_KEY = 'parqlet_demo_variant';

export function readVariant(): DemoVariant {
  if (typeof window === 'undefined') return DEFAULT_VARIANT;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'apartments' || v === 'hoa' ? v : DEFAULT_VARIANT;
  } catch {
    // Private browsing, or storage disabled. A demo must still open.
    return DEFAULT_VARIANT;
  }
}

/**
 * Switch and reload. A full reload rather than a re-render on purpose:
 * every screen caches building-scoped data through react-query, and
 * swapping the identity underneath them would leave one building's
 * bookings next to another's residents for a few seconds — in front of a
 * prospect, that reads as a bug.
 */
export function setVariant(v: DemoVariant): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, v);
  } catch {
    // Ignore — the reload below still lands on the default.
  }
  window.location.href = '/';
}

export function currentIdentity(): DemoIdentity {
  return DEMO_IDENTITIES[readVariant()];
}
