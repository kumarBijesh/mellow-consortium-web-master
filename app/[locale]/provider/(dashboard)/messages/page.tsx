import { Link } from "@/i18n/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProviderMessagesPage() {
  const supabase = createClient();
  const user = await getCurrentUser();

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
  // can't auto-embed profiles(...) off this table. Separate query + map.
  const patientIds = (connections ?? []).map((c) => c.patient_id);
  const { data: patientProfiles } =
    patientIds.length > 0 ? await supabase.from("profiles").select("id, full_name, email").in("id", patientIds) : { data: [] };
  const profileByPatientId = new Map((patientProfiles ?? []).map((p) => [p.id, p]));

  const connectionIds = (connections ?? []).map((c) => c.id);
  const { data: unreadRows } = user && connectionIds.length > 0
    ? await supabase.from("messages").select("connection_id").in("connection_id", connectionIds).neq("sender_id", user.id).is("read_at", null)
    : { data: [] };
  const unreadConnectionIds = new Set((unreadRows ?? []).map((m) => m.connection_id));

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-1">Messages</h1>
      <p className="text-muted dark:text-white/60 text-[14.5px] mb-10">Conversations with your connected patients.</p>

      {error && (
        <p className="text-[14px] text-red-600 mb-8">
          Couldn&apos;t load your conversations. Make sure{" "}
          <code className="px-1.5 py-0.5 bg-lightblue dark:bg-teal/[0.08] rounded text-[13px]">supabase/provider-dashboard.sql</code> has been run.
        </p>
      )}

      <div className="space-y-2.5">
        {(connections ?? []).map((c) => {
          const patient = profileByPatientId.get(c.patient_id) ?? null;
          const hasUnread = unreadConnectionIds.has(c.id);
          return (
            <Link
              key={c.id}
              href={`/provider/messages/${c.id}`}
              className="flex items-center justify-between gap-4 rounded-[14px] border border-line dark:border-white/10 p-5 hover:border-blue transition"
            >
              <div className="flex items-center gap-2.5">
                {hasUnread && <span className="w-2 h-2 rounded-full bg-blue flex-none" aria-hidden="true" />}
                <div>
                  <p className="text-[14.5px] font-semibold text-navy dark:text-white">{patient?.full_name || "Unnamed patient"}</p>
                  {patient?.email && <p className="text-[13px] text-muted dark:text-white/60 mt-0.5">{patient.email}</p>}
                </div>
              </div>
              <span className="text-[13px] font-semibold text-blue">{hasUnread ? "New messages →" : "Open →"}</span>
            </Link>
          );
        })}

        {(!connections || connections.length === 0) && !error && (
          <div className="rounded-[14px] border border-line dark:border-white/10 p-10 text-center">
            <p className="text-muted dark:text-white/60 text-[14.5px]">
              No conversations yet. Once a patient connects with you, their thread will show up here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
