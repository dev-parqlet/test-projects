/**
 * The demo's one clock anchor, shared by everything that slides mock
 * dates forward.
 *
 * Its own module rather than inside handle-request.ts because that file
 * is "use server": every export of a "use server" module is a Server
 * Action and must be async, so a plain synchronous helper cannot be
 * exported from it - the production build refuses with "Server Actions
 * must be async functions". Moved 2026-11-06 when storage needed it too.
 */

/**
 * The day every mock JSON file is written to be correct on.
 *
 * The demo is shown for months from a fixed corpus, and a fixed corpus has
 * a shelf life: this one was a production dump taken in May and by late
 * September every ticket, invoice and sync log on screen was four months
 * old. Nobody notices while editing the data; every prospect notices when
 * the newest support ticket predates the meeting by a season.
 *
 * So dates are not served as written. Everything is shifted forward by the
 * whole number of days between this epoch and today, which keeps the
 * corpus exactly as internally consistent as it was authored - an invoice
 * still lands a month before the next renewal - while the whole thing
 * stays anchored to now.
 *
 * EVERY mock file must be authored against this one date. Two anchors
 * cannot both survive a single shift.
 */
export const DEMO_EPOCH = Date.UTC(2026, 8, 28); // 2026-09-28

/** Whole days from the epoch to today. Never negative. */
export function demoDayShift(now = new Date()): number {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.round((today - DEMO_EPOCH) / 86_400_000));
}
