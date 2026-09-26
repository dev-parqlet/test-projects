/**
 * Compares two names ignoring any leading non-alphanumeric characters
 * (quotes, asterisks, backticks, etc.) so e.g. `"Shawn" Xiaoran Dong` sorts
 * next to other "S" names instead of jumping to the very top of the list.
 *
 * Frontend-only fix: the residents list is server-paginated, so this only
 * reorders whichever rows are already on the current page — a resident
 * whose name starts with a symbol can still land on the "wrong" page,
 * since the backend's SQL ORDER BY (which decides the page cut) doesn't
 * apply this same normalization. Fixing that fully requires the same
 * normalization server-side.
 */
export function compareNamesIgnoringLeadingSymbols(a: string, b: string): number {
  const strip = (s: string) => s.replace(/^[^a-zA-Z0-9]+/, "");
  return strip(a).localeCompare(strip(b), undefined, { sensitivity: "base" });
}
