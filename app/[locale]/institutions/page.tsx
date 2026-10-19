import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/motion/Reveal";
import InstitutionsDirectory, { type DirectoryInstitution } from "@/components/institutions/InstitutionsDirectory";

export const revalidate = 300;

export async function generateMetadata() {
  const t = await getTranslations("Institutions");
  return { title: t("heading"), description: t("subheading") };
}

export default async function InstitutionsPage() {
  const t = await getTranslations("Institutions");
  const supabase = createClient();

  // Only the columns the directory shows — investigators is selected for
  // institution_id alone (it holds private registration fields too).
  const [{ data: institutions }, { data: investigators }] = await Promise.all([
    supabase.from("institutions").select("id, name, city, country, region, is_hq, specializations, created_at"),
    supabase.from("investigators").select("institution_id").not("institution_id", "is", null),
  ]);

  const counts = new Map<string, number>();
  for (const inv of investigators ?? []) {
    counts.set(inv.institution_id, (counts.get(inv.institution_id) ?? 0) + 1);
  }

  const rows: DirectoryInstitution[] = (institutions ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    city: i.city,
    country: i.country,
    region: i.region,
    isHq: i.is_hq,
    specializations: i.specializations ?? [],
    investigators: counts.get(i.id) ?? 0,
    createdAt: i.created_at,
  }));

  return (
    <main className="bg-richblack text-white">
      <section className="py-20 sm:py-24">
        <div className="wrap">
          <Reveal>
            <div className="max-w-[720px] mb-10">
              <span className="mkt-eyebrow">{t("eyebrow")}</span>
              <h1 className="text-[34px] sm:text-[46px] font-brand font-bold mt-4 text-white leading-tight">{t("heading")}</h1>
              <p className="text-pistachio/80 text-[17px] mt-3.5">{t("subheading")}</p>
            </div>
          </Reveal>
          <InstitutionsDirectory institutions={rows} />
        </div>
      </section>

      {/* "Add" entry point: institutions are admin-reviewed (they also drive
          the public network map), so this routes to the existing partner
          application rather than a public create form. */}
      <section className="border-t border-white/10 py-16">
        <div className="wrap">
          <div className="rounded-2xl border border-meadow/25 bg-darkgreen/40 p-8 sm:p-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            <div className="flex-1">
              <h2 className="text-[24px] sm:text-[28px] font-brand font-bold text-white">{t("cta.heading")}</h2>
              <p className="text-pistachio/80 text-[15.5px] mt-2">{t("cta.body")}</p>
            </div>
            <Link href="/apply/academic_institution" className="mkt-btn-primary self-start md:self-auto whitespace-nowrap">
              {t("cta.button")} <span className="inline-block rtl:-scale-x-100">→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
