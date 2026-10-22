import { getTranslations } from "next-intl/server";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PatientVisitsPage() {
  const t = await getTranslations("PatientDashboard.pages.visits");
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: visits, error } = await supabase
    .from("visits")
    .select("id, visit_date, diagnosis, notes, provider_profiles(name)")
    .eq("patient_id", user?.id ?? "")
    .order("visit_date", { ascending: false });

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-1">{t("title")}</h1>
      <p className="text-muted dark:text-white/60 text-[14.5px] mb-10">{t("subtitle")}</p>

      {error && (
        <p className="text-[14px] text-red-600 mb-8">{t("loadError", { file: "supabase/patient-dashboard.sql" })}</p>
      )}

      <div className="space-y-3">
        {(visits ?? []).map((v) => {
          const provider = v.provider_profiles as unknown as { name: string } | null;
          return (
            <div key={v.id} className="rounded-[14px] border border-line dark:border-white/10 p-5">
              <div className="flex items-center justify-between gap-4 mb-1.5">
                <p className="text-[14.5px] font-semibold text-navy dark:text-white">{new Date(v.visit_date).toLocaleDateString()}</p>
                {provider?.name && <p className="text-[12.5px] text-muted dark:text-white/60">{provider.name}</p>}
              </div>
              {v.diagnosis && <p className="text-[14px] text-navy dark:text-white">{v.diagnosis}</p>}
              {v.notes && <p className="text-[13.5px] text-muted dark:text-white/60 mt-1 whitespace-pre-wrap">{v.notes}</p>}
            </div>
          );
        })}

        {(!visits || visits.length === 0) && !error && (
          <div className="rounded-[14px] border border-line dark:border-white/10 p-10 text-center">
            <p className="text-muted dark:text-white/60 text-[14.5px]">{t("empty")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
