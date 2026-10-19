import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Connection = {
  id: string;
  status: string;
  patient: { id: string; full_name: string | null; email: string | null } | null;
};

export default async function HospitalPatientsPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const q = searchParams.q?.trim().toLowerCase();

  const { data: hospital } = await supabase.from("hospitals").select("id").eq("user_id", user?.id ?? "").maybeSingle();

  const { data: providers } = hospital
    ? await supabase.from("provider_profiles").select("id").eq("hospital_id", hospital.id)
    : { data: [] };
  const providerIds = (providers ?? []).map((p) => p.id);

  const { data: connectionsRaw, error } =
    providerIds.length > 0
      ? await supabase
          .from("patient_provider_connections")
          .select("id, status, patient:profiles(id, full_name, email)")
          .in("provider_id", providerIds)
          .eq("status", "ACTIVE")
      : { data: [] as Connection[], error: null };

  let connections = (connectionsRaw ?? []) as unknown as Connection[];
  // Dedupe — a patient could theoretically show up once per provider
  // they've been connected to historically, though the one-active-
  // connection rule keeps this to at most one row per patient today.
  const seen = new Set<string>();
  connections = connections.filter((c) => {
    if (!c.patient || seen.has(c.patient.id)) return false;
    seen.add(c.patient.id);
    return true;
  });

  if (q) {
    connections = connections.filter(
      (c) => c.patient?.full_name?.toLowerCase().includes(q) || c.patient?.email?.toLowerCase().includes(q)
    );
  }

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-6">All Patients</h1>

      {error && <p className="text-[14px] text-red-600 mb-6">Couldn&apos;t load patients. Try refreshing.</p>}

      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-5 border-b border-line dark:border-white/10">
          <h2 className="text-[15px] font-display font-bold text-navy dark:text-white">All patients ({connections.length})</h2>
          <form method="get">
            <input
              type="search"
              name="q"
              placeholder="Search…"
              defaultValue={q ?? ""}
              className="w-[220px] rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white px-4 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line dark:border-white/10 text-[11px] uppercase tracking-[0.06em] text-muted dark:text-white/60">
                <th className="px-5 py-3 font-semibold">Patient</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Gender</th>
                <th className="px-5 py-3 font-semibold">DOB</th>
                <th className="px-5 py-3 font-semibold">Country</th>
                <th className="px-5 py-3 font-semibold">Conditions</th>
              </tr>
            </thead>
            <tbody>
              {connections.map((c) => (
                <tr key={c.id} className="border-b border-line dark:border-white/10 last:border-0">
                  <td className="px-5 py-3 text-navy dark:text-white font-medium">{c.patient?.full_name || ""}</td>
                  <td className="px-5 py-3 text-muted dark:text-white/60">{c.patient?.email || ""}</td>
                  {/* No gender/DOB/country/conditions fields exist on profiles yet — shown
                      honestly as unset rather than guessed or fabricated. */}
                  <td className="px-5 py-3 text-muted dark:text-white/40">–</td>
                  <td className="px-5 py-3 text-muted dark:text-white/40">–</td>
                  <td className="px-5 py-3 text-muted dark:text-white/40">–</td>
                  <td className="px-5 py-3 text-muted dark:text-white/60">None</td>
                </tr>
              ))}
              {connections.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted dark:text-white/60">
                    No patients connected to this hospital&apos;s providers yet.
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
