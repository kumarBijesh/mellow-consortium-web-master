import { getTranslations } from "next-intl/server";
import Reveal from "@/components/motion/Reveal";
import ContactForm from "@/components/ContactForm";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const t = await getTranslations("Contact");

  return (
    <main className="py-24">
      <div className="wrap max-w-[640px]">
        <Reveal>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1 className="text-[38px] mt-4 mb-3 text-navy dark:text-white">{t("heading")}</h1>
          <p className="text-muted dark:text-white/60 text-[16px] mb-12">{t("description")}</p>
        </Reveal>

        <ContactForm />

        <p className="text-muted dark:text-white/60 text-[14px] mt-10 pt-8 border-t border-line dark:border-white/10">
          {t("preferEmail")}{" "}
          <a href="mailto:info@musbresearch.com" className="text-blue font-semibold hover:underline">
            info@musbresearch.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
