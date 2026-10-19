// Keep in sync with `images.remotePatterns` in next.config.mjs. CMS-editable
// fields (e.g. news post cover image URL) are free-text — an admin pasting a
// non-image or unconfigured-host URL there must not crash next/image and take
// the whole page down for every visitor. Gate rendering on this check first.
const ALLOWED_IMAGE_HOSTS = [/(^|\.)supabase\.co$/];

export function isRenderableImageUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  return ALLOWED_IMAGE_HOSTS.some((pattern) => pattern.test(parsed.hostname));
}
