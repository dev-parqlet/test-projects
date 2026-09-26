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

/**
 * Accepts the obvious spellings rather than one exact string. A link is
 * typed by a human into an email as often as it is copied, and `?v=apartment`
 * silently falling back to the HOA dashboard is the kind of thing nobody
 * notices until a prospect is already looking at the wrong product.
 */
function parse(v: string | null): DemoVariant | null {
  const k = (v ?? '').trim().toLowerCase();
  if (k === 'apartments' || k === 'apartment' || k === 'apt') return 'apartments';
  if (k === 'hoa') return 'hoa';
  return null;
}

/**
 * The variant asked for in the URL, e.g. demo.parqlet.com/?v=apartments.
 *
 * This is how a link is sent to a specific prospect: an apartment operator
 * should open the Apartments dashboard immediately, not be asked to choose
 * between two products they have not heard of. Reading it takes precedence
 * over whatever was stored, so a link always wins over a stale choice made
 * on a previous visit.
 */
export function variantFromUrl(): DemoVariant | null {
  if (typeof window === 'undefined') return null;
  try {
    return parse(new URLSearchParams(window.location.search).get('v'));
  } catch {
    return null;
  }
}

/** Has the visitor chosen yet, whether by link or by the chooser screen? */
export function hasChosenVariant(): boolean {
  if (typeof window === 'undefined') return false;
  if (variantFromUrl()) return true;
  try {
    return parse(window.localStorage.getItem(STORAGE_KEY)) !== null;
  } catch {
    return false;
  }
}

export function readVariant(): DemoVariant {
  if (typeof window === 'undefined') return DEFAULT_VARIANT;
  const fromUrl = variantFromUrl();
  if (fromUrl) return fromUrl;
  try {
    return parse(window.localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_VARIANT;
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
    // Ignore — the ?v= below still carries the choice.
  }
  // Each product has its own routes, so switching has to land on the right
  // root: HOA at `/`, Apartments at `/apartments`. Carrying `?v=` too means
  // the address bar always names what you are looking at, the link is
  // copy-pasteable mid-demo, and it does not depend on localStorage having
  // worked - which it may not have in a private window.
  window.location.href = v === "apartments" ? `/apartments?v=${v}` : `/?v=${v}`;
}

/** The other one. There are exactly two, so switching is a toggle. */
export function otherVariant(v: DemoVariant): DemoVariant {
  return v === 'hoa' ? 'apartments' : 'hoa';
}

export function currentIdentity(): DemoIdentity {
  return DEMO_IDENTITIES[readVariant()];
}
