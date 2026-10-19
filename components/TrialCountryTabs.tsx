"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type TrialCard = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  status: string;
  therapeutic_area: string | null;
};

type Group = { country: string; trials: TrialCard[] };

export default function TrialCountryTabs({ groups }: { groups: Group[] }) {
  const t = useTranslations("TrialStatus");
  const tTrials = useTranslations("Trials");
  const [active, setActive] = useState(0);
  if (groups.length === 0) return null;
  const current = groups[active] ?? groups[0];

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-7" role="tablist">
        {groups.map((g, i) => (
          <button
            key={g.country}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`px-[18px] py-2.5 rounded-full border font-display font-semibold text-[14px] transition ${
              i === active
                ? "bg-navy text-white border-navy"
                : "bg-white dark:bg-white/[0.03] text-muted dark:text-white/60 border-line dark:border-white/10 hover:border-blue hover:text-blue"
            }`}
          >
            {g.country}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
        {current.trials.map((trial, i) => (
          <Link
            key={trial.id}
            href={`/trials/${trial.slug}`}
            className="rounded-2xl border border-line dark:border-white/10 overflow-hidden bg-white dark:bg-white/[0.03] flex flex-col hover:-translate-y-1 hover:shadow-card-sm dark:shadow-none dark:ring-1 dark:ring-white/[0.08] transition"
          >
            <div
              className="h-[120px] relative"
              style={{
                background:
                  i % 3 === 0
                    ? "linear-gradient(135deg,#006EB6,#15A8A0)"
                    : i % 3 === 1
                      ? "linear-gradient(135deg,#0c3661,#006EB6)"
                      : "linear-gradient(135deg,#15A8A0,#0c8f88)",
              }}
            >
              <div className="absolute top-3 start-3 flex gap-1.5">
                <span className="text-[10.5px] font-bold uppercase tracking-wide px-[9px] py-[5px] rounded-md font-display bg-gold text-navy dark:text-white">
                  {t.has(trial.status) ? t(trial.status) : trial.status}
                </span>
              </div>
            </div>
            <div className="p-[18px] flex flex-col flex-1">
              <span className="text-[11.5px] font-bold text-blue tracking-wide uppercase">
                {trial.therapeutic_area ?? tTrials("longevityFallback")}
              </span>
              <h4 className="text-[16.5px] text-navy dark:text-white mt-1.5 font-semibold">{trial.title}</h4>
              {trial.summary && <p className="text-[13px] text-muted dark:text-white/60 mt-2">{trial.summary}</p>}
              <div className="mt-auto pt-4 text-[12.5px] font-semibold font-display text-blue">
                {tTrials("viewDetails")} <span className="inline-block rtl:-scale-x-100">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
