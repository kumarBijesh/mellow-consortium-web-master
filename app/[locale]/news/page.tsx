import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isRenderableImageUrl } from "@/lib/image-url";
import Reveal, { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import HoverLift from "@/components/motion/HoverLift";

export const revalidate = 300;
export const metadata = { title: "News & Updates" };

export default async function NewsPage() {
  const supabase = createClient();
  const t = await getTranslations("News");
  const locale = await getLocale();
  const { data: posts } = await supabase
    .from("news_posts")
    .select("id, title, slug, excerpt, cover_image_url, published_at")
    .order("published_at", { ascending: false })
    .limit(30);

  return (
    <main className="py-24">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1 className="text-[38px] mt-4 mb-3 text-navy dark:text-white">{t("heading")}</h1>
          <p className="text-muted dark:text-white/60 text-[16px] max-w-[600px] mb-12">{t("description")}</p>
        </Reveal>

        <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(posts ?? []).map((n) => (
            <StaggerItem key={n.id}>
              <HoverLift>
                <Link
                  href={`/news/${n.slug}`}
                  className="block rounded-card bg-white dark:bg-white/[0.03] border border-line dark:border-white/10 overflow-hidden hover:shadow-card-sm dark:shadow-none dark:ring-1 dark:ring-white/[0.08] transition-shadow h-full"
                >
                  {isRenderableImageUrl(n.cover_image_url) && (
                    <div className="relative w-full h-[160px] bg-lightblue dark:bg-teal/[0.08]">
                      <Image
                        src={n.cover_image_url}
                        alt={n.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    {n.published_at && (
                      <p className="text-[12px] font-semibold text-teal uppercase tracking-[0.08em] mb-2">
                        {new Date(n.published_at).toLocaleDateString(locale, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                    <h4 className="text-[16px] text-navy dark:text-white mb-2">{n.title}</h4>
                    {n.excerpt && <p className="text-muted dark:text-white/60 text-[13.5px]">{n.excerpt}</p>}
                  </div>
                </Link>
              </HoverLift>
            </StaggerItem>
          ))}
          {(!posts || posts.length === 0) && (
            <p className="text-muted dark:text-white/60 text-[14px] col-span-full">{t("empty")}</p>
          )}
        </StaggerGroup>
      </div>
    </main>
  );
}
