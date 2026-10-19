import { defineRouting } from "next-intl/routing";

// Locale metadata used across the app (language switcher labels, <html
// dir=...> on the RTL locale, etc.) — kept next to `routing` so adding a
// locale is a one-place change plus a messages/<locale>.json file.
export const LOCALE_META = {
  en: { label: "English", nativeLabel: "English", dir: "ltr" },
  hi: { label: "Hindi", nativeLabel: "हिन्दी", dir: "ltr" },
  ar: { label: "Arabic", nativeLabel: "العربية", dir: "rtl" },
  fr: { label: "French", nativeLabel: "Français", dir: "ltr" },
  es: { label: "Spanish", nativeLabel: "Español", dir: "ltr" },
  de: { label: "German", nativeLabel: "Deutsch", dir: "ltr" },
} as const;

export const routing = defineRouting({
  locales: Object.keys(LOCALE_META) as (keyof typeof LOCALE_META)[],
  defaultLocale: "en",
  // Every locale gets an explicit, indexable prefix (/en/..., /ar/...) —
  // including the default. "as-needed" (bare "/" for English) is the more
  // common choice, but it makes the current locale ambiguous from the URL
  // alone, which we rely on in a few places (middleware role-gating,
  // hreflang tags later). Explicit prefixes cost one redirect on "/" and
  // buy that back everywhere else.
  localePrefix: "always",
  localeCookie: {
    // Read by the language switcher and by returning visitors — persists
    // the choice independent of Accept-Language.
    name: "MELLOW_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
  },
});

export type AppLocale = (typeof routing.locales)[number];
