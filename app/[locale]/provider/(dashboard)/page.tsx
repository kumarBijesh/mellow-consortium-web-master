import { Link } from "@/i18n/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STAT_VALUE_COLOR: Record<string, string> = {
  blue: "text-blue",
  teal: "text-teal",
  purple: "text-[#6B4EC7]",
  coral: "text-[#E8735A]",
};

const RISK_STYLES: Record<string, string> = {
  "Very low": "bg-lightblue text-blue dark:bg-blue/[0.15] dark:text-blue",
  Low: "bg-lightblue text-blue dark:bg-blue/[0.15] dark:text-blue",
  Moderate: "bg-[#fdf3d9] text-[#8a6a12] dark:bg-gold/[0.15] dark:text-gold",
  High: "bg-red-50 text-red-600 dark:bg-red-500/[0.15] dark:text-red-400",
};

export default async function ProviderDashboardPage() {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select("id")
    .eq("provider_user_id", user?.id ?? "")
    .maybeSingle();

  if (!provider) {
    return (
      <div>
        <h1 className="text-[26px] text-navy dark:text-white mb-6">Dashboard</h1>
        <p className="text-[14px] text-red-600">
          Couldn&apos;t load your provider profile. Make sure{" "}
          <code className="px-1.5 py-0.5 bg-lightblue dark:bg-teal/[0.08] rounded text-[13px]">supabase/provider-dashboard.sql</code> has been
          run.
        </p>
      </div>
    );
  }

  const { data: connections } = await supabase
    .from("patient_provider_connections")
    .select("id, patient_id")
    .eq("provider_id", provider.id)
    .eq("status", "ACTIVE");

  // patient_provider_connections.patient_id and profiles.id both
  // reference auth.users.id, but not each other directly — PostgREST
  // can't auto-embed profiles(...) off this table, it just silently
  // returns no relationship. Separate query + map, same pattern already
  // used in /provider/patients.
  const connectionIds = (connections ?? []).map((c) => c.id);
  const patientIds = (connections ?? []).map((c) => c.patient_id);
  const { data: patientProfiles } =
    patientIds.length > 0 ? await supabase.from("profiles").select("id, full_name").in("id", patientIds) : { data: [] };
  const nameByPatientId = new Map((patientProfiles ?? []).map((p) => [p.id, p.full_name]));

  const [{ data: allReports }, { data: unreadRows }] = await Promise.all([
    connectionIds.length > 0
      ? supabase
          .from("biomarker_reports")
          .select("connection_id, recorded_date, biological_age, chronological_age, risk_level")
          .in("connection_id", connectionIds)
          .order("recorded_date", { ascending: false })
      : Promise.resolve({ data: [] }),
    connectionIds.length > 0 && user
      ? supabase.from("messages").select("connection_id").in("connection_id", connectionIds).neq("sender_id", user.id).is("read_at", null)
      : Promise.resolve({ data: [] }),
  ]);

  // Latest report per connection (allReports is already ordered newest-first).
  type ReportRow = { connection_id: string; recorded_date: string; biological_age: number | null; chronological_age: number | null; risk_level: string | null };
  const latestByConnection = new Map<string, ReportRow>();
  for (const r of (allReports ?? []) as ReportRow[]) {
    if (!latestByConnection.has(r.connection_id)) latestByConnection.set(r.connection_id, r);
  }

  const unreadConnectionIds = new Set((unreadRows ?? []).map((m) => m.connection_id));

  const roster = (connections ?? []).map((c) => {
    const latest = latestByConnection.get(c.id);
    return {
      connectionId: c.id,
      name: nameByPatientId.get(c.patient_id) || "Unnamed patient",
      riskLevel: latest?.risk_level ?? null,
      biologicalAge: latest?.biological_age ?? null,
      chronologicalAge: latest?.chronological_age ?? null,
      lastUpdate: latest?.recorded_date ?? null,
      hasUnread: unreadConnectionIds.has(c.id),
    };
  });

  const stats = {
    activePatients: connections?.length ?? 0,
    highRisk: roster.filter((r) => r.riskLevel === "High").length,
    reportsReviewed: allReports?.length ?? 0,
    unreadMessages: unreadConnectionIds.size,
  };

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active patients", value: stats.activePatients, color: "blue" },
          { label: "High-risk flags", value: stats.highRisk, color: "coral" },
          { label: "Reports logged", value: stats.reportsReviewed, color: "purple" },
          { label: "Unread messages", value: stats.unreadMessages, color: "teal" },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-card stat-accent-${s.color} border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-5`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wide text-muted dark:text-white/50">{s.label}</p>
              <span className={`w-2 h-2 rounded-full stat-chip-${s.color}`} aria-hidden="true" />
            </div>
            <p className={`text-[28px] font-display font-bold mt-1 ${STAT_VALUE_COLOR[s.color]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden overflow-x-auto">
        <div className="px-5 py-4 border-b border-line dark:border-white/10">
          <h2 className="text-[15px] font-semibold text-navy dark:text-white">Risk-stratified patient roster</h2>
        </div>
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-line dark:border-white/10 text-[11px] uppercase tracking-[0.06em] text-muted dark:text-white/60">
              <th className="px-5 py-3 font-semibold">Patient</th>
              <th className="px-5 py-3 font-semibold">Risk</th>
              <th className="px-5 py-3 font-semibold">Biological age</th>
              <th className="px-5 py-3 font-semibold">Chronological age</th>
              <th className="px-5 py-3 font-semibold">Last update</th>
              <th className="px-5 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((r) => (
              <tr key={r.connectionId} className="border-b border-line dark:border-white/10 last:border-0">
                <td className="px-5 py-3.5 text-navy dark:text-white font-medium">
                  <span className="inline-flex items-center gap-2">
                    {r.hasUnread && <span className="w-2 h-2 rounded-full bg-blue flex-none" aria-hidden="true" />}
                    {r.name}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {r.riskLevel ? (
                    <span className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-full ${RISK_STYLES[r.riskLevel] ?? "bg-lightblue text-blue"}`}>
                      {r.riskLevel}
                    </span>
                  ) : (
                    <span className="text-muted dark:text-white/50">No reports yet</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-navy dark:text-white">{r.biologicalAge ?? ""}</td>
                <td className="px-5 py-3.5 text-muted dark:text-white/60">{r.chronologicalAge ?? ""}</td>
                <td className="px-5 py-3.5 text-muted dark:text-white/40">{r.lastUpdate ? new Date(r.lastUpdate).toLocaleDateString() : ""}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/provider/patients/${r.connectionId}`} className="btn-chip">
                      View details
                    </Link>
                    <Link href={`/provider/messages/${r.connectionId}`} className="btn-chip-primary">
                      Message
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {roster.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted dark:text-white/60">
                  No connected patients yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
