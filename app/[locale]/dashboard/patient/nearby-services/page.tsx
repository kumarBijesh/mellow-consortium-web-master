import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import UseLocationButton from "@/components/patient/UseLocationButton";

// query stays English — it's sent to the Google Maps embed API, not shown
// to the user; the displayed label comes from nearbyServices.categories.*.
const CATEGORIES: { key: string; icon: string; query: string }[] = [
  { key: "clinics", icon: "🏥", query: "clinics" },
  { key: "dietitians", icon: "🥗", query: "dietitians" },
  { key: "yoga", icon: "🧘", query: "yoga centres" },
  { key: "meditation", icon: "🧠", query: "meditation centres" },
  { key: "gym", icon: "🏋️", query: "gyms" },
  { key: "pharmacy", icon: "💊", query: "pharmacies" },
];

// Embed API's search mode reliably renders named result pins for
// place-based text queries ("dietitians in Hauz Khas") but not for raw
// coordinates or a bare category term biased only by `center` — those
// just fall back to the generic landmark/POI layer with no labeled
// matches. Reverse-geocoding to a real locality name first and building
// "{category} in {locality}" is what actually produces the pinned,
// labeled results the design calls for.
const resolveLocality = cache(async function resolveLocality(lat: number, lng: number, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();
    if (data.status !== "OK" || !data.results?.length) return null;
    const components = data.results[0].address_components as { long_name: string; types: string[] }[];
    const pick = (type: string) => components.find((c) => c.types.includes(type))?.long_name;
    return pick("sublocality") ?? pick("neighborhood") ?? pick("locality") ?? null;
  } catch {
    return null;
  }
});

export default async function NearbyServicesPage({
  searchParams,
}: {
  searchParams: { lat?: string; lng?: string; category?: string };
}) {
  const t = await getTranslations("PatientDashboard.pages.nearbyServices");
  const lat = searchParams.lat ? Number(searchParams.lat) : null;
  const lng = searchParams.lng ? Number(searchParams.lng) : null;
  const hasLocation = lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng);
  const activeCategory = CATEGORIES.find((c) => c.key === searchParams.category) ?? CATEGORIES[0];

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const locality = hasLocation && apiKey ? await resolveLocality(lat!, lng!, apiKey) : null;
  const locationText = locality ?? (hasLocation ? `${lat},${lng}` : "");
  const searchText = `${activeCategory.query} in ${locationText}`;

  const embedSrc =
    hasLocation && apiKey
      ? `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${encodeURIComponent(searchText)}&zoom=13`
      : null;
  // The formal "Maps URLs" API (maps/search/?api=1&query=...) has no
  // viewport param, so use the plain browser URL scheme Google Maps
  // itself generates for "search X while viewing Y" instead.
  const openInMapsHref = hasLocation
    ? `https://www.google.com/maps/search/${encodeURIComponent(activeCategory.query)}/@${lat},${lng},15z`
    : null;

  function categoryHref(key: string) {
    const params = new URLSearchParams();
    if (hasLocation) {
      params.set("lat", String(lat));
      params.set("lng", String(lng));
    }
    params.set("category", key);
    return `/dashboard/patient/nearby-services?${params.toString()}`;
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h1 className="text-[26px] text-navy dark:text-white mb-1">{t("title")}</h1>
          <p className="text-muted dark:text-white/60 text-[14.5px]">{t("subtitle")}</p>
        </div>
        <UseLocationButton />
      </div>

      {hasLocation && (
        <p className="text-[13.5px] text-muted dark:text-white/60 mt-4">
          📍 {t("locationFound", { lat: lat!.toFixed(3), lng: lng!.toFixed(3) })}
        </p>
      )}

      <div className="flex flex-wrap gap-2.5 mt-6 mb-8">
        {CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={categoryHref(c.key)}
            className={`text-[13.5px] font-semibold px-4 py-2 rounded-full border transition ${
              c.key === activeCategory.key
                ? "bg-navy text-white border-navy"
                : "bg-white dark:bg-white/[0.03] text-navy dark:text-white border-line dark:border-white/10 hover:border-blue"
            }`}
          >
            <span className="me-1.5">{c.icon}</span>
            {t(`categories.${c.key}`)}
          </Link>
        ))}
      </div>

      {!hasLocation ? (
        <div className="rounded-[14px] border border-line dark:border-white/10 p-10 text-center max-w-[480px]">
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.12em] text-blue mb-3">{t("notConnected")}</span>
          <h2 className="text-[17px] font-display font-bold text-navy dark:text-white mb-2.5">{t("shareLocationHeading")}</h2>
          <p className="text-[13.5px] text-muted dark:text-white/60 leading-relaxed">
            {t("shareLocationBody", { category: t(`categories.${activeCategory.key}`).toLowerCase() })}
          </p>
        </div>
      ) : !apiKey ? (
        <div className="rounded-[14px] border border-line dark:border-white/10 p-10 text-center max-w-[480px]">
          <p className="text-[13.5px] text-muted dark:text-white/60 leading-relaxed">
            {t("mapsNotConfigured", { envVar: "GOOGLE_MAPS_API_KEY" })}
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-[16px] font-display font-bold text-navy dark:text-white">
                <span className="me-1.5">{activeCategory.icon}</span>
                {t(`categories.${activeCategory.key}`)} {t("near")}
              </h2>
              <p className="text-[13px] text-muted dark:text-white/60 mt-0.5">{t("liveResults")}</p>
            </div>
            <a href={openInMapsHref!} target="_blank" rel="noopener noreferrer" className="btn-primary !px-4 !py-2.5 text-[13.5px] whitespace-nowrap">
              {t("openInGoogleMaps")}
            </a>
          </div>
          <div className="rounded-card overflow-hidden border border-line dark:border-white/10">
            <iframe
              key={embedSrc}
              src={embedSrc!}
              width="100%"
              height="520"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`${t(`categories.${activeCategory.key}`)} ${t("near")}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
