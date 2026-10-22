import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getPatientUnreadConversations } from "@/lib/patient-data";

export const dynamic = "force-dynamic";

// Sample-data preview only — there is no biomarker table, no lab-result
// ingestion, and no scoring formula anywhere in this codebase yet. These
// numbers are NOT computed from anything real; every card that shows them
// is labeled "Sample" so nothing here is mistaken for an actual reading.
// See MEMORY / the conversation this was built in for why: inventing a
// biological-age formula would mean presenting made-up numbers as health
// data, which isn't something to guess at.
const SAMPLE_BIO_AGE = 34.5;
const SAMPLE_CHRONO_AGE = 45.0;
const SAMPLE_DOMAINS = [
  { icon: "🫀", key: "cardiovascular", value: 70 },
  { icon: "🧬", key: "metabolic", value: 84 },
  { icon: "🧠", key: "mentalWellness", value: 70 },
  { icon: "💪", key: "physicalFitness", value: 45 },
  { icon: "🥗", key: "nutrition", value: 70 },
];
const SAMPLE_SYSTEM_AGES = [
  { icon: "🫀", key: "cardiovascularAge", value: 52, deltaYrs: 7 },
  { icon: "🧪", key: "metabolicAge", value: 46, deltaYrs: 1 },
  { icon: "🔥", key: "inflammationAge", value: 49, deltaYrs: 4 },
];
const SAMPLE_BIOMARKERS = [
  { label: "Glucose", value: "101.1 mg/dL" },
  { label: "hs-CRP", value: "3.9 mg/L" },
  { label: "Albumin", value: "4.0 g/dL" },
];

function domainColor(value: number) {
  if (value >= 80) return "bg-teal";
  if (value >= 60) return "bg-gold";
  return "bg-[#E8735A]";
}

