import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  const [{ data: trials }, { data: posts }, { data: institutions }, { data: investigators }] = await Promise.all([
    supabase.from("trials").select("slug"),
    supabase.from("news_posts").select("slug, published_at").not("published_at", "is", null),
    supabase.from("institutions").select("id"),
    supabase.from("investigators").select("id"),
  ]);

  return [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/trials`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/news`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/institutions`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/investigators`, changeFrequency: "weekly", priority: 0.7 },
    ...(investigators ?? []).map((i) => ({
      url: `${siteUrl}/investigators/${i.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    ...(institutions ?? []).map((i) => ({
      url: `${siteUrl}/institutions/${i.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...(trials ?? []).map((t) => ({
      url: `${siteUrl}/trials/${t.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...(posts ?? []).map((p) => ({
      url: `${siteUrl}/news/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
      lastModified: p.published_at ?? undefined,
    })),
  ];
}
