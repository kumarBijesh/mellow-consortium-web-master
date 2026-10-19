// The searchable static marketing pages — content that has real, distinct
// copy but no database row to query (unlike trials/news). Title and
// description are pulled at search time from the same message keys each
// page renders itself, via `namespace`/`descriptionKey`, so a result and
// its destination page always say the same thing in the same language —
// one source of truth instead of a second hardcoded copy that could drift.
export const STATIC_SEARCH_PAGES = [
  { href: "/about", namespace: "About", descriptionKey: "intro" },
  { href: "/mellow-age", namespace: "MellowAge", descriptionKey: "subheading" },
  { href: "/jlive", namespace: "Jlive", descriptionKey: "description" },
  { href: "/conferences", namespace: "Conferences", descriptionKey: "description" },
  { href: "/contact", namespace: "Contact", descriptionKey: "description" },
] as const;
