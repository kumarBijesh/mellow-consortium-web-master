"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { REGIONS, REGION_KEYS, REGION_COLORS } from "@/lib/regions";

export type DirectoryInstitution = {
  id: string;
  name: string;
  city: string | null;
  country: string;
  region: string | null;
  isHq: boolean;
  specializations: string[];
  investigators: number;
  createdAt: string;
};

type Sort = "az" | "investigators" | "recent";

export default function InstitutionsDirectory({ institutions }: { institutions: DirectoryInstitution[] }) {
  const t = useTranslations("Institutions");
  const tMap = useTranslations("NetworkMap");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<string>("all");
  const [specialization, setSpecialization] = useState("");
  const [sort, setSort] = useState<Sort>("az");

  const specializations = useMemo(
    () => Array.from(new Set(institutions.flatMap((i) => i.specializations))).sort((a, b) => a.localeCompare(b, locale)),
    [institutions, locale]
  );

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(locale);
    const filtered = institutions.filter(
      (i) =>
        (region === "all" || i.region === region) &&
        (!specialization || i.specializations.includes(specialization)) &&
        (!q || [i.name, i.city, i.country].some((f) => f?.toLocaleLowerCase(locale).includes(q)))
    );
    return filtered.sort((a, b) => {
      if (sort === "investigators" && b.investigators !== a.investigators) return b.investigators - a.investigators;
      if (sort === "recent") return b.createdAt.localeCompare(a.createdAt);
      return a.name.localeCompare(b.name, locale);
    });
  }, [institutions, query, region, specialization, sort, locale]);

  const filtersActive = query !== "" || region !== "all" || specialization !== "";

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
        <RegionChip label={tMap("allRegions")} active={region === "all"} onClick={() => setRegion("all")} />
        {REGIONS.map((r) => (
          <RegionChip
            key={r}
            label={tMap(`regions.${REGION_KEYS[r]}`)}
            color={REGION_COLORS[r]}
            active={region === r}
            onClick={() => setRegion(r)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-4 mt-5">
        {specializations.length > 0 && (
          <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-pistachio/70">
            {t("specializationLabel")}
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="min-w-[220px] rounded-[10px] border border-white/15 bg-richblack px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-meadow"
            >
              <option value="">{t("allSpecializations")}</option>
              {specializations.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-pistachio/70">
          {t("sortLabel")}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="min-w-[180px] rounded-[10px] border border-white/15 bg-richblack px-3.5 py-2.5 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-meadow"
          >
            <option value="az">{t("sort.az")}</option>
            <option value="investigators">{t("sort.investigators")}</option>
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
                setSpecialization("");
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
                href={`/institutions/${i.id}`}
                className="group h-full flex flex-col rounded-2xl border border-white/10 bg-white/[.03] p-6 hover:border-meadow/40 hover:bg-white/[.05] transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[17px] font-brand font-bold text-white leading-snug">{i.name}</h2>
                  {i.isHq && (
                    <span className="flex-none text-[10px] font-bold uppercase tracking-wide text-gold border border-gold/40 rounded-full px-2 py-0.5">
                      {t("hq")}
                    </span>
                  )}
                </div>
                <p className="flex items-center gap-2 text-[13.5px] text-pistachio/70 mt-1.5">
                  {i.region && (
                    <span
                      className="w-[9px] h-[9px] rounded-full flex-none"
                      style={{ background: REGION_COLORS[i.region] ?? "#888" }}
                      aria-hidden="true"
                    />
                  )}
                  {[i.city, i.country].filter(Boolean).join(", ")}
                </p>
                {i.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {i.specializations.map((s) => (
                      <span key={s} className="text-[11.5px] bg-white/[.08] text-[#d4ebe4] px-2.5 py-1 rounded-full font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 mt-auto pt-5">
                  <span className="text-[13px] text-pistachio/60">{t("investigatorCount", { count: i.investigators })}</span>
                  <span className="text-[13.5px] font-semibold text-meadow group-hover:text-white transition">
                    {t("viewInstitution")} <span className="inline-block rtl:-scale-x-100">→</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Same look as the network map's region chips, plus a colour dot so the
// region colours read the same here as on the globe.
function RegionChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
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
