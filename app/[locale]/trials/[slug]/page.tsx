import { cache } from "react";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

// `*` rather than a column list so the page keeps working whether or not
// trials-location-enroll.sql has been applied yet (location/enroll_url
// just come back undefined before it has).
const getTrial = cache(async (slug: string) => {
  const supabase = createClient();
  const { data } = await supabase
    .from("trials")
    .select(
      `*,
       lead_investigator:investigators(full_name, title, bio),
       sponsor:institutions(name, country, city, website),
       trial_sites(id, country, city, institution:institutions(name))`
    )
    .eq("slug", slug)
    .maybeSingle();

  return data;
});

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const trial = await getTrial(params.slug);
  return { title: trial?.title ?? "Trial", description: trial?.summary ?? undefined };
}

export default async function TrialDetailPage({ params }: { params: { slug: string } }) {
  const trial = await getTrial(params.slug);
  if (!trial) notFound();
  const t = await getTranslations("Trials");
  const tStatus = await getTranslations("TrialStatus");

  const investigator = Array.isArray(trial.lead_investigator)
    ? trial.lead_investigator[0]
    : trial.lead_investigator;
  const sponsor = Array.isArray(trial.sponsor) ? trial.sponsor[0] : trial.sponsor;
  type Site = { id: string; country: string | null; city: string | null; institution: { name: string } | { name: string }[] | null };
  const sites: Site[] = trial.trial_sites ?? [];

  return (
    <main className="py-24">
      <div className="wrap max-w-[760px]">
        <Link href="/trials" className="text-[13.5px] font-semibold text-blue mb-6 inline-flex items-center gap-1.5">
          <span className="inline-block rtl:-scale-x-100">&larr;</span> {t("backToAll")}
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-blue">
            {trial.therapeutic_area ?? t("longevityFallback")}
          </span>
          <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted dark:text-white/60">
            {tStatus.has(trial.status) ? tStatus(trial.status) : trial.status}
          </span>
        </div>

        <h1 className="text-[34px] mb-5 text-navy dark:text-white">{trial.title}</h1>

        {trial.location && (
          <p className="text-[14px] text-muted dark:text-white/60 -mt-2 mb-5">
            <span className="font-semibold text-navy dark:text-white">{t("location")}:</span> {trial.location}
          </p>
        )}

        {trial.summary && <p className="text-muted dark:text-white/60 text-[16px] mb-10">{trial.summary}</p>}

        {trial.enroll_url && trial.status !== "completed" && (
          <div className="mb-10 -mt-4">
            <a href={trial.enroll_url} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex">
              {t("enrolCta")} <span className="inline-block rtl:-scale-x-100">&rarr;</span>
            </a>
            <p className="text-[12.5px] text-muted dark:text-white/50 mt-2">
              {t("enrolNote", { host: new URL(trial.enroll_url).hostname.replace(/^www\./, "") })}
            </p>
          </div>
        )}

        {sponsor && (
          <section className="mb-8 pb-8 border-b border-line dark:border-white/10">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-navy dark:text-white mb-2">
              {t("sponsor")}
            </h2>
            <p className="text-[14.5px] text-ink dark:text-white">
              {sponsor.name}
              {sponsor.city || sponsor.country
                ? ` (${[sponsor.city, sponsor.country].filter(Boolean).join(", ")})`
                : ""}
            </p>
          </section>
        )}

        {investigator && (
          <section className="mb-8 pb-8 border-b border-line dark:border-white/10">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-navy dark:text-white mb-2">
              {t("leadInvestigator")}
            </h2>
            <p className="text-[14.5px] text-ink dark:text-white mb-1">
              {investigator.full_name}
              {investigator.title ? `, ${investigator.title}` : ""}
            </p>
            {investigator.bio && <p className="text-muted dark:text-white/60 text-[14px]">{investigator.bio}</p>}
          </section>
        )}

        {sites.length > 0 && (
          <section>
            <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-navy dark:text-white mb-4">
              {t("trialSites")}
            </h2>
            <ul className="space-y-2.5">
              {sites.map((s) => {
                const site_institution = Array.isArray(s.institution) ? s.institution[0] : s.institution;
                return (
                  <li key={s.id} className="text-[14.5px] text-ink dark:text-white">
                    {site_institution?.name ? `${site_institution.name} (` : ""}
                    {[s.city, s.country].filter(Boolean).join(", ")}
                    {site_institution?.name ? ")" : ""}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
