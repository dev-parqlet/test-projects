/**
 * Shared helpers for the localhost-only dev auth mock.
 *
 * `isDevAuthEnabled` gates the auto-login + DevAuthSwitcher behind localhost
 * AND an opt-out env flag. Auto-login stays on by default (backward compatible
 * with the designer mock workflow); set NEXT_PUBLIC_DEV_AUTH_ENABLED=false in
 * .env.local to disable it and use the real backend session instead.
 *
 * `DEV_SIGNED_OUT` is the sentinel value stored in `localStorage["dev_mock_user"]`
 * when the developer has explicitly signed out via DevAuthSwitcher. Both the
 * switcher (writer) and AuthProvider (reader) import this constant so the two
 * sides can never drift.
 */

/**
 * Whether the dev auth switcher / auto-login is active.
 *
 * Gated on localhost AND an opt-out env flag. Auto-login stays on by default
 * (backward compatible with the designer mock workflow); set
 * NEXT_PUBLIC_DEV_AUTH_ENABLED=false in .env.local to disable it and use the
 * real backend session instead.
 */
export function isDevAuthEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.hostname !== "localhost") return false;
  return process.env.NEXT_PUBLIC_DEV_AUTH_ENABLED !== "false";
}

export const DEV_SIGNED_OUT = "__signed_out__";
