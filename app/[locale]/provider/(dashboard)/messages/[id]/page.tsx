import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import MessageThread from "@/components/messaging/MessageThread";

export const dynamic = "force-dynamic";

export default async function ProviderMessageThreadPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: connection } = await supabase
    .from("patient_provider_connections")
    .select("id, patient_id, status, provider_profiles(provider_user_id)")
    .eq("id", params.id)
    .maybeSingle();

  const provider = connection?.provider_profiles as unknown as { provider_user_id: string | null } | null;
  if (!connection || connection.status !== "ACTIVE" || provider?.provider_user_id !== user?.id) notFound();

  const [{ data: patient }, { data: messages }] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", connection.patient_id).maybeSingle(),
    supabase.from("messages").select("id, sender_id, body, created_at").eq("connection_id", connection.id).order("created_at", { ascending: true }),
  ]);

  return (
    <div>
      <Link href="/provider/messages" className="text-[13px] text-muted dark:text-white/60 hover:text-navy dark:text-white transition">
        ← All conversations
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-[22px] text-navy dark:text-white">{patient?.full_name || "Unnamed patient"}</h1>
        {patient?.email && <p className="text-[13.5px] text-muted dark:text-white/60 mt-1">{patient.email}</p>}
      </div>

      <MessageThread connectionId={connection.id} currentUserId={user?.id ?? ""} messages={messages ?? []} />
    </div>
  );
}
