import { notFound, redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { TextField, SelectField } from "@/components/admin/AdminFields";
import { strOrNull } from "@/lib/network-constants";

export const dynamic = "force-dynamic";

export default async function EditPublicationPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const [{ data: pub }, { data: trials }] = await Promise.all([
    supabase.from("publications").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("trials").select("id, title").order("title"),
  ]);
  if (!pub) notFound();

  async function updatePublication(formData: FormData) {
    "use server";
    const locale = await getLocale();
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("publications")
      .update({
        title,
        authors: strOrNull(formData.get("authors")),
        journal: strOrNull(formData.get("journal")),
        published_on: strOrNull(formData.get("published_on")),
        url: strOrNull(formData.get("url")),
        trial_id: strOrNull(formData.get("trial_id")),
      })
      .eq("id", params.id);

    if (error) {
      console.error("[admin/network/publications/[id]] update failed:", error);
      redirect(`/${locale}/admin/network/publications/${params.id}?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/admin/network/publications");
    revalidatePath("/");
  }

  async function deletePublication() {
    "use server";
    const locale = await getLocale();
    const supabase = createClient();
    const { error } = await supabase.from("publications").delete().eq("id", params.id);
    if (error) {
      console.error("[admin/network/publications/[id]] delete failed:", error);
      redirect(`/${locale}/admin/network/publications/${params.id}?error=${encodeURIComponent(error.message)}`);
    }
    revalidatePath("/admin/network/publications");
    revalidatePath("/");
    redirect(`/${locale}/admin/network/publications`);
  }

  return (
    <div className="max-w-[560px]">
      <Link href="/admin/network/publications" className="text-[13.5px] font-semibold text-teal hover:text-ink dark:text-white transition mb-6 inline-block">
        &larr; All publications
      </Link>
      <h1 className="text-[24px] font-display font-bold text-ink dark:text-white mb-6">Edit publication</h1>

      {searchParams.error && (
        <div className="text-[13px] text-red-300 mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="font-mono break-all">{searchParams.error}</p>
        </div>
      )}

      <form action={updatePublication} className="space-y-4">
        <TextField name="title" label="Title" required defaultValue={pub.title} />
        <TextField name="authors" label="Authors" defaultValue={pub.authors ?? ""} />
        <TextField name="journal" label="Journal" defaultValue={pub.journal ?? ""} />
        <TextField name="published_on" label="Published on" type="date" defaultValue={pub.published_on ?? ""} />
        <TextField name="url" label="URL" type="url" defaultValue={pub.url ?? ""} />
        <SelectField
          name="trial_id"
          label="Related trial"
          options={(trials ?? []).map((t) => ({ value: t.id, label: t.title }))}
          defaultValue={pub.trial_id ?? ""}
        />
        <button type="submit" className="adm-btn-primary w-full">
          Save changes
        </button>
      </form>

      <form action={deletePublication} className="mt-6">
        <button type="submit" className="text-[13px] font-semibold text-red-400 hover:text-red-300 transition">
          Delete publication
        </button>
      </form>
    </div>
  );
}
