import { createClient, getCurrentUser } from "@/lib/supabase/server";
import MeetingRoomForm from "@/components/provider/MeetingRoomForm";
import ShareMeetingLinkForm from "@/components/provider/ShareMeetingLinkForm";

export const dynamic = "force-dynamic";

export default async function ProviderMeetingPage() {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select("id, meeting_url")
    .eq("provider_user_id", user?.id ?? "")
    .maybeSingle();

  const { data: connections } = provider
    ? await supabase.from("patient_provider_connections").select("id, patient_id").eq("provider_id", provider.id).eq("status", "ACTIVE")
    : { data: [] };

  // patient_provider_connections.patient_id and profiles.id both
  // reference auth.users.id, but not each other directly — PostgREST
  // can't auto-embed profiles(...) off this table. Separate query + map.
  const patientIds = (connections ?? []).map((c) => c.patient_id);
  const { data: patientProfiles } =
    patientIds.length > 0 ? await supabase.from("profiles").select("id, full_name").in("id", patientIds) : { data: [] };
  const nameByPatientId = new Map((patientProfiles ?? []).map((p) => [p.id, p.full_name]));

  const patients = (connections ?? []).map((c) => ({
    connectionId: c.id,
    name: nameByPatientId.get(c.patient_id) || "Unnamed patient",
  }));

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-8">Meeting</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6">
          <h2 className="text-[15px] font-semibold text-navy dark:text-white mb-4">Meeting room</h2>
          <MeetingRoomForm meetingUrl={provider?.meeting_url ?? null} />
        </div>

        <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6">
          <h2 className="text-[15px] font-semibold text-navy dark:text-white mb-4">Share with patient</h2>
          <ShareMeetingLinkForm meetingUrl={provider?.meeting_url ?? null} patients={patients} />
        </div>
      </div>
    </div>
  );
}
