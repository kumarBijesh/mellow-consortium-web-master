"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ErrorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="py-32">
      <div className="wrap max-w-[560px] text-center">
        <span className="eyebrow justify-center">{t("eyebrow")}</span>
        <h1 className="text-[32px] mt-4 mb-4 text-navy dark:text-white">{t("heading")}</h1>
        <p className="text-muted dark:text-white/60 text-[15px] mb-8">{t("body")}</p>
        <div className="flex gap-3 justify-center">
          <button type="button" onClick={() => reset()} className="btn-primary">
            {t("tryAgain")}
          </button>
          <Link href="/" className="btn-secondary">
            {t("backHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
