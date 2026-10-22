import { cache } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isRenderableImageUrl } from "@/lib/image-url";
import { formatEventDateBadge } from "@/lib/events-constants";
import ShareButtons from "@/components/ShareButtons";
import Reveal from "@/components/motion/Reveal";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const getEvent = cache(async (slug: string) => {
  const supabase = createClient();
  const { data: event } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  return event;
});

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const event = await getEvent(params.slug);
  return { title: event?.title ?? "Event" };
}

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const t = await getTranslations("Conferences");
  const locale = await getLocale();
  const event = await getEvent(params.slug);
  if (!event) notFound();

  const badge = formatEventDateBadge(event.start_date, event.end_date, locale);
  const dateRange = event.end_date
    ? `${new Date(`${event.start_date}T00:00:00`).toLocaleDateString(locale, { month: "long", day: "numeric" })} – ${new Date(`${event.end_date}T00:00:00`).toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric" })}`
    : new Date(`${event.start_date}T00:00:00`).toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric" });
  const eventUrl = `${siteUrl}/${locale}/conferences/${event.slug}`;

  return (
    <main className="py-20">
      <div className="wrap max-w-[760px]">
        <Reveal>
          <Link href="/conferences" className="text-[13.5px] font-semibold text-teal hover:text-navy dark:hover:text-white transition mb-8 inline-flex items-center gap-1.5">
            <span className="inline-block rtl:-scale-x-100">←</span> {t("detail.backToEvents")}
          </Link>

          {isRenderableImageUrl(event.cover_image_url) && (
            <div className="relative w-full aspect-[16/7] rounded-card overflow-hidden mb-8 bg-lightblue dark:bg-teal/[0.08]">
              <Image src={event.cover_image_url} alt={event.title} fill sizes="760px" className="object-cover" />
            </div>
          )}

          <span className="text-[11px] font-bold uppercase tracking-wide text-blue">{t(`filters.types.${event.event_type}`)}</span>
          <h1 className="text-[32px] sm:text-[40px] mt-2 mb-4 text-navy dark:text-white font-brand font-extrabold leading-tight">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14.5px] text-muted dark:text-white/60 mb-6">
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M8 3v4M16 3v4M3 10h18" />
              </svg>
              {dateRange}
            </span>
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              {event.is_virtual ? t("card.onlineVirtual") : event.location}
            </span>
          </div>

          <p className="text-[16px] text-ink dark:text-white/85 leading-relaxed mb-8 whitespace-pre-wrap">{event.description}</p>

          {event.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {event.tags.map((tag: string) => (
                <span key={tag} className="text-[12px] bg-lightblue dark:bg-white/[0.06] text-navy dark:text-white/70 px-3 py-1.5 rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 pt-6 border-t border-line dark:border-white/10">
            <span className="text-[13px] font-semibold text-navy dark:text-white">{t("detail.shareHeading")}</span>
            <ShareButtons url={eventUrl} title={event.title} />
          </div>
        </Reveal>
      </div>
    </main>
  );
}
