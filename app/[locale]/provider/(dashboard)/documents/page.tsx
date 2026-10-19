import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProviderDocumentsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: provider } = await supabase.from("provider_profiles").select("id").eq("provider_user_id", user?.id ?? "").maybeSingle();

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
  // can't auto-embed profiles(...) off this table. Separate query + map,
  // same pattern as every other provider list page.
  const patientIds = (connections ?? []).map((c) => c.patient_id);
  const { data: patientProfiles } =
    patientIds.length > 0 ? await supabase.from("profiles").select("id, full_name, email").in("id", patientIds) : { data: [] };
  const profileByPatientId = new Map((patientProfiles ?? []).map((p) => [p.id, p]));

  const connectionIds = (connections ?? []).map((c) => c.id);
  const { data: docRows } =
    connectionIds.length > 0
      ? await supabase.from("documents").select("connection_id").in("connection_id", connectionIds)
      : { data: [] };
  const docCountByConnection = new Map<string, number>();
  for (const d of docRows ?? []) {
    docCountByConnection.set(d.connection_id, (docCountByConnection.get(d.connection_id) ?? 0) + 1);
  }

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-1">Documents</h1>
      <p className="text-muted dark:text-white/60 text-[14.5px] mb-10">Files shared with each connected patient.</p>

      {error && (
        <p className="text-[14px] text-red-600 mb-8">
          Couldn&apos;t load your patients. Make sure{" "}
          <code className="px-1.5 py-0.5 bg-lightblue dark:bg-teal/[0.08] rounded text-[13px]">supabase/documents-connection-scoped.sql</code>{" "}
          has been run.
        </p>
      )}

      <div className="space-y-2.5">
        {(connections ?? []).map((c) => {
          const patient = profileByPatientId.get(c.patient_id) ?? null;
          const count = docCountByConnection.get(c.id) ?? 0;
          return (
            <Link
              key={c.id}
              href={`/provider/documents/${c.id}`}
              className="flex items-center justify-between gap-4 rounded-[14px] border border-line dark:border-white/10 p-5 hover:border-blue transition"
            >
              <div>
                <p className="text-[14.5px] font-semibold text-navy dark:text-white">{patient?.full_name || "Unnamed patient"}</p>
                {patient?.email && <p className="text-[13px] text-muted dark:text-white/60 mt-0.5">{patient.email}</p>}
              </div>
              <span className="text-[12.5px] font-semibold text-muted dark:text-white/60 whitespace-nowrap">
                {count} {count === 1 ? "document" : "documents"} →
              </span>
            </Link>
          );
        })}

        {(!connections || connections.length === 0) && !error && (
          <div className="rounded-[14px] border border-line dark:border-white/10 p-10 text-center">
            <p className="text-muted dark:text-white/60 text-[14.5px]">
              No connected patients yet. Once a patient connects with you, their document area will show up here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
