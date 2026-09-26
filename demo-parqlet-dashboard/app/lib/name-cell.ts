// Shared sizing for every "name + phone icon" table cell across the app
// (Bookings' Resident Name/Spot Owner/Guest Name, Resident Directory/Super
// Admin Residents' Resident Name). Kept in one place so a width change
// only needs to happen once instead of drifting between tables.
export const NAME_TEXT_WIDTH = 150;
// Column width needs headroom beyond the name text itself for the phone
// icon + gap + a little padding.
export const NAME_COLUMN_WIDTH = "0 0 190px";
