import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import MessageThread from "@/components/messaging/MessageThread";

export const dynamic = "force-dynamic";

export default async function PatientMessageThreadPage({ params }: { params: { id: string } }) {
  const t = await getTranslations("PatientDashboard.pages.messageThread");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: connection } = await supabase
    .from("patient_provider_connections")
    .select("id, patient_id, status, provider_profiles(name, specialty)")
    .eq("id", params.id)
    .maybeSingle();

  if (!connection || connection.patient_id !== user?.id || connection.status !== "ACTIVE") notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("connection_id", connection.id)
    .order("created_at", { ascending: true });

  const provider = connection.provider_profiles as unknown as { name: string; specialty: string | null } | null;

  return (
    <div>
      <Link href="/dashboard/patient/messages" className="text-[13px] text-muted dark:text-white/60 hover:text-navy dark:text-white transition inline-flex items-center gap-1">
        <span className="inline-block rtl:-scale-x-100">←</span> {t("backToAll")}
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-[22px] text-navy dark:text-white">{provider?.name ?? t("providerFallback")}</h1>
        {provider?.specialty && <p className="text-[13.5px] text-muted dark:text-white/60 mt-1">{provider.specialty}</p>}
      </div>

      <MessageThread connectionId={connection.id} currentUserId={user?.id ?? ""} messages={messages ?? []} />
    </div>
  );
}
