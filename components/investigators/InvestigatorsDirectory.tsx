"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { REGIONS, REGION_KEYS, REGION_COLORS } from "@/lib/regions";
import { initials } from "@/lib/investigators";

export type DirectoryInvestigator = {
  id: string;
  name: string;
  title: string | null;
  focus: string | null;
  photoUrl: string | null;
  institution: string | null;
  country: string | null;
  region: string | null;
  createdAt: string;
};

type Affiliation = "all" | "institution" | "independent";
type Sort = "az" | "country" | "recent";

const SELECT_CLASS =
  "min-w-[200px] rounded-[10px] border border-white/15 bg-richblack px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-meadow";

export default function InvestigatorsDirectory({ investigators }: { investigators: DirectoryInvestigator[] }) {
  const t = useTranslations("Investigators");
  const tMap = useTranslations("NetworkMap");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [affiliation, setAffiliation] = useState<Affiliation>("all");
  const [sort, setSort] = useState<Sort>("az");

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(locale);
    const filtered = investigators.filter(
      (i) =>
        (region === "all" || i.region === region) &&
        (affiliation === "all" || (affiliation === "institution" ? i.institution !== null : i.institution === null)) &&
        (!q || [i.name, i.title, i.focus, i.institution, i.country].some((f) => f?.toLocaleLowerCase(locale).includes(q)))
    );
    const byName = (a: DirectoryInvestigator, b: DirectoryInvestigator) => a.name.localeCompare(b.name, locale);
    return filtered.sort((a, b) => {
      if (sort === "recent") return b.createdAt.localeCompare(a.createdAt) || byName(a, b);
      if (sort === "country") return (a.country ?? "~").localeCompare(b.country ?? "~", locale) || byName(a, b);
      return byName(a, b);
    });
  }, [investigators, query, region, affiliation, sort, locale]);

  const filtersActive = query !== "" || region !== "all" || affiliation !== "all";

  return (
    <div>
      <div className="relative max-w-[640px]">
        <svg
          className="w-[18px] h-[18px] absolute start-4 top-1/2 -translate-y-1/2 text-pistachio/50"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          className="w-full rounded-full border border-white/15 bg-white/[.04] ps-11 pe-4 py-3.5 text-[15px] text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-meadow"
        />
      </div>

      <div className="flex flex-wrap gap-2 mt-6" role="group" aria-label={tMap("allRegions")}>
        <Chip label={tMap("allRegions")} active={region === "all"} onClick={() => setRegion("all")} />
        {REGIONS.map((r) => (
          <Chip
            key={r}
            label={tMap(`regions.${REGION_KEYS[r]}`)}
            color={REGION_COLORS[r]}
            active={region === r}
            onClick={() => setRegion(r)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-4 mt-5">
        <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-pistachio/70">
          {t("affiliationLabel")}
          <select value={affiliation} onChange={(e) => setAffiliation(e.target.value as Affiliation)} className={SELECT_CLASS}>
            <option value="all">{t("affiliation.all")}</option>
            <option value="institution">{t("affiliation.institution")}</option>
            <option value="independent">{t("affiliation.independent")}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-pistachio/70">
          {t("sortLabel")}
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={SELECT_CLASS}>
            <option value="az">{t("sort.az")}</option>
            <option value="country">{t("sort.country")}</option>
            <option value="recent">{t("sort.recent")}</option>
          </select>
        </label>
        <p className="ms-auto text-[13px] text-pistachio/60" aria-live="polite">
          {t("resultsCount", { count: results.length })}
        </p>
      </div>

      {results.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-10 text-center">
          <p className="text-[15px] text-pistachio/80">{t("empty")}</p>
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setRegion("all");
                setAffiliation("all");
              }}
              className="mt-4 text-[14px] font-semibold text-meadow hover:text-white transition"
            >
              {t("clearFilters")}
            </button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {results.map((i) => (
            <li key={i.id}>
              <Link
                href={`/investigators/${i.id}`}
                className="group h-full flex flex-col rounded-2xl border border-white/10 bg-white/[.03] p-6 hover:border-meadow/40 hover:bg-white/[.05] transition"
              >
                <div className="flex items-start gap-4">
                  <Avatar name={i.name} photoUrl={i.photoUrl} />
                  <div className="min-w-0">
                    <h2 className="text-[16.5px] font-brand font-bold text-white leading-snug">{i.name}</h2>
                    {i.title && <p className="text-[13px] text-pistachio/70 mt-1 line-clamp-2">{i.title}</p>}
                  </div>
                </div>
                <div className="mt-4 text-[13.5px]">
                  <p className="text-white/90 font-medium">{i.institution ?? t("independent")}</p>
                  {i.country && (
                    <p className="flex items-center gap-2 text-pistachio/70 mt-1">
                      {i.region && (
                        <span
                          className="w-[9px] h-[9px] rounded-full flex-none"
                          style={{ background: REGION_COLORS[i.region] ?? "#888" }}
                          aria-hidden="true"
                        />
                      )}
                      {i.country}
                    </p>
                  )}
                </div>
                <span className="mt-auto pt-5 text-[13.5px] font-semibold text-meadow group-hover:text-white transition">
                  {t("viewProfile")} <span className="inline-block rtl:-scale-x-100">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Avatar({ name, photoUrl, size = 52 }: { name: string; photoUrl: string | null; size?: number }) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- storage URLs aren't in next/image's allowed hosts
    return <img src={photoUrl} alt="" width={size} height={size} className="rounded-full object-cover flex-none" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="rounded-full flex-none grid place-items-center bg-meadow/15 text-meadow font-brand font-bold"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

function Chip({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 px-[14px] py-2 rounded-full border font-display font-semibold text-[12.5px] transition ${
        active
          ? "bg-meadow border-meadow text-[#021B1A]"
          : "bg-white/[.04] border-white/15 text-[#c3ddd4] hover:border-meadow hover:text-white"
      }`}
    >
      {color && <span className="w-[8px] h-[8px] rounded-full" style={{ background: color }} aria-hidden="true" />}
      {label}
    </button>
  );
}
