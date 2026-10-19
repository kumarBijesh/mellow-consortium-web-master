import { getTranslations } from "next-intl/server";
import Reveal from "@/components/motion/Reveal";

export const metadata = { title: "JLIVE" };

export default async function JLivePage() {
  const t = await getTranslations("Jlive");

  return (
    <main className="py-24">
      <div className="wrap max-w-[680px]">
        <Reveal>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1 className="text-[38px] mt-4 mb-4 text-navy dark:text-white">{t("heading")}</h1>
          <p className="text-muted dark:text-white/60 text-[16.5px] leading-relaxed mb-14">{t("description")}</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-7 mb-6">
            <h2 className="text-[16px] font-semibold text-navy dark:text-white mb-2">{t("publishHeading")}</h2>
            <p className="text-muted dark:text-white/60 text-[14.5px] mb-4">{t("publishBody")}</p>
            <span className="inline-flex items-center text-[12.5px] font-bold uppercase tracking-[0.08em] text-muted dark:text-white/40 border border-line dark:border-white/15 rounded-full px-3 py-1">
              {t("comingSoon")}
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-7">
            <h2 className="text-[16px] font-semibold text-navy dark:text-white mb-2">{t("latestHeading")}</h2>
            <p className="text-muted dark:text-white/60 text-[14.5px]">{t("latestBody")}</p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
