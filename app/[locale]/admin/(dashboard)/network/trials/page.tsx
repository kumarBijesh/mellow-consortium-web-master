import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import TrialForm from "@/components/admin/network/TrialForm";
import { httpUrlOrNull, strOrNull } from "@/lib/network-constants";

export const dynamic = "force-dynamic";

async function createTrial(_prevState: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  "use server";
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!title || !slug || !status) return { error: "Title, slug, and status are required." };
  const enrollUrl = httpUrlOrNull(formData.get("enroll_url"));
  if (enrollUrl === "invalid") return { error: "Enrol / listing URL must be a full http(s) link." };

  const supabase = createClient();
  const { error } = await supabase.from("trials").insert({
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
  });

  if (error) {
    console.error("[admin/network/trials] insert failed:", error);
    return { error: `${error.code ? `[${error.code}] ` : ""}${error.message}` };
  }

  revalidatePath("/admin/network/trials");
  revalidatePath("/");
  revalidatePath("/trials");
  return {};
}

export default async function AdminTrialsPage() {
  const supabase = createClient();
  const [{ data: trials, error }, { data: investigators }, { data: institutions }] = await Promise.all([
    supabase.from("trials").select("id, title, status, therapeutic_area").order("created_at", { ascending: false }),
    supabase.from("investigators").select("id, full_name").order("full_name"),
    supabase.from("institutions").select("id, name").order("name"),
  ]);

  return (
    <div>
      <Link href="/admin/network" className="text-[13.5px] font-semibold text-teal hover:text-ink dark:text-white transition mb-6 inline-block">
        &larr; Network
      </Link>
      <h1 className="text-[26px] font-display font-bold text-ink dark:text-white mb-1">Trials</h1>
      <p className="text-[13.5px] text-muted dark:text-white/40 mb-8">
        Backs the "Active Trials" hero badge. Status active/recruiting counts as active.
      </p>

      {error && (
        <div className="text-[14px] text-red-300 mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="font-mono text-[12.5px] break-all">{error.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-2.5">
          {(trials ?? []).map((trial) => (
            <Link
              key={trial.id}
              href={`/admin/network/trials/${trial.id}`}
              className="adm-card flex items-center justify-between p-4 hover:border-teal/30 transition"
            >
              <div>
                <span className="text-[14.5px] text-ink dark:text-white">{trial.title}</span>
                {trial.therapeutic_area && <span className="text-[12px] text-muted dark:text-white/40 ml-2">{trial.therapeutic_area}</span>}
              </div>
              <span className="text-[12px] uppercase tracking-wide text-muted dark:text-white/40">{trial.status}</span>
            </Link>
          ))}
          {(!trials || trials.length === 0) && !error && <p className="text-muted dark:text-white/30 text-[14px]">No trials yet.</p>}
        </div>

        <div className="adm-card p-5 h-fit">
          <h2 className="text-[15px] font-semibold text-ink dark:text-white mb-4">New trial</h2>
          <TrialForm
            action={createTrial}
            investigators={(investigators ?? []).map((i) => ({ id: i.id, name: i.full_name }))}
            institutions={institutions ?? []}
          />
        </div>
      </div>
    </div>
  );
}
