// Destinations that leave the MELLOW site entirely. Render these with a
// plain <a target="_blank"> (see isExternalHref), never next-intl's Link,
// which would prefix them with a locale.
export const JLIVE_URL = "https://www.jlivejournals.com/";

export function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
}
