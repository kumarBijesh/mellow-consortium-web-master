"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  geoPath,
  geoOrthographic,
  geoNaturalEarth1,
  geoGraticule10,
  geoCentroid,
  geoArea,
  geoDistance,
  geoInterpolate,
  type GeoPath,
  type GeoProjection,
  type ExtendedFeature,
} from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { Topology } from "topojson-specification";
import worldTopology from "world-atlas/countries-110m.json";
import InvestigatorInquiryForm from "./InvestigatorInquiryForm";
import { REGIONS, REGION_KEYS, REGION_COLORS } from "@/lib/regions";
import { Link } from "@/i18n/navigation";

export type InvestigatorRecord = { id: string; name: string; title: string | null };

export type NetworkSite = {
  id: string;
  name: string;
  city: string;
  country: string;
  region: string;
  lat: number;
  lon: number;
  isHQ: boolean;
  investigators: number;
  investigatorRecords: InvestigatorRecord[];
  activeStudies: number;
  specializations: string[];
  // True for a synthetic per-country pin representing investigators with
  // no institution_id — see app/[locale]/page.tsx. Not a real institution:
  // skips institution-only chrome (verified badge, specializations,
  // active studies) in the click-through panel.
  isIndependentGroup?: boolean;
};

const REGION_CENTER: Record<string, { lat: number; lon: number }> = {
  all: { lat: 15, lon: 10 },
  "North America": { lat: 40, lon: -95 },
  "South America": { lat: -17, lon: -60 },
  Europe: { lat: 52, lon: 12 },
  Africa: { lat: 2, lon: 22 },
  "Middle East": { lat: 25, lon: 48 },
  "Asia-Pacific": { lat: 18, lon: 110 },
};

const COUNTRY_LABEL_OVERRIDES: Record<string, string> = {
  "United States of America": "United States",
  "United Kingdom": "U.K.",
  "United Arab Emirates": "U.A.E.",
  "Dem. Rep. Congo": "DR Congo",
  "Central African Rep.": "C.A.R.",
  "Russian Federation": "Russia",
  "Bosnia and Herz.": "Bosnia",
  "South Sudan": "S. Sudan",
};

function hexToRGBA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// Hub-and-spoke: every site connects to the HQ site. Simple, dynamic (no
// hardcoded index pairs like the reference), and thematically right for
// "one network, one HQ."
function deriveLinks(sites: NetworkSite[]): [number, number][] {
  const hqIndex = sites.findIndex((s) => s.isHQ);
  if (hqIndex === -1) return [];
  return sites.map((_, i) => i).filter((i) => i !== hqIndex).map((i) => [hqIndex, i] as [number, number]);
}

