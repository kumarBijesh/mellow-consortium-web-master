export const SALUTATIONS = ["Dr.", "Prof.", "Mr.", "Mrs.", "Ms.", "Mx."] as const;

export const ACCESS_TIERS = ["PI", "Sponsor", "KOL"] as const;

export type Salutation = (typeof SALUTATIONS)[number];
export type AccessTier = (typeof ACCESS_TIERS)[number];

export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const CV_MAX_BYTES = 10 * 1024 * 1024;

export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// "Cellular Senescence, Regenerative Medicine" -> ["Cellular Senescence", "Regenerative Medicine"]
export function splitCommaList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// One publication per line -> string[]
export function splitLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}
