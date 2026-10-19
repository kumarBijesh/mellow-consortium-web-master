import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PERSONAS, type PersonaType } from "@/lib/personas";

const ICONS: Record<PersonaType, JSX.Element> = {
  biotech_company: (
    <path d="M3 21h18M6 21V8l6-4 6 4v13M10 12h4M10 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  ),
  clinical_investigator: (
    <path d="M12 3v6m0 0a3 3 0 100 6 3 3 0 000-6zM7 21c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  ),
  academic_institution: (
    <path d="M4 20h16M6 20V9l6-3 6 3v11M9 13h6M9 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  ),
  individual: (
    <>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  healthcare_provider: (
    <>
      <path d="M12 3a4 4 0 014 4v2a4 4 0 01-8 0V7a4 4 0 014-4zM4 21c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 6l1.5 1.5L22 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  hospital_wellness_group: (
    <path d="M4 21V7l5-3 5 3v14M14 21V11l6 3v7M4 21h18M8 10h1M8 14h1" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  ),
  journal_conference_partner: (
    <>
      <path d="M6 3h9l3 3v15H6zM9 3v14h9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 8h6M9 11h6M9 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
};

export default async function PersonaPicker() {
  const t = await getTranslations("PersonaPicker");
  const tPersonas = await getTranslations("Personas");

  return (
    <section className="py-24">
      <div className="wrap">
        <div className="text-center max-w-[620px] mx-auto mb-12">
          <span className="mkt-eyebrow-2 justify-center">{t("eyebrow")}</span>
          <h2 className="text-[32px] mt-4 text-richblack dark:text-white font-brand">{t("heading")}</h2>
          <p className="text-muted dark:text-white/60 text-[15px] mt-3.5">{t("description")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PERSONAS.map((p) => (
            <Link
              key={p.type}
              href={`/apply/${p.type}`}
              className="group relative rounded-card border border-line dark:border-white/10 p-[22px] bg-white dark:bg-white/[0.03] overflow-hidden hover:-translate-y-1 hover:shadow-card-green-sm dark:shadow-none dark:ring-1 dark:ring-white/[0.08] transition"
            >
              <span className="absolute start-0 top-0 bottom-0 w-1 bg-meadow scale-y-0 origin-top transition-transform group-hover:scale-y-100" />
              <div className="w-11 h-11 rounded-[11px] bg-flashwhite dark:bg-meadow/[0.08] text-forest dark:text-meadow grid place-items-center mb-3.5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  {ICONS[p.type]}
                </svg>
              </div>
              <h4 className="text-[15.5px] text-richblack dark:text-white font-semibold">{tPersonas(`${p.type}.label`)}</h4>
              <p className="text-muted dark:text-white/60 text-[13.5px] mt-1.5">{tPersonas(`${p.type}.description`)}</p>
              <div className="font-brand text-[13px] font-bold text-forest dark:text-meadow flex items-center gap-1.5 mt-3.5">
                {tPersonas(`${p.type}.pathway`)} <span className="inline-block rtl:-scale-x-100">→</span>
              </div>
            </Link>
          ))}
          <Link
            href="/apply/individual"
            className="group relative rounded-card border border-line dark:border-white/10 p-[22px] bg-white dark:bg-white/[0.03] overflow-hidden hover:-translate-y-1 hover:shadow-card-green-sm dark:shadow-none dark:ring-1 dark:ring-white/[0.08] transition"
          >
            <span className="absolute start-0 top-0 bottom-0 w-1 bg-meadow scale-y-0 origin-top transition-transform group-hover:scale-y-100" />
            <div className="w-11 h-11 rounded-[11px] bg-flashwhite dark:bg-meadow/[0.08] text-forest dark:text-meadow grid place-items-center mb-3.5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </div>
            <h4 className="text-[15.5px] text-richblack dark:text-white font-semibold">{t("notSure.title")}</h4>
            <p className="text-muted dark:text-white/60 text-[13.5px] mt-1.5">{t("notSure.description")}</p>
            <div className="font-brand text-[13px] font-bold text-forest dark:text-meadow flex items-center gap-1.5 mt-3.5">
              {t("notSure.cta")} <span className="inline-block rtl:-scale-x-100">→</span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