export default async function PatientDashboardPage() {
  const t = await getTranslations("PatientDashboard.pages.home");
  const supabase = createClient();
  const user = await getCurrentUser();

  const [{ data: profile }, unreadMessagesCount] = user
    ? await Promise.all([
        supabase.from("profiles").select("full_name, email, role").eq("id", user.id).maybeSingle(),
        getPatientUnreadConversations(user.id),
      ])
    : [{ data: null }, 0];

  const fullName = profile?.full_name || (user?.user_metadata as { full_name?: string } | undefined)?.full_name;
  const bioAgeDelta = (SAMPLE_CHRONO_AGE - SAMPLE_BIO_AGE).toFixed(1);

  return (
    <div>
      <div className="mb-8">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-blue">{profile?.role ?? t("roleFallback")}</span>
        <h1 className="text-[30px] mt-2 text-navy dark:text-white">{fullName || t("welcomeFallback")}</h1>
        <p className="text-muted dark:text-white/60 text-[14.5px] mt-1">{profile?.email ?? user?.email}</p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-card stat-accent-teal border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-[0.08em] text-muted dark:text-white/50">{t("stats.biologicalAge")}</p>
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted dark:text-white/40 border border-line dark:border-white/15 rounded-full px-2 py-0.5">
              {t("sampleTag")}
            </span>
          </div>
          <p className="text-[26px] font-display font-bold text-teal">{SAMPLE_BIO_AGE} {t("yrs")}</p>
        </div>
        <div className="rounded-card stat-accent-blue border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-[0.08em] text-muted dark:text-white/50">{t("stats.chronologicalAge")}</p>
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted dark:text-white/40 border border-line dark:border-white/15 rounded-full px-2 py-0.5">
              {t("sampleTag")}
            </span>
          </div>
          <p className="text-[26px] font-display font-bold text-blue">{SAMPLE_CHRONO_AGE.toFixed(1)} {t("yrs")}</p>
        </div>
        <div className="rounded-card stat-accent-purple border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-[0.08em] text-muted dark:text-white/50">{t("stats.riskLevel")}</p>
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted dark:text-white/40 border border-line dark:border-white/15 rounded-full px-2 py-0.5">
              {t("sampleTag")}
            </span>
          </div>
          <p className="text-[26px] font-display font-bold text-[#6B4EC7]">{t("stats.riskVeryLow")}</p>
        </div>
        <div className="rounded-card stat-accent-gold border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
          <p className="text-[11px] uppercase tracking-[0.08em] text-muted dark:text-white/50 mb-2">{t("stats.messages")}</p>
          <p className="text-[26px] font-display font-bold text-[#8a6a12] dark:text-gold">{unreadMessagesCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Biological age ring */}
        <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-lightblue dark:bg-teal/[0.08]">
            <h2 className="text-[15px] font-display font-bold text-navy dark:text-white">{t("bioAgeCard.heading")}</h2>
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted dark:text-white/40 border border-line dark:border-white/15 rounded-full px-2 py-0.5">
              {t("sampleTag")}
            </span>
          </div>
          <div className="p-6">
            <div
              className="w-[140px] h-[140px] rounded-full mx-auto mb-2 grid place-items-center relative"
              style={{ background: `conic-gradient(#15A8A0 0 ${(SAMPLE_BIO_AGE / SAMPLE_CHRONO_AGE) * 100}%, rgba(120, 140, 160, 0.18) 0 100%)` }}
            >
              <div className="absolute inset-3 rounded-full bg-white dark:bg-[#12171f]" />
              <div className="relative text-center">
                <b className="font-display text-[30px] text-navy dark:text-white block leading-none">{SAMPLE_BIO_AGE}</b>
                <span className="text-[11px] text-muted dark:text-white/60">{t("bioAgeCard.bioAgeLabel")}</span>
              </div>
            </div>
            <p className="text-center text-[13.5px] text-muted dark:text-white/60 mb-5">
              {t("bioAgeCard.chronological", { age: SAMPLE_CHRONO_AGE.toFixed(1) })}
              <b className="text-teal">{t("bioAgeCard.youngerBy", { years: bioAgeDelta })}</b>
            </p>
            <div className="border-t border-line dark:border-white/10 pt-4 space-y-2">
              {SAMPLE_BIOMARKERS.map((b) => (
                <div key={b.label} className="flex justify-between text-[13.5px]">
                  <span className="text-muted dark:text-white/60">{b.label}</span>
                  <span className="text-navy dark:text-white font-medium">{b.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Health domains */}
        <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-display font-bold text-navy dark:text-white">{t("domainsCard.heading")}</h2>
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted dark:text-white/40 border border-line dark:border-white/15 rounded-full px-2 py-0.5">
              {t("sampleTag")}
            </span>
          </div>
          <div className="space-y-4">
            {SAMPLE_DOMAINS.map((d) => (
              <div key={d.key}>
                <div className="flex justify-between text-[13.5px] mb-1.5">
                  <span className="text-navy dark:text-white font-medium">
                    <span className="me-1.5">{d.icon}</span>
                    {t(`domainsCard.${d.key}`)}
                  </span>
                  <span className="text-muted dark:text-white/50">{d.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-line dark:bg-white/10 overflow-hidden">
                  <span className={`block h-full rounded-full ${domainColor(d.value)}`} style={{ width: `${d.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System ages */}
      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[15px] font-display font-bold text-navy dark:text-white">{t("systemAges.heading")}</h2>
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted dark:text-white/40 border border-line dark:border-white/15 rounded-full px-2 py-0.5">
            {t("sampleTag")}
          </span>
        </div>
        <p className="text-[13px] text-muted dark:text-white/60 mb-5 max-w-[560px]">{t("systemAges.description")}</p>
        <div className="space-y-3">
          {SAMPLE_SYSTEM_AGES.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-1">
              <span className="text-[14.5px] text-navy dark:text-white">
                <span className="me-2">{s.icon}</span>
                {t(`systemAges.${s.key}`)}
              </span>
              <span className="text-[16px] font-display font-bold text-[#E8735A]">
                {s.value} <span className="text-[12px] font-body font-normal text-muted dark:text-white/50">+{s.deltaYrs} {t("yrs")}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {!connectedProviders && (
        <section>
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted dark:text-white/60 mb-5">{t("careTeam.heading")}</h2>
          <div className="rounded-[14px] border border-line dark:border-white/10 p-6 flex items-center justify-between gap-4">
            <p className="text-muted dark:text-white/60 text-[14.5px]">{t("careTeam.body")}</p>
            <Link href="/dashboard/patient/providers" className="btn-secondary !px-4 !py-2.5 text-[13.5px] whitespace-nowrap">
              {t("careTeam.cta")}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
