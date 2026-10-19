import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import Reveal from "@/components/motion/Reveal";
import EventsBrowser from "@/components/conferences/EventsBrowser";
import NewsletterForm from "@/components/NewsletterForm";
import type { EventRow } from "@/lib/events-constants";

export const revalidate = 300;
export const metadata = { title: "Conferences" };

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function ConferencesPage() {
  const t = await getTranslations("Conferences");
  const locale = await getLocale();
  const supabase = createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, slug, description, event_type, start_date, end_date, is_virtual, location, tags, cover_image_url")
    .order("start_date", { ascending: true });

  return (
    <main>
      {/* Hero */}
      <section className="py-20 bg-flashwhite dark:bg-white/[0.02] border-b border-line dark:border-white/10">
        <div className="wrap grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <span className="eyebrow">{t("eyebrow")}</span>
            <h1 className="text-[40px] sm:text-[52px] mt-4 mb-4 text-navy dark:text-white font-brand font-extrabold leading-[1.05]">
              {t("heading")}
            </h1>
            <p className="text-muted dark:text-white/60 text-[16.5px] leading-relaxed mb-5 max-w-[460px]">{t("subheading")}</p>
            <p className="text-[13.5px] font-semibold text-teal tracking-wide mb-7">{t("tagline")}</p>
            <Link href="/conferences/calendar" className="mkt-btn-primary">
              {t("viewFullCalendar")}
            </Link>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative rounded-card overflow-hidden aspect-[4/3] bg-gradient-to-br from-navy via-forest to-richblack">
              {/* No real photo has been supplied yet — obvious placeholder block, not a stock image, per explicit instruction not to fake one. */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/40 border border-white/20 rounded-full px-4 py-2">
                  {t("banner.placeholderNote")}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-7 bg-gradient-to-t from-richblack/90 via-richblack/50 to-transparent">
                <p className="text-white font-brand font-extrabold text-[22px] sm:text-[26px] leading-tight">
                  {t("banner.line1")} <span className="text-meadow">/</span> {t("banner.line2")} <span className="text-meadow">/</span>{" "}
                  {t("banner.line3")}
                </p>
                <p className="text-pistachio/80 text-[13.5px] mt-2">{t("banner.caption")}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Filters + grid */}
      <section id="events" className="py-20">
        <div className="wrap">
          <EventsBrowser events={(events ?? []) as EventRow[]} locale={locale} siteUrl={siteUrl} />
        </div>
      </section>

      {/* Bottom CTA strip */}
      <section className="py-16 bg-richblack text-white text-center">
        <div className="wrap max-w-[560px]">
          <h2 className="text-[26px] font-brand font-bold mb-2.5">{t("ctaStrip.heading")}</h2>
          <p className="text-pistachio/70 text-[14.5px] mb-1">{t("ctaStrip.body")}</p>
          <div className="flex justify-center">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </main>
  );
}
