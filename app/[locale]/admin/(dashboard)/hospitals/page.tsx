import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateHospitalForm from "@/components/admin/CreateHospitalForm";
import StatusBadge from "@/components/admin/StatusBadge";
import { SearchIcon } from "@/components/admin/AdminIcons";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = ["PENDING_SETUP", "ACTIVE", "DISABLED"] as const;

export default async function AdminHospitalsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const supabase = createClient();
  const activeStatus = searchParams.status;
  const q = searchParams.q?.trim();

  const { data: allHospitals } = await supabase.from("hospitals").select("status");
  const stats = {
    total: allHospitals?.length ?? 0,
    active: allHospitals?.filter((h) => h.status === "ACTIVE").length ?? 0,
    pending: allHospitals?.filter((h) => h.status === "PENDING_SETUP").length ?? 0,
    disabled: allHospitals?.filter((h) => h.status === "DISABLED").length ?? 0,
  };

  let query = supabase
    .from("hospitals")
    .select("id, name, admin_email, status, created_at, countries")
    .order("created_at", { ascending: false });

  if (activeStatus) query = query.eq("status", activeStatus);
  if (q) query = query.or(`name.ilike.%${q}%,admin_email.ilike.%${q}%`);

  const { data: hospitals, error } = await query;

  if (error) {
    console.error("[admin/hospitals] select failed:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[26px] font-display font-bold text-ink dark:text-white">Hospitals</h1>
          <p className="text-[13.5px] text-muted dark:text-white/40 mt-1">Manage hospital accounts and their locations/providers.</p>
        </div>
        <CreateHospitalForm />
      </div>

      {error && (
        <div className="text-[14px] text-red-300 mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="font-semibold mb-1">Couldn&apos;t load hospitals.</p>
          <p className="font-mono text-[12.5px] break-all">
            {error.code ? `[${error.code}] ` : ""}
            {error.message}
          </p>
          {error.hint && <p className="text-[12px] text-muted dark:text-white/40 mt-1">Hint: {error.hint}</p>}
          <p className="text-[12px] text-muted dark:text-white/30 mt-2">Full details logged server-side (see terminal running `npm run dev`).</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Active" value={stats.active} accent="text-teal" />
        <StatCard label="Pending setup" value={stats.pending} accent="text-gold" />
        <StatCard label="Disabled" value={stats.disabled} accent="text-muted dark:text-white/40" />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <form method="get" className="flex-1 min-w-[220px] relative">
          {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
          <SearchIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted dark:text-white/30" />
          <input
            type="search"
            name="q"
            placeholder="Search by name or email…"
            defaultValue={q ?? ""}
            className="adm-input pl-10"
          />
        </form>
        <div className="flex flex-wrap gap-2.5" role="group" aria-label="Filter by status">
          <FilterPill href={buildHref(undefined, q)} active={!activeStatus} label="All" />
          {STATUS_OPTIONS.map((s) => (
            <FilterPill key={s} href={buildHref(s, q)} active={activeStatus === s} label={s.replaceAll("_", " ")} />
          ))}
        </div>
      </div>

      <div className="adm-card overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-line dark:border-white/[0.08] text-[11px] uppercase tracking-[0.06em] text-muted dark:text-white/35">
              <th className="px-5 py-3.5 font-semibold">Name</th>
              <th className="px-5 py-3.5 font-semibold">Email</th>
              <th className="px-5 py-3.5 font-semibold">Countries</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 font-semibold">Created</th>
              <th className="px-5 py-3.5 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {(hospitals ?? []).map((h) => (
              <tr key={h.id} className="border-b border-line dark:border-white/[0.06] last:border-0 hover:bg-white dark:bg-white/[0.02] transition">
                <td className="px-5 py-3.5 text-ink dark:text-white font-medium">
                  <Link href={`/admin/hospitals/${h.id}`} className="hover:text-teal transition">
                    {h.name}
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-muted dark:text-white/50">{h.admin_email}</td>
                <td className="px-5 py-3.5 text-muted dark:text-white/50">
                  {(h.countries ?? []).join(", ") || ""}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={h.status} />
                </td>
                <td className="px-5 py-3.5 text-muted dark:text-white/40">{new Date(h.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3.5 text-right">
                  <Link href="/coming-soon?from=hospital-whitelabel" className="adm-btn-ghost !py-1.5 !px-3 text-[12px]">
                    White-label
                  </Link>
                </td>
              </tr>
            ))}
            {(!hospitals || hospitals.length === 0) && !error && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted dark:text-white/30">
                  No hospitals match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = "text-ink dark:text-white" }: { label: string; value: number; accent?: string }) {
  return (
    <div className="adm-card p-5">
      <p className="text-[12px] text-muted dark:text-white/40 mb-2">{label}</p>
      <p className={`text-[26px] font-display font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function buildHref(status: string | undefined, q: string | undefined) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  const qs = params.toString();
  return `/admin/hospitals${qs ? `?${qs}` : ""}`;
}

function FilterPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link href={href} aria-current={active ? "true" : undefined} className={`adm-pill ${active ? "adm-pill-active" : "adm-pill-inactive"}`}>
      {label}
    </Link>
  );
}
