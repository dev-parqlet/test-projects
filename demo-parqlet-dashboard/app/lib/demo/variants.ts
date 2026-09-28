/**
 * The two dashboards this demo site shows.
 *
 * demo.parqlet.com exists to be shown to a prospect, so it has to present
 * BOTH products: the Condo dashboard that exists today, and the Apartment
 * dashboard. Each lives at its own URL - /condo and /apartment - because a
 * link is how a demo is sent, and the link has to say which product it
 * opens. There is no sign-in, and no real account behind either.
 *
 * Both identities are `admin`, never `super_admin`: the super-admin console
 * is an internal tool and showing it would misrepresent what a client buys.
 *
 * The building ids are real entries in app/lib/mock-data/buildings.json. If
 * one is ever changed there without being changed here, every
 * building-scoped screen silently renders empty, because the mock API
 * filters on exactly these ids.
 */

import { APARTMENT_PREFIX, CONDO_PREFIX, productFromPath } from './product-path';

export type DemoVariant = 'condo' | 'apartment';

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

const CONDO_BUILDING = {
  id: 'e6565d1b-1f25-4c51-bfa6-7db4932702cd',
  name: 'The Meridian',
};

const APARTMENT_BUILDING = {
  id: '80f9ac2e-b884-4634-ac02-0682a9a12662',
  name: 'Oakline Park',
};

export const DEMO_IDENTITIES: Record<DemoVariant, DemoIdentity> = {
  condo: {
    variant: 'condo',
    label: 'Condo — The Meridian',
    blurb: 'Residents share their own spots. Everything costs 1 credit.',
    user: {
      id: '11111111-2222-4333-8444-555555555555',
      name: 'Sarah Johnson',
      email: 'sarah@themeridian.com',
      role: 'admin',
      buildingId: CONDO_BUILDING.id,
      buildingIds: [CONDO_BUILDING.id],
      buildings: [CONDO_BUILDING],
      phone: '+1 (555) 100-0003',
      createdAt: '2026-05-15T06:55:06.103Z',
    },
  },
  apartment: {
    variant: 'apartment',
    label: 'Apartment — Oakline Park',
    blurb: 'The building owns some spots and can charge extra on those. Everything else is 1 credit.',
    user: {
      id: '66666666-7777-4888-8999-000000000000',
      name: 'Daniel Reyes',
      email: 'daniel@oaklinepark.com',
      role: 'admin',
      buildingId: APARTMENT_BUILDING.id,
      buildingIds: [APARTMENT_BUILDING.id],
      buildings: [APARTMENT_BUILDING],
      phone: '+1 (555) 200-0007',
      createdAt: '2026-04-02T09:12:00.000Z',
    },
  },
};

export const DEFAULT_VARIANT: DemoVariant = 'condo';

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
  if (k === 'apartment' || k === 'apartments' || k === 'apt') return 'apartment';
  if (k === 'condo' || k === 'condos' || k === 'hoa') return 'condo';
  return null;
}

/**
 * The variant named by the URL, e.g. demo.parqlet.com/apartment/spots.
 *
 * The PATH is the source of truth. This is how a link is sent to a specific
 * prospect: an apartment operator opens the Apartment dashboard and stays
 * in it, because every link in that nav is prefixed too and there is no
 * control anywhere that crosses over.
 *
 * `?v=` is still read, but only as a fallback, so the links already sent
 * out before the paths existed keep working.
 */
export function variantFromUrl(): DemoVariant | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromPath = productFromPath(window.location.pathname);
    if (fromPath) return fromPath;
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
 * Open a product. A full page load rather than a client navigation on
 * purpose: every screen caches building-scoped data through react-query,
 * and swapping the identity underneath them would leave one building's
 * bookings next to another's residents for a few seconds — in front of a
 * prospect, that reads as a bug.
 *
 * Only the front door calls this. There is no switcher in the header: a
 * prospect sent the Condo link should never find themselves in the
 * Apartment dashboard, and a control that does that is a control that will
 * eventually be clicked during a call.
 */
export function setVariant(v: DemoVariant): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, v);
  } catch {
    // Ignore — the path carries the choice on its own.
  }
  window.location.href = pathForVariant(v);
}

/**
 * The path a variant lives at: /condo or /apartment. The prefix IS the
 * identity, so nothing needs to be appended to carry it.
 */
export function pathForVariant(v: DemoVariant): string {
  return v === 'apartment' ? APARTMENT_PREFIX : CONDO_PREFIX;
}

/**
 * The link you send a prospect.
 *
 * Absolute, and built from the browser's own origin rather than a
 * hard-coded demo.parqlet.com, so a link copied from a preview
 * deployment or from localhost points at the site it was copied from. A
 * link that silently retargets production is worse than no link.
 */
export function shareUrl(v: DemoVariant): string {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return `${origin}${pathForVariant(v)}`;
}

/** The other one. There are exactly two. */
export function otherVariant(v: DemoVariant): DemoVariant {
  return v === 'condo' ? 'apartment' : 'condo';
}

export function currentIdentity(): DemoIdentity {
  return DEMO_IDENTITIES[readVariant()];
}
