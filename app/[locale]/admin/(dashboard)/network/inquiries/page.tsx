import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import InquiryActions from "@/components/admin/InquiryActions";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = ["new", "contacted", "closed"] as const;

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const activeStatus = searchParams.status;

  let query = supabase
    .from("investigator_inquiries")
    .select(
      "id, investigator_name, institution_name, first_name, last_name, company_institution, email, phone, organization_type, partnership_interest, message, status, submitted_at"
    )
    .order("submitted_at", { ascending: false });

  if (activeStatus) query = query.eq("status", activeStatus);

  const { data: inquiries, error } = await query;

  if (error) {
    console.error("[admin/network/inquiries] select failed:", error);
  }

  return (
    <div>
      <Link href="/admin/network" className="text-[13.5px] font-semibold text-teal hover:text-ink dark:text-white transition mb-6 inline-block">
        &larr; Network
      </Link>
      <h1 className="text-[26px] font-display font-bold text-ink dark:text-white mb-1">Investigator Inquiries</h1>
      <p className="text-[13.5px] text-muted dark:text-white/40 mb-8">
        "Request Discovery Call" leads from the homepage globe. Separate from Applications — accepting an
        application creates an account; these are just leads for your team to follow up on by email/phone.
      </p>

      {error && (
        <div className="text-[14px] text-red-300 mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="font-semibold mb-1">Couldn&apos;t load inquiries.</p>
          <p className="font-mono text-[12.5px] break-all">
            {error.code ? `[${error.code}] ` : ""}
            {error.message}
          </p>
          <p className="text-[12px] text-muted dark:text-white/30 mt-2">
            Make sure <code className="px-1 py-0.5 bg-lightblue dark:bg-teal/[0.08] rounded">supabase/investigator-inquiries.sql</code>{" "}
            has been run.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2.5 mb-8" role="group" aria-label="Filter by status">
        <FilterPill href="/admin/network/inquiries" active={!activeStatus} label="All" />
        {STATUS_OPTIONS.map((s) => (
          <FilterPill key={s} href={`/admin/network/inquiries?status=${s}`} active={activeStatus === s} label={s} />
        ))}
      </div>

      <div className="space-y-3">
        {(inquiries ?? []).map((iq) => (
          <div key={iq.id} className="adm-card p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <p className="text-[15px] font-semibold text-ink dark:text-white">
                  {iq.first_name} {iq.last_name}
                </p>
                <p className="text-[13px] text-muted dark:text-white/40">
                  {iq.email} · {iq.phone}
                </p>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-teal whitespace-nowrap">
                {iq.organization_type.replaceAll("_", " ")}
              </span>
            </div>

            <p className="text-[13.5px] text-muted dark:text-white/70 mb-1">{iq.company_institution}</p>
            <p className="text-[13px] text-ink dark:text-white/80 mb-1">
              Re: <span className="font-semibold">{iq.investigator_name}</span> at {iq.institution_name}
            </p>
            <p className="text-[12.5px] text-muted dark:text-white/50 mb-1">
              Interest: {iq.partnership_interest.replaceAll("_", " ")}
            </p>
            {iq.message && <p className="text-[13px] text-muted dark:text-white/50 mb-2 italic">&ldquo;{iq.message}&rdquo;</p>}

            <p className="text-[12px] text-muted dark:text-white/35 mb-3">Submitted {new Date(iq.submitted_at).toLocaleDateString()}</p>

            <div className="flex justify-end">
              <InquiryActions inquiryId={iq.id} status={iq.status} />
            </div>
          </div>
        ))}

        {(!inquiries || inquiries.length === 0) && !error && (
          <p className="text-muted dark:text-white/30 text-[14px]">No inquiries match this filter.</p>
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
