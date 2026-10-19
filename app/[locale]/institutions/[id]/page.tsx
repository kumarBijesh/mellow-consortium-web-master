import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { REGION_KEYS, REGION_COLORS, type Region } from "@/lib/regions";
import InstitutionContact, { type ContactInvestigator } from "@/components/institutions/InstitutionContact";

export const revalidate = 300;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getInstitution(id: string) {
  // A malformed id would make Postgres throw on the uuid cast; treat it as not found.
  if (!UUID_RE.test(id)) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("institutions")
    .select("id, name, city, country, region, is_hq, specializations, website")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const institution = await getInstitution(params.id);
  if (!institution) return { title: "Institution" };
  return {
    title: institution.name,
    description: [institution.city, institution.country].filter(Boolean).join(", "),
  };
}

type TrialLink = { slug: string; title: string; status: string };

export default async function InstitutionDetailPage({ params }: { params: { id: string } }) {
  const institution = await getInstitution(params.id);
  if (!institution) notFound();

  const t = await getTranslations("Institutions");
  const tMap = await getTranslations("NetworkMap");
  const tStatus = await getTranslations("TrialStatus");
  const supabase = createClient();

  // Public columns only: investigators also holds private registration
  // fields (email, address), so never select * here.
  const [{ data: investigators }, { data: siteRows }, { data: sponsored }] = await Promise.all([
    supabase.from("investigators").select("id, full_name, title, bio, photo_url").eq("institution_id", institution.id).order("full_name"),
    supabase.from("trial_sites").select("trial:trials(slug, title, status)").eq("institution_id", institution.id),
    supabase.from("trials").select("slug, title, status").eq("sponsor_institution_id", institution.id),
  ]);

  // A trial can be both hosted and sponsored here; list it once.
  const trialsBySlug = new Map<string, TrialLink>();
  for (const row of siteRows ?? []) {
    const trial = (Array.isArray(row.trial) ? row.trial[0] : row.trial) as TrialLink | null;
    if (trial) trialsBySlug.set(trial.slug, trial);
  }
  for (const trial of sponsored ?? []) trialsBySlug.set(trial.slug, trial);
  const trials = Array.from(trialsBySlug.values()).sort((a, b) => a.title.localeCompare(b.title));

  const people: ContactInvestigator[] = (investigators ?? []).map((i) => ({
    id: i.id,
    name: i.full_name,
    title: i.title,
    bio: i.bio,
    photoUrl: i.photo_url,
  }));

  const region = institution.region as Region | null;
  const specializations: string[] = institution.specializations ?? [];

  return (
    <main className="bg-richblack text-white">
      <section className="py-16 sm:py-20">
        <div className="wrap max-w-[960px]">
          <Link
            href="/institutions"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-meadow hover:text-white transition mb-8"
          >
            <span className="inline-block rtl:-scale-x-100">←</span> {t("detail.backToAll")}
          </Link>

          <h1 className="text-[32px] sm:text-[42px] font-brand font-bold leading-tight">{institution.name}</h1>
          <div className="flex flex-wrap items-center gap-2.5 mt-3 text-[15px] text-pistachio/80">
            <span>{[institution.city, institution.country].filter(Boolean).join(", ")}</span>
            {region && REGION_KEYS[region] && (
              <span
                className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
                style={{ background: `${REGION_COLORS[region]}33`, color: REGION_COLORS[region] }}
              >
                {tMap(`regions.${REGION_KEYS[region]}`)}
              </span>
            )}
            {institution.website && (
              <a
                href={institution.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] font-semibold text-meadow hover:text-white transition"
              >
                {t("detail.website")} ↗
              </a>
            )}
          </div>

          {specializations.length > 0 && (
            <div className="mt-6">
              <h2 className="sr-only">{t("detail.specializations")}</h2>
              <div className="flex flex-wrap gap-2">
                {specializations.map((s) => (
                  <span key={s} className="text-[12.5px] bg-white/[.08] text-[#d4ebe4] px-3 py-1.5 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8">
            <Stat value={String(people.length)} label={t("detail.investigatorsStat")} />
            <Stat value={String(trials.length)} label={t("detail.trialsStat")} />
            {institution.is_hq && <Stat value={t("hq")} label={t("detail.hq")} accent />}
          </div>

          <InstitutionContact institutionId={institution.id} institutionName={institution.name} investigators={people} />

          {trials.length > 0 && (
            <section className="mt-14">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#8fe3dd] mb-4">{t("detail.trialsHeading")}</h2>
              <ul className="flex flex-col gap-2">
                {trials.map((trial) => (
                  <li key={trial.slug}>
                    <Link
                      href={`/trials/${trial.slug}`}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[.03] px-5 py-4 hover:border-meadow/40 transition"
                    >
                      <span className="text-[15px] font-semibold text-white">{trial.title}</span>
                      <span className="flex-none text-[11.5px] font-bold uppercase tracking-wide text-pistachio/60">
                        {tStatus.has(trial.status) ? tStatus(trial.status) : trial.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.04] px-5 py-4">
      <div className={`font-display font-extrabold text-[24px] leading-none ${accent ? "text-gold" : "text-white"}`}>{value}</div>
      <div className="text-[12.5px] text-pistachio/60 mt-2">{label}</div>
    </div>
  );
}
