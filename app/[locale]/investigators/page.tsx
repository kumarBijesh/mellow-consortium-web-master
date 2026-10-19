import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/motion/Reveal";
import InvestigatorsDirectory, { type DirectoryInvestigator } from "@/components/investigators/InvestigatorsDirectory";
import { investigatorDisplayName, investigatorRegion } from "@/lib/investigators";

export const revalidate = 300;

export async function generateMetadata() {
  const t = await getTranslations("Investigators");
  return { title: t("heading"), description: t("subheading") };
}

type InstitutionRef = { name: string; country: string; region: string | null } | null;

export default async function InvestigatorsPage() {
  const t = await getTranslations("Investigators");
  const supabase = createClient();

  // Card fields only; the table's private registration columns are never selected.
  const { data } = await supabase
    .from("investigators")
    .select("id, salutation, full_name, title, country, photo_url, created_at, department_focus_area, institution:institutions(name, country, region)");

  const rows: DirectoryInvestigator[] = (data ?? []).map((i) => {
    const institution = (Array.isArray(i.institution) ? i.institution[0] : i.institution) as InstitutionRef;
    const country = i.country ?? institution?.country ?? null;
    return {
      id: i.id,
      name: investigatorDisplayName(i.salutation, i.full_name),
      title: i.title,
      focus: i.department_focus_area,
      photoUrl: i.photo_url,
      institution: institution?.name ?? null,
      country,
      region: investigatorRegion(country, institution?.region ?? null),
      createdAt: i.created_at,
    };
  });

  return (
    <main className="bg-richblack text-white">
      <section className="py-20 sm:py-24">
        <div className="wrap">
          <Reveal>
            <div className="max-w-[760px] mb-10">
              <span className="mkt-eyebrow">{t("eyebrow")}</span>
              <h1 className="text-[34px] sm:text-[46px] font-brand font-bold mt-4 text-white leading-tight">{t("heading")}</h1>
              <p className="text-pistachio/80 text-[17px] mt-3.5">{t("subheading")}</p>
            </div>
          </Reveal>
          <InvestigatorsDirectory investigators={rows} />
        </div>
      </section>

      {/* Reuses the existing Investigator Registration flow (admin-reviewed). */}
      <section className="border-t border-white/10 py-16">
        <div className="wrap">
          <div className="rounded-2xl border border-meadow/25 bg-darkgreen/40 p-8 sm:p-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            <div className="flex-1">
              <h2 className="text-[24px] sm:text-[28px] font-brand font-bold text-white">{t("cta.heading")}</h2>
              <p className="text-pistachio/80 text-[15.5px] mt-2">{t("cta.body")}</p>
            </div>
            <Link href="/apply/clinical_investigator" className="mkt-btn-primary self-start md:self-auto whitespace-nowrap">
              {t("cta.button")} <span className="inline-block rtl:-scale-x-100">→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