export default function GlobalNetworkMap({ sites }: { sites: NetworkSite[] }) {
  const t = useTranslations("NetworkMap");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gpOverviewRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<"map" | "globe">("globe");
  const [activeRegion, setActiveRegion] = useState("all");
  // Click-through panel state: panelCountry === null is the overview.
  // Otherwise selected === -1 means "country's institution list" (level 1);
  // selected !== -1 means "institution profile + investigators" (level 2).
  // highlighted drives the map pin glow and can point at a site even while
  // only its country's list is showing (right after a dot click).
  const [panelCountry, setPanelCountry] = useState<string | null>(null);
  const [selected, setSelected] = useState(-1);
  const [highlighted, setHighlighted] = useState(-1);
  const [activeInquiryId, setActiveInquiryId] = useState<string | null>(null);
  const [countsStarted, setCountsStarted] = useState(false);

  // Refs mirroring the state above so the rAF loop always reads current
  // values without needing to restart the render loop on every change.
  const viewModeRef = useRef(viewMode);
  const activeRegionRef = useRef(activeRegion);
  const highlightedRef = useRef(highlighted);
  useEffect(() => void (viewModeRef.current = viewMode), [viewMode]);
  useEffect(() => void (activeRegionRef.current = activeRegion), [activeRegion]);
  useEffect(() => void (highlightedRef.current = highlighted), [highlighted]);

  function onSiteClick(i: number) {
    setHighlighted(i);
    setPanelCountry(sites[i].country);
    setSelected(-1);
    setActiveInquiryId(null);
  }
  function selectInstitution(i: number) {
    setHighlighted(i);
    setSelected(i);
    setActiveInquiryId(null);
  }
  function backToWorld() {
    setPanelCountry(null);
    setSelected(-1);
    setHighlighted(-1);
    setActiveInquiryId(null);
  }
  function backToCountryList() {
    setSelected(-1);
    setHighlighted(-1);
    setActiveInquiryId(null);
  }

  const links = useRef(deriveLinks(sites));
  useEffect(() => void (links.current = deriveLinks(sites)), [sites]);

  const countries = new Set(sites.map((s) => s.country));
  const totals = {
    institutions: sites.filter((s) => !s.isIndependentGroup).length,
    countries: countries.size,
    investigators: sites.reduce((a, s) => a + s.investigators, 0),
    studies: sites.reduce((a, s) => a + s.activeStudies, 0),
  };

  // Animated count-up for the overview stats, once visible.
  useEffect(() => {
    const el = gpOverviewRef.current;
    if (!el || countsStarted) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCountsStarted(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [countsStarted]);

  return (
    <div className="globe-layout grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-10 items-stretch">
      <div>
        <div className="flex flex-wrap gap-[7px] mb-[22px]" role="group" aria-label={t("filterAriaLabel")}>
          <RegionChip label={t("allRegions")} active={activeRegion === "all"} onClick={() => setActiveRegion("all")} />
          {REGIONS.map((r) => (
            <RegionChip key={r} label={t(`regions.${REGION_KEYS[r]}`)} active={activeRegion === r} onClick={() => setActiveRegion(r)} />
          ))}
        </div>

        <MapCanvas
          canvasRef={canvasRef}
          stageRef={stageRef}
          sites={sites}
          links={links}
          viewModeRef={viewModeRef}
          activeRegionRef={activeRegionRef}
          highlightedRef={highlightedRef}
          onSiteClick={onSiteClick}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>

      <div className="gpanel bg-white/[.04] border border-white/10 rounded-[18px] p-[26px] min-h-[340px] flex flex-col justify-center overflow-y-auto max-h-[720px]">
        {panelCountry === null ? (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-[22px]">
              <OverviewStat value={totals.institutions} label={t("memberInstitutions")} started={countsStarted} />
              <OverviewStat value={totals.countries} label={t("countries")} started={countsStarted} />
              <OverviewStat value={totals.investigators} label={t("investigatorsStat")} started={countsStarted} />
              <OverviewStat value={totals.studies} label={t("activeStudiesStat")} started={countsStarted} />
            </div>
            <div ref={gpOverviewRef} className="flex flex-col gap-0.5">
              {REGIONS.map((r) => {
                const n = sites.filter((s) => s.region === r && !s.isIndependentGroup).length;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setActiveRegion(r)}
                    className="flex items-center gap-[11px] px-2 py-[9px] rounded-[9px] hover:bg-white/5 dark:bg-white/[0.03] transition text-start"
                  >
                    <span className="w-[9px] h-[9px] rounded-full flex-none" style={{ background: REGION_COLORS[r] }} />
                    <span className="text-[13.5px] text-[#d4ebe4] font-medium">{t(`regions.${REGION_KEYS[r]}`)}</span>
                    <span className="ms-auto text-[12px] text-[#88a0b6] font-display font-semibold">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : selected === -1 ? (
          <CountryInstitutionList
            country={panelCountry}
            sites={sites}
            onBack={backToWorld}
            onSelectInstitution={selectInstitution}
          />
        ) : (
          <SiteProfile
            site={sites[selected]}
            country={panelCountry}
            onBackToCountry={backToCountryList}
            onBackToWorld={backToWorld}
            activeInquiryId={activeInquiryId}
            onToggleInquiry={setActiveInquiryId}
          />
        )}
      </div>
    </div>
  );
}

function RegionChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-[14px] py-2 rounded-full border font-display font-semibold text-[12.5px] transition ${
        active
          ? "bg-meadow border-meadow text-[#021B1A]"
          : "bg-white/[.04] border-white/15 text-[#c3ddd4] hover:border-meadow hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function OverviewStat({ value, label, started }: { value: number; label: string; started: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!started || !ref.current) return;
    const el = ref.current;
    let start: number | null = null;
    const duration = 1200;
    function step(t: number) {
      if (start === null) start = t;
      const p = Math.min((t - start) / duration, 1);
      el.textContent = String(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [started, value]);

  return (
    <div className="bg-white/[.04] border border-white/[.08] rounded-xl px-4 py-3.5">
      <div ref={ref} className="font-display font-extrabold text-2xl text-gold leading-none">
        0
      </div>
      <div className="text-xs text-[#a9c0d5] mt-1.5">{label}</div>
    </div>
  );
}

function Breadcrumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap text-[11.5px] mb-3">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-[#5a7286]">›</span>}
          {it.onClick ? (
            <button type="button" onClick={it.onClick} className="text-[#8fa8bd] hover:text-white transition font-medium">
              {it.label}
            </button>
          ) : (
            <span className="text-white font-semibold">{it.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

function CountryInstitutionList({
  country,
  sites,
  onBack,
  onSelectInstitution,
}: {
  country: string;
  sites: NetworkSite[];
  onBack: () => void;
  onSelectInstitution: (i: number) => void;
}) {
  const t = useTranslations("NetworkMap");
  const entries = sites.map((s, i) => ({ site: s, i })).filter((e) => e.site.country === country);
  const institutionCount = entries.filter((e) => !e.site.isIndependentGroup).length;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-[7px] text-[12.5px] font-semibold text-[#8fe3dd] hover:text-white font-display mb-4"
      >
        <span className="inline-block rtl:-scale-x-100">←</span> {t("backToNetwork")}
      </button>
      <Breadcrumb items={[{ label: t("worldLabel"), onClick: onBack }, { label: country }]} />
      {institutionCount > 0 && <p className="text-[12px] text-[#a9c0d5] mb-3.5">{t("institutionsCount", { count: institutionCount })}</p>}
      <div className="flex flex-col gap-1.5">
        {entries.map(({ site, i }) => (
          <button
            key={site.id}
            type="button"
            onClick={() => onSelectInstitution(i)}
            className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-[11px] bg-white/[.04] border border-white/[.08] hover:border-meadow/40 hover:bg-white/[.07] transition text-start"
          >
            <span>
              <span className="block text-[13.5px] font-semibold text-white">{site.name}</span>
              <span className="block text-[12px] text-[#a9c0d5] mt-0.5">
                {site.isIndependentGroup ? t("investigatorsListLabel", { count: site.investigators }) : site.city}
              </span>
            </span>
            <span className="text-[#8fe3dd] rtl:-scale-x-100">→</span>
          </button>
        ))}
        {entries.length === 0 && <p className="text-[13px] text-[#a9c0d5]">{t("noInstitutions")}</p>}
      </div>
    </div>
  );
}

function SiteProfile({
  site,
  country,
  onBackToCountry,
  onBackToWorld,
  activeInquiryId,
  onToggleInquiry,
}: {
  site: NetworkSite;
  country: string;
  onBackToCountry: () => void;
  onBackToWorld: () => void;
  activeInquiryId: string | null;
  onToggleInquiry: (id: string | null) => void;
}) {
  const t = useTranslations("NetworkMap");
  const color = REGION_COLORS[site.region] ?? "#888";
  const regionKey = (REGION_KEYS as Record<string, string>)[site.region];
  return (
    <div>
      <button
        type="button"
        onClick={onBackToCountry}
        className="inline-flex items-center gap-[7px] text-[12.5px] font-semibold text-[#8fe3dd] hover:text-white font-display mb-4"
      >
        <span className="inline-block rtl:-scale-x-100">←</span> {t("backTo", { place: country })}
      </button>
      <Breadcrumb
        items={[
          { label: t("worldLabel"), onClick: onBackToWorld },
          { label: country, onClick: onBackToCountry },
          { label: site.name },
        ]}
      />
      {!site.isIndependentGroup && (
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-meadow mb-2">
          ✓ {t("verifiedInstitution")}
        </div>
      )}
      <h3 className="text-[20px] text-white font-bold leading-tight">{site.name}</h3>
      {!site.isIndependentGroup && (
        <Link
          href={`/institutions/${site.id}`}
          className="inline-flex items-center gap-1.5 mt-1.5 text-[12.5px] font-semibold text-[#8fe3dd] hover:text-white font-display"
        >
          {t("viewFullProfile")} <span className="inline-block rtl:-scale-x-100">→</span>
        </Link>
      )}
      <div className="text-[13.5px] text-[#a9c0d5] mt-1.5 flex items-center gap-[7px] flex-wrap">
        {!site.isIndependentGroup && <span>{site.city}</span>}
        <span
          className="text-[10.5px] font-bold uppercase tracking-wide px-[9px] py-[3px] rounded-full font-display"
          style={{ background: hexToRGBA(color, 0.2), color }}
        >
          {regionKey ? t(`regions.${regionKey}`) : site.region}
        </span>
      </div>
      {!site.isIndependentGroup && (
        <div className="flex flex-wrap gap-1.5 my-[18px]">
          {site.specializations.map((sp) => (
            <span key={sp} className="text-[11.5px] bg-white/[.08] text-[#d4ebe4] px-[11px] py-[5px] rounded-full font-medium">
              {sp}
            </span>
          ))}
        </div>
      )}
      <div className={`grid ${site.isIndependentGroup ? "grid-cols-1" : "grid-cols-2"} gap-3 my-[18px]`}>
        <div className="bg-white/[.04] border border-white/[.08] rounded-[11px] px-[14px] py-3">
          <div className="font-display font-extrabold text-xl text-white leading-none">{site.investigators}</div>
          <div className="text-[11.5px] text-[#a9c0d5] mt-1.5">{t("investigatorsStat")}</div>
        </div>
        {!site.isIndependentGroup && (
          <div className="bg-white/[.04] border border-white/[.08] rounded-[11px] px-[14px] py-3">
            <div className="font-display font-extrabold text-xl text-white leading-none">{site.activeStudies}</div>
            <div className="text-[11.5px] text-[#a9c0d5] mt-1.5">{t("activeStudiesStat")}</div>
          </div>
        )}
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#8fe3dd] mb-2.5">
          {t("investigatorsListLabel", { count: site.investigatorRecords.length })}
        </p>
        <div className="flex flex-col gap-1.5">
          {site.investigatorRecords.map((inv) => (
            <div key={inv.id}>
              <button
                type="button"
                onClick={() => onToggleInquiry(activeInquiryId === inv.id ? null : inv.id)}
                aria-expanded={activeInquiryId === inv.id}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-[11px] bg-white/[.04] border border-white/[.08] hover:border-meadow/40 hover:bg-white/[.07] transition text-start"
              >
                <span>
                  <span className="block text-[13.5px] font-semibold text-white">{inv.name}</span>
                  {inv.title && <span className="block text-[12px] text-[#a9c0d5] mt-0.5">{inv.title}</span>}
                </span>
                <span className="text-[#8fe3dd]">{activeInquiryId === inv.id ? "▾" : "→"}</span>
              </button>
              {activeInquiryId === inv.id && (
                <Link
                  href={`/investigators/${inv.id}`}
                  className="inline-flex items-center gap-1.5 mt-2 ms-1 text-[12px] font-semibold text-[#8fe3dd] hover:text-white font-display"
                >
                  {t("viewFullProfile")} <span className="inline-block rtl:-scale-x-100">→</span>
                </Link>
              )}
              {activeInquiryId === inv.id && (
                <InvestigatorInquiryForm
                  investigatorId={inv.id}
                  investigatorName={inv.name}
                  institutionId={site.isIndependentGroup ? null : site.id}
                  institutionName={site.isIndependentGroup ? `Independent — ${site.country}` : site.name}
                  onClose={() => onToggleInquiry(null)}
                />
              )}
            </div>
          ))}
          {site.investigatorRecords.length === 0 && <p className="text-[13px] text-[#a9c0d5]">{t("noInvestigators")}</p>}
        </div>
      </div>
    </div>
  );
}

function MapCanvas({
  canvasRef,
  stageRef,
  sites,
  links,
  viewModeRef,
  activeRegionRef,
  highlightedRef,
  onSiteClick,
  viewMode,
  setViewMode,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  stageRef: React.RefObject<HTMLDivElement>;
  sites: NetworkSite[];
  links: React.RefObject<[number, number][]>;
  viewModeRef: React.RefObject<"map" | "globe">;
  activeRegionRef: React.RefObject<string>;
  highlightedRef: React.RefObject<number>;
  onSiteClick: (i: number) => void;
  viewMode: "map" | "globe";
  setViewMode: (v: "map" | "globe") => void;
}) {
  const t = useTranslations("NetworkMap");
  const hintMap = t("hintMap");
  const hintGlobe = t("hintGlobe");
  const [hintText, setHintText] = useState(viewMode === "globe" ? hintGlobe : hintMap);

  useEffect(() => {
    const cv = canvasRef.current;
    const stage = stageRef.current;
    if (!cv || !stage) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const topology = worldTopology as unknown as Topology;
    const countriesObject = topology.objects.countries as never;
    const countryFeatures = (feature(topology, countriesObject) as unknown as { features: ExtendedFeature[] }).features;
    const borders = mesh(topology, countriesObject, (a, b) => a !== b);
    const graticule = geoGraticule10();
    const memberCountries = new Set(sites.map((s) => s.country));

    countryFeatures.forEach((f) => {
      (f as unknown as { _c: [number, number]; _a: number })._c = geoCentroid(f);
      (f as unknown as { _c: [number, number]; _a: number })._a = geoArea(f);
    });
    const bigCountries = countryFeatures.filter((f) => (f as unknown as { _a: number })._a > 0.0016);

    const projGlobe: GeoProjection = geoOrthographic().clipAngle(90);
    const projMap: GeoProjection = geoNaturalEarth1();
    let projection: GeoProjection = viewModeRef.current === "globe" ? projGlobe : projMap;
    let path: GeoPath = geoPath(projection, ctx);

    let W = 0, H = 0, R = 0, cx = 0, cy = 0, dpr = 1;
    let lambda = -20, phi = -12, tLambda: number | null = null, tPhi: number | null = null;
    let dragging = false, lastX = 0, lastY = 0, moved = false;
    let hover = -1;
    let k = 1, panx = 0, pany = 0, baseScale = 1, baseTranslate: [number, number] = [0, 0];
    let raf = 0;
    let resizeTimer: ReturnType<typeof setTimeout>;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv!.clientWidth;
      H = cv!.clientHeight;
      cv!.width = W * dpr;
      cv!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2;
      cy = H / 2;
      R = Math.min(W, H) * 0.46;
      projGlobe.scale(R).translate([cx, cy]);
      projMap.fitExtent([[12, H * 0.12], [W - 12, H * 0.88]], { type: "Sphere" } as never);
      baseScale = projMap.scale();
      baseTranslate = projMap.translate() as [number, number];
      path = geoPath(projection, ctx);
    }

    function applyMapZoom() {
      const ox = cx * (1 - k) + panx, oy = cy * (1 - k) + pany;
      projMap.scale(baseScale * k).translate([k * baseTranslate[0] + ox, k * baseTranslate[1] + oy]);
    }
    function clampPan() {
      if (k <= 1) { panx = 0; pany = 0; return; }
      const mx = (k - 1) * W * 0.55 + 40, my = (k - 1) * H * 0.55 + 40;
      panx = Math.max(-mx, Math.min(mx, panx));
      pany = Math.max(-my, Math.min(my, pany));
    }
    function zoomAt(mx: number, my: number, k1: number) {
      k1 = Math.max(1, Math.min(6, k1));
      const ox = cx * (1 - k) + panx, oy = cy * (1 - k) + pany;
      const p0x = (mx - ox) / k, p0y = (my - oy) / k;
      const noX = mx - k1 * p0x, noY = my - k1 * p0y;
      panx = noX - cx * (1 - k1);
      pany = noY - cy * (1 - k1);
      k = k1;
      clampPan();
    }
    function flyTo(lon: number, lat: number) {
      tLambda = -lon;
      tPhi = Math.max(-82, Math.min(82, -lat));
    }
    function visible(lon: number, lat: number) {
      if (viewModeRef.current === "map") return true;
      return geoDistance([lon, lat], [-lambda, -phi]) < Math.PI / 2 - 0.02;
    }
    function labelName(n: string) {
      return COUNTRY_LABEL_OVERRIDES[n] ?? n;
    }
    function roundRect(x: number, y: number, w: number, h: number, r: number) {
      ctx!.beginPath();
      ctx!.moveTo(x + r, y);
      ctx!.arcTo(x + w, y, x + w, y + h, r);
      ctx!.arcTo(x + w, y + h, x, y + h, r);
      ctx!.arcTo(x, y + h, x, y, r);
      ctx!.arcTo(x, y, x + w, y, r);
      ctx!.closePath();
    }
    function drawPin(x: number, y: number, active: boolean, hq: boolean) {
      const r = (hq ? 9 : 7.5) * (active ? 1.18 : 1);
      const cyc = y - 1.6 * r;
      ctx!.fillStyle = "rgba(15,40,60,0.20)";
      ctx!.beginPath();
      ctx!.ellipse(x, y + 1, r * 0.55, r * 0.2, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.beginPath();
      ctx!.moveTo(x, y);
      ctx!.quadraticCurveTo(x - r * 0.95, cyc + r * 0.55, x - r, cyc);
      ctx!.arc(x, cyc, r, Math.PI, 0, true);
      ctx!.quadraticCurveTo(x + r * 0.95, cyc + r * 0.55, x, y);
      ctx!.closePath();
      ctx!.fillStyle = hq ? "#E0A500" : "#E5342B";
      ctx!.fill();
      ctx!.lineWidth = active ? 2 : 1.1;
      ctx!.strokeStyle = active ? "#ffffff" : "rgba(120,20,15,0.35)";
      ctx!.stroke();
      ctx!.fillStyle = "#fff";
      ctx!.beginPath();
      ctx!.arc(x, cyc, r * 0.4, 0, Math.PI * 2);
      ctx!.fill();
    }

    let pulseT = 0;

    function frame() {
      const mode = viewModeRef.current;
      if (mode === "globe") {
        if (tLambda !== null && tPhi !== null) {
          lambda += (tLambda - lambda) * 0.09;
          phi += (tPhi - phi) * 0.09;
          if (Math.abs(tLambda - lambda) < 0.15 && Math.abs(tPhi - phi) < 0.15) {
            lambda = tLambda; phi = tPhi; tLambda = null; tPhi = null;
          }
        } else if (!dragging && !reduce) {
          lambda += 0.12;
        }
        if (lambda > 180) lambda -= 360;
        if (lambda < -180) lambda += 360;
        projGlobe.rotate([lambda, phi]);
      }
      const map = mode === "map";
      if (map) applyMapZoom();

      ctx!.clearRect(0, 0, W, H);

      ctx!.beginPath();
      path({ type: "Sphere" } as never);
      let g: CanvasGradient;
      if (map) {
        g = ctx!.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(1, "#eaf3f6");
      } else {
        g = ctx!.createRadialGradient(cx - R * 0.35, cy - R * 0.42, R * 0.15, cx, cy, R);
        g.addColorStop(0, "#12456e");
        g.addColorStop(0.65, "#0b2e4e");
        g.addColorStop(1, "#071f38");
      }
      ctx!.fillStyle = g;
      ctx!.fill();

      ctx!.beginPath();
      path(graticule as never);
      ctx!.strokeStyle = map ? "rgba(120,150,170,0.10)" : "rgba(150,200,235,0.09)";
      ctx!.lineWidth = 0.6;
      ctx!.stroke();

      countryFeatures.forEach((f) => {
        const member = memberCountries.has((f.properties as { name: string }).name);
        ctx!.beginPath();
        path(f as never);
        ctx!.fillStyle = map ? (member ? "#5bb0ad" : "#a4c7ce") : member ? "rgba(21,168,160,0.32)" : "rgba(31,74,112,0.85)";
        ctx!.fill();
        ctx!.lineWidth = map ? 0.7 : member ? 0.9 : 0.5;
        ctx!.strokeStyle = map ? "rgba(255,255,255,0.9)" : member ? "rgba(120,224,214,0.7)" : "rgba(94,140,180,0.5)";
        ctx!.stroke();
      });
      ctx!.beginPath();
      path(borders as never);
      ctx!.strokeStyle = map ? "rgba(255,255,255,0.85)" : "rgba(120,160,195,0.35)";
      ctx!.lineWidth = map ? 0.6 : 0.4;
      ctx!.stroke();
      ctx!.beginPath();
      path({ type: "Sphere" } as never);
      ctx!.strokeStyle = map ? "rgba(150,180,195,0.5)" : "rgba(21,168,160,0.5)";
      ctx!.lineWidth = map ? 1 : 1.4;
      ctx!.stroke();

      ctx!.font = "600 10.5px Inter, sans-serif";
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      bigCountries.forEach((f) => {
        const c = (f as unknown as { _c: [number, number] })._c;
        if (!visible(c[0], c[1])) return;
        const area = path.area(f as never);
        if (area < 520) return;
        const p = projection(c);
        if (!p) return;
        const member = memberCountries.has((f.properties as { name: string }).name);
        const name = labelName((f.properties as { name: string }).name);
        if (map) {
          ctx!.lineWidth = 2.6;
          ctx!.strokeStyle = "rgba(255,255,255,0.85)";
          ctx!.strokeText(name, p[0], p[1]);
          ctx!.fillStyle = member ? "#0d6b66" : "rgba(51,80,100,0.8)";
          ctx!.fillText(name, p[0], p[1]);
        } else {
          ctx!.lineWidth = 2.6;
          ctx!.strokeStyle = "rgba(7,31,56,0.75)";
          ctx!.strokeText(name, p[0], p[1]);
          ctx!.fillStyle = member ? "#bff5ef" : "rgba(214,230,244,0.82)";
          ctx!.fillText(name, p[0], p[1]);
        }
      });
      ctx!.textAlign = "left";
      ctx!.textBaseline = "alphabetic";

      if (!reduce) pulseT = (pulseT + 0.006) % 1;
      (links.current ?? []).forEach((l, li) => {
        const A = sites[l[0]], B = sites[l[1]];
        const interp = geoInterpolate([A.lon, A.lat], [B.lon, B.lat]);
        const coords: [number, number][] = [];
        for (let t = 0; t <= 1.0001; t += 0.03) coords.push(interp(t));
        ctx!.beginPath();
        path({ type: "LineString", coordinates: coords } as never);
        ctx!.strokeStyle = map ? "rgba(21,140,132,0.28)" : "rgba(21,168,160,0.32)";
        ctx!.lineWidth = 1;
        ctx!.stroke();
        if (!reduce) {
          const fwd = (pulseT + li * 0.13) % 1;
          const bwd = (pulseT * 0.92 + li * 0.21 + 0.5) % 1;
          const ts = [fwd, (fwd + 0.5) % 1, 1 - bwd, 1 - ((bwd + 0.5) % 1)];
          ts.forEach((tt) => {
            const q = interp(tt);
            if (visible(q[0], q[1])) {
              const pp = projection(q);
              if (pp) {
                ctx!.fillStyle = map ? "rgba(12,110,104,0.9)" : "rgba(255,255,255,0.9)";
                ctx!.beginPath();
                ctx!.arc(pp[0], pp[1], map ? 1.8 : 2, 0, Math.PI * 2);
                ctx!.fill();
              }
            }
          });
        }
      });

      const now = Date.now() / 1000;
      sites.forEach((s, i) => {
        if (!visible(s.lon, s.lat)) return;
        const p = projection([s.lon, s.lat]);
        if (!p) return;
        const region = activeRegionRef.current;
        const dimmed = region !== "all" && s.region !== region;
        const isActive = i === hover || i === highlightedRef.current;
        ctx!.globalAlpha = dimmed ? 0.32 : 1;
        if (map) {
          drawPin(p[0], p[1], isActive, s.isHQ);
        } else {
          const col = s.isHQ ? "#F0CE6A" : REGION_COLORS[s.region];
          const pulse = Math.sin(now * 1.8 + i) * 0.5 + 0.5;
          ctx!.fillStyle = hexToRGBA(col, (isActive ? 0.32 : 0.16) + pulse * 0.1);
          ctx!.beginPath();
          ctx!.arc(p[0], p[1], (s.isHQ ? 5 : 4) + (isActive ? 9 : 6), 0, Math.PI * 2);
          ctx!.fill();
          ctx!.fillStyle = col;
          ctx!.beginPath();
          ctx!.arc(p[0], p[1], (s.isHQ ? 4.4 : 3.4) * (isActive ? 1.4 : 1), 0, Math.PI * 2);
          ctx!.fill();
          ctx!.strokeStyle = "rgba(255,255,255,0.85)";
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.arc(p[0], p[1], (s.isHQ ? 4.4 : 3.4) * (isActive ? 1.4 : 1), 0, Math.PI * 2);
          ctx!.stroke();
          if (isActive) {
            ctx!.strokeStyle = "#fff";
            ctx!.lineWidth = 1.5;
            ctx!.beginPath();
            ctx!.arc(p[0], p[1], (s.isHQ ? 4.4 : 3.4) * 1.4 + 5, 0, Math.PI * 2);
            ctx!.stroke();
          }
        }
        ctx!.globalAlpha = 1;
      });

      if (hover >= 0 && visible(sites[hover].lon, sites[hover].lat)) {
        const s = sites[hover];
        const p = projection([s.lon, s.lat]);
        if (p) {
          const label = s.city;
          ctx!.font = "600 12px Inter, sans-serif";
          const tw = ctx!.measureText(label).width;
          const ty = p[1] - (map ? 42 : 24);
          ctx!.fillStyle = "rgba(6,31,56,0.94)";
          roundRect(p[0] + 12, ty, tw + 18, 22, 6);
          ctx!.fill();
          ctx!.fillStyle = "#fff";
          ctx!.textBaseline = "alphabetic";
          ctx!.fillText(label, p[0] + 21, ty + 15);
        }
      }

      raf = requestAnimationFrame(frame);
    }

    function pos(e: PointerEvent) {
      const r = cv!.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function hit(mx: number, my: number) {
      let best = -1;
      let bd = viewModeRef.current === "map" ? 24 : 15;
      sites.forEach((s, i) => {
        if (!visible(s.lon, s.lat)) return;
        const p = projection([s.lon, s.lat]);
        if (!p) return;
        const d = Math.hypot(p[0] - mx, p[1] - (my + (viewModeRef.current === "map" ? 12 : 0)));
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    }

    function onPointerDown(e: PointerEvent) {
      dragging = true; moved = false; lastX = e.clientX; lastY = e.clientY;
      tLambda = null; tPhi = null;
      cv!.setPointerCapture(e.pointerId);
    }
    function onPointerMove(e: PointerEvent) {
      const p = pos(e);
      if (dragging && viewModeRef.current === "globe") {
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
        lambda += dx * 0.24;
        phi = Math.max(-82, Math.min(82, phi + dy * 0.24));
        lastX = e.clientX; lastY = e.clientY;
      } else if (dragging) {
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
        if (k > 1) { panx += dx; pany += dy; clampPan(); }
        lastX = e.clientX; lastY = e.clientY;
      } else {
        const h = hit(p.x, p.y);
        hover = h;
        cv!.style.cursor = h >= 0 ? "pointer" : viewModeRef.current === "globe" ? "grab" : k > 1 ? "grab" : "default";
      }
    }
    function onPointerUp(e: PointerEvent) {
      dragging = false;
      if (!moved) {
        const p = pos(e);
        const h = hit(p.x, p.y);
        if (h >= 0) {
          onSiteClick(h);
          if (viewModeRef.current === "globe") flyTo(sites[h].lon, sites[h].lat);
        }
      }
    }
    function onPointerLeave() { hover = -1; dragging = false; }
    function onWheel(e: WheelEvent) {
      if (viewModeRef.current !== "map") return;
      e.preventDefault();
      const r = cv!.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, k * Math.exp(-e.deltaY * 0.0016));
    }

    cv.addEventListener("pointerdown", onPointerDown);
    cv.addEventListener("pointermove", onPointerMove);
    cv.addEventListener("pointerup", onPointerUp);
    cv.addEventListener("pointerleave", onPointerLeave);
    cv.addEventListener("wheel", onWheel, { passive: false });

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    }
    window.addEventListener("resize", onResize);

    if (viewModeRef.current === "map") stage!.classList.add("maptheme");
    resize();
    frame();

    // Expose imperative controls used by JSX buttons outside this effect.
    (cv as unknown as { __controls: unknown }).__controls = {
      setView: (mode: "map" | "globe") => {
        stage!.classList.toggle("maptheme", mode === "map");
        k = 1; panx = 0; pany = 0; hover = -1; tLambda = null; tPhi = null;
        projection = mode === "globe" ? projGlobe : projMap;
        path = geoPath(projection, ctx);
        setHintText(mode === "globe" ? hintGlobe : hintMap);
      },
      zoom: (dir: "in" | "out" | "reset") => {
        if (dir === "reset") { k = 1; panx = 0; pany = 0; return; }
        zoomAt(cx, cy, dir === "in" ? k * 1.5 : k / 1.5);
      },
      flyTo,
    };

    return () => {
      cv.removeEventListener("pointerdown", onPointerDown);
      cv.removeEventListener("pointermove", onPointerMove);
      cv.removeEventListener("pointerup", onPointerUp);
      cv.removeEventListener("pointerleave", onPointerLeave);
      cv.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites]);

  function controls() {
    return (canvasRef.current as unknown as { __controls?: { setView: (m: "map" | "globe") => void; zoom: (d: "in" | "out" | "reset") => void; flyTo: (lon: number, lat: number) => void } })?.__controls;
  }

  return (
    <div ref={stageRef} className="globe-stage relative aspect-square max-w-[820px] w-full mx-auto touch-none rounded-2xl overflow-hidden shadow-[0_22px_55px_-26px_rgba(0,0,0,.55)]">
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      <div className="absolute top-0 end-0 flex gap-0.5 bg-[#021B1A]/[.06] border border-[#021B1A]/[.16] rounded-full p-[3px] z-[3]">
        {(["map", "globe"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => { setViewMode(v); controls()?.setView(v); }}
            className={`border-none font-display font-semibold text-[12px] px-[15px] py-1.5 rounded-full transition ${
              viewMode === v ? "bg-meadow text-[#021B1A]" : "bg-transparent text-[#3a5850] hover:text-richblack dark:text-white"
            }`}
          >
            {v === "map" ? t("worldMap") : t("globe")}
          </button>
        ))}
      </div>

      {viewMode === "map" && (
        <div className="absolute end-3 bottom-[38px] flex flex-col gap-1 z-[3]">
          {[
            { z: "in" as const, label: t("zoomIn"), glyph: "+" },
            { z: "out" as const, label: t("zoomOut"), glyph: "−" },
            { z: "reset" as const, label: t("resetView"), glyph: "⤢" },
          ].map((b) => (
            <button
              key={b.z}
              type="button"
              aria-label={b.label}
              onClick={() => controls()?.zoom(b.z)}
              className="w-[34px] h-[34px] rounded-[9px] border border-[#021B1A]/[.16] bg-white/95 dark:bg-white/[0.03] text-richblack dark:text-white font-display font-semibold grid place-items-center shadow-[0_4px_12px_-6px_rgba(0,0,0,.3)] hover:border-forest hover:text-forest transition"
            >
              {b.glyph}
            </button>
          ))}
        </div>
      )}

      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11.5px] text-[#5a7286] flex items-center gap-2 whitespace-nowrap">
        <span className="w-[5px] h-[5px] rounded-full bg-meadow" /> {hintText}
      </div>
    </div>
  );
}
