/**
 * Storage units residents have CLAIMED, waiting on the office.
 *
 * A resident types the number of the locker they believe is theirs,
 * and nothing the app holds proves it - parking spots arrive from the
 * lease sync, storage units do not. So the office confirms against its
 * own records before a neighbour can see or request it.
 *
 * Demo data. The real queue is `GET /api/building-storage/approvals`,
 * which reads the `extras.approval` flag on `spot_details`.
 *
 * Three rows, matching the design, and deliberately three DIFFERENT
 * storage types: the table's job is to let somebody check a claim
 * against their own records, and a column where every value is
 * "Storage cage" demonstrates nothing about whether that column earns
 * its place.
 */
export type DemoStorageApproval = {
  id: string;
  unitNumber: string;
  residentName: string;
  residentPhone: string;
  storageNumber: string;
  storageType: string;
};

export const DEMO_STORAGE_APPROVALS: DemoStorageApproval[] = [
  {
    id: "demo-storage-approval-1",
    unitNumber: "1207",
    residentName: "Oliver Johnson",
    residentPhone: "+15555550148",
    storageNumber: "#48",
    storageType: "Storage cage",
  },
  {
    id: "demo-storage-approval-2",
    unitNumber: "1604",
    residentName: "Mia Thompson",
    residentPhone: "+15555550162",
    storageNumber: "#22",
    storageType: "Locker",
  },
  {
    id: "demo-storage-approval-3",
    unitNumber: "2305",
    residentName: "Sophia Carter",
    residentPhone: "+15555550179",
    storageNumber: "#34",
    storageType: "Over-spot cabinets",
  },
];
