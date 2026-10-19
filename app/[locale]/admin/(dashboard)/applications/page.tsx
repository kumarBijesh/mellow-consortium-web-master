import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import ApplicationActions from "@/components/admin/ApplicationActions";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = ["new", "in_review", "accepted", "rejected"] as const;

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const activeStatus = searchParams.status;

  let query = supabase
    .from("applications")
    .select(
      "id, persona_type, contact_name, contact_email, organization_name, country, status, submitted_at, form_data, created_hospital_id, hospital:created_hospital_id(id, name, kind)"
    )
    .order("submitted_at", { ascending: false });

  if (activeStatus) query = query.eq("status", activeStatus);

  const { data: applications, error } = await query;

  if (error) {
    console.error("[admin/applications] select failed:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-[26px] font-display font-bold text-ink dark:text-white">Applications</h1>
        <Link
          href="/admin/applications/discovery-call-requests"
          className="text-[12.5px] font-semibold text-teal hover:text-ink dark:hover:text-white transition whitespace-nowrap mt-2"
        >
          Discovery Call Requests →
        </Link>
      </div>
      <p className="text-[13.5px] text-muted dark:text-white/40 mb-8">
        Review partnership applications. Accepting one creates a real Hospital or Individual Provider account and
        sends the invite email. Admin picks which account type it becomes, regardless of what the applicant
        selected on the form.
      </p>

      {error && (
        <div className="text-[14px] text-red-300 mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="font-semibold mb-1">Couldn&apos;t load applications.</p>
          <p className="font-mono text-[12.5px] break-all">
            {error.code ? `[${error.code}] ` : ""}
            {error.message}
          </p>
          {error.hint && <p className="text-[12px] text-muted dark:text-white/40 mt-1">Hint: {error.hint}</p>}
          <p className="text-[12px] text-muted dark:text-white/30 mt-2">
            Make sure <code className="px-1 py-0.5 bg-lightblue dark:bg-teal/[0.08] rounded">supabase/applications-account-pipeline.sql</code>{" "}
            has been run. Full details logged server-side (see terminal running `npm run dev`).
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2.5 mb-8" role="group" aria-label="Filter by status">
        <FilterPill href="/admin/applications" active={!activeStatus} label="All" />
        {STATUS_OPTIONS.map((s) => (
          <FilterPill
            key={s}
            href={`/admin/applications?status=${s}`}
            active={activeStatus === s}
            label={s.replaceAll("_", " ")}
          />
        ))}
      </div>

      <div className="space-y-3">
        {(applications ?? []).map((a) => {
          const hospital = Array.isArray(a.hospital) ? a.hospital[0] : a.hospital;
          return (
            <div key={a.id} className="adm-card p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="text-[15px] font-semibold text-ink dark:text-white">{a.contact_name}</p>
                  <p className="text-[13px] text-muted dark:text-white/40">{a.contact_email}</p>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-teal whitespace-nowrap">
                  {a.persona_type.replaceAll("_", " ")}
                </span>
              </div>

              {a.organization_name && (
                <p className="text-[13.5px] text-muted dark:text-white/70 mb-1">
                  {a.organization_name}
                  {a.country ? `, ${a.country}` : ""}
                </p>
              )}

              <p className="text-[12px] text-muted dark:text-white/35 mb-3">Submitted {new Date(a.submitted_at).toLocaleDateString()}</p>

              {a.form_data && Object.keys(a.form_data).length > 0 && (
                <div className="text-[13px] text-muted dark:text-white/50 mb-4 space-y-1">
                  {Object.entries(a.form_data as Record<string, string>)
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <p key={k}>
                        <span className="font-semibold text-ink dark:text-white/75">{k.replaceAll("_", " ")}: </span>
                        {v}
                      </p>
                    ))}
                </div>
              )}

              <div className="flex justify-end">
                <ApplicationActions applicationId={a.id} status={a.status} createdHospital={hospital ?? null} />
              </div>
            </div>
          );
        })}

        {(!applications || applications.length === 0) && !error && (
          <p className="text-muted dark:text-white/30 text-[14px]">No applications match this filter.</p>
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
