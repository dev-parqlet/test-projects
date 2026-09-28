// Design tokens used across chart components
export const colors = {
  sidebarBg:        "var(--color-primary-strong)",
  sidebarBorder:    "var(--color-gray-90)",
  sidebarItemActive:"var(--color-gray-90)",
  sidebarTextActive:"var(--color-text-accent)",
  sidebarText:      "var(--color-text-weaker)",
  mainBg:           "var(--color-fill-weak)",
  white:            "var(--color-fill-white)",
  border:           "var(--color-stroke-medium)",
  textStrong:       "var(--color-text-strong)",
  textWeak:         "var(--color-text-weak)",
  tagBg:            "var(--color-fill-weak)",
  tagActive:        "var(--color-tag-active)",
  tagUpcoming:      "var(--color-tag-upcoming)",
  chartBar:         "var(--color-accent-1000)",
  headerBorder:     "var(--color-stroke-medium)",
};

// --- Chart data -----------------------------------------------------------

export interface ChartPoint {
  day: string;
  value: number;
  /**
   * Of `value`, how many were on a spot a RESIDENT lent. Drawn as the
   * lower, darker part of the bar. Undefined where the split means
   * nothing - a Condo's residents own every spot - and the bar is then a
   * single colour.
   */
  neighbor?: number;
}

export const weekData: ChartPoint[] = [
  { day: "Mon", value: 38 },
  { day: "Tue", value: 12 },
  { day: "Wed", value: 26 },
  { day: "Thu", value: 33 },
  { day: "Fri", value: 50 },
  { day: "Sat", value: 42 },
  { day: "Sun", value: 12 },
];

export const monthData: ChartPoint[] = [
  { day: "W1", value: 85 },
  { day: "W2", value: 112 },
  { day: "W3", value: 98 },
  { day: "W4", value: 134 },
  { day: "W5", value: 47 },
];

// --- Chart helpers ---------------------------------------------------------

export function computeYLabels(maxVal: number): number[] {
  const step = maxVal <= 80 ? 20 : maxVal <= 200 ? 50 : 100;
  const top = Math.ceil(maxVal / step) * step;
  const labels: number[] = [];
  for (let v = top; v >= 0; v -= step) labels.push(v);
  return labels;
}

export function avg(data: ChartPoint[]): number {
  if (data.length === 0) return 0;
  return Math.round(data.reduce((s, d) => s + d.value, 0) / data.length);
}

// Parses a bare "YYYY-MM-DD" (from an <input type="date">) as a LOCAL
// calendar date. `new Date("YYYY-MM-DD")` parses as UTC midnight instead —
// for any timezone behind UTC (every US zone) that reads back one day
// earlier once `.getDay()`/`.getDate()` are called in local time, shifting
// every day label in the custom range by one versus what was actually
// picked.
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Minimal shape `generateCustomData` needs from a booking — kept
 *  structural rather than importing the dashboard's `ApiBooking` type so
 *  this stays a generic chart utility. */
interface BookingLike {
  bookingStartIso: string;
}

export function generateCustomData(
  from: string,
  to: string,
  bookings: BookingLike[]
): ChartPoint[] {
  if (!from || !to) return [];
  const start = parseLocalDate(from);
  const end = parseLocalDate(to);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return [];
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (days <= 0) return [];
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const countOnDay = (dayDate: Date) =>
    bookings.filter((b) => {
      const d = new Date(b.bookingStartIso);
      return !isNaN(d.getTime()) && d.toDateString() === dayDate.toDateString();
    }).length;

  if (days <= 14) {
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const label = days <= 7
        ? DAY_NAMES[d.getDay()]
        : `${d.getMonth() + 1}/${d.getDate()}`;
      return { day: label, value: countOnDay(d) };
    });
  }

  const weeks = Math.min(Math.ceil(days / 7), 8);
  return Array.from({ length: weeks }, (_, i) => {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const value = bookings.filter((b) => {
      const bd = new Date(b.bookingStartIso);
      return !isNaN(bd.getTime()) && bd >= weekStart && bd <= weekEnd;
    }).length;
    return { day: `W${i + 1}`, value };
  });
}

// Default custom range: last 7 days
export function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
}

export function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}