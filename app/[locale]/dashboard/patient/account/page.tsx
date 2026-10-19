import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import ChangePasswordForm from "@/components/patient/ChangePasswordForm";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  new: "#5b6b7b",
  in_review: "#006EB6",
  accepted: "#0E7A74",
  rejected: "#B8492E",
};

export default async function PatientAccountPage() {
  const t = await getTranslations("PatientDashboard.pages.account");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: applications }] = user
    ? await Promise.all([
        supabase.from("profiles").select("full_name, email, role, created_at").eq("id", user.id).maybeSingle(),
        supabase
          .from("applications")
          .select("id, persona_type, organization_name, status, submitted_at")
          .eq("user_id", user.id)
          .order("submitted_at", { ascending: false }),
      ])
    : [{ data: null }, { data: null }];

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-6">{t("title")}</h1>

      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 max-w-[640px] mb-6">
        <h2 className="text-[16px] font-display font-bold text-navy dark:text-white mb-4">{t("profile.heading")}</h2>
        <dl className="text-[14px] space-y-2">
          <div className="flex justify-between gap-4">
            <dt className="text-muted dark:text-white/50">{t("profile.name")}</dt>
            <dd className="text-navy dark:text-white font-medium">{profile?.full_name || t("profile.notSet")}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted dark:text-white/50">{t("profile.email")}</dt>
            <dd className="text-navy dark:text-white font-medium">{profile?.email ?? user?.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted dark:text-white/50">{t("profile.accountType")}</dt>
            <dd className="text-navy dark:text-white font-medium capitalize">{profile?.role ?? t("profile.patientFallback")}</dd>
          </div>
          {profile?.created_at && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted dark:text-white/50">{t("profile.memberSince")}</dt>
              <dd className="text-navy dark:text-white font-medium">
                {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 max-w-[640px] mb-6">
        <h2 className="text-[16px] font-display font-bold text-navy dark:text-white mb-4">{t("password.heading")}</h2>
        <ChangePasswordForm />
      </div>

      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 max-w-[640px]">
        <h2 className="text-[16px] font-display font-bold text-navy dark:text-white mb-4">{t("applications.heading")}</h2>
        <div className="space-y-2.5">
          {(applications ?? []).map((a) => (
            <div key={a.id} className="rounded-[10px] border border-line dark:border-white/10 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[14px] font-semibold text-navy dark:text-white">
                  {a.persona_type.replaceAll("_", " ")}
                  {a.organization_name ? ` (${a.organization_name})` : ""}
                </p>
                <p className="text-[12px] text-muted dark:text-white/60 mt-1">
                  {t("applications.submitted", { date: new Date(a.submitted_at).toLocaleDateString() })}
                </p>
              </div>
              <span
                className="text-[11px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full whitespace-nowrap"
                style={{
                  color: STATUS_COLORS[a.status] ?? "#5b6b7b",
                  background: `${STATUS_COLORS[a.status] ?? "#5b6b7b"}1a`,
                }}
              >
                {t.has(`status.${a.status}`) ? t(`status.${a.status}`) : a.status}
              </span>
            </div>
          ))}

          {(!applications || applications.length === 0) && (
            <p className="text-[13.5px] text-muted dark:text-white/60">
              {t("applications.empty")}{" "}
              <Link href="/apply/individual" className="text-blue font-semibold">
                {t("applications.cta")}
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
