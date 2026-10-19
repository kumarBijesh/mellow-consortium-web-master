import { Link } from "@/i18n/navigation";
import { SearchIcon } from "@/components/admin/AdminIcons";
import { getUnifiedUsers, type UnifiedUser } from "@/lib/admin-users";
import RemoveUserButton from "@/components/admin/RemoveUserButton";

export const dynamic = "force-dynamic";

const ROLE_OPTIONS = ["admin", "patient", "hospital", "provider"] as const;
const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  patient: "Patient",
  hospital: "Hospital",
  provider: "Provider",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { role?: string; q?: string };
}) {
  const { role: roleFilter, q } = searchParams;
  const { users: allUsers, error } = await getUnifiedUsers();

  if (error) {
    console.error("[admin/users] select failed:", error);
  }

  let users = allUsers;
  if (roleFilter) users = users.filter((u) => u.role === roleFilter);
  if (q?.trim()) {
    const needle = q.trim().toLowerCase();
    users = users.filter((u) => u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle));
  }

  const counts = {
    admin: allUsers.filter((u) => u.role === "admin").length,
    patient: allUsers.filter((u) => u.role === "patient").length,
    hospital: allUsers.filter((u) => u.role === "hospital").length,
    provider: allUsers.filter((u) => u.role === "provider").length,
  };

  return (
    <div>
      <h1 className="text-[26px] font-display font-bold text-ink dark:text-white mb-1">User Management</h1>
      <p className="text-[13.5px] text-muted dark:text-white/40 mb-8">All accounts across roles ({allUsers.length} total).</p>

      {error && (
        <div className="text-[14px] text-red-300 mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="font-semibold mb-1">Couldn&apos;t load every source. The list below may be incomplete.</p>
          <p className="font-mono text-[12.5px] break-all">
            {error.code ? `[${error.code}] ` : ""}
            {error.message}
          </p>
          <p className="text-[12px] text-muted dark:text-white/30 mt-2">Full details logged server-side (see terminal running `npm run dev`).</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <form method="get" className="flex-1 min-w-[220px] relative">
          {roleFilter && <input type="hidden" name="role" value={roleFilter} />}
          <SearchIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted dark:text-white/30" />
          <input
            type="search"
            name="q"
            placeholder="Search by name or email…"
            defaultValue={q ?? ""}
            className="adm-input pl-10"
          />
        </form>
        <div className="flex flex-wrap gap-2.5" role="group" aria-label="Filter by role">
          <FilterPill href={buildHref(undefined, q)} active={!roleFilter} label="All" />
          {ROLE_OPTIONS.map((r) => (
            <FilterPill
              key={r}
              href={buildHref(r, q)}
              active={roleFilter === r}
              label={`${ROLE_LABELS[r]} (${counts[r]})`}
            />
          ))}
        </div>
      </div>

      <div className="adm-card overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-line dark:border-white/[0.08] text-[11px] uppercase tracking-[0.06em] text-muted dark:text-white/35">
              <th className="px-5 py-3.5 font-semibold">Name</th>
              <th className="px-5 py-3.5 font-semibold">Email</th>
              <th className="px-5 py-3.5 font-semibold">Role</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 font-semibold">Signed up</th>
              <th className="px-5 py-3.5 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={`${u.role}-${u.id}`} className="border-b border-line dark:border-white/[0.06] last:border-0">
                <td className="px-5 py-3.5 text-ink dark:text-white font-medium">{u.name}</td>
                <td className="px-5 py-3.5 text-muted dark:text-white/50">{u.email}</td>
                <td className="px-5 py-3.5">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-5 py-3.5 text-muted dark:text-white/50">{u.status.replaceAll("_", " ")}</td>
                <td className="px-5 py-3.5 text-muted dark:text-white/40">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-3.5">
                  <RemoveUserButton userId={u.id} userName={u.name} />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted dark:text-white/30">
                  No users match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildHref(role: string | undefined, q: string | undefined) {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (q) params.set("q", q);
  const qs = params.toString();
  return `/admin/users${qs ? `?${qs}` : ""}`;
}

function FilterPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link href={href} aria-current={active ? "true" : undefined} className={`adm-pill ${active ? "adm-pill-active" : "adm-pill-inactive"}`}>
      {label}
    </Link>
  );
}

function RoleBadge({ role }: { role: UnifiedUser["role"] }) {
  const styles: Record<string, string> = {
    admin: "bg-blue/10 text-blue border-blue/20",
    patient: "bg-white dark:bg-white/[0.04] text-muted dark:text-white/60 border-line dark:border-white/10",
    hospital: "bg-teal/10 text-teal border-teal/20",
    provider: "bg-gold/10 text-gold border-gold/25",
  };
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${styles[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}
