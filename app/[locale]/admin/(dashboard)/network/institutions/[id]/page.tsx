import { notFound, redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import InstitutionForm from "@/components/admin/network/InstitutionForm";
import { updateInstitution } from "@/lib/actions/institutions";

export const dynamic = "force-dynamic";

export default async function EditInstitutionPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: inst } = await supabase.from("institutions").select("*").eq("id", params.id).maybeSingle();
  if (!inst) notFound();

  async function deleteInstitution() {
    "use server";
    const locale = await getLocale();
    const supabase = createClient();
    const { error } = await supabase.from("institutions").delete().eq("id", params.id);
    if (error) {
      console.error("[admin/network/institutions/[id]] delete failed:", error);
      redirect(`/${locale}/admin/network/institutions/${params.id}?error=${encodeURIComponent(error.message)}`);
    }
    revalidatePath("/[locale]/admin/network/institutions", "page");
    revalidatePath("/[locale]", "page");
    redirect(`/${locale}/admin/network/institutions`);
  }

  return (
    <div className="max-w-[560px]">
      <Link href="/admin/network/institutions" className="text-[13.5px] font-semibold text-teal hover:text-ink dark:text-white transition mb-6 inline-block">
        &larr; All institutions
      </Link>
      <h1 className="text-[24px] font-display font-bold text-ink dark:text-white mb-6">Edit institution</h1>

      {searchParams.error && (
        <div className="text-[13px] text-red-300 mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="font-mono break-all">{searchParams.error}</p>
        </div>
      )}

      <InstitutionForm
        action={updateInstitution.bind(null, params.id)}
        submitLabel="Save changes"
        pendingLabel="Saving…"
        successMessage="Saved."
        defaults={{
          name: inst.name,
          country: inst.country,
          city: inst.city ?? "",
          region: inst.region ?? "",
          lat: inst.lat != null ? String(inst.lat) : "",
          lon: inst.lon != null ? String(inst.lon) : "",
          specializations: (inst.specializations ?? []).join(", "),
          website: inst.website ?? "",
          logo_url: inst.logo_url ?? "",
          is_hq: inst.is_hq,
        }}
      />

      <form action={deleteInstitution} className="mt-6">
        <button type="submit" className="text-[13px] font-semibold text-red-400 hover:text-red-300 transition">
          Delete institution
        </button>
      </form>
    </div>
  );
}
