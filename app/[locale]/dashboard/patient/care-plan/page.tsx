import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CarePlanRow = {
  connection_id: string;
  diet_plan: string | null;
  exercise_protocol: string | null;
  yoga: string | null;
  meditation: string | null;
  medications: string | null;
  cautions: string | null;
  clinical_note: string | null;
  updated_at: string;
};

const FIELDS: { key: keyof CarePlanRow; icon: string }[] = [
  { key: "diet_plan", icon: "🥗" },
  { key: "exercise_protocol", icon: "🏃" },
  { key: "yoga", icon: "🧘" },
  { key: "meditation", icon: "🧠" },
  { key: "medications", icon: "💊" },
  { key: "cautions", icon: "⚠️" },
  { key: "clinical_note", icon: "📝" },
];

export default async function PatientCarePlanPage() {
  const t = await getTranslations("PatientDashboard.pages.carePlan");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: connections, error } = user
    ? await supabase
        .from("patient_provider_connections")
        .select("id, provider_profiles(name, specialty)")
        .eq("patient_id", user.id)
        .eq("status", "ACTIVE")
        .order("responded_at", { ascending: false })
    : { data: [], error: null };

  const connectionIds = (connections ?? []).map((c) => c.id);
  const { data: plans } =
    connectionIds.length > 0
      ? await supabase
          .from("care_plans")
          .select("connection_id, diet_plan, exercise_protocol, yoga, meditation, medications, cautions, clinical_note, updated_at")
          .in("connection_id", connectionIds)
      : { data: [] };
  const planByConnection = new Map((plans ?? []).map((p) => [p.connection_id, p as CarePlanRow]));

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-1">{t("title")}</h1>
      <p className="text-muted dark:text-white/60 text-[14.5px] mb-10">{t("subtitle")}</p>

      {error && (
        <p className="text-[14px] text-red-600 mb-8">
          {t("loadError", { file: "supabase/provider-dashboard-depth.sql" })}
        </p>
      )}

      <div className="space-y-6">
        {(connections ?? []).map((c) => {
          const provider = c.provider_profiles as unknown as { name: string; specialty: string | null } | null;
          const plan = planByConnection.get(c.id);
          const filledFields = plan ? FIELDS.filter((f) => plan[f.key] && String(plan[f.key]).trim().length > 0) : [];

          return (
            <div key={c.id} className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-6 py-4 bg-lightblue dark:bg-teal/[0.08]">
                <div>
                  <p className="text-[15px] font-display font-bold text-navy dark:text-white">{provider?.name ?? t("providerFallback")}</p>
                  {provider?.specialty && <p className="text-[12.5px] text-muted dark:text-white/60 mt-0.5">{provider.specialty}</p>}
                </div>
                {plan && (
                  <p className="text-[12px] text-muted dark:text-white/60 whitespace-nowrap">
                    {t("updated", { date: new Date(plan.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) })}
                  </p>
                )}
              </div>

              <div className="p-6">
                {filledFields.length === 0 ? (
                  <p className="text-muted dark:text-white/60 text-[14px] text-center py-6">{t("empty")}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filledFields.map((f) => (
                      <div
                        key={f.key}
                        className={`rounded-[14px] border border-line dark:border-white/10 p-4 ${
                          f.key === "diet_plan" || f.key === "exercise_protocol" || f.key === "medications" || f.key === "cautions" || f.key === "clinical_note"
                            ? "sm:col-span-2"
                            : ""
                        }`}
                      >
                        <p className="text-[13px] font-semibold text-navy dark:text-white mb-1.5">
                          <span aria-hidden="true">{f.icon}</span> {t(`fields.${f.key}`)}
                        </p>
                        <p className="text-[13.5px] text-muted dark:text-white/70 whitespace-pre-wrap">{plan![f.key]}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {(!connections || connections.length === 0) && !error && (
          <div className="rounded-[14px] border border-line dark:border-white/10 p-10 text-center">
            <p className="text-muted dark:text-white/60 text-[14.5px]">{t("noConnections")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
