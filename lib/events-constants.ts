export const EVENT_TYPES = ["conference", "webinar", "workshop", "meeting", "consortium", "other"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export function strOrNull(raw: FormDataEntryValue | null): string | null {
  const s = String(raw ?? "").trim();
  return s || null;
}

export function parseTags(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type EventRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  event_type: EventType;
  start_date: string;
  end_date: string | null;
  is_virtual: boolean;
  location: string | null;
  tags: string[];
  cover_image_url: string | null;
};

// "OCT 15-17 2026" / "OCT 15 2026" — matches the reference design's date badge.
export function formatEventDateBadge(startDate: string, endDate: string | null, locale: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const month = start.toLocaleDateString(locale, { month: "short" }).toUpperCase();
  const year = start.getFullYear();
  if (!endDate) return { month, day: `${start.getDate()}`, year };
  const end = new Date(`${endDate}T00:00:00`);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const day = sameMonth ? `${start.getDate()}-${end.getDate()}` : `${start.getDate()} - ${end.toLocaleDateString(locale, { month: "short", day: "numeric" })}`;
  return { month, day, year };
}
