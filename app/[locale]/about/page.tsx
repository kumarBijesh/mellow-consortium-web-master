import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/motion/Reveal";

export const metadata = { title: "About" };

export default async function AboutPage() {
  const t = await getTranslations("About");

  return (
    <main className="py-24">
      <div className="wrap max-w-[760px]">
        <Reveal>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1 className="text-[38px] mt-4 mb-6 text-navy dark:text-white">{t("heading")}</h1>
          <p className="text-muted dark:text-white/60 text-[16.5px] leading-relaxed">{t("intro")}</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-14 pt-10 border-t border-line dark:border-white/10">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-teal mb-3">{t("mission.heading")}</h2>
            <p className="text-navy dark:text-white text-[17px] leading-relaxed">{t("mission.body")}</p>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-12 pt-10 border-t border-line dark:border-white/10">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-teal mb-3">{t("whatWeDo.heading")}</h2>
            <p className="text-muted dark:text-white/70 text-[16px] leading-relaxed">{t("whatWeDo.body")}</p>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-12 pt-10 border-t border-line dark:border-white/10">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-teal mb-3">{t("globalNetwork.heading")}</h2>
            <p className="text-muted dark:text-white/70 text-[16px] leading-relaxed">{t("globalNetwork.body")}</p>
          </div>
        </Reveal>

        <Reveal delay={0.25}>
          <div className="mt-12 pt-10 border-t border-line dark:border-white/10">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-teal mb-3">{t("getInvolved.heading")}</h2>
            <p className="text-muted dark:text-white/70 text-[16px] leading-relaxed mb-6">{t("getInvolved.body")}</p>
            <Link href="/#sponsors" className="btn-primary">
              {t("getInvolved.cta")} <span className="inline-block rtl:-scale-x-100">→</span>
            </Link>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
