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

/**
 * Axis labels that fit the data, top down.
 *
 * The step used to start at 20 whatever the numbers were, which suited the
 * mock series this was written against (12 to 50) and nothing else: a week
 * whose busiest day saw 7 bookings got an axis running to 20, so the
 * tallest bar reached a third of the height and the chart read as a flat
 * line under a lot of white.
 *
 * So the step is chosen from a ladder of round numbers - the smallest that
 * keeps the axis to about four intervals. A quiet week now fills the chart
 * the same way a busy one does, and the labels stay numbers a person would
 * have picked.
 */
const AXIS_STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
const AXIS_INTERVALS = 4;

export function computeYLabels(maxVal: number): number[] {
  // An all-zero series still needs an axis, or the bars divide by zero.
  const safeMax = Math.max(1, Math.ceil(maxVal));
  const step =
    AXIS_STEPS.find((s) => safeMax / s <= AXIS_INTERVALS) ??
    Math.ceil(safeMax / AXIS_INTERVALS);
  const top = Math.ceil(safeMax / step) * step;
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
  /** Set when the spot belongs to a RESIDENT rather than the building.
   *  Same predicate the Week and Month series use for their split. */
  spotOwnerName?: string | null;
}

/**
 * The most bars a custom range is drawn with.
 *
 * Past this the buckets get WIDER rather than the range getting shorter.
 * It used to cap at 8 weekly buckets and simply stop, so a range longer
 * than 56 days was drawn as its first 56 days with nothing to say the
 * rest existed - the axis claimed to show the range the user picked and
 * did not.
 */
const MAX_CUSTOM_BARS = 12;

export function generateCustomData(
  from: string,
  to: string,
  bookings: BookingLike[],
  splitBySpotKind = false,
  /**
   * What a bucket of bookings is worth. Counting them is the default; the
   * Earnings metric sums what each one made instead. Passed in rather than
   * branched on here so this stays a generic chart utility that knows
   * nothing about money.
   */
  measure: (rows: BookingLike[]) => number = (rows) => rows.length,
): ChartPoint[] {
  if (!from || !to) return [];
  const start = parseLocalDate(from);
  const end = parseLocalDate(to);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return [];
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (days <= 0) return [];
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  /** Bookings that START inside [a, b] — b is exclusive. */
  const inWindow = (a: Date, b: Date) =>
    bookings.filter((bk) => {
      const d = new Date(bk.bookingStartIso);
      return !isNaN(d.getTime()) && d >= a && d < b;
    });

  // The split is computed the same way for every tab, or a bar would
  // change meaning when the user switched range.
  const point = (label: string, rows: BookingLike[]): ChartPoint => ({
    day: label,
    value: measure(rows),
    neighbor: splitBySpotKind
      ? measure(rows.filter((b) => b.spotOwnerName))
      : undefined,
  });

  if (days <= 14) {
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const label = days <= 7
        ? DAY_NAMES[d.getDay()]
        : `${d.getMonth() + 1}/${d.getDate()}`;
      return point(label, inWindow(d, next));
    });
  }

  // Bucket width is chosen so the buckets COVER the range, rather than
  // the count being fixed and the tail dropped.
  const bucketDays = Math.max(7, Math.ceil(days / MAX_CUSTOM_BARS));
  const buckets = Math.ceil(days / bucketDays);

  // One past the last day the user picked. The final bucket is CLAMPED to
  // it: `days` is rarely a whole number of buckets, so without this the
  // last bar reaches past the range and counts bookings from after the
  // end date - 30 days in weekly buckets would report 35 days of them.
  const rangeEnd = new Date(start);
  rangeEnd.setDate(start.getDate() + days);

  return Array.from({ length: buckets }, (_, i) => {
    const bucketStart = new Date(start);
    bucketStart.setDate(start.getDate() + i * bucketDays);
    const bucketEnd = new Date(bucketStart);
    bucketEnd.setDate(bucketStart.getDate() + bucketDays);
    if (bucketEnd > rangeEnd) bucketEnd.setTime(rangeEnd.getTime());

    // Whole weeks keep the familiar W1..Wn. Anything wider is labelled by
    // the date it starts, because "W1" over a 19-day bucket would be a
    // lie about what the bar covers.
    const label =
      bucketDays === 7
        ? `W${i + 1}`
        : `${bucketStart.getMonth() + 1}/${bucketStart.getDate()}`;
    return point(label, inWindow(bucketStart, bucketEnd));
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