import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StatusBadge from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminHospitalDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: hospital } = await supabase
    .from("hospitals")
    .select("id, name, admin_email, status, created_at, countries")
    .eq("id", params.id)
    .maybeSingle();

  if (!hospital) notFound();

  const [{ data: locations }, { data: providers }] = await Promise.all([
    supabase
      .from("locations")
      .select("id, name, city, state_province, country, status")
      .eq("hospital_id", params.id)
      .order("name"),
    supabase
      .from("provider_profiles")
      .select("id, name, email, specialty, status")
      .eq("hospital_id", params.id)
      .order("name"),
  ]);

  return (
    <div>
      <Link href="/admin/hospitals" className="text-[13px] text-muted dark:text-white/40 hover:text-ink dark:text-white transition">
        ← All hospitals
      </Link>

      <div className="flex items-start justify-between gap-4 mt-4 mb-8">
        <div>
          <h1 className="text-[26px] font-display font-bold text-ink dark:text-white">{hospital.name}</h1>
          <p className="text-[13.5px] text-muted dark:text-white/40 mt-1">{hospital.admin_email}</p>
        </div>
        <StatusBadge status={hospital.status} />
      </div>

      <p className="text-[13.5px] text-muted dark:text-white/40 mb-10">
        Countries: {(hospital.countries ?? []).join(", ") || ""}
      </p>

      <h2 className="text-[15px] font-semibold text-ink dark:text-white mb-4">Locations ({locations?.length ?? 0})</h2>
      <div className="adm-card overflow-hidden overflow-x-auto mb-10">
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-line dark:border-white/[0.08] text-[11px] uppercase tracking-[0.06em] text-muted dark:text-white/35">
              <th className="px-5 py-3.5 font-semibold">Name</th>
              <th className="px-5 py-3.5 font-semibold">City</th>
              <th className="px-5 py-3.5 font-semibold">Country</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {(locations ?? []).map((l) => (
              <tr key={l.id} className="border-b border-line dark:border-white/[0.06] last:border-0">
                <td className="px-5 py-3.5 text-ink dark:text-white font-medium">{l.name}</td>
                <td className="px-5 py-3.5 text-muted dark:text-white/50">{[l.city, l.state_province].filter(Boolean).join(", ") || ""}</td>
                <td className="px-5 py-3.5 text-muted dark:text-white/50">{l.country}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={l.status} />
                </td>
              </tr>
            ))}
            {(!locations || locations.length === 0) && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted dark:text-white/30">
                  No locations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-[15px] font-semibold text-ink dark:text-white mb-4">Providers ({providers?.length ?? 0})</h2>
      <div className="adm-card overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-line dark:border-white/[0.08] text-[11px] uppercase tracking-[0.06em] text-muted dark:text-white/35">
              <th className="px-5 py-3.5 font-semibold">Name</th>
              <th className="px-5 py-3.5 font-semibold">Email</th>
              <th className="px-5 py-3.5 font-semibold">Specialty</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {(providers ?? []).map((p) => (
              <tr key={p.id} className="border-b border-line dark:border-white/[0.06] last:border-0">
                <td className="px-5 py-3.5 text-ink dark:text-white font-medium">{p.name}</td>
                <td className="px-5 py-3.5 text-muted dark:text-white/50">{p.email}</td>
                <td className="px-5 py-3.5 text-muted dark:text-white/50">{p.specialty || ""}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={p.status} />
                </td>
              </tr>
            ))}
            {(!providers || providers.length === 0) && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted dark:text-white/30">
                  No providers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
