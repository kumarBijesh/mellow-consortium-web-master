import { getTranslations } from "next-intl/server";

// Sample-data preview only — no biomarker table or lab-result ingestion
// exists in this codebase yet, so there's nothing real to trend. See the
// note in app/dashboard/patient/page.tsx for why these aren't computed.
const SAMPLE_TRENDS = [
  { key: "biologicalAge", unit: "yrs", points: [37.2, 36.5, 36.1, 35.4, 34.9, 34.5], color: "#15A8A0" },
  { key: "glucose", unit: "mg/dL", points: [108, 106, 104, 103, 102, 101.1], color: "#006EB6" },
  { key: "hsCrp", unit: "mg/L", points: [5.2, 4.8, 4.5, 4.2, 4.0, 3.9], color: "#D9B447" },
];

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 280;
  const h = 64;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => `${i * step},${h - ((p - min) / range) * (h - 8) - 4}`);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16" preserveAspectRatio="none">
      <polyline points={coords.join(" ")} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => {
        const [x, y] = c.split(",");
        return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />;
      })}
    </svg>
  );
}

export default async function HealthTrendsPage() {
  const t = await getTranslations("PatientDashboard.pages.healthTrends");
  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-1">
        <h1 className="text-[26px] text-navy dark:text-white">{t("title")}</h1>
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted dark:text-white/40 border border-line dark:border-white/15 rounded-full px-2 py-0.5">
          {t("sampleTag")}
        </span>
      </div>
      <p className="text-muted dark:text-white/60 text-[14.5px] mb-10">{t("subtitle")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {SAMPLE_TRENDS.map((trend) => (
          <div key={trend.key} className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-[14.5px] font-semibold text-navy dark:text-white">{t(trend.key)}</h3>
              <span className="text-[13px] text-muted dark:text-white/50">
                {trend.points[trend.points.length - 1]} {trend.unit}
              </span>
            </div>
            <Sparkline points={trend.points} color={trend.color} />
          </div>
        ))}
      </div>
    </div>
  );
}
