import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { isRenderableImageUrl } from "@/lib/image-url";
import { STATIC_SEARCH_PAGES } from "@/lib/static-search-content";
import Image from "next/image";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  return { title: q ? `Search: ${q}` : "Search" };
}

// PostgREST's `.or()` filter string is its own small DSL — a raw query
// containing `,`, `(`, `)`, or `%` would either break the filter syntax
// or get interpreted as ilike wildcards/filter separators instead of
// literal text. Strip those before interpolating into the filter string.
function sanitizeForIlike(q: string) {
  return q.replace(/[%,()]/g, " ").trim();
}

async function searchTrials(q: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("trials")
    .select("id, title, slug, summary, status, therapeutic_area")
    .or(`title.ilike.%${q}%,summary.ilike.%${q}%,therapeutic_area.ilike.%${q}%`)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

async function searchNews(q: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("news_posts")
    .select("id, title, slug, excerpt, cover_image_url, published_at")
    .not("published_at", "is", null)
    .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`)
    .order("published_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

// Static pages have no table to query — their title/description come from
// the same translation keys the pages themselves render, fetched here and
// matched against the query in-memory (case-insensitive substring).
async function searchStaticPages(q: string) {
  const tAll = await getTranslations();
  const needle = q.toLowerCase();
  return STATIC_SEARCH_PAGES.map((page) => ({
    href: page.href,
    title: tAll(`${page.namespace}.heading`),
    description: tAll(`${page.namespace}.${page.descriptionKey}`),
  })).filter((page) => page.title.toLowerCase().includes(needle) || page.description.toLowerCase().includes(needle));
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const t = await getTranslations("Search");
  const rawQuery = (searchParams.q ?? "").trim();
  const query = sanitizeForIlike(rawQuery);

  const [trials, news, pages] =
    query.length > 0
      ? await Promise.all([searchTrials(query), searchNews(query), searchStaticPages(rawQuery)])
      : [[], [], []];
  const hasQuery = query.length > 0;
  const hasResults = trials.length > 0 || news.length > 0 || pages.length > 0;

  return (
    <main className="py-24">
      <div className="wrap max-w-[820px]">
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1 className="text-[34px] mt-4 mb-8 text-navy dark:text-white">{t("heading")}</h1>

        <form action="/search" method="get" className="flex gap-2.5 mb-12 max-w-[520px]">
          <label htmlFor="search-q" className="sr-only">
            {t("inputLabel")}
          </label>
          <input
            id="search-q"
            name="q"
            type="search"
            defaultValue={rawQuery}
            placeholder={t("placeholder")}
            className="flex-1 rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            autoFocus
          />
          <button type="submit" className="btn-primary !px-5">
            {t("submit")}
          </button>
        </form>

        {!hasQuery && <p className="text-muted dark:text-white/60 text-[14.5px]">{t("prompt")}</p>}

        {hasQuery && !hasResults && (
          <p className="text-muted dark:text-white/60 text-[14.5px]">{t("noResults", { query: rawQuery })}</p>
        )}

        {trials.length > 0 && (
          <section className="mb-10">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted dark:text-white/60 mb-4">
              {t("trialsHeading", { count: trials.length })}
            </h2>
            <div className="space-y-2.5">
              {trials.map((trial) => (
                <Link
                  key={trial.id}
                  href={`/trials/${trial.slug}`}
                  className="block rounded-[14px] border border-line dark:border-white/10 p-5 hover:border-blue transition"
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-blue">
                      {trial.therapeutic_area ?? t("longevityFallback")}
                    </span>
                  </div>
                  <h3 className="text-[15.5px] font-semibold text-navy dark:text-white">{trial.title}</h3>
                  {trial.summary && <p className="text-[13.5px] text-muted dark:text-white/60 mt-1">{trial.summary}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {news.length > 0 && (
          <section className="mb-10">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted dark:text-white/60 mb-4">
              {t("newsHeading", { count: news.length })}
            </h2>
            <div className="space-y-2.5">
              {news.map((post) => (
                <Link
                  key={post.id}
                  href={`/news/${post.slug}`}
                  className="flex items-center gap-4 rounded-[14px] border border-line dark:border-white/10 p-5 hover:border-blue transition"
                >
                  {isRenderableImageUrl(post.cover_image_url) && (
                    <div className="relative w-[64px] h-[64px] flex-none rounded-[10px] overflow-hidden bg-lightblue dark:bg-teal/[0.08]">
                      <Image src={post.cover_image_url} alt="" fill sizes="64px" className="object-cover" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-[15px] font-semibold text-navy dark:text-white">{post.title}</h3>
                    {post.excerpt && <p className="text-[13.5px] text-muted dark:text-white/60 mt-1">{post.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {pages.length > 0 && (
          <section>
            <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted dark:text-white/60 mb-4">
              {t("pagesHeading", { count: pages.length })}
            </h2>
            <div className="space-y-2.5">
              {pages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className="block rounded-[14px] border border-line dark:border-white/10 p-5 hover:border-blue transition"
                >
                  <h3 className="text-[15.5px] font-semibold text-navy dark:text-white">{page.title}</h3>
                  <p className="text-[13.5px] text-muted dark:text-white/60 mt-1">{page.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
