import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import SignOutButton from "@/components/admin/SignOutButton";
import AdminNavLink from "@/components/admin/AdminNavLink";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { getAdminStats } from "@/lib/admin-stats";
import {
  OverviewIcon,
  HospitalsIcon,
  UsersIcon,
  ApplicationsIcon,
  DataMonitoringIcon,
  ClinicalTrialsIcon,
  NetworkIcon,
  RevenueIcon,
  NewsIcon,
  AuditLogIcon,
} from "@/components/admin/AdminIcons";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("AdminDashboard");
  const tCommon = await getTranslations("DashboardCommon");
  const [user, stats] = await Promise.all([getCurrentUser(), getAdminStats()]);

  return (
    <div className="adm-shell flex">
      {/* Sidebar stays a fixed purple brand surface regardless of site
          theme — same "own identity, not theme-toggled" treatment as the
          hospital/patient/provider sidebars. */}
      <aside className="w-[264px] flex-none sticky top-0 h-screen bg-gradient-to-b from-[#3D2B7A] to-[#2A1B5C] flex flex-col">
        <div className="flex items-center justify-between px-6 py-7">
          <Link href="/admin/overview" className="flex items-center gap-3">
            <Image src="/logo-icon.png" alt="" width={221} height={192} className="w-9 h-9 flex-none" />
            <span className="font-display font-extrabold text-[16.5px] text-white tracking-tight leading-tight">
              MELLOW
              <small className="block font-body font-semibold text-[9.5px] tracking-[0.16em] text-teal uppercase">
                {tCommon("roleLabels.admin")}
              </small>
            </span>
          </Link>
          <ThemeToggle className="!border-white/20 !text-white/70 hover:!border-white/40 hover:!text-white" />
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto" aria-label="Admin">
          <AdminNavLink href="/admin/overview" label={t("nav.overview")} icon={<OverviewIcon />} />
          <AdminNavLink href="/admin/hospitals" label={t("nav.hospitals")} icon={<HospitalsIcon />} />
          <AdminNavLink href="/admin/mellow-members" label={t("nav.mellowMembers")} icon={<UsersIcon />} />
          <AdminNavLink href="/admin/users" label={t("nav.userManagement")} icon={<UsersIcon />} />
          <AdminNavLink href="/admin/applications" label={t("nav.applications")} icon={<ApplicationsIcon />} />
          <AdminNavLink href="/admin/data-monitoring" label={t("nav.dataMonitoring")} icon={<DataMonitoringIcon />} />
          <AdminNavLink href="/admin/clinical-trials" label={t("nav.clinicalTrials")} icon={<ClinicalTrialsIcon />} />
          <AdminNavLink href="/admin/network" label={t("nav.network")} icon={<NetworkIcon />} />
          <AdminNavLink href="/admin/revenue" label={t("nav.revenue")} icon={<RevenueIcon />} />
          <AdminNavLink href="/admin/cms" label={t("nav.cms")} icon={<NewsIcon />} />
          <AdminNavLink href="/admin/audit-log" label={t("nav.auditLog")} icon={<AuditLogIcon />} />
        </nav>

        <div className="px-3 pb-6 pt-4 border-t border-white/10">
          <div className="px-3.5 py-2 mb-1">
            <p className="text-[11px] uppercase tracking-[0.08em] text-white/35">{tCommon("signedInAs")}</p>
            <p className="text-[13px] text-white/80 truncate">{user?.email}</p>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-8 py-10">
          {/* Persistent stat strip — same 5 metrics on every admin page,
              matching the reference. Real counts throughout except
              High-Risk Alerts, which has no backing risk model anywhere
              in this project and is always 0 rather than fabricated. */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <StatTile label={t("stats.projectedMrr")} value={`$${stats.projectedMRR.toLocaleString()} (proj.)`} color="teal" />
            <StatTile label={t("stats.totalUsers")} value={stats.totalUsers} color="blue" />
            <StatTile label={t("stats.hospitals")} value={stats.hospitals} color="purple" />
            <StatTile label={t("stats.highRiskAlerts")} value={stats.highRiskAlerts} color="coral" />
            <StatTile label={t("stats.labReportUploads")} value={stats.labReportUploads} color="gold" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

const STAT_VALUE_COLOR: Record<string, string> = {
  blue: "text-blue",
  teal: "text-teal",
  purple: "text-[#6B4EC7]",
  gold: "text-[#8a6a12] dark:text-gold",
  coral: "text-[#E8735A]",
};

function StatTile({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: "blue" | "teal" | "purple" | "gold" | "coral";
}) {
  return (
    <div className={`adm-card stat-accent-${color} p-5`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] uppercase tracking-[0.08em] text-muted dark:text-white/40">{label}</p>
        <span className={`w-2 h-2 rounded-full stat-chip-${color}`} aria-hidden="true" />
      </div>
      <p className={`text-[22px] font-display font-bold ${STAT_VALUE_COLOR[color]}`}>{value}</p>
    </div>
  );
}
