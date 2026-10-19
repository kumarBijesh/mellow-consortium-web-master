import { notFound, redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { TextField, TextAreaField } from "@/components/admin/AdminFields";
import { isRenderableImageUrl } from "@/lib/image-url";

export const dynamic = "force-dynamic";

export default async function EditNewsPostPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const [{ data: post }, { data: divisions }] = await Promise.all([
    supabase.from("news_posts").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("divisions").select("id, name").order("sort_order"),
  ]);

  if (!post) notFound();

  async function updatePost(formData: FormData) {
    "use server";
    const locale = await getLocale();
    const title = String(formData.get("title") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    if (!title || !slug) return;

    const coverImageUrl = String(formData.get("cover_image_url") ?? "").trim() || null;
    // Same crash this guards against on create: next/image throws for any
    // src whose host isn't in next.config.mjs's images.remotePatterns,
    // taking down the public /news pages for every visitor.
    if (coverImageUrl && !isRenderableImageUrl(coverImageUrl)) {
      redirect(
        `/${locale}/admin/cms/${params.id}?error=${encodeURIComponent("Cover image URL must be an https link hosted on Supabase storage (*.supabase.co).")}`
      );
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("news_posts")
      .update({
        title,
        slug,
        division_id: String(formData.get("division_id") ?? "") || null,
        excerpt: String(formData.get("excerpt") ?? "").trim() || null,
        body: String(formData.get("body") ?? "").trim() || null,
        cover_image_url: coverImageUrl,
        published_at: formData.get("publish") === "on" ? new Date().toISOString() : null,
      })
      .eq("id", params.id);

    if (error) {
      console.error("[admin/cms/[id]] updatePost failed:", error);
      redirect(`/${locale}/admin/cms/${params.id}?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/admin/cms");
    revalidatePath("/news");
    revalidatePath(`/news/${slug}`);
  }

  async function deletePost() {
    "use server";
    const locale = await getLocale();
    const supabase = createClient();
    const { error } = await supabase.from("news_posts").delete().eq("id", params.id);
    if (error) {
      console.error("[admin/cms/[id]] deletePost failed:", error);
      redirect(`/${locale}/admin/cms/${params.id}?error=${encodeURIComponent(error.message)}`);
    }
    revalidatePath("/admin/cms");
    revalidatePath("/news");
    redirect(`/${locale}/admin/cms`);
  }

  return (
    <div className="max-w-[560px]">
      <Link href="/admin/cms" className="text-[13.5px] font-semibold text-teal hover:text-ink dark:text-white transition mb-6 inline-block">
        &larr; All posts
      </Link>
      <h1 className="text-[24px] font-display font-bold text-ink dark:text-white mb-6">Edit post</h1>

      {searchParams.error && (
        <div className="text-[13px] text-red-300 mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="font-mono break-all">{searchParams.error}</p>
        </div>
      )}

      <form action={updatePost} className="space-y-4">
        <TextField name="title" label="Title" required defaultValue={post.title} />
        <TextField name="slug" label="Slug" required defaultValue={post.slug} />
        <div>
          <label htmlFor="division_id" className="adm-label">
            Division
          </label>
          <select id="division_id" name="division_id" defaultValue={post.division_id ?? ""} className="adm-input">
            <option value="" className="bg-[#0d1117]"></option>
            {(divisions ?? []).map((d) => (
              <option key={d.id} value={d.id} className="bg-[#0d1117]">
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <TextField name="excerpt" label="Excerpt" defaultValue={post.excerpt ?? ""} />
        <TextAreaField name="body" label="Body" defaultValue={post.body ?? ""} />
        <TextField name="cover_image_url" label="Cover image URL" defaultValue={post.cover_image_url ?? ""} />
        <label className="flex items-center gap-2 text-[13px] text-muted dark:text-white/70">
          <input type="checkbox" name="publish" defaultChecked={Boolean(post.published_at)} className="rounded border-line dark:border-white/20 bg-white/5 dark:bg-white/[0.03] accent-teal" />
          Published
        </label>
        <button type="submit" className="adm-btn-primary w-full">
          Save changes
        </button>
      </form>

      <form action={deletePost} className="mt-6">
        <button type="submit" className="text-[13px] font-semibold text-red-400 hover:text-red-300 transition">
          Delete post
        </button>
      </form>
    </div>
  );
}
