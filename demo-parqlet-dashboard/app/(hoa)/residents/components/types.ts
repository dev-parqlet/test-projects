"use client";

export type ResidencyType = "Owner" | "Renter";
export type ParqletStatus = "Registered" | "Hasn't Registered";
export type InviteState = "reset" | "sent";

export interface Resident {
  id:               string;
  name:             string;
  phone:            string;
  unitNumber:       string | null;
  parkingSpotNumbers: string | null;
  email:            string;
  buildingId:       string;
  residencyType:    ResidencyType;
  leaseExpiration:  string;
  status: ParqletStatus;
  inviteState: InviteState;
  inviteSentDate?: string;
  registeredDate?: string;
  note?: string | null;
  notes?: { text: string; timestamp: string }[];
  // Revoke-access state (mirror of app/lib/api/residents.ts).
  // When `excludedAt` is set, the resident is hidden from the dashboard list
  // and cannot log in. The super-admin residents page passes isRevoked=true
  // so the three-dot menu shows "Restore access" instead.
  excludedAt?: string | null;
  excludedBy?: string | null;
}