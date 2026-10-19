import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import InvestigatorSubmissionActions from "@/components/admin/InvestigatorSubmissionActions";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = ["pending", "approved", "rejected"] as const;

export default async function AdminInvestigatorSubmissionsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const activeStatus = searchParams.status;

  let query = supabase.from("investigator_registrations").select("*").order("submitted_at", { ascending: false });
  if (activeStatus) query = query.eq("status", activeStatus);

  const [{ data: registrations, error }, { data: institutions }] = await Promise.all([
    query,
    supabase.from("institutions").select("id, name").order("name"),
  ]);

  if (error) {
    console.error("[admin/network/investigator-submissions] select failed:", error);
  }

  // Best-effort name match so admin isn't hunting through the dropdown
  // for the obvious case (free-text institution_name from the public
  // form vs. the real institutions list).
  const suggestInstitution = (name: string) =>
    (institutions ?? []).find((i) => i.name.toLowerCase().trim() === name.toLowerCase().trim())?.id ?? "";

  const cvLinks = new Map<string, string>();
  for (const reg of registrations ?? []) {
    if (reg.cv_path) {
      const { data } = await supabase.storage.from("investigator-cvs").createSignedUrl(reg.cv_path, 3600);
      if (data?.signedUrl) cvLinks.set(reg.id, data.signedUrl);
    }
  }

  return (
    <div>
      <Link href="/admin/network" className="text-[13.5px] font-semibold text-teal hover:text-ink dark:text-white transition mb-6 inline-block">
        &larr; Network
      </Link>
      <h1 className="text-[26px] font-display font-bold text-ink dark:text-white mb-1">Investigator Submissions</h1>
      <p className="text-[13.5px] text-muted dark:text-white/40 mb-8">
        Full registration applications from /apply/clinical_investigator. Approving one creates a real row in
        Investigators (linked to the institution you pick), making them appear on the homepage globe. Separate
        from Investigator Inquiries — those are just discovery-call leads.
      </p>

      {error && (
        <div className="text-[14px] text-red-300 mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="font-semibold mb-1">Couldn&apos;t load submissions.</p>
          <p className="font-mono text-[12.5px] break-all">
            {error.code ? `[${error.code}] ` : ""}
            {error.message}
          </p>
          <p className="text-[12px] text-muted dark:text-white/30 mt-2">
            Make sure <code className="px-1 py-0.5 bg-lightblue dark:bg-teal/[0.08] rounded">supabase/investigator-registrations.sql</code>{" "}
            has been run.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2.5 mb-8" role="group" aria-label="Filter by status">
        <FilterPill href="/admin/network/investigator-submissions" active={!activeStatus} label="All" />
        {STATUS_OPTIONS.map((s) => (
          <FilterPill key={s} href={`/admin/network/investigator-submissions?status=${s}`} active={activeStatus === s} label={s} />
        ))}
      </div>

      <div className="space-y-3">
        {(registrations ?? []).map((reg) => {
          const fullName = [reg.salutation, reg.first_name, reg.middle_name, reg.last_name].filter(Boolean).join(" ");
          const cvLink = cvLinks.get(reg.id);
          return (
            <div key={reg.id} className="adm-card p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="text-[15px] font-semibold text-ink dark:text-white">{fullName}</p>
                  <p className="text-[13px] text-muted dark:text-white/40">{reg.personal_email}</p>
                </div>
                {reg.access_tier && (
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-teal whitespace-nowrap">{reg.access_tier}</span>
                )}
              </div>

              <p className="text-[13.5px] text-muted dark:text-white/70 mb-1">
                {reg.institution_name}
                {reg.country ? `, ${reg.country}` : ""}
              </p>
              {reg.department_focus_area && <p className="text-[12.5px] text-muted dark:text-white/50 mb-1">{reg.department_focus_area}</p>}
              {reg.professional_bio && <p className="text-[13px] text-muted dark:text-white/50 mb-2 italic">&ldquo;{reg.professional_bio}&rdquo;</p>}

              <div className="flex flex-wrap gap-3 text-[12.5px] mb-3">
                {reg.linkedin_url && (
                  <a href={reg.linkedin_url} target="_blank" rel="noreferrer" className="text-teal hover:underline">
                    LinkedIn ↗
                  </a>
                )}
                {reg.website_url && (
                  <a href={reg.website_url} target="_blank" rel="noreferrer" className="text-teal hover:underline">
                    Website ↗
                  </a>
                )}
                {cvLink && (
                  <a href={cvLink} target="_blank" rel="noreferrer" className="text-teal hover:underline">
                    Download CV ↗
                  </a>
                )}
              </div>

              <p className="text-[12px] text-muted dark:text-white/35 mb-3">Submitted {new Date(reg.submitted_at).toLocaleDateString()}</p>

              <div className="flex justify-end">
                <InvestigatorSubmissionActions
                  registrationId={reg.id}
                  status={reg.status}
                  institutions={institutions ?? []}
                  suggestedInstitutionId={suggestInstitution(reg.institution_name)}
                  applicantInstitution={{ name: reg.institution_name ?? "", country: reg.country ?? "" }}
                />
              </div>
            </div>
          );
        })}

        {(!registrations || registrations.length === 0) && !error && (
          <p className="text-muted dark:text-white/30 text-[14px]">No submissions match this filter.</p>
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
