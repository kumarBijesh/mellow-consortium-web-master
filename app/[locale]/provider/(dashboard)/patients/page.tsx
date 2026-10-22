import { Link } from "@/i18n/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import InvitePatientButton from "@/components/provider/InvitePatientButton";

export const dynamic = "force-dynamic";

export default async function ProviderPatientsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();
  const user = await getCurrentUser();
  const q = searchParams.q?.trim().toLowerCase();

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select("id")
    .eq("provider_user_id", user?.id ?? "")
    .maybeSingle();

  const { data: connections, error } = provider
    ? await supabase
        .from("patient_provider_connections")
        .select("id, patient_id, responded_at")
        .eq("provider_id", provider.id)
        .eq("status", "ACTIVE")
        .order("responded_at", { ascending: false })
    : { data: [], error: null };

  const patientIds = (connections ?? []).map((c) => c.patient_id);
  const { data: patientProfiles } =
    patientIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, email").in("id", patientIds)
      : { data: [] };
  const profileMap = new Map((patientProfiles ?? []).map((p) => [p.id, p]));

  let rows = (connections ?? []).map((c) => ({
    connectionId: c.id,
    respondedAt: c.responded_at,
    name: profileMap.get(c.patient_id)?.full_name || "Unnamed patient",
    email: profileMap.get(c.patient_id)?.email ?? "",
  }));

  if (q) {
    rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-[26px] text-navy dark:text-white">Patients</h1>
        <InvitePatientButton />
      </div>
      <p className="text-[13.5px] text-muted dark:text-white/60 mb-8">Patients connected with you.</p>

      {error && (
        <p className="text-[14px] text-red-600 mb-6">
          Couldn&apos;t load patients. Make sure <code className="px-1.5 py-0.5 bg-lightblue dark:bg-teal/[0.08] rounded text-[13px]">supabase/provider-dashboard.sql</code> has been run.
        </p>
      )}

      <form method="get" className="mb-6 max-w-[360px]">
        <input
          type="search"
          name="q"
          placeholder="Search by name or email…"
          defaultValue={q ?? ""}
          className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
        />
      </form>

      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-line dark:border-white/10 text-[11px] uppercase tracking-[0.06em] text-muted dark:text-white/60">
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Connected</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.connectionId} className="border-b border-line dark:border-white/10 last:border-0">
                <td className="px-5 py-3 text-navy dark:text-white font-medium">
                  <Link href={`/provider/patients/${r.connectionId}`} className="hover:text-blue transition">
                    {r.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-muted dark:text-white/60">{r.email}</td>
                <td className="px-5 py-3 text-muted dark:text-white/60">
                  {r.respondedAt ? new Date(r.respondedAt).toLocaleDateString() : ""}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !error && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-muted dark:text-white/60">
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
