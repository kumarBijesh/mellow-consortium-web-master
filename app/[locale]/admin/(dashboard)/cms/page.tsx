import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import NewsPostForm from "@/components/admin/NewsPostForm";
import { isRenderableImageUrl } from "@/lib/image-url";

export const dynamic = "force-dynamic";

async function createPost(_prevState: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  "use server";
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!title || !slug) return { error: "Title and slug are required." };

  const coverImageUrl = String(formData.get("cover_image_url") ?? "").trim() || null;
  // next/image throws (crashing the public /news pages for every visitor,
  // not just showing a broken image) for any src whose host isn't in
  // next.config.mjs's images.remotePatterns — catch that here instead of
  // letting a pasted-in article link or unconfigured host take the site down.
  if (coverImageUrl && !isRenderableImageUrl(coverImageUrl)) {
    return { error: "Cover image URL must be an https link hosted on Supabase storage (*.supabase.co)." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("news_posts").insert({
    title,
    slug,
    division_id: String(formData.get("division_id") ?? "") || null,
    excerpt: String(formData.get("excerpt") ?? "").trim() || null,
    body: String(formData.get("body") ?? "").trim() || null,
    cover_image_url: coverImageUrl,
    published_at: formData.get("publish") === "on" ? new Date().toISOString() : null,
  });

  if (error) {
    console.error("[admin/cms] createPost insert failed:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { error: `${error.code ? `[${error.code}] ` : ""}${error.message}` };
  }

  revalidatePath("/admin/cms");
  revalidatePath("/news");
  return {};
}

export default async function AdminCmsPage() {
  const supabase = createClient();
  const [{ data: posts, error }, { data: divisions }] = await Promise.all([
    supabase
      .from("news_posts")
      .select("id, title, published_at, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("divisions").select("id, name").order("sort_order"),
  ]);

  if (error) {
    console.error("[admin/cms] select failed:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }

  return (
    <div>
      <h1 className="text-[26px] font-display font-bold text-ink dark:text-white mb-1">CMS</h1>
      <p className="text-[13.5px] text-muted dark:text-white/40 mb-6">Publish and manage news posts.</p>

      <Link
        href="/admin/cms/membership-plans"
        className="adm-card flex items-center justify-between p-4 mb-8 hover:border-teal/30 transition"
      >
        <div>
          <span className="text-[14.5px] font-semibold text-ink dark:text-white">Membership plans</span>
          <p className="text-[12.5px] text-muted dark:text-white/40">Tier names, prices, and the benefits comparison on /membership-plans.</p>
        </div>
        <span className="text-teal text-[13px] font-semibold">Edit &rarr;</span>
      </Link>

      {error && (
        <div className="text-[14px] text-red-300 mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="font-semibold mb-1">Couldn&apos;t load posts.</p>
          <p className="font-mono text-[12.5px] break-all">
            {error.code ? `[${error.code}] ` : ""}
            {error.message}
          </p>
          {error.hint && <p className="text-[12px] text-muted dark:text-white/40 mt-1">Hint: {error.hint}</p>}
          <p className="text-[12px] text-muted dark:text-white/30 mt-2">Full details logged server-side (see terminal running `npm run dev`).</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-2.5">
          {(posts ?? []).map((p) => (
            <Link
              key={p.id}
              href={`/admin/cms/${p.id}`}
              className="adm-card flex items-center justify-between p-4 hover:border-teal/30 transition"
            >
              <span className="text-[14.5px] text-ink dark:text-white">{p.title}</span>
              <span className="text-[12px] text-muted dark:text-white/40">{p.published_at ? "Published" : "Draft"}</span>
            </Link>
          ))}
          {(!posts || posts.length === 0) && !error && <p className="text-muted dark:text-white/30 text-[14px]">No posts yet.</p>}
        </div>

        <div className="adm-card p-5 h-fit">
          <h2 className="text-[15px] font-semibold text-ink dark:text-white mb-4">New post</h2>
          <NewsPostForm action={createPost} divisions={divisions ?? []} />
        </div>
      </div>
    </div>
  );
}
