import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PatientMessagesPage() {
  const t = await getTranslations("PatientDashboard.pages.messages");
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: connections, error } = await supabase
    .from("patient_provider_connections")
    .select("id, provider_profiles(name, specialty)")
    .eq("patient_id", user?.id ?? "")
    .eq("status", "ACTIVE")
    .order("responded_at", { ascending: false });

  const connectionIds = (connections ?? []).map((c) => c.id);
  const { data: unreadRows } = user && connectionIds.length > 0
    ? await supabase.from("messages").select("connection_id").in("connection_id", connectionIds).neq("sender_id", user.id).is("read_at", null)
    : { data: [] };
  const unreadConnectionIds = new Set((unreadRows ?? []).map((m) => m.connection_id));

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-1">{t("title")}</h1>
      <p className="text-muted dark:text-white/60 text-[14.5px] mb-10">{t("subtitle")}</p>

      {error && <p className="text-[14px] text-red-600 mb-8">{t("loadError")}</p>}

      <div className="space-y-2.5">
        {(connections ?? []).map((c) => {
          const provider = c.provider_profiles as unknown as { name: string; specialty: string | null } | null;
          const hasUnread = unreadConnectionIds.has(c.id);
          return (
            <Link
              key={c.id}
              href={`/dashboard/patient/messages/${c.id}`}
              className="flex items-center justify-between gap-4 rounded-[14px] border border-line dark:border-white/10 p-5 hover:border-blue transition"
            >
              <div className="flex items-center gap-2.5">
                {hasUnread && <span className="w-2 h-2 rounded-full bg-blue flex-none" aria-hidden="true" />}
                <div>
                  <p className="text-[14.5px] font-semibold text-navy dark:text-white">{provider?.name ?? t("providerFallback")}</p>
                  {provider?.specialty && <p className="text-[13px] text-muted dark:text-white/60 mt-0.5">{provider.specialty}</p>}
                </div>
              </div>
              <span className="text-[13px] font-semibold text-blue inline-flex items-center gap-1">
                {hasUnread ? t("newMessages") : t("open")} <span className="inline-block rtl:-scale-x-100">→</span>
              </span>
            </Link>
          );
        })}

        {(!connections || connections.length === 0) && !error && (
          <div className="rounded-[14px] border border-line dark:border-white/10 p-10 text-center">
            <p className="text-muted dark:text-white/60 text-[14.5px]">
              {t("empty")}{" "}
              <Link href="/dashboard/patient/providers" className="text-blue font-semibold">
                {t("findProviderLink")}
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
