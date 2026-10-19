import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { href: "/admin/network/institutions", table: "institutions", label: "Institutions", desc: "Member research sites. Feeds Research/Clinical Sites, Countries, and the map markers." },
  { href: "/admin/network/investigators", table: "investigators", label: "Investigators", desc: "Feeds the Investigators count." },
  { href: "/admin/network/trials", table: "trials", label: "Trials", desc: "Feeds Active Trials (status active/recruiting)." },
  { href: "/admin/network/trial-sites", table: "trial_sites", label: "Trial Sites", desc: "Trial ↔ institution pairings. Feeds per-region Active Studies." },
  { href: "/admin/network/publications", table: "publications", label: "Publications", desc: "Feeds the Publications count." },
  { href: "/admin/network/events", table: "events", label: "Events", desc: "Backs the public /conferences page." },
  {
    href: "/admin/network/inquiries",
    table: "investigator_inquiries",
    label: "Investigator Inquiries",
    desc: "\"Request Discovery Call\" leads from the homepage globe click-through.",
  },
  {
    href: "/admin/network/investigator-submissions",
    table: "investigator_registrations",
    label: "Investigator Submissions",
    desc: "Full registrations from /apply/clinical_investigator. Approving one creates a real Investigators row.",
  },
] as const;

export default async function AdminNetworkHubPage() {
  const supabase = createClient();
  const counts = await Promise.all(
    SECTIONS.map((s) => supabase.from(s.table).select("*", { count: "exact", head: true }))
  );

  return (
    <div>
      <h1 className="text-[26px] font-display font-bold text-ink dark:text-white mb-1">Network</h1>
      <p className="text-[13.5px] text-muted dark:text-white/40 mb-8">
        The data behind every stat on the public homepage: hero badges, stats bar, and the interactive network map.
        Every public number is a live count against these tables; nothing is hand-typed.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {SECTIONS.map((s, i) => (
          <Link key={s.href} href={s.href} className="adm-card p-5 hover:border-teal/30 transition">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[15px] font-semibold text-ink dark:text-white">{s.label}</span>
              <span className="text-[20px] font-display font-bold text-teal">{counts[i].count ?? 0}</span>
            </div>
            <p className="text-[12.5px] text-muted dark:text-white/40">{s.desc}</p>
          </Link>
        ))}
        <Link href="/admin/network/settings" className="adm-card p-5 hover:border-teal/30 transition">
          <span className="text-[15px] font-semibold text-ink dark:text-white block mb-1.5">Market stat</span>
          <p className="text-[12.5px] text-muted dark:text-white/40">
            The $610B Longevity Market figure: external, source-cited, not derived from these tables.
          </p>
        </Link>
      </div>
    </div>
  );
}
