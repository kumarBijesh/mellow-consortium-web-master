import { notFound, redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { TextField, TextAreaField, SelectField } from "@/components/admin/AdminFields";
import { TRIAL_STATUSES, strOrNull, httpUrlOrNull } from "@/lib/network-constants";

export const dynamic = "force-dynamic";

export default async function EditTrialPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const [{ data: trial }, { data: investigators }, { data: institutions }] = await Promise.all([
    supabase.from("trials").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("investigators").select("id, full_name").order("full_name"),
    supabase.from("institutions").select("id, name").order("name"),
  ]);
  if (!trial) notFound();

  async function updateTrial(formData: FormData) {
    "use server";
    const locale = await getLocale();
    const title = String(formData.get("title") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    if (!title || !slug || !status) return;
    const enrollUrl = httpUrlOrNull(formData.get("enroll_url"));
    if (enrollUrl === "invalid") {
      redirect(`/${locale}/admin/network/trials/${params.id}?error=${encodeURIComponent("Enrol / listing URL must be a full http(s) link.")}`);
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("trials")
      .update({
        title,
        slug,
        status,
        summary: strOrNull(formData.get("summary")),
        therapeutic_area: strOrNull(formData.get("therapeutic_area")),
        lead_investigator_id: strOrNull(formData.get("lead_investigator_id")),
        sponsor_institution_id: strOrNull(formData.get("sponsor_institution_id")),
        starts_on: strOrNull(formData.get("starts_on")),
        ends_on: strOrNull(formData.get("ends_on")),
        location: strOrNull(formData.get("location")),
        enroll_url: enrollUrl,
      })
      .eq("id", params.id);

    if (error) {
      console.error("[admin/network/trials/[id]] update failed:", error);
      redirect(`/${locale}/admin/network/trials/${params.id}?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/admin/network/trials");
    revalidatePath("/");
    revalidatePath("/trials");
    revalidatePath(`/trials/${slug}`);
  }

  async function deleteTrial() {
    "use server";
    const locale = await getLocale();
    const supabase = createClient();
    const { error } = await supabase.from("trials").delete().eq("id", params.id);
    if (error) {
      console.error("[admin/network/trials/[id]] delete failed:", error);
      redirect(`/${locale}/admin/network/trials/${params.id}?error=${encodeURIComponent(error.message)}`);
    }
    revalidatePath("/admin/network/trials");
    revalidatePath("/");
    revalidatePath("/trials");
    redirect(`/${locale}/admin/network/trials`);
  }

  return (
    <div className="max-w-[560px]">
      <Link href="/admin/network/trials" className="text-[13.5px] font-semibold text-teal hover:text-ink dark:text-white transition mb-6 inline-block">
        &larr; All trials
      </Link>
      <h1 className="text-[24px] font-display font-bold text-ink dark:text-white mb-6">Edit trial</h1>

      {searchParams.error && (
        <div className="text-[13px] text-red-300 mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="font-mono break-all">{searchParams.error}</p>
        </div>
      )}

      <form action={updateTrial} className="space-y-4">
        <TextField name="title" label="Title" required defaultValue={trial.title} />
        <TextField name="slug" label="Slug" required defaultValue={trial.slug} />
        <TextAreaField name="summary" label="Summary" defaultValue={trial.summary ?? ""} rows={4} />
        <SelectField
          name="status"
          label="Status"
          required
          options={TRIAL_STATUSES.map((s) => ({ value: s, label: s }))}
          defaultValue={trial.status}
          placeholder=""
        />
        <TextField name="therapeutic_area" label="Therapeutic area" defaultValue={trial.therapeutic_area ?? ""} />
        <SelectField
          name="lead_investigator_id"
          label="Lead investigator"
          options={(investigators ?? []).map((i) => ({ value: i.id, label: i.full_name }))}
          defaultValue={trial.lead_investigator_id ?? ""}
        />
        <SelectField
          name="sponsor_institution_id"
          label="Sponsor institution"
          options={(institutions ?? []).map((i) => ({ value: i.id, label: i.name }))}
          defaultValue={trial.sponsor_institution_id ?? ""}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField name="starts_on" label="Starts on" type="date" defaultValue={trial.starts_on ?? ""} />
          <TextField name="ends_on" label="Ends on" type="date" defaultValue={trial.ends_on ?? ""} />
        </div>
        <TextField name="location" label="Location" defaultValue={trial.location ?? ""} />
        <TextField name="enroll_url" label="Enrol / listing URL" type="url" defaultValue={trial.enroll_url ?? ""} />
        <p className="text-[12px] text-muted dark:text-white/40 -mt-2">
          Link to the trial&apos;s listing on musbresearch.com/trials (or wherever patients enrol). Shown as an enrol button on the public trial page.
        </p>
        <button type="submit" className="adm-btn-primary w-full">
          Save changes
        </button>
      </form>

      <form action={deleteTrial} className="mt-6">
        <button type="submit" className="text-[13px] font-semibold text-red-400 hover:text-red-300 transition">
          Delete trial
        </button>
      </form>
    </div>
  );
}
