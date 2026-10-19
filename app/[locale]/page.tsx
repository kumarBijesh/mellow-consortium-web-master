import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { LOCALE_META, type AppLocale } from "@/i18n/routing";
import EcosystemGrid from "@/components/EcosystemGrid";
import PersonaPicker from "@/components/PersonaPicker";
import StatsBar from "@/components/StatsBar";
import TrialCountryTabs from "@/components/TrialCountryTabs";
import HeroNetworkCanvas from "@/components/network-map/HeroNetworkCanvas";
import GlobalNetworkMap, { type NetworkSite } from "@/components/network-map/GlobalNetworkMap";
import Reveal, { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import HoverLift from "@/components/motion/HoverLift";
import HeroAurora from "@/components/motion/HeroAurora";
import HeroParallax from "@/components/motion/HeroParallax";
import SplitText from "@/components/motion/SplitText";
import Magnetic from "@/components/motion/Magnetic";
import BioAgeCta from "@/components/BioAgeCta";
import { COUNTRY_CENTROIDS } from "@/lib/country-centroids";

export const revalidate = 300; // re-fetch content every 5 minutes

// title/body come from the WhyPoints.* translation keys (looked up by
// `key` below) — kept out of this static config since it's shared across
// 6 locales.
const WHY_POINTS = [
  {
    key: "globalTrials",
    d: "M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
    circle: true,
  },
  {
    key: "sharedPlaceboArms",
    d: "M12 3v18M5 8h14M5 16h14",
  },
  {
    key: "kolNetwork",
    d: "M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6",
    circleTop: true,
  },
  {
    key: "standardizedBiomarkers",
    d: "M3 7l9-4 9 4-9 4-9-4zM3 12l9 4 9-4M3 17l9 4 9-4",
  },
  {
    key: "publicationPathway",
    d: "M6 3h9l3 3v15H6zM9 3v14h9",
  },
  {
    key: "internationalVisibility",
    d: "M4 20h16M8 20v-6M12 20V8m4 12v-9",
  },
];

export default async function HomePage() {
  const supabase = createClient();
  const t = await getTranslations("Home");
  const tWhy = await getTranslations("WhyPoints");
  const locale = (await getLocale()) as AppLocale;
  const isRTL = LOCALE_META[locale].dir === "rtl";

  const [
    { data: divisions },
    { data: trials },
    { data: news },
    { data: founders },
    { data: institutions },
    { data: investigators },
    { data: tradeSites },
    { data: allTrialsForCounts },
    { count: publicationsCount },
    { count: industryPartnersCount },
    { data: marketSetting },
  ] = await Promise.all([
    supabase.from("divisions").select("*").order("sort_order"),
    // Only active/recruiting trials — same definition as activeTrialIds
    // below. This section is titled "Active clinical trials"; a country
    // whose only trial is completed/planned shouldn't get a filter tab.
    supabase
      .from("trials")
      .select("id, title, slug, summary, status, therapeutic_area, sponsor:institutions(country)")
      .in("status", ["active", "recruiting"])
      .order("created_at", { ascending: false }),
    supabase
      .from("news_posts")
      .select("id, title, slug, excerpt, published_at")
      .order("published_at", { ascending: false })
      .limit(3),
    supabase.from("founders").select("*").order("sort_order"),
    supabase
      .from("institutions")
      .select("id, name, city, country, region, lat, lon, is_hq, specializations")
      .not("region", "is", null),
    supabase.from("investigators").select("id, full_name, title, institution_id, country"),
    supabase.from("trial_sites").select("institution_id, trial_id"),
    supabase.from("trials").select("id, status, sponsor_institution_id"),
    // Backs the StatsBar "Publications" count — no publications content
    // model existed before this (JLIVE is still a coming-soon stub).
    supabase.from("publications").select("*", { count: "exact", head: true }),
    // Backs "Industry Partners" — no dedicated partners table exists, so
    // this counts accepted applications from the persona types that
    // represent an external organization rather than an individual.
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "accepted")
      .in("persona_type", ["biotech_company", "hospital_wellness_group", "journal_conference_partner"]),
    // "$610B Longevity Market" is a market-size estimate, not something
    // derivable from our own data — admin-edited with a source citation
    // (see supabase/network-admin.sql) instead of a hardcoded constant.
    supabase.from("platform_settings").select("numeric_value, unit").eq("key", "longevity_market").maybeSingle(),
  ]);

  // Trials grouped by sponsor country, for the country-tabbed section.
  type TrialRow = NonNullable<typeof trials>[number];
  const trialGroups = Object.values(
    (trials ?? []).reduce<Record<string, { country: string; trials: TrialRow[] }>>((acc, t) => {
      const sponsor = Array.isArray(t.sponsor) ? t.sponsor[0] : t.sponsor;
      const country = sponsor?.country ?? "Other Regions";
      if (!acc[country]) acc[country] = { country, trials: [] };
      acc[country].trials.push(t);
      return acc;
    }, {})
  ).sort((a, b) => b.trials.length - a.trials.length);

  // Network map sites: institutions extended with live investigator/active-study counts.
  const activeTrialIds = new Set(
    (allTrialsForCounts ?? []).filter((t) => t.status === "active" || t.status === "recruiting").map((t) => t.id)
  );
  // Institutions quick-created from the investigator flow have no lat/lon
  // yet; Number(null) would pin them at 0,0 in the Gulf of Guinea. Fall back
  // to the country centroid, or leave them off the map until an admin adds
  // coordinates (flagged "Needs map coordinates" in /admin/network/institutions).
  const sites: NetworkSite[] = (institutions ?? []).flatMap((inst) => {
    const hasCoords = inst.lat != null && inst.lon != null;
    const centroid = COUNTRY_CENTROIDS[inst.country];
    if (!hasCoords && !centroid) return [];
    const instInvestigators = (investigators ?? []).filter((i) => i.institution_id === inst.id);
    const sponsoredActive = (allTrialsForCounts ?? []).filter(
      (t) => t.sponsor_institution_id === inst.id && activeTrialIds.has(t.id)
    ).length;
    const siteActive = (tradeSites ?? []).filter((ts) => ts.institution_id === inst.id && activeTrialIds.has(ts.trial_id)).length;
    return {
      id: inst.id,
      name: inst.name,
      city: inst.city ?? inst.country,
      country: inst.country,
      region: inst.region ?? (hasCoords ? "Europe" : centroid.region),
      lat: hasCoords ? Number(inst.lat) : centroid.lat,
      lon: hasCoords ? Number(inst.lon) : centroid.lon,
      isHQ: inst.is_hq,
      investigators: instInvestigators.length,
      investigatorRecords: instInvestigators.map((i) => ({ id: i.id, name: i.full_name, title: i.title })),
      activeStudies: sponsoredActive + siteActive,
      specializations: inst.specializations ?? [],
    };
  });

  // Independent investigators — no institution_id, so they'd never appear
  // in the loop above. Cluster them into one synthetic pin per country
  // instead (World > Country > Investigators, no institution level) using
  // COUNTRY_CENTROIDS for placement since there's no institution lat/lon
  // to anchor to. Countries with no known centroid are silently skipped
  // (they'd have no valid map position) rather than crashing the page.
  const independentByCountry = (investigators ?? []).reduce<Record<string, typeof investigators>>((acc, i) => {
    if (i.institution_id || !i.country) return acc;
    (acc[i.country] ??= []).push(i);
    return acc;
  }, {});
  for (const [country, invs] of Object.entries(independentByCountry)) {
    const centroid = COUNTRY_CENTROIDS[country];
    if (!centroid || !invs) continue;
    sites.push({
      id: `independent-${country}`,
      name: "Independent Investigators",
      city: country,
      country,
      region: centroid.region,
      lat: centroid.lat,
      lon: centroid.lon,
      isHQ: false,
      investigators: invs.length,
      investigatorRecords: invs.map((i) => ({ id: i.id, name: i.full_name, title: i.title })),
      activeStudies: 0,
      specializations: [],
      isIndependentGroup: true,
    });
  }

  // Every figure below is a live count against real Supabase data — none
  // of it is hand-typed. "Clinical Sites"/"Global Regions"/"Countries"
  // reuse `sites` so this section and the hero badges never disagree.
  // realSiteCount excludes the synthetic independent-investigator country
  // pins (isIndependentGroup) — those aren't clinical sites.
  const realSiteCount = sites.filter((s) => !s.isIndependentGroup).length;
  const continentsCount = new Set(sites.map((s) => s.region)).size;
  const statsBarData = {
    globalRegions: continentsCount,
    clinicalSites: realSiteCount,
    publications: publicationsCount ?? 0,
    investigators: (investigators ?? []).length,
    countries: new Set(sites.map((s) => s.country)).size,
    industryPartners: industryPartnersCount ?? 0,
    longevityMarket: Number(marketSetting?.numeric_value ?? 0),
    longevityMarketUnit: marketSetting?.unit ?? "",
  };

  return (
    <main>
      {/* Hero — asymmetric: left-anchored oversized type over a full-bleed
          animated node network, diagonal clip into the next section. */}
      <section className="relative bg-richblack text-white overflow-hidden isolate">
        <HeroNetworkCanvas sites={sites} />
        <HeroAurora />
        {/* The text column sits at the writing-direction start edge
            automatically (block layout, no explicit alignment below) —
            but this scrim's darkened side and the decorative glow's
            position are literal coordinates, so they need to flip with
            it in RTL or the text loses its readable backdrop. */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background: isRTL
              ? "radial-gradient(1100px 600px at 22% 30%, rgba(44,194,149,.18), transparent 60%), linear-gradient(270deg, rgba(2,27,26,.96) 0%, rgba(2,27,26,.82) 34%, rgba(2,27,26,.34) 62%, rgba(2,27,26,.58) 100%)"
              : "radial-gradient(1100px 600px at 78% 30%, rgba(44,194,149,.18), transparent 60%), linear-gradient(90deg, rgba(2,27,26,.96) 0%, rgba(2,27,26,.82) 34%, rgba(2,27,26,.34) 62%, rgba(2,27,26,.58) 100%)",
          }}
        />

        {/* Floating real-data badges — decorative, desktop only */}
        <div className="float-badge hidden lg:block absolute z-[2] top-28 end-[6%] px-4 py-2.5 rounded-2xl bg-white/[0.07] border border-white/15 shadow-[0_12px_30px_-14px_rgba(0,0,0,.5)] pointer-events-none">
          <p className="text-[20px] font-brand font-extrabold leading-none">{activeTrialIds.size}+</p>
          <p className="text-[11px] text-pistachio/80 mt-1 whitespace-nowrap">{t("activeTrials")}</p>
        </div>
        <div className="float-badge float-badge-b hidden lg:block absolute z-[2] top-[48%] end-[1.5%] px-4 py-2.5 rounded-2xl bg-white/[0.07] border border-white/15 shadow-[0_12px_30px_-14px_rgba(0,0,0,.5)] pointer-events-none">
          <p className="text-[20px] font-brand font-extrabold leading-none">{realSiteCount}+</p>
          <p className="text-[11px] text-pistachio/80 mt-1 whitespace-nowrap">{t("researchSites")}</p>
        </div>
        <div className="float-badge float-badge-c hidden lg:block absolute z-[2] bottom-20 end-[16%] px-4 py-2.5 rounded-2xl bg-white/[0.07] border border-white/15 shadow-[0_12px_30px_-14px_rgba(0,0,0,.5)] pointer-events-none">
          <p className="text-[20px] font-brand font-extrabold leading-none">{continentsCount}</p>
          <p className="text-[11px] text-pistachio/80 mt-1 whitespace-nowrap">{t("continentsConnected")}</p>
        </div>

        <HeroParallax>
          <div className="wrap relative z-[2] pt-24 pb-32">
            <div className="max-w-[720px]">
              <Reveal delay={0}>
                <span className="mkt-eyebrow">{t("eyebrow")}</span>
              </Reveal>
              <h1 className="text-[42px] sm:text-[70px] lg:text-[80px] font-brand font-extrabold mt-5 leading-[0.98] tracking-tight">
                <SplitText text={t("headingPart1")} startDelay={0.06} />{" "}
                <SplitText text={t("headingPart2")} className="text-shimmer" startDelay={0.17} />{" "}
                <SplitText text={t("headingPart3")} startDelay={0.28} />
              </h1>
              <Reveal delay={0.5}>
                <p className="font-brand font-semibold text-[18px] sm:text-[22px] text-flashwhite mt-4">
                  {t("subheading")}
                </p>
              </Reveal>
              <Reveal delay={0.58}>
                <p className="text-[16.5px] text-pistachio/80 mt-5 max-w-[560px]">{t("description")}</p>
              </Reveal>
              <Reveal delay={0.66}>
                <div className="flex gap-3.5 mt-8 flex-wrap">
                  <Magnetic>
                    <a
                      href="/apply/clinical_investigator"
                      className="mkt-btn bg-forest text-flashwhite hover:shadow-[0_12px_26px_-12px_rgba(9,85,68,.7)]"
                    >
                      {t("ctaInvestigator")}
                    </a>
                  </Magnetic>
                  <Magnetic>
                    <BioAgeCta className="mkt-btn-secondary">{t("ctaBioAge")}</BioAgeCta>
                  </Magnetic>
                </div>
              </Reveal>
              <Reveal delay={0.7}>
                <div className="flex items-center gap-3.5 mt-4 flex-wrap text-[13.5px]">
                  <a href="#sponsors" className="font-semibold text-pistachio/70 hover:text-white transition inline-flex items-center gap-1">
                    {t("ctaPartner")} <span className="inline-block rtl:-scale-x-100">→</span>
                  </a>
                  <span className="text-pistachio/25">·</span>
                  <Link href="/apply/healthcare_provider" className="font-semibold text-pistachio/70 hover:text-white transition">
                    {t("ctaPhysicianPartner")}
                  </Link>
                </div>
              </Reveal>
              <Reveal delay={0.74}>
                <div className="flex gap-2.5 items-center mt-[30px] text-[13px] text-pistachio/80 flex-wrap">
                  <span className="px-3 py-1.5 border border-white/[.16] rounded-full bg-white/[.04] inline-flex items-center gap-2">
                    <span className="pulse-dot" /> <b className="text-white font-semibold">{t("liveLabel")}</b> {t("liveClinicalSites", { count: realSiteCount })}
                  </span>
                  <span className="px-3 py-1.5 border border-white/[.16] rounded-full bg-white/[.04]">
                    {t("sharedPlacebo")}
                  </span>
                </div>
              </Reveal>
            </div>
          </div>
        </HeroParallax>
      </section>

      <StatsBar stats={statsBarData} />

      {/* Audience selector */}
      <div className="bg-flashwhite dark:bg-forest/[0.12]">
        <PersonaPicker />
      </div>

      {/* Global Network */}
      <section className="block bg-richblack text-white relative overflow-hidden py-24" id="network">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(900px 500px at 22% 40%, rgba(44,194,149,.18), transparent 60%)" }}
        />
        <div className="wrap relative z-[2]">
          <Reveal>
            <div className="max-w-[720px] mx-auto text-center mb-11">
              <span className="mkt-eyebrow justify-center">{t("network.eyebrow")}</span>
              <h2 className="text-[32px] sm:text-[42px] font-brand font-bold mt-4 text-white">
                {t("network.heading")}
              </h2>
              <p className="text-pistachio/80 text-[17px] mt-3.5">{t("network.description")}</p>
            </div>
          </Reveal>
          {sites.length > 0 ? (
            <Reveal delay={0.1} y={40}>
              <GlobalNetworkMap sites={sites} />
            </Reveal>
          ) : (
            <p className="text-center text-pistachio/80 text-[14px]">{t("network.empty")}</p>
          )}
        </div>
      </section>

      {/* Ecosystem grid — interactive division network (its own component) */}
      <div id="ecosystem">
        <EcosystemGrid divisions={divisions ?? []} />
      </div>

      {/* Why */}
      <section className="block bg-richblack text-white py-24">
        <div className="wrap">
          <Reveal>
            <div className="max-w-[720px] mb-11">
              <span className="mkt-eyebrow">{t("why.eyebrow")}</span>
              <h2 className="text-[32px] sm:text-[42px] font-brand font-bold mt-4 text-white">
                {t("why.heading")}
              </h2>
              <p className="text-pistachio/80 text-[17px] mt-3.5">{t("why.description")}</p>
            </div>
          </Reveal>
          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden">
            {WHY_POINTS.map((w) => (
              <StaggerItem key={w.key}>
                <HoverLift lift={4} scale={1} className="bg-richblack hover:bg-darkgreen transition-colors p-[26px] h-full">
                  <div className="w-[46px] h-[46px] rounded-xl bg-meadow/[.15] text-meadow grid place-items-center mb-4">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      {w.circle && <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />}
                      {w.circleTop && <circle cx="12" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.8" />}
                      <path d={w.d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h4 className="text-[17px] font-brand font-semibold">{tWhy(`${w.key}.title`)}</h4>
                  <p className="text-[14px] text-pistachio/70 mt-2">{tWhy(`${w.key}.body`)}</p>
                </HoverLift>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Research consortium. The trials/institutions behind this are still
          placeholder seed data, so the copy says the network is growing
          rather than implying an established program portfolio. */}
      <section className="block bg-flashwhite dark:bg-forest/[0.12] py-24" id="research">
        <div className="wrap">
          <Reveal>
            <div className="max-w-[760px]">
              <span className="mkt-eyebrow">{t("research.eyebrow")}</span>
              <h2 className="text-[32px] sm:text-[42px] font-brand font-bold mt-4 text-richblack dark:text-white">{t("research.heading")}</h2>
              <p className="text-muted dark:text-white/60 text-[17px] mt-3.5">{t("research.description")}</p>
            </div>
            <div className="flex flex-wrap gap-2.5 mt-8">
              {(t.raw("research.topics") as string[]).map((topic) => (
                <span
                  key={topic}
                  className="px-4 py-2 rounded-full bg-white dark:bg-white/[0.05] border border-line dark:border-white/10 text-[14px] font-medium text-richblack dark:text-white"
                >
                  {topic}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Trials */}
      <section className="block py-24" id="trials">
        <div className="wrap">
          <Reveal>
            <div className="max-w-[720px] mb-11">
              <span className="mkt-eyebrow-2">{t("trials.eyebrow")}</span>
              <h2 className="text-[32px] sm:text-[42px] font-brand font-bold mt-4 text-richblack dark:text-white">
                {t("trials.heading")}
              </h2>
              <p className="text-muted dark:text-white/60 text-[17px] mt-3.5">{t("trials.description")}</p>
            </div>
          </Reveal>
          {trialGroups.length > 0 ? (
            <TrialCountryTabs groups={trialGroups} />
          ) : (
            <p className="text-muted dark:text-white/60 text-[14px]">{t("trials.empty")}</p>
          )}
        </div>
      </section>

      {/* MELLOW-Age promo */}
      <section className="block py-24" id="age" style={{ background: "linear-gradient(135deg,#03624C,#2CC295)" }}>
        <div className="wrap grid grid-cols-1 lg:grid-cols-[1.05fr_.95fr] gap-14 items-center text-white">
          <Reveal>
            <span className="text-[12px] font-bold tracking-[0.16em] uppercase text-flashwhite inline-flex items-center gap-2.5 font-brand">
              <span className="w-[26px] h-[2px] bg-richblack/50 inline-block" />
              {t("agePromo.kicker")}
            </span>
            <h2 className="text-[28px] sm:text-[40px] font-brand font-bold mt-4">{t("agePromo.heading")}</h2>
            <p className="text-[17px] text-flashwhite/90 mt-4">{t("agePromo.description")}</p>
            <div className="flex flex-col gap-2.5 mt-6">
              {(t.raw("agePromo.steps") as string[]).map((step, i) => (
                <div key={step} className="flex gap-3.5 items-center text-[15px] font-medium">
                  <span className="w-[30px] h-[30px] rounded-lg bg-richblack/20 grid place-items-center font-brand font-bold text-[13px] flex-none">
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-[30px] flex-wrap">
              <Link href="/mellow-age" className="mkt-btn bg-richblack text-white hover:shadow-[0_12px_26px_-12px_rgba(2,27,26,.7)]">
                {t("agePromo.ctaStart")} <span className="inline-block rtl:-scale-x-100">→</span>
              </Link>
              <Link href="/mellow-age#sign-in" className="mkt-btn bg-transparent text-white border-white/40 hover:border-white hover:bg-white/[.1]">
                {t("agePromo.ctaProviders")}
              </Link>
            </div>
            <Link href="/mellow-age#roadmap" className="inline-flex items-center gap-1.5 mt-5 text-[14px] font-semibold text-flashwhite/90 hover:text-white underline underline-offset-4 decoration-white/40">
              {t("agePromo.roadmapLink")} <span className="inline-block rtl:-scale-x-100">→</span>
            </Link>
          </Reveal>

          <Reveal
            delay={0.15}
            y={40}
            className="bg-white dark:bg-white/[0.03] rounded-[20px] p-7 text-ink dark:text-white shadow-[0_30px_70px_-30px_rgba(2,27,26,.6)]"
          >
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wide text-forest">{t("agePromo.resultCard.yourResult")}</span>
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted dark:text-white/60">{t("agePromo.resultCard.sample")}</span>
            </div>
            <div
              className="w-[118px] h-[118px] rounded-full mx-auto mt-3.5 mb-1.5 grid place-items-center relative"
              style={{ background: "conic-gradient(#2CC295 0 78%, #e3ede9 78% 100%)" }}
            >
              <div className="absolute inset-3 rounded-full bg-white dark:bg-white/[0.03]" />
              <div className="relative text-center">
                <b className="font-brand text-[34px] text-richblack dark:text-white block leading-none">51</b>
                <span className="text-[11px] text-muted dark:text-white/60">{t("agePromo.resultCard.bioAge")}</span>
              </div>
            </div>
            <p className="text-center text-[13px] text-muted dark:text-white/60 mt-0.5">
              {t("agePromo.resultCard.chronologicalAge", { age: 57 })}
              <b className="text-forest dark:text-meadow">{t("agePromo.resultCard.youngerBy", { years: 6 })}</b>
            </p>
            {/* Only fields the product actually records: domain scores were
                removed because nothing calculates them. */}
            <div className="grid grid-cols-2 gap-2 mt-[18px]">
              {[
                { label: t("agePromo.resultCard.riskLevel"), value: t("agePromo.resultCard.riskLow") },
                { label: t("agePromo.resultCard.reviewedBy"), value: t("agePromo.resultCard.yourProvider") },
              ].map((d) => (
                <div key={d.label} className="bg-flashwhite dark:bg-meadow/[0.08] rounded-[9px] px-3 py-2.5">
                  <div className="text-[11px] text-muted dark:text-white/60">{d.label}</div>
                  <div className="font-brand font-bold text-[15px] text-richblack dark:text-white mt-0.5">{d.value}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Platform — providers & hospitals. Copy is limited to what the
          provider/hospital dashboards actually do today; keep it that way
          when features ship (booking, AI insights, white-label, population
          analytics, and audit logging were cut from the old site's copy
          because none exist yet). */}
      <section className="block bg-richblack text-white py-24" id="platform">
        <div className="wrap">
          <Reveal>
            <div className="max-w-[720px] mb-11">
              <span className="mkt-eyebrow">{t("platform.eyebrow")}</span>
              <h2 className="text-[32px] sm:text-[42px] font-brand font-bold mt-4 text-white">{t("platform.heading")}</h2>
              <p className="text-pistachio/80 text-[17px] mt-3.5">{t("platform.description")}</p>
            </div>
          </Reveal>
          <StaggerGroup className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(
              [
                { key: "providers", href: "/apply/healthcare_provider" },
                { key: "hospitals", href: "/apply/hospital_wellness_group" },
              ] as const
            ).map((a) => (
              <StaggerItem key={a.key}>
                <div className="h-full flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-7 sm:p-8">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-meadow">{t(`platform.${a.key}.label`)}</span>
                  <h3 className="text-[22px] sm:text-[24px] font-brand font-semibold mt-3 leading-snug">{t(`platform.${a.key}.heading`)}</h3>
                  <ul className="mt-6 space-y-3.5 flex-1">
                    {(t.raw(`platform.${a.key}.points`) as string[]).map((point) => (
                      <li key={point} className="flex gap-3 text-[14.5px] text-pistachio/80">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-none mt-0.5 text-meadow" aria-hidden="true">
                          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={a.href} className="mkt-btn-secondary self-start mt-8">
                    {t(`platform.${a.key}.cta`)}
                  </Link>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Privacy & safety. Every claim here is checked against the build:
          no "end-to-end" (the server can read data), no HIPAA claim (no
          audit logging or confirmed BAAs), and biological age is described
          as provider-recorded because nothing calculates it. */}
      <section className="block bg-flashwhite dark:bg-forest/[0.12] py-24" id="privacy">
        <div className="wrap">
          <Reveal>
            <div className="max-w-[720px] mb-11">
              <span className="mkt-eyebrow">{t("privacy.eyebrow")}</span>
              <h2 className="text-[32px] sm:text-[42px] font-brand font-bold mt-4 text-richblack dark:text-white">{t("privacy.heading")}</h2>
            </div>
          </Reveal>
          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {(["secure", "bioAge", "notDiagnostic", "notEmergency"] as const).map((key) => (
              <StaggerItem key={key}>
                <div className="h-full rounded-2xl border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6">
                  <h3 className="text-[17px] font-brand font-semibold text-richblack dark:text-white">{t(`privacy.items.${key}.title`)}</h3>
                  <p className="text-[14.5px] text-muted dark:text-white/60 mt-2">{t(`privacy.items.${key}.body`)}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Founders */}
      <section className="block py-24">
        <div className="wrap">
          <Reveal>
            <span className="mkt-eyebrow-2">{t("founders.eyebrow")}</span>
            <h2 className="text-[32px] font-brand mt-4 mb-10 text-richblack dark:text-white">
              {t("founders.heading")}
            </h2>
          </Reveal>
          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(founders ?? []).map((f, i) => (
              <StaggerItem key={f.id}>
                <HoverLift className="border border-line dark:border-white/10 rounded-[18px] p-[30px] flex gap-[22px] bg-white dark:bg-white/[0.03] hover:shadow-card-green-sm dark:shadow-none dark:ring-1 dark:ring-white/[0.08] transition-shadow h-full">
                  <div
                    className="w-[88px] h-[88px] rounded-2xl flex-none grid place-items-center font-brand font-extrabold text-2xl text-white"
                    style={{
                      background: i % 2 === 0 ? "linear-gradient(135deg,#03624C,#021B1A)" : "linear-gradient(135deg,#2CC295,#095544)",
                    }}
                  >
                    {f.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-[19px] text-richblack dark:text-white font-brand font-bold">{f.full_name}</h4>
                    <div className="text-[13px] text-forest dark:text-meadow font-semibold mt-1">{f.title}</div>
                    <p className="text-[14px] text-muted dark:text-white/60 mt-3">{f.bio}</p>
                  </div>
                </HoverLift>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* News */}
      <section className="block bg-flashwhite dark:bg-forest/[0.12] py-24" id="news">
        <div className="wrap">
          <Reveal>
            <span className="mkt-eyebrow-2">{t("news.eyebrow")}</span>
            <h2 className="text-[32px] font-brand mt-4 mb-10 text-richblack dark:text-white">{t("news.heading")}</h2>
          </Reveal>
          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-3 gap-[18px]">
            {(news ?? []).map((n) => (
              <StaggerItem key={n.id}>
                <HoverLift>
                  <Link
                    href={`/news/${n.slug}`}
                    className="block rounded-2xl bg-white dark:bg-white/[0.03] border border-line dark:border-white/10 overflow-hidden hover:shadow-card-green-sm dark:shadow-none dark:ring-1 dark:ring-white/[0.08] transition-shadow"
                  >
                    <div className="h-16 relative" style={{ background: "linear-gradient(120deg,#095544,#2CC295)" }} />
                    <div className="p-5">
                      <h4 className="text-[16px] text-richblack dark:text-white font-brand font-semibold leading-snug">{n.title}</h4>
                      <p className="text-muted dark:text-white/60 text-[13.5px] mt-2">{n.excerpt}</p>
                    </div>
                  </Link>
                </HoverLift>
              </StaggerItem>
            ))}
            {(!news || news.length === 0) && (
              <p className="text-muted dark:text-white/60 text-[14px] col-span-full">{t("news.empty")}</p>
            )}
          </StaggerGroup>
        </div>
      </section>

      {/* Final CTA */}
      <section className="block bg-richblack text-white text-center relative overflow-hidden py-20" id="sponsors">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(700px 380px at 50% -10%, rgba(0,223,129,.35), transparent 65%)" }}
        />
        <div className="orb w-[320px] h-[320px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-meadow/20" />
        <Reveal className="wrap relative z-[2]">
          <span className="mkt-eyebrow justify-center">{t("finalCta.eyebrow")}</span>
          <h2 className="text-[30px] sm:text-[48px] font-brand font-extrabold mt-4 max-w-[760px] mx-auto">
            {t("finalCta.heading")}
          </h2>
          <p className="text-pistachio/80 text-[17px] mt-4 max-w-[560px] mx-auto">{t("finalCta.description")}</p>
          <div className="flex gap-3.5 justify-center mt-8 flex-wrap">
            <Link href="/membership-plans" className="mkt-btn-primary">
              {t("finalCta.ctaCompare")} <span className="inline-block rtl:-scale-x-100">→</span>
            </Link>
            <Link href="/discovery-call" className="mkt-btn-secondary">
              {t("finalCta.ctaDiscoveryCall")}
            </Link>
            <Link href="/coming-soon?from=prospectus" className="mkt-btn-secondary">
              {t("finalCta.ctaProspectus")}
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
