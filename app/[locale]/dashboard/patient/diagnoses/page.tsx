import { getTranslations } from "next-intl/server";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DiagnosesPage() {
  const t = await getTranslations("PatientDashboard.pages.diagnoses");
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: visits, error } = user
    ? await supabase
        .from("visits")
        .select("id, visit_date, diagnosis, provider_profiles(name)")
        .eq("patient_id", user.id)
        .not("diagnosis", "is", null)
        .order("visit_date", { ascending: false })
    : { data: [], error: null };

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-1">{t("title")}</h1>
      <p className="text-muted dark:text-white/60 text-[14.5px] mb-10">{t("subtitle")}</p>

      {error && (
        <p className="text-[14px] text-red-600 mb-8">{t("loadError", { file: "supabase/patient-dashboard.sql" })}</p>
      )}

      <div className="space-y-2.5">
        {(visits ?? []).map((v) => {
          const provider = v.provider_profiles as unknown as { name: string } | null;
          return (
            <div key={v.id} className="rounded-[14px] border border-line dark:border-white/10 p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[14.5px] font-semibold text-navy dark:text-white">{v.diagnosis}</p>
                <p className="text-[12.5px] text-muted dark:text-white/60 mt-1">
                  {new Date(v.visit_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {provider?.name ? ` · ${provider.name}` : ""}
                </p>
              </div>
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
