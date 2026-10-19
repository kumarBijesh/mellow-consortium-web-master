import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import InvestigatorForm from "@/components/admin/network/InvestigatorForm";
import { strOrNull } from "@/lib/network-constants";

export const dynamic = "force-dynamic";

async function createInvestigator(_prevState: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  "use server";
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { error: "Full name is required." };

  const supabase = createClient();
  const { error } = await supabase.from("investigators").insert({
    full_name: fullName,
    title: strOrNull(formData.get("title")),
    institution_id: strOrNull(formData.get("institution_id")),
    bio: strOrNull(formData.get("bio")),
    photo_url: strOrNull(formData.get("photo_url")),
  });

  if (error) {
    console.error("[admin/network/investigators] insert failed:", error);
    return { error: `${error.code ? `[${error.code}] ` : ""}${error.message}` };
  }

  revalidatePath("/admin/network/investigators");
  revalidatePath("/");
  return {};
}

export default async function AdminInvestigatorsPage() {
  const supabase = createClient();
  const [{ data: investigators, error }, { data: institutions }] = await Promise.all([
    supabase
      .from("investigators")
      .select("id, full_name, title, institutions(name)")
      .order("full_name"),
    supabase.from("institutions").select("id, name").order("name"),
  ]);

  return (
    <div>
      <Link href="/admin/network" className="text-[13.5px] font-semibold text-teal hover:text-ink dark:text-white transition mb-6 inline-block">
        &larr; Network
      </Link>
      <h1 className="text-[26px] font-display font-bold text-ink dark:text-white mb-1">Investigators</h1>
      <p className="text-[13.5px] text-muted dark:text-white/40 mb-8">Backs the "Investigators" count on the stats bar and network map.</p>

      {error && (
        <div className="text-[14px] text-red-300 mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="font-mono text-[12.5px] break-all">{error.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-2.5">
          {(investigators ?? []).map((inv) => {
            const institution = inv.institutions as unknown as { name: string } | null;
            return (
              <Link
                key={inv.id}
                href={`/admin/network/investigators/${inv.id}`}
                className="adm-card flex items-center justify-between p-4 hover:border-teal/30 transition"
              >
                <div>
                  <span className="text-[14.5px] text-ink dark:text-white">{inv.full_name}</span>
                  {inv.title && <span className="text-[12px] text-muted dark:text-white/40 ml-2">{inv.title}</span>}
                </div>
                <span className="text-[12px] text-muted dark:text-white/40">{institution?.name ?? ""}</span>
              </Link>
            );
          })}
          {(!investigators || investigators.length === 0) && !error && (
            <p className="text-muted dark:text-white/30 text-[14px]">No investigators yet.</p>
          )}
        </div>

        <div className="adm-card p-5 h-fit">
          <h2 className="text-[15px] font-semibold text-ink dark:text-white mb-4">New investigator</h2>
          <InvestigatorForm action={createInvestigator} institutions={institutions ?? []} />
        </div>
      </div>
    </div>
  );
}
