import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("NotFoundPage");

  return (
    <main className="py-32">
      <div className="wrap max-w-[560px] text-center">
        <span className="eyebrow justify-center">{t("eyebrow")}</span>
        <h1 className="text-[32px] mt-4 mb-4 text-navy dark:text-white">{t("heading")}</h1>
        <p className="text-muted dark:text-white/60 text-[15px] mb-8">{t("body")}</p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn-primary">
            {t("backHome")}
          </Link>
          <Link href="/trials" className="btn-secondary">
            {t("viewTrials")}
          </Link>
        </div>
      </div>
    </main>
  );
}
