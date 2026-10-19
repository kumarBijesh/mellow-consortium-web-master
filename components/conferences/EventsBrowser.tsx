"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isRenderableImageUrl } from "@/lib/image-url";
import { EVENT_TYPES, type EventRow, type EventType, formatEventDateBadge } from "@/lib/events-constants";
import ShareButtons from "@/components/ShareButtons";
import HoverLift from "@/components/motion/HoverLift";

const TYPE_BADGE_COLORS: Record<EventType, string> = {
  conference: "bg-blue text-white",
  webinar: "bg-teal text-white",
  workshop: "bg-forest text-white",
  meeting: "bg-[#6B4EC7] text-white",
  consortium: "bg-gold text-[#3a2c05]",
  other: "bg-[#88a0b6] text-white",
};

type Sort = "soonest" | "latest" | "az";

export default function EventsBrowser({ events, locale, siteUrl }: { events: EventRow[]; locale: string; siteUrl: string }) {
  const t = useTranslations("Conferences");
  const [activeType, setActiveType] = useState<"all" | EventType>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("soonest");

  const filtered = useMemo(() => {
    let list = events;
    if (activeType !== "all") list = list.filter((e) => e.event_type === activeType);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    const sorted = [...list];
    if (sort === "soonest") sorted.sort((a, b) => a.start_date.localeCompare(b.start_date));
    if (sort === "latest") sorted.sort((a, b) => b.start_date.localeCompare(a.start_date));
    if (sort === "az") sorted.sort((a, b) => a.title.localeCompare(b.title));
    return sorted;
  }, [events, activeType, query, sort]);

  return (
    <div>
      {/* Category tabs + search + sort */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-10">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by event type">
          <FilterTab label={t("filters.allEvents")} active={activeType === "all"} onClick={() => setActiveType("all")} />
          {EVENT_TYPES.map((type) => (
            <FilterTab
              key={type}
              label={t(`filters.types.${type}`)}
              active={activeType === type}
              onClick={() => setActiveType(type)}
            />
          ))}
        </div>

        <div className="flex gap-3 lg:ms-auto">
          <label htmlFor="event-search" className="sr-only">
            {t("filters.searchPlaceholder")}
          </label>
          <input
            id="event-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("filters.searchPlaceholder")}
            className="rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue min-w-[180px]"
          />
          <label htmlFor="event-sort" className="sr-only">
            {t("filters.sortLabel")}
          </label>
          <select
            id="event-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
          >
            <option value="soonest">{t("filters.sortSoonest")}</option>
            <option value="latest">{t("filters.sortLatest")}</option>
            <option value="az">{t("filters.sortAZ")}</option>
          </select>
        </div>
      </div>

      {/* Cards grid — plain grid, no scroll-reveal animation. This grid's
          contents change on every filter/search/sort interaction, not just
          on scroll; StaggerGroup's whileInView+once fires exactly once and
          then stops observing, so cards removed by a filter and brought
          back by switching back never get re-animated in and are stuck at
          their hidden (opacity: 0) state forever. Same plain-grid pattern
          as TrialCountryTabs, which has the same filter-driven shape. */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} locale={locale} siteUrl={siteUrl} />
          ))}
        </div>
      ) : (
        <p className="text-muted dark:text-white/60 text-[14px] text-center py-16">{t("empty")}</p>
      )}
    </div>
  );
}

function FilterTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-[14px] py-2 rounded-full border font-display font-semibold text-[12.5px] transition ${
        active
          ? "bg-navy border-navy text-white dark:bg-white dark:border-white dark:text-navy"
          : "bg-white border-line text-ink hover:border-navy dark:bg-white/[0.04] dark:border-white/15 dark:text-white/70 dark:hover:border-white/40"
      }`}
    >
      {label}
    </button>
  );
}

function EventCard({ event, locale, siteUrl }: { event: EventRow; locale: string; siteUrl: string }) {
  const t = useTranslations("Conferences");
  const badge = formatEventDateBadge(event.start_date, event.end_date, locale);
  const eventUrl = `${siteUrl}/${locale}/conferences/${event.slug}`;

  return (
    <HoverLift>
      <div className="rounded-card bg-white dark:bg-white/[0.03] border border-line dark:border-white/10 overflow-hidden hover:shadow-card-sm dark:shadow-none dark:ring-1 dark:ring-white/[0.08] transition-shadow h-full flex flex-col">
        <Link href={`/conferences/${event.slug}`} className="block relative w-full h-[170px] bg-lightblue dark:bg-teal/[0.08]">
          {isRenderableImageUrl(event.cover_image_url) ? (
            <Image src={event.cover_image_url} alt={event.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center bg-gradient-to-br from-lightblue to-teal/[0.12] dark:from-teal/[0.1] dark:to-forest/[0.15]">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-white/40">
                {t(`filters.types.${event.event_type}`)}
              </span>
            </div>
          )}

          <div className="absolute top-3 start-3 bg-white/95 dark:bg-richblack/90 rounded-[10px] px-2.5 py-1.5 text-center shadow-sm leading-none">
            <p className="text-[10px] font-bold uppercase tracking-wide text-navy dark:text-white">{badge.month}</p>
            <p className="text-[14px] font-display font-extrabold text-navy dark:text-white">{badge.day}</p>
            <p className="text-[9px] text-muted dark:text-white/50">{badge.year}</p>
          </div>

          <span
            className={`absolute top-3 end-3 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${TYPE_BADGE_COLORS[event.event_type]}`}
          >
            {t(`filters.types.${event.event_type}`)}
          </span>
        </Link>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-[16px] font-semibold text-navy dark:text-white mb-1.5">{event.title}</h3>
          <p className="text-[12.5px] text-muted dark:text-white/50 flex items-center gap-1.5 mb-3">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-none">
              <path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            {event.is_virtual ? t("card.onlineVirtual") : event.location}
          </p>
          <p className="text-[13.5px] text-muted dark:text-white/60 mb-4 flex-1">{event.description}</p>

          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] bg-lightblue dark:bg-white/[0.06] text-navy dark:text-white/70 px-2.5 py-1 rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-line dark:border-white/10">
            <ShareButtons url={eventUrl} title={event.title} />
            <Link href={`/conferences/${event.slug}`} className="text-[13px] font-semibold text-blue hover:text-navy dark:hover:text-white transition">
              {t("card.viewDetails")} →
            </Link>
          </div>
        </div>
      </div>
    </HoverLift>
  );
}
