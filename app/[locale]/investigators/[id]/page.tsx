import { cache } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { REGION_COLORS } from "@/lib/regions";
import { PUBLIC_INVESTIGATOR_COLUMNS, investigatorDisplayName, investigatorRegion } from "@/lib/investigators";
import { Avatar } from "@/components/investigators/InvestigatorsDirectory";
import InvestigatorContact from "@/components/investigators/InvestigatorContact";

export const revalidate = 300;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type InstitutionRef = { id: string; name: string; country: string; region: string | null } | null;

const getInvestigator = cache(async (id: string) => {
  if (!UUID_RE.test(id)) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("investigators")
    .select(`${PUBLIC_INVESTIGATOR_COLUMNS}, institution:institutions(id, name, country, region)`)
    .eq("id", id)
    .maybeSingle();
  return data;
});

export async function generateMetadata({ params }: { params: { id: string } }) {
  const inv = await getInvestigator(params.id);
  if (!inv) return { title: "Investigator" };
  return { title: investigatorDisplayName(inv.salutation, inv.full_name), description: inv.title ?? undefined };
}

export default async function InvestigatorDetailPage({ params }: { params: { id: string } }) {
  const inv = await getInvestigator(params.id);
  if (!inv) notFound();

  const t = await getTranslations("Investigators");
  const tStatus = await getTranslations("TrialStatus");
  const supabase = createClient();
  const { data: trials } = await supabase
    .from("trials")
    .select("slug, title, status")
    .eq("lead_investigator_id", inv.id)
    .order("title");

  const institution = (Array.isArray(inv.institution) ? inv.institution[0] : inv.institution) as InstitutionRef;
  const name = investigatorDisplayName(inv.salutation, inv.full_name);
  const country = inv.country ?? institution?.country ?? null;
  const region = investigatorRegion(country, institution?.region ?? null);
  const competencies: string[] = inv.core_competencies ?? [];
  const publications: string[] = inv.publications ?? [];
  // Most imported investigators have no profile fields yet; without this
  // the contact card sat alone beside an empty column.
  const hasProfileContent = Boolean(
    inv.bio || inv.department_focus_area || inv.qualifications || competencies.length || publications.length || trials?.length
  );

  return (
    <main className="bg-richblack text-white">
      <section className="py-16 sm:py-20">
        <div className="wrap max-w-[1040px]">
          <Link
            href="/investigators"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-meadow hover:text-white transition mb-8"
          >
            <span className="inline-block rtl:-scale-x-100">←</span> {t("detail.backToAll")}
          </Link>

          <header className="flex flex-col sm:flex-row gap-6 sm:items-center">
            <Avatar name={name} photoUrl={inv.photo_url} size={96} />
            <div className="min-w-0">
              {inv.access_tier && (
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-meadow">{inv.access_tier}</span>
              )}
              <h1 className="text-[30px] sm:text-[40px] font-brand font-bold leading-tight">{name}</h1>
              {inv.title && <p className="text-[16px] text-pistachio/80 mt-1.5">{inv.title}</p>}
              <p className="flex flex-wrap items-center gap-2 text-[14.5px] text-pistachio/70 mt-2">
                {institution ? (
                  <Link href={`/institutions/${institution.id}`} className="font-semibold text-white hover:text-meadow transition">
                    {institution.name}
                  </Link>
                ) : (
                  <span className="font-semibold text-white">{t("independent")}</span>
                )}
                {country && (
                  <>
                    <span aria-hidden="true">·</span>
                    {region && (
                      <span className="w-[9px] h-[9px] rounded-full" style={{ background: REGION_COLORS[region] ?? "#888" }} aria-hidden="true" />
                    )}
                    {country}
                  </>
                )}
              </p>
              {(inv.linkedin_url || inv.website_url) && (
                <div className="flex flex-wrap gap-2.5 mt-4">
                  {inv.linkedin_url && <ExternalPill href={inv.linkedin_url} label={t("detail.linkedin")} />}
                  {inv.website_url && <ExternalPill href={inv.website_url} label={t("detail.website")} />}
                </div>
              )}
            </div>
          </header>

          <div className={hasProfileContent ? "grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 mt-12" : "mt-10 max-w-[420px]"}>
            {/* Sidebar first in the DOM so the CTA sits near the top on mobile. */}
            <aside className="lg:order-2">
              <div className={hasProfileContent ? "lg:sticky lg:top-24" : undefined}>
                <InvestigatorContact
                  investigatorId={inv.id}
                  investigatorName={name}
                  institutionId={institution?.id ?? null}
                  institutionName={institution?.name ?? `Independent — ${country ?? "Unknown"}`}
                />
              </div>
            </aside>

            {hasProfileContent && (
              <div className="lg:order-1 space-y-10">
                {inv.bio && <Section title={t("detail.about")}><p className="text-[15.5px] text-pistachio/85 leading-relaxed whitespace-pre-line">{inv.bio}</p></Section>}
                {inv.department_focus_area && <Section title={t("detail.focusArea")}><p className="text-[15px] text-pistachio/85">{inv.department_focus_area}</p></Section>}
                {inv.qualifications && <Section title={t("detail.qualifications")}><p className="text-[15px] text-pistachio/85 whitespace-pre-line">{inv.qualifications}</p></Section>}
                {competencies.length > 0 && (
                  <Section title={t("detail.competencies")}>
                    <div className="flex flex-wrap gap-2">
                      {competencies.map((c) => (
                        <span key={c} className="text-[12.5px] bg-white/[.08] text-[#d4ebe4] px-3 py-1.5 rounded-full font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  </Section>
                )}
                {publications.length > 0 && (
                  <Section title={t("detail.publications")}>
                    <ul className="list-disc ps-5 space-y-2 text-[14.5px] text-pistachio/85">
                      {publications.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </Section>
                )}
                {(trials ?? []).length > 0 && (
                  <Section title={t("detail.trials")}>
                    <ul className="flex flex-col gap-2">
                      {(trials ?? []).map((trial) => (
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
                  </Section>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#8fe3dd] mb-3">{title}</h2>
      {children}
    </section>
  );
}

function ExternalPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full border border-white/20 px-4 py-1.5 text-[13px] font-semibold text-white hover:border-meadow transition"
    >
      {label} ↗
    </a>
  );
}
