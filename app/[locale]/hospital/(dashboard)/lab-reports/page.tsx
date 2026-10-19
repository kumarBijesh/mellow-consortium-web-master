import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Document = {
  id: string;
  file_name: string;
  created_at: string;
  patient_id: string;
  patient: { full_name: string | null; email: string | null } | null;
};

function SampleTag() {
  return (
    <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted dark:text-white/40 border border-line dark:border-white/15 rounded-full px-2 py-0.5">
      Sample
    </span>
  );
}

export default async function HospitalLabReportsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: hospital } = await supabase.from("hospitals").select("id").eq("user_id", user?.id ?? "").maybeSingle();

  const { data: providers } = hospital
    ? await supabase.from("provider_profiles").select("id").eq("hospital_id", hospital.id)
    : { data: [] };
  const providerIds = (providers ?? []).map((p) => p.id);

  // This hospital's active patient roster (documents' RLS is patient/
  // connected-provider scoped, so we look up which patients are
  // connected to this hospital's providers, then read documents
  // uploaded under their record).
  const { data: connections } =
    providerIds.length > 0
      ? await supabase
          .from("patient_provider_connections")
          .select("patient_id")
          .in("provider_id", providerIds)
          .eq("status", "ACTIVE")
      : { data: [] };
  const patientIds = Array.from(new Set((connections ?? []).map((c) => c.patient_id)));

  const { data: documentsRaw, error } =
    patientIds.length > 0
      ? await supabase
          .from("documents")
          .select("id, file_name, created_at, patient_id, patient:profiles(full_name, email)")
          .in("patient_id", patientIds)
          .eq("category", "Lab reports")
          .order("created_at", { ascending: false })
      : { data: [] as Document[], error: null };

  const documents = (documentsRaw ?? []) as unknown as Document[];

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-1">Lab Reports</h1>
      <p className="text-muted dark:text-white/60 text-[14.5px] mb-8">
        Lab report files uploaded by patients under this hospital&apos;s care.
      </p>

      {error && (
        <p className="text-[14px] text-red-600 mb-6">
          Couldn&apos;t load lab reports. Make sure{" "}
          <code className="px-1.5 py-0.5 bg-lightblue dark:bg-teal/[0.08] rounded text-[13px]">
            supabase/patient-provider-documents-and-single-connection.sql
          </code>{" "}
          has been run.
        </p>
      )}

      {/* Biomarker-level detail (bio age, risk, glucose, hs-CRP...) has no
          real backing anywhere in this project — no biomarker table, no
          scoring formula. Same "sample, clearly labeled" treatment as the
          patient dashboard, not fabricated as if real. */}
      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-display font-bold text-navy dark:text-white">Biomarker summary</h2>
          <SampleTag />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniStat label="High-risk" value="0" />
          <MiniStat label="Avg bioage gap" value="−10.1 yrs" />
          <MiniStat label="Avg glucose" value="101.4 mg/dL" />
          <MiniStat label="Avg hs-CRP" value="3.34 mg/L" />
        </div>
      </div>

      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
        <div className="p-5 border-b border-line dark:border-white/10">
          <h2 className="text-[15px] font-display font-bold text-navy dark:text-white">Lab report files ({documents.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line dark:border-white/10 text-[11px] uppercase tracking-[0.06em] text-muted dark:text-white/60">
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Patient</th>
                <th className="px-5 py-3 font-semibold">File</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-b border-line dark:border-white/10 last:border-0">
                  <td className="px-5 py-3 text-navy dark:text-white font-medium whitespace-nowrap">
                    {new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 text-muted dark:text-white/60">{d.patient?.full_name || d.patient?.email || ""}</td>
                  <td className="px-5 py-3 text-muted dark:text-white/60">{d.file_name}</td>
                </tr>
              ))}
              {documents.length === 0 && !error && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-muted dark:text-white/60">
                    No lab report files uploaded yet.
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line dark:border-white/10 p-4">
      <p className="text-[11px] uppercase tracking-[0.08em] text-muted dark:text-white/50 mb-2">{label}</p>
      <p className="text-[20px] font-display font-bold text-navy dark:text-white">{value}</p>
    </div>
  );
}
