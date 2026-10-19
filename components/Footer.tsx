import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { JLIVE_URL, isExternalHref } from "@/lib/external-links";
import NewsletterForm from "@/components/NewsletterForm";

export default async function Footer() {
  const t = await getTranslations("Footer");

  const PLATFORM_LINKS = [
    { href: "/mellow-age", label: t("mellowAge") },
    { href: JLIVE_URL, label: t("jlive") },
    { href: "/trials", label: t("clinicalTrials") },
  ];

  const COMMUNITY_LINKS = [
    { href: "/conferences", label: t("conferences") },
    { href: "/news", label: t("newsAndUpdates") },
    { href: "/contact", label: t("contact") },
  ];

  const COMPANY_LINKS = [
    { href: "/about", label: t("about") },
    { href: "/#sponsors", label: t("becomePartner") },
    { href: "/apply/healthcare_provider", label: t("becomePhysicianPartner") },
    { href: "/access", label: t("signIn") },
  ];

  return (
    <footer className="bg-richblack text-pistachio text-[14px] pt-16 pb-[30px]">
      <div className="wrap">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_.8fr_.8fr_.8fr_1fr] gap-10 pb-11 border-b border-white/10">
          <div>
            <Link href="/" className="flex items-center flex-none">
              <Image
                src="/logo-mark.png"
                alt="Mellow Consortium"
                width={751}
                height={197}
                className="h-9 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-[280px] text-pistachio/70 text-[13.5px]">{t("tagline")}</p>
            {/* Mailing address / phone / email are facts, not copy — same
                in every locale, so left untranslated rather than routed
                through messages/*.json. dir="ltr" + text-start keeps the
                phone number's "+1" from getting bidi-reordered to "1+"
                under RTL locales while still sitting at the block's
                normal (start-of-line) edge. */}
            <div className="mt-[18px] text-[13px] text-pistachio/70 leading-relaxed" dir="ltr">
              <p className="text-start">6331 State Road 54, New Port Richey, FL 34653</p>
              <p className="text-start">+1 (813) 419-0781 · info@musbresearch.com</p>
            </div>
          </div>

          <div>
            <h5 className="font-brand text-white text-[13px] tracking-[0.06em] uppercase mb-4">{t("platformsHeading")}</h5>
            {PLATFORM_LINKS.map((l) =>
              isExternalHref(l.href) ? (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="block py-1.5 text-[14px] hover:text-meadow transition">
                  {l.label}
                </a>
              ) : (
                <Link key={l.href} href={l.href} className="block py-1.5 text-[14px] hover:text-meadow transition">
                  {l.label}
                </Link>
              )
            )}
          </div>

          <div>
            <h5 className="font-brand text-white text-[13px] tracking-[0.06em] uppercase mb-4">{t("communityHeading")}</h5>
            {COMMUNITY_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="block py-1.5 text-[14px] hover:text-meadow transition">
                {l.label}
              </Link>
            ))}
          </div>

          <div>
            <h5 className="font-brand text-white text-[13px] tracking-[0.06em] uppercase mb-4">{t("companyHeading")}</h5>
            {COMPANY_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="block py-1.5 text-[14px] hover:text-meadow transition">
                {l.label}
              </Link>
            ))}
          </div>

          <div>
            <h5 className="font-brand text-white text-[13px] tracking-[0.06em] uppercase mb-4">{t("newsletterHeading")}</h5>
            <p className="text-pistachio/70 text-[13.5px]">{t("newsletterBlurb")}</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 flex-wrap gap-3 text-[12.5px] text-pistachio/50">
          <span>{t("copyright", { year: new Date().getFullYear() })}</span>
          <div className="flex gap-5 flex-wrap">
            <Link href="/coming-soon?from=privacy" className="hover:text-white transition">
              {t("privacyPolicy")}
            </Link>
            <Link href="/coming-soon?from=terms" className="hover:text-white transition">
              {t("termsOfUse")}
            </Link>
            <Link href="/coming-soon?from=accessibility" className="hover:text-white transition">
              {t("accessibility")}
            </Link>
            <Link href="/admin/login" className="text-pistachio/40 hover:text-white transition">
              {t("adminLogin")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
