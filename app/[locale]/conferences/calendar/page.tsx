import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import Reveal from "@/components/motion/Reveal";
import { formatEventDateBadge } from "@/lib/events-constants";

export const revalidate = 300;
export const metadata = { title: "Full Event Calendar" };

export default async function CalendarPage() {
  const t = await getTranslations("Conferences");
  const locale = await getLocale();
  const supabase = createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, slug, event_type, start_date, end_date, is_virtual, location")
    .order("start_date", { ascending: true });

  const groups = new Map<string, typeof events>();
  for (const event of events ?? []) {
    const key = new Date(`${event.start_date}T00:00:00`).toLocaleDateString(locale, { month: "long", year: "numeric" });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(event);
  }

  return (
    <main className="py-20">
      <div className="wrap max-w-[760px]">
        <Reveal>
          <Link href="/conferences" className="text-[13.5px] font-semibold text-teal hover:text-navy dark:hover:text-white transition mb-8 inline-flex items-center gap-1.5">
            <span className="inline-block rtl:-scale-x-100">←</span> {t("calendarPage.backToEvents")}
          </Link>
          <span className="eyebrow">{t("calendarPage.eyebrow")}</span>
          <h1 className="text-[34px] mt-4 mb-3 text-navy dark:text-white font-brand font-extrabold">{t("calendarPage.heading")}</h1>
          <p className="text-muted dark:text-white/60 text-[15.5px] mb-12">{t("calendarPage.description")}</p>
        </Reveal>

        {groups.size > 0 ? (
          <div className="space-y-10">
            {Array.from(groups.entries()).map(([month, monthEvents]) => (
              <Reveal key={month}>
                <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-blue mb-4">{month}</h2>
                <div className="space-y-2.5">
                  {monthEvents!.map((event) => {
                    const badge = formatEventDateBadge(event.start_date, event.end_date, locale);
                    return (
                      <Link
                        key={event.id}
                        href={`/conferences/${event.slug}`}
                        className="flex items-center gap-4 rounded-card border border-line dark:border-white/10 p-4 hover:border-blue transition"
                      >
                        <div className="w-14 flex-none text-center rounded-[10px] bg-lightblue dark:bg-white/[0.06] py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-blue">{badge.month}</p>
                          <p className="text-[15px] font-display font-extrabold text-navy dark:text-white">{badge.day}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-semibold text-navy dark:text-white truncate">{event.title}</p>
                          <p className="text-[12.5px] text-muted dark:text-white/50">
                            {t(`filters.types.${event.event_type}`)} · {event.is_virtual ? t("card.onlineVirtual") : event.location}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-muted dark:text-white/60 text-[14px]">{t("calendarPage.empty")}</p>
        )}
      </div>
    </main>
  );
}
