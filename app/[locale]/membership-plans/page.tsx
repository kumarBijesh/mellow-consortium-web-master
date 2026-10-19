import { Link } from "@/i18n/navigation";
import MembershipPlansTable from "@/components/MembershipPlansTable";
import { createClient } from "@/lib/supabase/server";
import { fetchMembershipPlans } from "@/lib/membership-plans";

const discoveryCallHref = (tier: string) => `/discovery-call?tier=${encodeURIComponent(tier)}`;

export const metadata = { title: "Compare Membership Plans" };
// Saves from /admin/cms/membership-plans revalidate this page immediately;
// this is just the backstop.
export const revalidate = 300;

const COUNT_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

export default async function MembershipPlansPage() {
  const { plans } = await fetchMembershipPlans(createClient());
  const sponsorTiers = plans.tiers.filter((t) => t.kind === "sponsor");
  const individualTiers = plans.tiers.filter((t) => t.kind === "individual");
  const sponsorCount = COUNT_WORDS[sponsorTiers.length] ?? String(sponsorTiers.length);

  return (
    <main className="py-24">
      <div className="wrap">
        <div className="text-center max-w-[680px] mx-auto mb-14">
          <span className="eyebrow justify-center">Partner with MELLOW</span>
          <h1 className="text-[38px] mt-4 mb-3 text-navy dark:text-white">Compare Membership Plans</h1>
          <p className="text-muted dark:text-white/60 text-[16px]">
            {sponsorCount} industry sponsorship {sponsorTiers.length === 1 ? "tier" : "tiers"}
            {individualTiers.length > 0 ? ", plus a lighter individual Member tier" : ""}. Every tier includes access to the
            MELLOW global investigator network — higher tiers add deeper strategic, clinical, and commercial benefits.
          </p>
        </div>

        <MembershipPlansTable tiers={sponsorTiers} sections={plans.sections} />

        {individualTiers.map((tier) => (
          <div key={tier.id} className="mt-10 rounded-card border border-line dark:border-white/10 bg-lightblue/40 dark:bg-teal/[0.08] p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
            <div className="flex-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-teal dark:text-meadow">Individual membership</span>
              <h3 className="text-[20px] font-bold text-navy dark:text-white mt-1.5 mb-2">{tier.name} — {tier.price_label}</h3>
              <p className="text-muted dark:text-white/60 text-[14px]">{tier.description}</p>
            </div>
            <Link
              href={discoveryCallHref(tier.name)}
              className="shrink-0 rounded-full border border-line dark:border-white/15 text-[13px] font-semibold text-navy dark:text-white py-3 px-6 hover:border-meadow transition text-center"
            >
              {tier.cta_label || "Get started"}
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
