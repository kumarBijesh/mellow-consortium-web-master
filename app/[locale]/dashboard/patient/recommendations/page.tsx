import { getTranslations } from "next-intl/server";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const t = await getTranslations("PatientDashboard.pages.recommendations");
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: recommendations, error } = user
    ? await supabase
        .from("provider_recommendations")
        .select("id, body, created_at, provider_profiles(name, specialty)")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-1">{t("title")}</h1>
      <p className="text-muted dark:text-white/60 text-[14.5px] mb-10">{t("subtitle")}</p>

      {error && (
        <p className="text-[14px] text-red-600 mb-8">{t("loadError", { file: "supabase/provider-dashboard.sql" })}</p>
      )}

      <div className="space-y-3">
        {(recommendations ?? []).map((r) => {
          const provider = r.provider_profiles as unknown as { name: string; specialty: string | null } | null;
          return (
            <div key={r.id} className="rounded-[14px] border border-line dark:border-white/10 p-5">
              <div className="flex items-center justify-between gap-4 mb-2">
                <p className="text-[14.5px] font-semibold text-navy dark:text-white">{provider?.name ?? t("providerFallback")}</p>
                <p className="text-[12.5px] text-muted dark:text-white/60 whitespace-nowrap">
                  {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <p className="text-[14px] text-navy dark:text-white whitespace-pre-wrap">{r.body}</p>
            </div>
          );
        })}

        {(!recommendations || recommendations.length === 0) && !error && (
          <div className="rounded-[14px] border border-line dark:border-white/10 p-10 text-center">
            <p className="text-muted dark:text-white/60 text-[14.5px]">{t("empty")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
