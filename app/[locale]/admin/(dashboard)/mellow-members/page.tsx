import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import StatusBadge from "@/components/admin/StatusBadge";
import ResendMellowMemberInvite from "@/components/admin/ResendMellowMemberInvite";

export const dynamic = "force-dynamic";

export default async function AdminMellowMembersPage() {
  const supabase = createClient();
  const { data: org } = await supabase.from("hospitals").select("id, name").eq("kind", "internal").maybeSingle();

  const { data: members, error } = org
    ? await supabase
        .from("provider_profiles")
        .select("id, name, email, specialty, country, status, created_at")
        .eq("hospital_id", org.id)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[26px] font-display font-bold text-ink dark:text-white">Mellow Members</h1>
          <p className="text-[13.5px] text-muted dark:text-white/40 mt-1">
            In-house providers under the internal {org?.name ?? "Mellow Consortium"} org. Each gets a real provider
            dashboard login.
          </p>
        </div>
        {org && (
          <Link href="/admin/mellow-members/new" className="adm-btn-primary">
            + Add Mellow Member
          </Link>
        )}
      </div>

      {!org && (
        <div className="text-[14px] text-gold mb-6 rounded-2xl border border-gold/25 bg-gold/5 p-4">
          The internal Mellow Consortium org doesn&apos;t exist yet. Run <code>supabase/mellow-members.sql</code> in the
          Supabase SQL editor, then reload.
        </div>
      )}

      {error && (
        <div className="text-[14px] text-red-300 mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="font-mono text-[12.5px] break-all">{error.message}</p>
        </div>
      )}

      {org && (
        <div className="adm-card overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line dark:border-white/[0.08] text-[11px] uppercase tracking-[0.06em] text-muted dark:text-white/35">
                <th className="px-5 py-3.5 font-semibold">Name</th>
                <th className="px-5 py-3.5 font-semibold">Email</th>
                <th className="px-5 py-3.5 font-semibold">Focus area</th>
                <th className="px-5 py-3.5 font-semibold">Country</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((m) => (
                <tr key={m.id} className="border-b border-line dark:border-white/[0.06] last:border-0">
                  <td className="px-5 py-3.5 text-ink dark:text-white font-medium">{m.name}</td>
                  <td className="px-5 py-3.5 text-muted dark:text-white/50">{m.email}</td>
                  <td className="px-5 py-3.5 text-muted dark:text-white/50">{m.specialty ?? ""}</td>
                  <td className="px-5 py-3.5 text-muted dark:text-white/50">{m.country ?? ""}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-5 py-3.5 max-w-[360px]">
                    {m.status === "PENDING_SETUP" && <ResendMellowMemberInvite providerId={m.id} email={m.email} />}
                  </td>
                </tr>
              ))}
              {(members ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted dark:text-white/40">
                    No Mellow Members yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
