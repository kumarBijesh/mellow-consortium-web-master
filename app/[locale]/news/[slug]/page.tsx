import { cache } from "react";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isRenderableImageUrl } from "@/lib/image-url";

export const revalidate = 300;

const getPost = cache(async (slug: string) => {
  const supabase = createClient();
  const { data } = await supabase
    .from("news_posts")
    .select("id, title, slug, excerpt, body, cover_image_url, published_at")
    .eq("slug", slug)
    .maybeSingle();

  return data;
});

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  return { title: post?.title ?? "News", description: post?.excerpt };
}

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();
  const t = await getTranslations("News");
  const locale = await getLocale();

  const paragraphs = String(post.body ?? "")
    .split("\n")
    .filter((p) => p.trim().length > 0);

  return (
    <main className="py-24">
      <div className="wrap max-w-[720px]">
        <Link href="/news" className="text-[13.5px] font-semibold text-blue mb-6 inline-flex items-center gap-1.5">
          <span className="inline-block rtl:-scale-x-100">&larr;</span> {t("backToAll")}
        </Link>

        {post.published_at && (
          <p className="text-[12px] font-semibold text-teal uppercase tracking-[0.08em] mb-3">
            {new Date(post.published_at).toLocaleDateString(locale, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}

        <h1 className="text-[34px] mb-6 text-navy dark:text-white">{post.title}</h1>

        {isRenderableImageUrl(post.cover_image_url) && (
          <div className="relative w-full h-[320px] rounded-card overflow-hidden mb-8 bg-lightblue dark:bg-teal/[0.08]">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              sizes="720px"
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="space-y-4">
          {paragraphs.length > 0 ? (
            paragraphs.map((p, i) => (
              <p key={i} className="text-[15.5px] text-ink dark:text-white leading-relaxed">
                {p}
              </p>
            ))
          ) : (
            <p className="text-muted dark:text-white/60 text-[14px]">{post.excerpt}</p>
          )}
        </div>
      </div>
    </main>
  );
}
