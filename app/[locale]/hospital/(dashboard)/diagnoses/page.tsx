import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Visit = {
  id: string;
  visit_date: string;
  diagnosis: string;
  provider_id: string;
  patient: { full_name: string | null } | null;
};

export default async function HospitalDiagnosesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: hospital } = await supabase.from("hospitals").select("id").eq("user_id", user?.id ?? "").maybeSingle();

  const { data: providers } = hospital
    ? await supabase.from("provider_profiles").select("id, name").eq("hospital_id", hospital.id)
    : { data: [] };
  const providerIds = (providers ?? []).map((p) => p.id);
  const providerNames = new Map((providers ?? []).map((p) => [p.id, p.name]));

  const { data: visitsRaw, error } =
    providerIds.length > 0
      ? await supabase
          .from("visits")
          .select("id, visit_date, diagnosis, provider_id, patient:profiles(full_name)")
          .in("provider_id", providerIds)
          .not("diagnosis", "is", null)
          .order("visit_date", { ascending: false })
      : { data: [] as Visit[], error: null };

  const diagnoses = (visitsRaw ?? []) as unknown as Visit[];

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-1">Diagnoses</h1>
      <p className="text-muted dark:text-white/60 text-[14.5px] mb-8">Diagnoses recorded across all providers at this hospital.</p>

      {error && <p className="text-[14px] text-red-600 mb-6">Couldn&apos;t load diagnoses. Try refreshing.</p>}

      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
        <div className="p-5 border-b border-line dark:border-white/10">
          <h2 className="text-[15px] font-display font-bold text-navy dark:text-white">Diagnoses ({diagnoses.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line dark:border-white/10 text-[11px] uppercase tracking-[0.06em] text-muted dark:text-white/60">
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Patient</th>
                <th className="px-5 py-3 font-semibold">Provider</th>
                <th className="px-5 py-3 font-semibold">Diagnosis</th>
              </tr>
            </thead>
            <tbody>
              {diagnoses.map((v) => (
                <tr key={v.id} className="border-b border-line dark:border-white/10 last:border-0">
                  <td className="px-5 py-3 text-navy dark:text-white font-medium whitespace-nowrap">
                    {new Date(v.visit_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 text-muted dark:text-white/60">{v.patient?.full_name || ""}</td>
                  <td className="px-5 py-3 text-muted dark:text-white/60">{providerNames.get(v.provider_id) ?? ""}</td>
                  <td className="px-5 py-3 text-navy dark:text-white">{v.diagnosis}</td>
                </tr>
              ))}
              {diagnoses.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted dark:text-white/60">
                    No diagnoses recorded yet.
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
