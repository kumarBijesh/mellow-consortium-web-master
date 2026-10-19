// Shared enums for the /admin/network CRUD pages. Kept in sync with the
// DB check constraints (institutions.region in institutions-geo.sql,
// trials.status in schema.sql) so the admin dropdowns can't submit a
// value Postgres would reject.
export const REGIONS = ["North America", "South America", "Europe", "Africa", "Middle East", "Asia-Pacific"] as const;

export const TRIAL_STATUSES = ["active", "recruiting", "completed", "planned"] as const;

// "Cellular Senescence, Regenerative Medicine" -> ["Cellular Senescence", "Regenerative Medicine"]
export function parseSpecializations(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function numOrNull(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function strOrNull(raw: FormDataEntryValue | null): string | null {
  const s = String(raw ?? "").trim();
  return s || null;
}

// Optional external link that gets rendered as a public href: empty ->
// null, a valid http(s) URL -> itself, anything else -> "invalid" so the
// caller can reject it (never let javascript:/data: URLs through).
export function httpUrlOrNull(raw: FormDataEntryValue | null): string | null | "invalid" {
  const s = strOrNull(raw);
  if (!s) return null;
  try {
    const url = new URL(s);
    return url.protocol === "http:" || url.protocol === "https:" ? s : "invalid";
  } catch {
    return "invalid";
  }
}
