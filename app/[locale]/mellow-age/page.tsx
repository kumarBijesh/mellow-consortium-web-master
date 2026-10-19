import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/motion/Reveal";

export const metadata = { title: "MELLOW-Age" };

const STEP_KEYS = ["step1", "step2", "step3", "step4"] as const;
// Planned domain-specific scores. None exist in the product yet, so this
// section is framed as a roadmap: keep it that way until each one ships.
const ROADMAP_KEYS = [
  "gutPermeability",
  "microbiome",
  "inflammation",
  "cognitive",
  "epigenetic",
  "metabolic",
  "cardiovascular",
  "aiCoach",
] as const;
const WHO_ITS_FOR_KEYS = ["individuals", "providers", "hospitals"] as const;
const DOOR_KEYS = ["patient", "provider", "hospital", "admin"] as const;
const DOOR_HREFS = ["/signin", "/provider/login", "/hospital/login", "/admin/login"] as const;

export default async function MellowAgePage() {
  const t = await getTranslations("MellowAge");

  return (
    <main>
      <section className="py-24 bg-lightblue/50 dark:bg-teal/[0.06]">
        <div className="wrap max-w-[680px]">
          <Reveal>
            <span className="eyebrow">{t("eyebrow")}</span>
            <h1 className="text-[38px] sm:text-[46px] mt-4 mb-4 text-navy dark:text-white leading-tight">{t("heading")}</h1>
            <p className="text-muted dark:text-white/70 text-[17px] leading-relaxed mb-8">{t("subheading")}</p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/signup" className="btn-primary">
                {t("ctaGetStarted")}
              </Link>
              <Link href="/signin" className="btn-secondary">
                {t("ctaSignIn")}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-24">
        <div className="wrap max-w-[900px]">
          <Reveal>
            <h2 className="text-[28px] text-navy dark:text-white mb-10">{t("howItWorks.heading")}</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {STEP_KEYS.map((key, i) => (
              <Reveal key={key} delay={0.05 * i}>
                <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 h-full">
                  <span className="w-8 h-8 rounded-lg bg-lightblue dark:bg-teal/[0.1] text-blue grid place-items-center font-display font-bold text-[13px] mb-3.5">
                    {i + 1}
                  </span>
                  <h3 className="text-[15.5px] font-semibold text-navy dark:text-white mb-1.5">
                    {t(`howItWorks.${key}.title`)}
                  </h3>
                  <p className="text-muted dark:text-white/60 text-[13.5px]">{t(`howItWorks.${key}.body`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="text-[12.5px] text-muted dark:text-white/40 mt-6 max-w-[640px]">{t("howItWorks.disclaimer")}</p>
        </div>
      </section>

      <section className="py-24 bg-lightblue/40 dark:bg-teal/[0.05]" id="roadmap">
        <div className="wrap max-w-[1000px]">
          <Reveal>
            <span className="eyebrow">{t("roadmap.eyebrow")}</span>
            <h2 className="text-[28px] text-navy dark:text-white mt-3 mb-3">{t("roadmap.heading")}</h2>
            <p className="text-muted dark:text-white/60 text-[15.5px] mb-8 max-w-[640px]">{t("roadmap.description")}</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROADMAP_KEYS.map((key, i) => (
              <Reveal key={key} delay={0.04 * i}>
                {/* Dashed, muted cards so planned scores can't be mistaken for live features. */}
                <div className="h-full rounded-card border border-dashed border-line dark:border-white/15 bg-white/60 dark:bg-white/[0.02] p-5">
                  <span className="inline-block text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted dark:text-white/50 border border-line dark:border-white/15 rounded-full px-2.5 py-0.5 mb-3">
                    {t("roadmap.badge")}
                  </span>
                  <h3 className="text-[15px] font-semibold text-navy dark:text-white mb-1.5">{t(`roadmap.cards.${key}.title`)}</h3>
                  <p className="text-muted dark:text-white/60 text-[13.5px]">{t(`roadmap.cards.${key}.body`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="wrap max-w-[900px]">
          <Reveal>
            <h2 className="text-[28px] text-navy dark:text-white mb-10">{t("whoItsFor.heading")}</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {WHO_ITS_FOR_KEYS.map((key, i) => (
              <Reveal key={key} delay={0.05 * i}>
                <div>
                  <h3 className="text-[15.5px] font-semibold text-navy dark:text-white mb-1.5">
                    {t(`whoItsFor.${key}.title`)}
                  </h3>
                  <p className="text-muted dark:text-white/60 text-[14px]">{t(`whoItsFor.${key}.body`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-navy text-white" id="sign-in">
        <div className="wrap max-w-[900px]">
          <Reveal>
            <div className="text-center max-w-[500px] mx-auto mb-12">
              <h2 className="text-[28px] mb-2">{t("doors.heading")}</h2>
              <p className="text-white/60 text-[15px]">{t("doors.subheading")}</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DOOR_KEYS.map((key, i) => (
              <Reveal key={key} delay={0.05 * i}>
                <Link
                  href={DOOR_HREFS[i]}
                  className="group block rounded-card border border-white/15 bg-white/[0.04] p-5 hover:bg-white/[0.08] hover:border-white/30 transition h-full"
                >
                  <p className="text-[14.5px] font-semibold text-white mb-2">{t(`doors.${key}.label`)}</p>
                  <span className="text-[13px] font-bold text-teal flex items-center gap-1.5">
                    {t(`doors.${key}.cta`)} <span className="inline-block rtl:-scale-x-100">→</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="py-8 bg-lightblue/30 dark:bg-white/[0.02]">
        <p className="wrap max-w-[760px] text-[12.5px] text-muted dark:text-white/40 text-center leading-relaxed">
          {t("medicalDisclaimer")}
        </p>
      </div>
    </main>
  );
}
