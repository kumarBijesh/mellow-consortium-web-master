import { notFound, redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { TextField, SelectField } from "@/components/admin/AdminFields";
import { strOrNull } from "@/lib/network-constants";

export const dynamic = "force-dynamic";

export default async function EditTrialSitePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const [{ data: site }, { data: trials }, { data: institutions }] = await Promise.all([
    supabase.from("trial_sites").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("trials").select("id, title").order("title"),
    supabase.from("institutions").select("id, name").order("name"),
  ]);
  if (!site) notFound();

  async function updateTrialSite(formData: FormData) {
    "use server";
    const locale = await getLocale();
    const trialId = String(formData.get("trial_id") ?? "").trim();
    const country = String(formData.get("country") ?? "").trim();
    if (!trialId || !country) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("trial_sites")
      .update({
        trial_id: trialId,
        country,
        city: strOrNull(formData.get("city")),
        institution_id: strOrNull(formData.get("institution_id")),
      })
      .eq("id", params.id);

    if (error) {
      console.error("[admin/network/trial-sites/[id]] update failed:", error);
      redirect(`/${locale}/admin/network/trial-sites/${params.id}?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/admin/network/trial-sites");
    revalidatePath("/");
  }

  async function deleteTrialSite() {
    "use server";
    const locale = await getLocale();
    const supabase = createClient();
    const { error } = await supabase.from("trial_sites").delete().eq("id", params.id);
    if (error) {
      console.error("[admin/network/trial-sites/[id]] delete failed:", error);
      redirect(`/${locale}/admin/network/trial-sites/${params.id}?error=${encodeURIComponent(error.message)}`);
    }
    revalidatePath("/admin/network/trial-sites");
    revalidatePath("/");
    redirect(`/${locale}/admin/network/trial-sites`);
  }

  return (
    <div className="max-w-[560px]">
      <Link href="/admin/network/trial-sites" className="text-[13.5px] font-semibold text-teal hover:text-ink dark:text-white transition mb-6 inline-block">
        &larr; All trial sites
      </Link>
      <h1 className="text-[24px] font-display font-bold text-ink dark:text-white mb-6">Edit trial site</h1>

      {searchParams.error && (
        <div className="text-[13px] text-red-300 mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="font-mono break-all">{searchParams.error}</p>
        </div>
      )}

      <form action={updateTrialSite} className="space-y-4">
        <SelectField
          name="trial_id"
          label="Trial"
          required
          options={(trials ?? []).map((t) => ({ value: t.id, label: t.title }))}
          defaultValue={site.trial_id}
          placeholder=""
        />
        <TextField name="country" label="Country" required defaultValue={site.country} />
        <TextField name="city" label="City" defaultValue={site.city ?? ""} />
        <SelectField
          name="institution_id"
          label="Institution"
          options={(institutions ?? []).map((i) => ({ value: i.id, label: i.name }))}
          defaultValue={site.institution_id ?? ""}
        />
        <button type="submit" className="adm-btn-primary w-full">
          Save changes
        </button>
      </form>

      <form action={deleteTrialSite} className="mt-6">
        <button type="submit" className="text-[13px] font-semibold text-red-400 hover:text-red-300 transition">
          Delete trial site
        </button>
      </form>
    </div>
  );
}
