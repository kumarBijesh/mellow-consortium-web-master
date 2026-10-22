import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MedicalRecordsPage() {
  const t = await getTranslations("PatientDashboard.pages.medicalRecords");
  const supabase = createClient();
  const user = await getCurrentUser();

  const [{ data: visits }, { count: documentsCount }, { data: connections }] = user
    ? await Promise.all([
        supabase
          .from("visits")
          .select("id, visit_date, diagnosis, provider_profiles(name)")
          .eq("patient_id", user.id)
          .order("visit_date", { ascending: false })
          .limit(5),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("patient_id", user.id),
        supabase
          .from("patient_provider_connections")
          .select("id, status, provider_profiles(name, specialty)")
          .eq("patient_id", user.id)
          .eq("status", "ACTIVE"),
      ])
    : [{ data: [] }, { count: 0 }, { data: [] }];

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-1">{t("title")}</h1>
      <p className="text-muted dark:text-white/60 text-[14.5px] mb-10">{t("subtitle")}</p>

      <div className="grid grid-cols-3 gap-4 mb-8 max-w-[520px]">
        <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted dark:text-white/50 mb-2">{t("visits")}</p>
          <p className="text-[26px] font-display font-bold text-navy dark:text-white">{(visits ?? []).length}</p>
        </div>
        <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted dark:text-white/50 mb-2">{t("providers")}</p>
          <p className="text-[26px] font-display font-bold text-navy dark:text-white">{(connections ?? []).length}</p>
        </div>
        <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted dark:text-white/50 mb-2">{t("documents")}</p>
          <p className="text-[26px] font-display font-bold text-navy dark:text-white">{documentsCount ?? 0}</p>
        </div>
      </div>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted dark:text-white/60">{t("recentVisits")}</h2>
          <Link href="/dashboard/patient/visits" className="text-[13px] font-semibold text-blue inline-flex items-center gap-1">
            {t("viewAll")} <span className="inline-block rtl:-scale-x-100">→</span>
          </Link>
        </div>
        <div className="space-y-2.5">
          {(visits ?? []).map((v) => {
            const provider = v.provider_profiles as unknown as { name: string } | null;
            return (
              <div key={v.id} className="rounded-[14px] border border-line dark:border-white/10 p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[14.5px] font-semibold text-navy dark:text-white">
                    {new Date(v.visit_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  {v.diagnosis && <p className="text-[13px] text-muted dark:text-white/60 mt-0.5">{v.diagnosis}</p>}
                </div>
                {provider?.name && <p className="text-[12.5px] text-muted dark:text-white/60 whitespace-nowrap">{provider.name}</p>}
              </div>
            );
          })}
          {(!visits || visits.length === 0) && (
            <div className="rounded-[14px] border border-line dark:border-white/10 p-10 text-center">
              <p className="text-muted dark:text-white/60 text-[14.5px]">{t("noVisits")}</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted dark:text-white/60 mb-4">{t("careTeamOnFile")}</h2>
        <div className="space-y-2.5">
          {(connections ?? []).map((c) => {
            const provider = c.provider_profiles as unknown as { name: string; specialty: string | null } | null;
            return (
              <div key={c.id} className="rounded-[14px] border border-line dark:border-white/10 p-5">
                <p className="text-[14.5px] font-semibold text-navy dark:text-white">{provider?.name}</p>
                {provider?.specialty && <p className="text-[13px] text-muted dark:text-white/60 mt-0.5">{provider.specialty}</p>}
              </div>
            );
          })}
          {(!connections || connections.length === 0) && (
            <div className="rounded-[14px] border border-line dark:border-white/10 p-10 text-center">
              <p className="text-muted dark:text-white/60 text-[14.5px]">{t("noProviders")}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
