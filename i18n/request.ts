import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  // Split into two files per locale so the public-site namespaces
  // (messages/<locale>.json) and the dashboard namespaces
  // (messages/dashboards/<locale>.json) can be worked on independently
  // without both sides editing the same JSON file.
  const [siteMessages, dashboardMessages] = await Promise.all([
    import(`../messages/${locale}.json`).then((m) => m.default),
    import(`../messages/dashboards/${locale}.json`).then((m) => m.default),
  ]);

  return {
    locale,
    messages: { ...siteMessages, ...dashboardMessages },
  };
});
