"use client";

import { Fragment, useState } from "react";
import { Link } from "@/i18n/navigation";

import type { CellValue, MembershipSection, MembershipTier } from "@/lib/membership-plans";

function Cell({ value }: { value: CellValue }) {
  if (value === true) {
    return (
      <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-meadow/15 text-forest dark:text-meadow" aria-label="Included">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M4 12.5l5 5L20 6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (value === false) {
    return <span className="text-muted/40 dark:text-white/20" aria-label="Not included">—</span>;
  }
  return <span className="text-[13px] font-semibold text-navy dark:text-white">{value}</span>;
}

const discoveryCallHref = (tier: string) => `/discovery-call?tier=${encodeURIComponent(tier)}`;

// min-h fits a two-line label, so every tier's button is the same height
// even when a (admin-editable) CTA label wraps in a narrow column.
const CTA_CLASS =
  "min-h-[52px] w-full flex items-center justify-center rounded-full border border-line dark:border-white/15 px-3 py-2 text-[13px] leading-tight font-semibold text-navy dark:text-white text-center hover:border-meadow transition";

function TierCta({ tier }: { tier: MembershipTier }) {
  return (
    <Link href={discoveryCallHref(tier.name)} className={CTA_CLASS}>
      {tier.cta_label || "Get started"}
    </Link>
  );
}

// Tiers and benefits come from the DB (supabase/membership-plans.sql),
// edited at /admin/cms/membership-plans. Only sponsor tiers are columns.
// Each tier's CTA sits at the bottom of the comparison, under its column.
export default function MembershipPlansTable({ tiers, sections }: { tiers: MembershipTier[]; sections: MembershipSection[] }) {
  const [activeTierId, setActiveTierId] = useState<string>(tiers.find((t) => t.is_featured)?.id ?? tiers[0]?.id ?? "");

  return (
    <div>
      {/* Desktop / tablet: full comparison table */}
      <div className="hidden md:block overflow-x-auto rounded-card border border-line dark:border-white/10">
        <table className="w-full border-collapse min-w-[720px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white dark:bg-richblack text-start px-5 py-4 text-[13px] font-semibold text-muted dark:text-white/50 border-b border-line dark:border-white/10">
                Benefit
              </th>
              {tiers.map((tier) => (
                <th
                  key={tier.id}
                  className={`px-5 py-4 text-center border-b border-line dark:border-white/10 ${
                    tier.is_featured ? "bg-meadow/[0.06]" : ""
                  }`}
                >
                  <div className="text-[15px] font-bold text-navy dark:text-white">{tier.name}</div>
                  <div className="text-[13px] text-muted dark:text-white/50 mt-0.5">{tier.price_label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <Fragment key={section.id}>
                <tr>
                  <td
                    colSpan={tiers.length + 1}
                    className="sticky left-0 bg-lightblue/50 dark:bg-white/[0.03] px-5 py-2 text-[11px] font-bold uppercase tracking-[0.06em] text-teal dark:text-meadow border-b border-line dark:border-white/10"
                  >
                    {section.title}
                  </td>
                </tr>
                {section.benefits.map((b) => (
                  <tr key={b.id} className="group">
                    <td className="sticky left-0 bg-white dark:bg-richblack group-hover:bg-lightblue/30 dark:group-hover:bg-white/[0.02] px-5 py-3 text-[13.5px] text-ink dark:text-white/85 border-b border-line/60 dark:border-white/[0.06]">
                      {b.label}
                    </td>
                    {tiers.map((tier) => (
                      <td
                        key={tier.id}
                        className={`px-5 py-3 text-center border-b border-line/60 dark:border-white/[0.06] group-hover:bg-lightblue/30 dark:group-hover:bg-white/[0.02] ${
                          tier.is_featured ? "bg-meadow/[0.03]" : ""
                        }`}
                      >
                        <Cell value={b.values[tier.id] ?? false} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky left-0 bg-white dark:bg-richblack px-5 py-5" />
              {tiers.map((tier) => (
                <td key={tier.id} className={`px-4 py-5 ${tier.is_featured ? "bg-meadow/[0.03]" : ""}`}>
                  <TierCta tier={tier} />
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile: tier picker + single-column benefit list */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1" role="tablist" aria-label="Select a membership tier">
          {tiers.map((tier) => (
            <button
              key={tier.id}
              type="button"
              role="tab"
              aria-selected={activeTierId === tier.id}
              onClick={() => setActiveTierId(tier.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold border transition ${
                activeTierId === tier.id
                  ? "bg-meadow text-richblack border-meadow"
                  : "bg-white dark:bg-white/[0.04] text-navy dark:text-white/70 border-line dark:border-white/10"
              }`}
            >
              {tier.name} <span className="opacity-70">· {tier.price_label}</span>
            </button>
          ))}
        </div>

        <div className="rounded-card border border-line dark:border-white/10 overflow-hidden">
          {sections.map((section) => (
            <div key={section.id}>
              <div className="bg-lightblue/50 dark:bg-white/[0.03] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.06em] text-teal dark:text-meadow border-b border-line dark:border-white/10">
                {section.title}
              </div>
              {section.benefits.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line/60 dark:border-white/[0.06] last:border-b-0"
                >
                  <span className="text-[13.5px] text-ink dark:text-white/85">{b.label}</span>
                  <Cell value={b.values[activeTierId] ?? false} />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          {tiers.map((tier) => (
            <div key={tier.id} className="text-center">
              <div className="text-[13px] font-bold text-navy dark:text-white mb-2">
                {tier.name} <span className="font-normal text-muted dark:text-white/50">· {tier.price_label}</span>
              </div>
              <TierCta tier={tier} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
