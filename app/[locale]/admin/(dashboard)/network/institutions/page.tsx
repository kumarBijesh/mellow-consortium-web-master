import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import InstitutionForm from "@/components/admin/network/InstitutionForm";
import { AddInstituteButton } from "@/components/admin/network/InstitutionPicker";
import { createInstitution } from "@/lib/actions/institutions";

export const dynamic = "force-dynamic";

export default async function AdminInstitutionsPage() {
  const supabase = createClient();
  const { data: institutions, error } = await supabase
    .from("institutions")
    .select("id, name, country, city, region, is_hq, lat, lon")
    .order("name");

  return (
    <div>
      <Link href="/admin/network" className="text-[13.5px] font-semibold text-teal hover:text-ink dark:text-white transition mb-6 inline-block">
        &larr; Network
      </Link>
      <h1 className="text-[26px] font-display font-bold text-ink dark:text-white mb-1">Institutions</h1>
      <p className="text-[13.5px] text-muted dark:text-white/40 mb-5">
        Backs the "Research Sites" / "Clinical Sites" counts and the network map markers.
      </p>
      <div className="mb-8">
        <AddInstituteButton />
      </div>

      {error && (
        <div className="text-[14px] text-red-300 mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="font-mono text-[12.5px] break-all">{error.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-2.5">
          {(institutions ?? []).map((inst) => (
            <Link
              key={inst.id}
              href={`/admin/network/institutions/${inst.id}`}
              className="adm-card flex items-center justify-between p-4 hover:border-teal/30 transition"
            >
              <div>
                <span className="text-[14.5px] text-ink dark:text-white">{inst.name}</span>
                {inst.is_hq && <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-gold">HQ</span>}
                {(inst.lat == null || inst.lon == null) && (
                  <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-amber-500">Needs map coordinates</span>
                )}
                <p className="text-[12px] text-muted dark:text-white/40">
                  {[inst.city, inst.country].filter(Boolean).join(", ")}
                </p>
              </div>
              <span className="text-[12px] text-muted dark:text-white/40">{inst.region ?? ""}</span>
            </Link>
          ))}
          {(!institutions || institutions.length === 0) && !error && (
            <p className="text-muted dark:text-white/30 text-[14px]">No institutions yet.</p>
          )}
        </div>

        <div className="adm-card p-5 h-fit">
          <h2 className="text-[15px] font-semibold text-ink dark:text-white mb-4">New institution</h2>
          <InstitutionForm action={createInstitution} />
        </div>
      </div>
    </div>
  );
}
