import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateHospitalForm from "@/components/admin/CreateHospitalForm";
import RemoveUserButton from "@/components/admin/RemoveUserButton";
import StatusBadge from "@/components/admin/StatusBadge";
import { getUnifiedUsers } from "@/lib/admin-users";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const supabase = createClient();
  const [{ data: hospitals }, { users }] = await Promise.all([
    supabase.from("hospitals").select("id, name, admin_email, status, countries").order("created_at", { ascending: false }),
    getUnifiedUsers(),
  ]);

  const counts = {
    hospitals: users.filter((u) => u.role === "hospital").length,
    providers: users.filter((u) => u.role === "provider").length,
    patients: users.filter((u) => u.role === "patient").length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[26px] font-display font-bold text-ink dark:text-white">Overview</h1>
        <p className="text-[13.5px] text-muted dark:text-white/40 mt-1">A snapshot of the MELLOW Consortium platform.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
        {/* min-w-0 is required here, not just on the flex rows inside —
            grid items default to min-width:auto, so without this the
            track itself refuses to shrink below the longest unbreakable
            string (an email/UUID with no spaces) and every truncate
            below becomes a no-op, letting that text spill past the
            card's edge instead of ellipsing. */}
        <div className="adm-card p-6 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[16px] font-semibold text-ink dark:text-white">Hospital management</h2>
            <CreateHospitalForm />
          </div>
          <div className="space-y-2.5">
            {(hospitals ?? []).map((h) => (
              <div key={h.id} className="rounded-xl border border-line dark:border-white/10 p-4 flex items-center gap-4">
                <span className="w-9 h-9 rounded-full bg-lightblue dark:bg-teal/[0.08] text-blue grid place-items-center font-display font-bold text-[13px] flex-none">
                  {h.name.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/admin/hospitals/${h.id}`}
                    className="block truncate text-[14px] font-semibold text-ink dark:text-white hover:text-teal transition"
                  >
                    {h.name}
                  </Link>
                  <p className="text-[12.5px] text-muted dark:text-white/40 truncate">
                    {(h.countries ?? []).join(", ") || ""} · Admin: {h.admin_email}
                  </p>
                </div>
                <StatusBadge status={h.status} />
                <Link href={`/admin/hospitals/${h.id}`} className="adm-btn-ghost !py-2">
                  Edit
                </Link>
                <Link href="/coming-soon?from=hospital-whitelabel" className="adm-btn-ghost !py-2">
                  White-label
                </Link>
              </div>
            ))}
            {(!hospitals || hospitals.length === 0) && (
              <p className="text-[13.5px] text-muted dark:text-white/40 text-center py-8">No hospitals yet.</p>
            )}
          </div>
        </div>

        <div className="adm-card p-6 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[16px] font-semibold text-ink dark:text-white">User management</h2>
            <Link href="/admin/users" className="text-[12.5px] font-semibold text-blue">
              {users.length} total →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <MiniStat label="Hospitals" value={counts.hospitals} />
            <MiniStat label="Providers" value={counts.providers} />
            <MiniStat label="Patients" value={counts.patients} />
          </div>

          <p className="text-[11px] uppercase tracking-[0.08em] text-muted dark:text-white/35 mb-2.5">All users</p>
          <div className="space-y-2 max-h-[420px] overflow-y-auto -mx-1 px-1">
            {users.slice(0, 12).map((u) => (
              <div key={`${u.role}-${u.id}`} className="rounded-lg border border-line dark:border-white/10 p-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-lightblue dark:bg-teal/[0.08] text-blue grid place-items-center font-display font-bold text-[11px] flex-none">
                  {u.name.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-ink dark:text-white truncate">{u.name}</p>
                  <p className="text-[11.5px] text-muted dark:text-white/40 truncate">
                    {u.email} ({u.role.toUpperCase()})
                    {u.hospitalName ? ` · Hospital: ${u.hospitalName}` : ""}
                  </p>
                </div>
                <RemoveUserButton userId={u.id} userName={u.name} />
              </div>
            ))}
            {users.length === 0 && <p className="text-[13.5px] text-muted dark:text-white/40 text-center py-8">No users yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line dark:border-white/10 p-3 text-center">
      <p className="text-[10px] uppercase tracking-[0.06em] text-muted dark:text-white/35 mb-1">{label}</p>
      <p className="text-[20px] font-display font-bold text-ink dark:text-white">{value}</p>
    </div>
  );
}
