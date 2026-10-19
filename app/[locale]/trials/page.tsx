import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import Reveal, { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import HoverLift from "@/components/motion/HoverLift";

export const revalidate = 300;
export const metadata = { title: "Clinical Trials" };

const STATUS_VALUES = ["active", "recruiting", "completed", "planned"] as const;

// Darkened from the brand teal/gold (#15A8A0 / #D9B447) — those fail WCAG
// AA contrast as small text on white (~2.9:1 / ~2:1 against a 4.5:1
// requirement). See the same note in components/EcosystemGrid.tsx.
const STATUS_COLORS: Record<string, string> = {
  active: "#0E7A74",
  recruiting: "#006EB6",
  completed: "#5b6b7b",
  planned: "#7A5F1E",
};

export default async function TrialsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const t = await getTranslations("Trials");
  const tStatus = await getTranslations("TrialStatus");
  const activeStatus = searchParams.status;

  const statusLabels: Record<string, string> = Object.fromEntries(STATUS_VALUES.map((v) => [v, tStatus(v)]));

  let query = supabase
    .from("trials")
    .select("id, title, slug, summary, status, therapeutic_area")
    .order("created_at", { ascending: false });

  if (activeStatus) query = query.eq("status", activeStatus);

  const { data: trials } = await query;

  return (
    <main className="py-24">
      <div className="wrap">
        <Reveal>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1 className="text-[38px] mt-4 mb-3 text-navy dark:text-white">{t("heading")}</h1>
          <p className="text-muted dark:text-white/60 text-[16px] max-w-[600px] mb-10">{t("description")}</p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="flex flex-wrap gap-2.5 mb-10" role="group" aria-label={t("filterAriaLabel")}>
            <FilterPill href="/trials" active={!activeStatus} label={tStatus("all")} />
            {STATUS_VALUES.map((value) => (
              <FilterPill
                key={value}
                href={`/trials?status=${value}`}
                active={activeStatus === value}
                label={statusLabels[value]}
              />
            ))}
          </div>
        </Reveal>

        <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(trials ?? []).map((trial) => (
            <StaggerItem key={trial.id}>
              <HoverLift>
                <Link
                  href={`/trials/${trial.slug}`}
                  className="block rounded-card border border-line dark:border-white/10 p-5 bg-white dark:bg-white/[0.03] hover:shadow-card-sm dark:shadow-none dark:ring-1 dark:ring-white/[0.08] transition-shadow h-full"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-blue">
                      {trial.therapeutic_area ?? t("longevityFallback")}
                    </span>
                    <span
                      className="text-[11px] font-bold tracking-[0.08em] uppercase px-2 py-1 rounded-full"
                      style={{
                        color: STATUS_COLORS[trial.status] ?? "#5b6b7b",
                        background: `${STATUS_COLORS[trial.status] ?? "#5b6b7b"}1a`,
                      }}
                    >
                      {statusLabels[trial.status] ?? trial.status}
                    </span>
                  </div>
                  <h4 className="text-[16.5px] text-navy dark:text-white mb-2">{trial.title}</h4>
                  {trial.summary && <p className="text-muted dark:text-white/60 text-[13.5px]">{trial.summary}</p>}
                </Link>
              </HoverLift>
            </StaggerItem>
          ))}
          {(!trials || trials.length === 0) && (
            <p className="text-muted dark:text-white/60 text-[14px] col-span-full">{t("empty")}</p>
          )}
        </StaggerGroup>
      </div>
    </main>
  );
}

function FilterPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`text-[13.5px] font-semibold px-4 py-2 rounded-full border transition ${
        active
          ? "bg-navy text-white border-navy"
          : "bg-white dark:bg-white/[0.03] text-navy dark:text-white border-line dark:border-white/10 hover:border-blue"
      }`}
    >
      {label}
    </Link>
  );
}
