/**
 * The three storage claims the demo shows, and the ONE place they live.
 *
 * ─── WHY THIS IS SHARED ─────────────────────────────────────────────
 *
 * A storage claim is visible on two screens: the Storage approval tab
 * and the Storage # column of the Resident directory. They are two
 * views of one queue, so a claim that reads "#22, Unit 1604, Mia
 * Thompson" on one and "#22, Unit 1E, Mason Harris" on the other is
 * not a cosmetic mismatch - it tells a prospect clicking between the
 * two tabs that the dashboard does not know who owns what.
 *
 * That is exactly what happened: this file used to be a standalone
 * list of invented people (units 1207/1604/2305, which do not exist in
 * The Meridian), while the directory stamped different numbers onto
 * whichever three residents the API happened to return first. Now the
 * claims are positional - number, type and state only - and BOTH
 * screens attach them to the first three residents of the same list.
 *
 * A resident typed the number of the locker they believe is theirs,
 * and nothing the app holds proves it: parking spots arrive from the
 * lease sync, storage units do not. So the office confirms against its
 * own records before a neighbour can see or request it.
 *
 * The three deliberately differ in TYPE and in STATE - two waiting,
 * one already confirmed - because a table where every row is a pending
 * "Storage cage" demonstrates nothing about what the columns are for.
 *
 * Demo data. The real queue is `GET /api/building-storage/approvals`,
 * which reads the `extras.approval` flag on `spot_details`.
 */

/** A claim the office has not answered yet, or one it already has. */
export type DemoStorageClaimState = "pending" | "approved";

/** What the demo asserts about a claim, independent of who holds it. */
export type DemoStorageClaim = {
  storageNumber: string;
  storageType: string;
  state: DemoStorageClaimState;
};

/**
 * By POSITION, not by person. The directory is sorted and filtered, so
 * pinning these to particular residents would push the icons onto page
 * three the moment somebody sorts by unit - and the point is that one
 * link shows all three states at once.
 */
export const DEMO_STORAGE_CLAIMS: DemoStorageClaim[] = [
  { storageNumber: "1", storageType: "Storage cage", state: "pending" },
  { storageNumber: "22", storageType: "Locker", state: "pending" },
  { storageNumber: "17", storageType: "Over-spot cabinets", state: "approved" },
];

/** A claim once it has been attached to the resident making it. */
export type DemoStorageApproval = DemoStorageClaim & {
  id: string;
  unitNumber: string;
  residentName: string;
  residentPhone: string;
};

/** The shape both screens can supply: the directory row, loosely typed. */
type ClaimHolder = {
  id?: string | null;
  name?: string | null;
  unit?: string | null;
  unitNumber?: string | null;
  phone?: string | null;
};

/**
 * Zip the first three residents of a list onto the three claims.
 *
 * Fed the same `/api/residents` first page the directory renders, so
 * the two screens name the same people by construction rather than by
 * two lists being kept in step by hand.
 */
export function buildStorageApprovals(residents: ClaimHolder[]): DemoStorageApproval[] {
  return DEMO_STORAGE_CLAIMS.flatMap((claim, i) => {
    const r = residents[i];
    if (!r) return [];
    return [{
      ...claim,
      id: r.id ?? `demo-storage-claim-${i}`,
      unitNumber: r.unitNumber ?? r.unit ?? "",
      residentName: r.name ?? "",
      residentPhone: r.phone ?? "",
    }];
  });
}
