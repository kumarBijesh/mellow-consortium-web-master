import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import BiomarkerReportsPanel from "@/components/provider/BiomarkerReportsPanel";

export const dynamic = "force-dynamic";

export default async function ProviderLabReportsPage({ searchParams }: { searchParams: { connection?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select("id")
    .eq("provider_user_id", user?.id ?? "")
    .maybeSingle();

  const { data: connections, error } = provider
    ? await supabase
        .from("patient_provider_connections")
        .select("id, patient_id")
        .eq("provider_id", provider.id)
        .eq("status", "ACTIVE")
        .order("responded_at", { ascending: false })
    : { data: [], error: null };

  // patient_provider_connections.patient_id and profiles.id both
  // reference auth.users.id, but not each other directly — PostgREST
  // can't auto-embed profiles(...) off this table. Separate query + map.
  const patientIds = (connections ?? []).map((c) => c.patient_id);
  const { data: patientProfiles } =
    patientIds.length > 0 ? await supabase.from("profiles").select("id, full_name").in("id", patientIds) : { data: [] };
  const nameByPatientId = new Map((patientProfiles ?? []).map((p) => [p.id, p.full_name]));

  const patients = (connections ?? []).map((c) => ({
    connectionId: c.id,
    patientId: c.patient_id,
    name: nameByPatientId.get(c.patient_id) || "Unnamed patient",
  }));

  const activeConnectionId = searchParams.connection ?? patients[0]?.connectionId;
  const activePatient = patients.find((p) => p.connectionId === activeConnectionId);

  const { data: reports } = activeConnectionId
    ? await supabase
        .from("biomarker_reports")
        .select("id, recorded_date, biological_age, chronological_age, crp, glucose, risk_level, notes")
        .eq("connection_id", activeConnectionId)
        .order("recorded_date", { ascending: false })
    : { data: [] };

  const latest = reports?.[0];

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-1">Lab Reports</h1>
      <p className="text-[13.5px] text-muted dark:text-white/60 mb-8">Biomarker report history across your connected patients.</p>

      {error && (
        <p className="text-[14px] text-red-600 mb-6">
          Couldn&apos;t load patients. Make sure{" "}
          <code className="px-1.5 py-0.5 bg-lightblue dark:bg-teal/[0.08] rounded text-[13px]">supabase/provider-dashboard-depth.sql</code> has
          been run.
        </p>
      )}

      {patients.length === 0 && !error ? (
        <p className="text-muted dark:text-white/60 text-[14.5px]">No connected patients yet.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden h-fit">
            {patients.map((p) => (
              <Link
                key={p.connectionId}
                href={`/provider/lab-reports?connection=${p.connectionId}`}
                className={`block px-4 py-3 text-[13.5px] border-b border-line dark:border-white/10 last:border-0 transition ${
                  p.connectionId === activeConnectionId
                    ? "bg-lightblue dark:bg-blue/[0.12] text-blue font-semibold"
                    : "text-navy dark:text-white hover:bg-lightblue/50 dark:hover:bg-white/[0.04]"
                }`}
              >
                {p.name}
              </Link>
            ))}
          </div>

          <div className="space-y-6">
            {activePatient && latest && (
              <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6">
                <h2 className="text-[15px] font-semibold text-navy dark:text-white mb-4">Latest for {activePatient.name}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-[12px] border border-line dark:border-white/10 p-4">
                    <p className="text-[11px] uppercase tracking-wide text-muted dark:text-white/50">Chronological age</p>
                    <p className="text-[24px] font-display font-bold text-navy dark:text-white mt-1">{latest.chronological_age ?? ""}</p>
                  </div>
                  <div className="rounded-[12px] border border-blue/30 bg-lightblue/50 dark:bg-blue/[0.1] dark:border-blue/20 p-4">
                    <p className="text-[11px] uppercase tracking-wide text-blue">Biological age</p>
                    <p className="text-[24px] font-display font-bold text-blue mt-1">{latest.biological_age ?? ""}</p>
                  </div>
                </div>
              </div>
            )}

            {activeConnectionId && activePatient && (
              <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6">
                <h2 className="text-[15px] font-semibold text-navy dark:text-white mb-4">Report history for {activePatient.name}</h2>
                <BiomarkerReportsPanel connectionId={activeConnectionId} patientId={activePatient.patientId} reports={reports ?? []} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
