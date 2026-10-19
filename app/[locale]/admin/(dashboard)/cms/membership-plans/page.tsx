import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchMembershipPlans } from "@/lib/membership-plans";
import MembershipPlansEditor from "@/components/admin/MembershipPlansEditor";

export const dynamic = "force-dynamic";

export default async function AdminMembershipPlansPage() {
  const { plans, error } = await fetchMembershipPlans(createClient());

  return (
    <div>
      <Link href="/admin/cms" className="text-[13.5px] font-semibold text-teal hover:text-ink dark:text-white transition mb-6 inline-block">
        &larr; CMS
      </Link>
      <h1 className="text-[26px] font-display font-bold text-ink dark:text-white mb-1">Membership plans</h1>
      <p className="text-[13.5px] text-muted dark:text-white/40 mb-8">
        Everything on{" "}
        <Link href="/membership-plans" className="text-teal hover:underline">
          /membership-plans
        </Link>
        . Changes go live when you save.
      </p>

      {error ? (
        <div className="text-[14px] text-red-300 mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="font-semibold mb-1">Couldn&apos;t load membership plans.</p>
          <p className="font-mono text-[12.5px] break-all">{error}</p>
          <p className="text-[12px] text-muted dark:text-white/30 mt-2">
            Make sure <code className="px-1 py-0.5 bg-lightblue dark:bg-teal/[0.08] rounded">supabase/membership-plans.sql</code> has been run.
          </p>
        </div>
      ) : (
        <MembershipPlansEditor initial={plans} />
      )}
    </div>
  );
}
