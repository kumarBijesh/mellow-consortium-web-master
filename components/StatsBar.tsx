"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

export type StatsBarData = {
  globalRegions: number;
  clinicalSites: number;
  publications: number;
  investigators: number;
  countries: number;
  industryPartners: number;
  longevityMarket: number;
  longevityMarketUnit: string;
};

function ease(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function StatsBar({ stats }: { stats: StatsBarData }) {
  const t = useTranslations("StatsBar");
  const containerRef = useRef<HTMLDivElement>(null);

  // Every value here comes from a live Supabase count passed down from the
  // homepage Server Component — nothing is hand-typed. "Longevity Market"
  // is the one exception in kind (an external market-size estimate, not
  // platform data); it's still admin-edited via /admin/network/settings
  // rather than hardcoded, just not a COUNT query like the rest.
  const displayStats = [
    { to: stats.globalRegions, suffix: "+", labelKey: "globalRegions" },
    { to: stats.clinicalSites, suffix: "+", labelKey: "clinicalSites" },
    { to: stats.publications, suffix: "+", labelKey: "publications" },
    { to: stats.investigators, suffix: "+", labelKey: "investigators" },
    { to: stats.countries, suffix: "+", labelKey: "countries" },
    { to: stats.longevityMarket, prefix: "$", suffix: stats.longevityMarketUnit, labelKey: "longevityMarket" },
    { to: stats.industryPartners, suffix: "+", labelKey: "industryPartners" },
  ];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const nums = Array.from(container.querySelectorAll<HTMLElement>("[data-stat-num]"));
    const duration = 1200;

    function run(el: HTMLElement) {
      const to = Number(el.dataset.to);
      const prefix = el.dataset.prefix ?? "";
      const suffix = el.dataset.suffix ?? "";
      let start: number | null = null;

      function step(t: number) {
        if (start === null) start = t;
        const p = Math.min((t - start) / duration, 1);
        el.textContent = `${prefix}${Math.round(to * ease(p))}${suffix}`;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            nums.forEach(run);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(container);

    return () => io.disconnect();
  }, [stats]);

  return (
    <div className="bg-darkgreen text-white relative z-[3] -mt-8 pt-8 mkt-diagonal-top">
      <div ref={containerRef} className="wrap grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 py-[34px]">
        {displayStats.map((s, i) => (
          <div key={s.labelKey} className={`text-center px-2 relative ${i > 0 ? "before:content-[''] before:absolute before:start-0 before:top-[14%] before:h-[72%] before:w-px before:bg-white/10 max-lg:before:hidden" : ""}`}>
            <div
              data-stat-num
              data-to={s.to}
              data-prefix={s.prefix ?? ""}
              data-suffix={s.suffix ?? ""}
              className="font-brand font-extrabold text-[30px] text-caribbean leading-none tracking-tight"
            >
              0
            </div>
            <div className="text-[11.5px] text-pistachio/80 mt-2 tracking-wide">{t(s.labelKey)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
