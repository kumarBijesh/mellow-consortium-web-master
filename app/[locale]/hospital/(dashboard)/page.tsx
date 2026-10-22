import { Link } from "@/i18n/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import CreateLocationForm from "@/components/hospital/CreateLocationForm";

export const dynamic = "force-dynamic";

export default async function HospitalDashboardPage() {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: hospital } = await supabase.from("hospitals").select("id, name").eq("user_id", user?.id ?? "").maybeSingle();

  const [{ data: locations }, { data: providers }, { count: patientCount }] = await Promise.all([
    hospital
      ? supabase.from("locations").select("id, name, address, city, state_province, country, postal_code, provider_locations(count)").eq("hospital_id", hospital.id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    hospital
      ? supabase.from("provider_profiles").select("id, name, specialty, email, provider_locations(locations(name))").eq("hospital_id", hospital.id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    hospital
      ? (async () => {
          const { data: hospProviders } = await supabase.from("provider_profiles").select("id").eq("hospital_id", hospital.id);
          const providerIds = (hospProviders ?? []).map((p) => p.id);
          if (providerIds.length === 0) return { count: 0 };
          return supabase
            .from("patient_provider_connections")
            .select("id", { count: "exact", head: true })
            .in("provider_id", providerIds)
            .eq("status", "ACTIVE");
        })()
      : Promise.resolve({ count: 0 }),
  ]);

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-6">Hospital Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Locations" value={(locations ?? []).length} color="blue" />
        <StatCard label="Providers" value={(providers ?? []).length} color="purple" />
        <StatCard label="Patients" value={patientCount ?? 0} color="teal" />
        <StatCard label="High-risk flags" value={0} color="coral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 items-start mb-8">
        <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[16px] font-display font-bold text-navy dark:text-white">Locations</h2>
            <CreateLocationForm />
          </div>
          <div className="space-y-2.5">
            {(locations ?? []).map((l) => {
              const addressParts = [l.address, l.city, l.state_province, l.postal_code, l.country].filter(Boolean);
              const providerCount = (l.provider_locations as unknown as { count: number }[] | undefined)?.[0]?.count ?? 0;
              return (
                <div key={l.id} className="rounded-xl border border-line dark:border-white/10 p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[14.5px] font-semibold text-navy dark:text-white">📍 {l.name}</p>
                    <p className="text-[12.5px] text-muted dark:text-white/50 mt-0.5">{addressParts.join(", ")}</p>
                  </div>
                  <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-lightblue dark:bg-teal/[0.08] text-blue whitespace-nowrap">
                    {providerCount} providers
                  </span>
                </div>
              );
            })}
            {(!locations || locations.length === 0) && (
              <p className="text-[13.5px] text-muted dark:text-white/60 text-center py-8">No locations yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[16px] font-display font-bold text-navy dark:text-white">Risk overview</h2>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-lightblue dark:bg-teal/[0.08] text-blue">0 reports</span>
          </div>
          <div className="rounded-xl border border-dashed border-line dark:border-white/15 p-10 text-center">
            <p className="text-[13.5px] text-muted dark:text-white/60">No reports yet.</p>
          </div>
        </div>
      </div>

      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-display font-bold text-navy dark:text-white">All providers</h2>
          <Link href="/hospital/providers" className="btn-primary !px-4 !py-2.5 text-[13.5px]">
            Manage Providers
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line dark:border-white/10 text-[11px] uppercase tracking-[0.06em] text-muted dark:text-white/50">
                <th className="py-2.5 font-semibold">Name</th>
                <th className="py-2.5 font-semibold">Specialty</th>
                <th className="py-2.5 font-semibold">Location</th>
                <th className="py-2.5 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody>
              {(providers ?? []).map((p) => {
                const locs = (p.provider_locations as unknown as { locations: { name: string } | null }[] | undefined) ?? [];
                const locNames = locs.map((pl) => pl.locations?.name).filter(Boolean).join(", ") || "";
                return (
                  <tr key={p.id} className="border-b border-line dark:border-white/10 last:border-0">
                    <td className="py-3 text-navy dark:text-white font-medium">{p.name}</td>
                    <td className="py-3 text-muted dark:text-white/60">{p.specialty || ""}</td>
                    <td className="py-3 text-muted dark:text-white/60">{locNames}</td>
                    <td className="py-3 text-muted dark:text-white/60">{p.email}</td>
                  </tr>
                );
              })}
              {(!providers || providers.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted dark:text-white/60">
                    No providers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const STAT_VALUE_COLOR: Record<string, string> = {
  blue: "text-blue",
  teal: "text-teal",
  purple: "text-[#6B4EC7]",
  coral: "text-[#E8735A]",
};

function StatCard({ label, value, color }: { label: string; value: number; color: "blue" | "teal" | "purple" | "coral" }) {
  return (
    <div className={`rounded-card stat-accent-${color} border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-5`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] uppercase tracking-[0.08em] text-muted dark:text-white/50">{label}</p>
        <span className={`w-2 h-2 rounded-full stat-chip-${color}`} aria-hidden="true" />
      </div>
      <p className={`text-[28px] font-display font-bold ${STAT_VALUE_COLOR[color]}`}>{value}</p>
    </div>
  );
}
