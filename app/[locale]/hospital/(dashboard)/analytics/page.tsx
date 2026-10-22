import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HospitalAnalyticsPage() {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: hospital } = await supabase.from("hospitals").select("id").eq("user_id", user?.id ?? "").maybeSingle();

  const { data: providers } = hospital
    ? await supabase.from("provider_profiles").select("id, status, specialty").eq("hospital_id", hospital.id)
    : { data: [] };
  const providerIds = (providers ?? []).map((p) => p.id);

  const { count: locationsCount } = hospital
    ? await supabase.from("locations").select("id", { count: "exact", head: true }).eq("hospital_id", hospital.id)
    : { count: 0 };

  const [connectionsResult, visitsResult] = await Promise.all([
    providerIds.length > 0
      ? supabase.from("patient_provider_connections").select("patient_id, status").in("provider_id", providerIds)
      : Promise.resolve({ data: [] }),
    providerIds.length > 0
      ? supabase.from("visits").select("visit_date").in("provider_id", providerIds)
      : Promise.resolve({ data: [] }),
  ]);

  const connections = connectionsResult.data ?? [];
  const visits = (visitsResult.data ?? []) as { visit_date: string }[];

  const activeProviders = (providers ?? []).filter((p) => p.status === "ACTIVE").length;
  const uniquePatients = new Set(connections.filter((c) => c.status === "ACTIVE").map((c) => c.patient_id)).size;

  const specialtyCounts = new Map<string, number>();
  for (const p of providers ?? []) {
    const key = p.specialty || "Unspecified";
    specialtyCounts.set(key, (specialtyCounts.get(key) ?? 0) + 1);
  }
  const specialtyRows = Array.from(specialtyCounts.entries()).sort((a, b) => b[1] - a[1]);
  const maxSpecialty = Math.max(1, ...specialtyRows.map(([, n]) => n));

  // Visits per month, last 6 months.
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-US", { month: "short" }) };
  });
  const visitCounts = new Map(months.map((m) => [m.key, 0]));
  for (const v of visits) {
    const d = new Date(v.visit_date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (visitCounts.has(key)) visitCounts.set(key, (visitCounts.get(key) ?? 0) + 1);
  }
  const maxVisits = Math.max(1, ...Array.from(visitCounts.values()));

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-6">Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active providers", value: activeProviders },
          { label: "Clinics", value: locationsCount ?? 0 },
          { label: "Active patients", value: uniquePatients },
          { label: "Total visits logged", value: visits.length },
        ].map((s) => (
          <div key={s.label} className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
            <p className="text-[11px] uppercase tracking-[0.08em] text-muted dark:text-white/50 mb-2">{s.label}</p>
            <p className="text-[28px] font-display font-bold text-navy dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6">
          <h2 className="text-[15px] font-display font-bold text-navy dark:text-white mb-5">Visits, last 6 months</h2>
          <div className="flex items-end gap-3 h-[140px]">
            {months.map((m) => {
              const count = visitCounts.get(m.key) ?? 0;
              const heightPct = Math.max(4, (count / maxVisits) * 100);
              return (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[12px] font-semibold text-navy dark:text-white">{count}</span>
                  <div className="w-full rounded-t-md bg-blue/80 dark:bg-teal/60" style={{ height: `${heightPct}%` }} />
                  <span className="text-[11px] text-muted dark:text-white/50">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6">
          <h2 className="text-[15px] font-display font-bold text-navy dark:text-white mb-5">Providers by specialty</h2>
          {specialtyRows.length > 0 ? (
            <div className="space-y-3">
              {specialtyRows.map(([specialty, count]) => (
                <div key={specialty}>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="text-navy dark:text-white font-medium">{specialty}</span>
                    <span className="text-muted dark:text-white/50">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-line dark:bg-white/10 overflow-hidden">
                    <span
                      className="block h-full rounded-full bg-teal"
                      style={{ width: `${(count / maxSpecialty) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13.5px] text-muted dark:text-white/60">No providers yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
