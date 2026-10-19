import { createClient } from "@/lib/supabase/server";
import RequestActions from "@/components/provider/RequestActions";

export const dynamic = "force-dynamic";

export default async function ProviderRequestsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select("id")
    .eq("provider_user_id", user?.id ?? "")
    .maybeSingle();

  const { data: requests, error } = provider
    ? await supabase
        .from("patient_provider_connections")
        .select("id, patient_id, requested_at")
        .eq("provider_id", provider.id)
        .eq("status", "PENDING")
        .order("requested_at", { ascending: false })
    : { data: [], error: null };

  const patientIds = (requests ?? []).map((r) => r.patient_id);
  const { data: patientProfiles } =
    patientIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, email").in("id", patientIds)
      : { data: [] };
  const profileMap = new Map((patientProfiles ?? []).map((p) => [p.id, p]));

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-1">Requests</h1>
      <p className="text-[13.5px] text-muted dark:text-white/60 mb-8">Patients asking to connect with you.</p>

      {error && (
        <p className="text-[14px] text-red-600 mb-6">
          Couldn&apos;t load requests. Make sure <code className="px-1.5 py-0.5 bg-lightblue dark:bg-teal/[0.08] rounded text-[13px]">supabase/provider-dashboard.sql</code> has been run.
        </p>
      )}

      <div className="space-y-3">
        {(requests ?? []).map((r) => {
          const p = profileMap.get(r.patient_id);
          return (
            <div
              key={r.id}
              className="rounded-card border border-line dark:border-white/10 p-5 bg-white dark:bg-white/[0.03] flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-[15px] font-semibold text-navy dark:text-white">{p?.full_name || "Unnamed patient"}</p>
                <p className="text-[13px] text-muted dark:text-white/60">{p?.email ?? ""}</p>
                <p className="text-[12px] text-muted dark:text-white/60 mt-1">Requested {new Date(r.requested_at).toLocaleDateString()}</p>
              </div>
              <RequestActions connectionId={r.id} />
            </div>
          );
        })}

        {(!requests || requests.length === 0) && !error && (
          <p className="text-muted dark:text-white/60 text-[14px]">No pending requests.</p>
        )}
      </div>
    </div>
  );
}
