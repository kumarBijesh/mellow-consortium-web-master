import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import DiscoveryCallActions from "@/components/admin/DiscoveryCallActions";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = ["new", "contacted", "closed"] as const;

export default async function AdminDiscoveryCallRequestsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const activeStatus = searchParams.status;

  let query = supabase
    .from("discovery_call_requests")
    .select(
      "id, full_name, email, organization, job_title, area_of_expertise, country, collaboration_type, source_tier, message, status, submitted_at"
    )
    .order("submitted_at", { ascending: false });

  if (activeStatus) query = query.eq("status", activeStatus);

  const { data: requests, error } = await query;

  if (error) {
    console.error("[admin/applications/discovery-call-requests] select failed:", error);
  }

  return (
    <div>
      <Link href="/admin/applications" className="text-[13.5px] font-semibold text-teal hover:text-ink dark:text-white transition mb-6 inline-block">
        &larr; Applications
      </Link>
      <h1 className="text-[26px] font-display font-bold text-ink dark:text-white mb-1">Discovery Call Requests</h1>
      <p className="text-[13.5px] text-muted dark:text-white/40 mb-8">
        Leads from the "Book a Discovery Call" form (homepage CTA + /membership-plans). Separate from Applications —
        these never create an account, they're just leads for your team to follow up on by email/phone.
      </p>

      {error && (
        <div className="text-[14px] text-red-300 mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="font-semibold mb-1">Couldn&apos;t load requests.</p>
          <p className="font-mono text-[12.5px] break-all">
            {error.code ? `[${error.code}] ` : ""}
            {error.message}
          </p>
          <p className="text-[12px] text-muted dark:text-white/30 mt-2">
            Make sure <code className="px-1 py-0.5 bg-lightblue dark:bg-teal/[0.08] rounded">supabase/discovery-call-requests.sql</code>{" "}
            has been run.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2.5 mb-8" role="group" aria-label="Filter by status">
        <FilterPill href="/admin/applications/discovery-call-requests" active={!activeStatus} label="All" />
        {STATUS_OPTIONS.map((s) => (
          <FilterPill key={s} href={`/admin/applications/discovery-call-requests?status=${s}`} active={activeStatus === s} label={s} />
        ))}
      </div>

      <div className="space-y-3">
        {(requests ?? []).map((r) => (
          <div key={r.id} className="adm-card p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <p className="text-[15px] font-semibold text-ink dark:text-white">{r.full_name}</p>
                <p className="text-[13px] text-muted dark:text-white/40">{r.email}</p>
              </div>
              {r.collaboration_type && (
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-teal whitespace-nowrap text-right max-w-[220px]">
                  {r.collaboration_type}
                </span>
              )}
            </div>

            <p className="text-[13.5px] text-muted dark:text-white/70 mb-1">
              {r.organization}
              {r.job_title ? ` · ${r.job_title}` : ""}
            </p>
            {r.source_tier && (
              <p className="text-[12.5px] text-forest dark:text-meadow font-semibold mb-1">From {r.source_tier} tier CTA</p>
            )}
            {(r.area_of_expertise || r.country) && (
              <p className="text-[12.5px] text-muted dark:text-white/50 mb-1">
                {[r.area_of_expertise, r.country].filter(Boolean).join(" · ")}
              </p>
            )}
            {r.message && <p className="text-[13px] text-muted dark:text-white/50 mb-2 italic">&ldquo;{r.message}&rdquo;</p>}

            <p className="text-[12px] text-muted dark:text-white/35 mb-3">Submitted {new Date(r.submitted_at).toLocaleDateString()}</p>

            <div className="flex justify-end">
              <DiscoveryCallActions requestId={r.id} status={r.status} />
            </div>
          </div>
        ))}

        {(!requests || requests.length === 0) && !error && (
          <p className="text-muted dark:text-white/30 text-[14px]">No requests match this filter.</p>
        )}
      </div>
    </div>
  );
}

function FilterPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link href={href} aria-current={active ? "true" : undefined} className={`adm-pill ${active ? "adm-pill-active" : "adm-pill-inactive"}`}>
      {label}
    </Link>
  );
}
