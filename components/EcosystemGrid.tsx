"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/motion/Reveal";
import { JLIVE_URL, isExternalHref } from "@/lib/external-links";

type Division = {
  id: string;
  name: string;
  kicker: string;
  description: string;
  accent_color: string;
  external_url: string | null;
};

const BADGES: Record<string, string> = {
  consortium: "◎",
  age: "◍",
  jlive: "❋",
  conferences: "◈",
  news: "◆",
};

// Divisions without a live external_url yet still need somewhere real to
// go — falling back to "#" would recreate the dead-link problem this site
// is meant to avoid.
const FALLBACK_HREFS: Record<string, string> = {
  consortium: "/",
  age: "/mellow-age",
  jlive: JLIVE_URL,
  conferences: "/conferences",
  news: "/news",
};

function hrefFor(d: Division) {
  if (d.external_url) return d.external_url;
  return FALLBACK_HREFS[d.id] ?? `/coming-soon?from=${d.id}`;
}

// external_url values leave the site entirely (e.g. the JLIVE publishing
// platform) and aren't locale-routed pages, so they can't go through
// next-intl's Link — that's built for internal, locale-prefixed paths.
// Route external destinations through a plain anchor that opens in a new
// tab instead, so visitors don't lose their place on the MELLOW site.
function DivisionLink({
  href,
  className,
  style,
  children,
}: {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  if (isExternalHref(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  );
}

// This section's background moved from white to Rich Black, and two of
// the five division accent_colors (data-driven, from Supabase) fail WCAG
// AA as small text on a dark background — consortium blue ~3.3:1, jlive
// purple ~3.0:1, against a 4.5:1 requirement. Lightened, brand-adjacent
// stand-ins for text/icon use only; the badge wash/border still use the
// true accent_color since those aren't conveying text.
const TEXT_SAFE_ON_DARK: Record<string, string> = {
  consortium: "#4FB3E8",
  jlive: "#A78BE8",
};

function textColorFor(d: Division) {
  return TEXT_SAFE_ON_DARK[d.id] ?? d.accent_color;
}

export default function EcosystemGrid({ divisions }: { divisions: Division[] }) {
  const t = useTranslations("EcosystemGrid");
  const [activeId, setActiveId] = useState<string | null>(divisions[0]?.id ?? null);
  const active = divisions.find((d) => d.id === activeId) ?? divisions[0];

  return (
    <section className="py-24 bg-richblack text-white relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(900px 500px at 50% 0%, rgba(44,194,149,.12), transparent 60%)" }}
      />
      <div className="wrap relative z-[2]">
        <Reveal>
          <div className="max-w-[620px] mx-auto text-center mb-16">
            <span className="mkt-eyebrow justify-center">{t("eyebrow")}</span>
            <h2 className="text-[34px] mt-4 mb-3 text-white font-brand">{t("heading")}</h2>
            <p className="text-pistachio/70 text-[16px]">{t("description")}</p>
          </div>
        </Reveal>

        {/* Desktop: interactive node network — hover or focus a node to
            expand its detail below. Keyboard users get the same result via
            focus; a click "pins" a node so touch-capable desktops work too. */}
        <div className="hidden lg:block">
          <div className="relative flex items-center justify-between max-w-[860px] mx-auto px-6 mb-4">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-px bg-white/10" />
            {divisions.map((d) => {
              const isActive = d.id === active?.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onMouseEnter={() => setActiveId(d.id)}
                  onFocus={() => setActiveId(d.id)}
                  onClick={() => setActiveId(d.id)}
                  aria-pressed={isActive}
                  className="relative z-[2] flex flex-col items-center gap-2.5 group/node outline-none"
                >
                  <span
                    className="w-16 h-16 rounded-full grid place-items-center text-2xl transition-all duration-300 border-2"
                    style={{
                      background: isActive ? `${d.accent_color}22` : "rgba(255,255,255,.04)",
                      borderColor: isActive ? d.accent_color : "rgba(255,255,255,.14)",
                      color: textColorFor(d),
                      boxShadow: isActive ? `0 0 0 6px ${d.accent_color}1a, 0 12px 28px -10px ${d.accent_color}80` : "none",
                      transform: isActive ? "scale(1.08)" : "scale(1)",
                    }}
                  >
                    {BADGES[d.id] ?? "●"}
                  </span>
                  <span
                    className={`text-[11px] font-bold tracking-[0.1em] uppercase transition-colors ${
                      isActive ? "text-white" : "text-white/45 group-hover/node:text-white/80"
                    }`}
                  >
                    {d.kicker}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {active && (
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="mkt-card-dark max-w-[640px] mx-auto p-8 text-center"
              >
                <h3 className="text-[22px] font-brand text-white mb-2.5">{active.name}</h3>
                <p className="text-pistachio/70 text-[15px] max-w-[480px] mx-auto">{active.description}</p>
                <DivisionLink
                  href={hrefFor(active)}
                  className="inline-flex items-center gap-1.5 text-[14px] font-semibold mt-5"
                  style={{ color: textColorFor(active) }}
                >
                  {t("enterDivision")} <span className="inline-block rtl:-scale-x-100">→</span>
                </DivisionLink>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile/tablet fallback: hover-expand doesn't work on touch, so
            show every division's full content at once, stacked. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:hidden">
          {divisions.map((d) => (
            <DivisionLink
              key={d.id}
              href={hrefFor(d)}
              className="mkt-card-dark p-6 flex flex-col"
              style={{ ["--acc" as string]: d.accent_color }}
            >
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg mb-4"
                style={{ background: `${d.accent_color}22`, color: textColorFor(d) }}
              >
                {BADGES[d.id] ?? "●"}
              </div>
              <div className="text-[11px] font-bold tracking-[0.14em] uppercase mb-2" style={{ color: textColorFor(d) }}>
                {d.kicker}
              </div>
              <h3 className="text-[18px] mb-2 text-white font-brand">{d.name}</h3>
              <p className="text-pistachio/70 text-[14px] flex-1">{d.description}</p>
              <span className="text-[13.5px] font-semibold mt-4 inline-flex items-center gap-1.5" style={{ color: textColorFor(d) }}>
                {t("enterDivision")} <span className="inline-block rtl:-scale-x-100">→</span>
              </span>
            </DivisionLink>
          ))}
        </div>
      </div>
    </section>
  );
}
