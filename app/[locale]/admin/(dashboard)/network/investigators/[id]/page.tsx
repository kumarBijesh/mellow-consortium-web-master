import { notFound, redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { TextField, TextAreaField } from "@/components/admin/AdminFields";
import InstitutionPicker from "@/components/admin/network/InstitutionPicker";
import { strOrNull } from "@/lib/network-constants";

export const dynamic = "force-dynamic";

export default async function EditInvestigatorPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const [{ data: inv }, { data: institutions }, { data: privateContact, error: privateError }] = await Promise.all([
    supabase.from("investigators").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("institutions").select("id, name").order("name"),
    // Admin-only table (investigator-private.sql); RLS returns nothing for non-admins.
    supabase
      .from("investigator_private")
      .select("personal_email, street_address, city, state, postal_code, cv_path")
      .eq("investigator_id", params.id)
      .maybeSingle(),
  ]);
  if (!inv) notFound();

  let cvUrl: string | null = null;
  if (privateContact?.cv_path) {
    const { data } = await supabase.storage.from("investigator-cvs").createSignedUrl(privateContact.cv_path, 60 * 10);
    cvUrl = data?.signedUrl ?? null;
  }
  const address = privateContact
    ? [privateContact.street_address, privateContact.city, privateContact.state, privateContact.postal_code].filter(Boolean).join(", ")
    : "";

  async function updateInvestigator(formData: FormData) {
    "use server";
    const locale = await getLocale();
    const fullName = String(formData.get("full_name") ?? "").trim();
    if (!fullName) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("investigators")
      .update({
        full_name: fullName,
        title: strOrNull(formData.get("title")),
        institution_id: strOrNull(formData.get("institution_id")),
        bio: strOrNull(formData.get("bio")),
        photo_url: strOrNull(formData.get("photo_url")),
      })
      .eq("id", params.id);

    if (error) {
      console.error("[admin/network/investigators/[id]] update failed:", error);
      redirect(`/${locale}/admin/network/investigators/${params.id}?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/admin/network/investigators");
    revalidatePath("/");
    revalidatePath("/[locale]/investigators", "page");
    revalidatePath("/[locale]/investigators/[id]", "page");
  }

  async function deleteInvestigator() {
    "use server";
    const locale = await getLocale();
    const supabase = createClient();
    const { error } = await supabase.from("investigators").delete().eq("id", params.id);
    if (error) {
      console.error("[admin/network/investigators/[id]] delete failed:", error);
      redirect(`/${locale}/admin/network/investigators/${params.id}?error=${encodeURIComponent(error.message)}`);
    }
    revalidatePath("/admin/network/investigators");
    revalidatePath("/");
    redirect(`/${locale}/admin/network/investigators`);
  }

  return (
    <div className="max-w-[560px]">
      <Link href="/admin/network/investigators" className="text-[13.5px] font-semibold text-teal hover:text-ink dark:text-white transition mb-6 inline-block">
        &larr; All investigators
      </Link>
      <h1 className="text-[24px] font-display font-bold text-ink dark:text-white mb-6">Edit investigator</h1>

      {searchParams.error && (
        <div className="text-[13px] text-red-300 mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="font-mono break-all">{searchParams.error}</p>
        </div>
      )}

      {/* Admin-only contact details, used to follow up on introduction
          requests from the Inquiries inbox. Never shown on public pages. */}
      <div className="adm-card p-5 mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted dark:text-white/40 mb-3">Private contact (admins only)</p>
        {privateError ? (
          <p className="text-[13px] text-gold">Private contact details aren&apos;t available yet. Run supabase/investigator-private.sql.</p>
        ) : privateContact && (privateContact.personal_email || address || cvUrl) ? (
          <dl className="text-[13.5px] space-y-1.5">
            {privateContact.personal_email && (
              <div className="flex gap-3">
                <dt className="w-[70px] text-muted dark:text-white/40">Email</dt>
                <dd>
                  <a href={`mailto:${privateContact.personal_email}`} className="text-teal hover:underline">
                    {privateContact.personal_email}
                  </a>
                </dd>
              </div>
            )}
            {address && (
              <div className="flex gap-3">
                <dt className="w-[70px] text-muted dark:text-white/40">Address</dt>
                <dd className="text-ink dark:text-white/80">{address}</dd>
              </div>
            )}
            {cvUrl && (
              <div className="flex gap-3">
                <dt className="w-[70px] text-muted dark:text-white/40">CV</dt>
                <dd>
                  <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">
                    Open CV (link valid 10 min)
                  </a>
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-[13px] text-muted dark:text-white/40">No private contact details on file.</p>
        )}
      </div>

      <form action={updateInvestigator} className="space-y-4">
        <TextField name="full_name" label="Full name" required defaultValue={inv.full_name} />
        <TextField name="title" label="Title (e.g. MD, PhD)" defaultValue={inv.title ?? ""} />
        <InstitutionPicker institutions={institutions ?? []} defaultValue={inv.institution_id ?? ""} />
        <TextAreaField name="bio" label="Bio" defaultValue={inv.bio ?? ""} rows={4} />
        <TextField name="photo_url" label="Photo URL" defaultValue={inv.photo_url ?? ""} />
        <button type="submit" className="adm-btn-primary w-full">
          Save changes
        </button>
      </form>

      <form action={deleteInvestigator} className="mt-6">
        <button type="submit" className="text-[13px] font-semibold text-red-400 hover:text-red-300 transition">
          Delete investigator
        </button>
      </form>
    </div>
  );
}
