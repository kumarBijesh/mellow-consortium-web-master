import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export const metadata = { title: "Sign In" };

// Door label/CTA copy is the same "Choose how you're joining" spec already
// built and translated for the MELLOW-Age sign-in section (MellowAge.doors)
// — reused here verbatim so the two entry points never drift out of sync.
const DOOR_KEYS = ["patient", "provider", "hospital", "admin"] as const;
const DOOR_HREFS = ["/signin", "/provider/login", "/hospital/login", "/admin/login"] as const;
const DOOR_ICONS = [
  <>
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </>,
  <>
    <path d="M12 3a4 4 0 014 4v2a4 4 0 01-8 0V7a4 4 0 014-4zM4 21c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M18 6l1.5 1.5L22 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </>,
  <path d="M4 21V7l5-3 5 3v14M14 21V11l6 3v7M4 21h18M8 10h1M8 14h1" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
  <>
    <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </>,
];

export default async function AccessPage() {
  const t = await getTranslations("Access");
  const tDoors = await getTranslations("MellowAge.doors");

  return (
    <main className="py-24">
      <div className="wrap">
        <div className="text-center max-w-[620px] mx-auto mb-12">
          <span className="eyebrow justify-center">{t("eyebrow")}</span>
          <h1 className="text-[32px] mt-4 text-navy dark:text-white">{t("heading")}</h1>
          <p className="text-muted dark:text-white/60 text-[15px] mt-3.5">{t("subheading")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[980px] mx-auto">
          {DOOR_KEYS.map((key, i) => (
            <Link
              key={key}
              href={DOOR_HREFS[i]}
              className="group relative rounded-card border border-line dark:border-white/10 p-[22px] bg-white dark:bg-white/[0.03] overflow-hidden hover:-translate-y-1 hover:shadow-card-sm dark:shadow-none dark:ring-1 dark:ring-white/[0.08] transition"
            >
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue scale-y-0 origin-top transition-transform group-hover:scale-y-100" />
              <div className="w-11 h-11 rounded-[11px] bg-lightblue dark:bg-teal/[0.08] text-blue grid place-items-center mb-3.5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  {DOOR_ICONS[i]}
                </svg>
              </div>
              <h4 className="text-[15.5px] text-navy dark:text-white font-semibold">{tDoors(`${key}.label`)}</h4>
              <div className="font-display text-[13px] font-bold text-blue flex items-center gap-1.5 mt-3.5">
                {tDoors(`${key}.cta`)} <span className="inline-block rtl:-scale-x-100">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
