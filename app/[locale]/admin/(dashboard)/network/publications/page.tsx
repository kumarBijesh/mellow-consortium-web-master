import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import PublicationForm from "@/components/admin/network/PublicationForm";
import { strOrNull } from "@/lib/network-constants";

export const dynamic = "force-dynamic";

async function createPublication(_prevState: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  "use server";
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Title is required." };

  const supabase = createClient();
  const { error } = await supabase.from("publications").insert({
    title,
    authors: strOrNull(formData.get("authors")),
    journal: strOrNull(formData.get("journal")),
    published_on: strOrNull(formData.get("published_on")),
    url: strOrNull(formData.get("url")),
    trial_id: strOrNull(formData.get("trial_id")),
  });

  if (error) {
    console.error("[admin/network/publications] insert failed:", error);
    return { error: `${error.code ? `[${error.code}] ` : ""}${error.message}` };
  }

  revalidatePath("/admin/network/publications");
  revalidatePath("/");
  return {};
}

export default async function AdminPublicationsPage() {
  const supabase = createClient();
  const [{ data: publications, error }, { data: trials }] = await Promise.all([
    supabase.from("publications").select("id, title, journal, published_on").order("published_on", { ascending: false }),
    supabase.from("trials").select("id, title").order("title"),
  ]);

  return (
    <div>
      <Link href="/admin/network" className="text-[13.5px] font-semibold text-teal hover:text-ink dark:text-white transition mb-6 inline-block">
        &larr; Network
      </Link>
      <h1 className="text-[26px] font-display font-bold text-ink dark:text-white mb-1">Publications</h1>
      <p className="text-[13.5px] text-muted dark:text-white/40 mb-8">
        Backs the "Publications" stat. No content model existed for this before. JLIVE, the publishing arm, is
        still a coming-soon stub, so this is a minimal list, not a full journal CMS.
      </p>

      {error && (
        <div className="text-[14px] text-red-300 mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="font-mono text-[12.5px] break-all">{error.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-2.5">
          {(publications ?? []).map((pub) => (
            <Link
              key={pub.id}
              href={`/admin/network/publications/${pub.id}`}
              className="adm-card flex items-center justify-between p-4 hover:border-teal/30 transition"
            >
              <div>
                <span className="text-[14.5px] text-ink dark:text-white">{pub.title}</span>
                {pub.journal && <span className="text-[12px] text-muted dark:text-white/40 ml-2">{pub.journal}</span>}
              </div>
              {pub.published_on && (
                <span className="text-[12px] text-muted dark:text-white/40">{new Date(pub.published_on).toLocaleDateString()}</span>
              )}
            </Link>
          ))}
          {(!publications || publications.length === 0) && !error && (
            <p className="text-muted dark:text-white/30 text-[14px]">No publications yet.</p>
          )}
        </div>

        <div className="adm-card p-5 h-fit">
          <h2 className="text-[15px] font-semibold text-ink dark:text-white mb-4">New publication</h2>
          <PublicationForm action={createPublication} trials={(trials ?? []).map((t) => ({ id: t.id, name: t.title }))} />
        </div>
      </div>
    </div>
  );
}
