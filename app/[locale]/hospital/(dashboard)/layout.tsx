import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/hospital/SignOutButton";
import HospitalNavLink from "@/components/hospital/HospitalNavLink";
import ThemeToggle from "@/components/theme/ThemeToggle";
import {
  DashboardIcon,
  ManageProvidersIcon,
  AllPatientsIcon,
  ClinicalVisitsIcon,
  DiagnosesIcon,
  LabReportsIcon,
  ScheduleIcon,
  AnalyticsIcon,
  SettingsIcon,
} from "@/components/hospital/HospitalIcons";

export default async function HospitalDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const t = await getTranslations("HospitalDashboard");
  const tCommon = await getTranslations("DashboardCommon");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex bg-white dark:bg-darkbg">
      {/* Sidebar stays a fixed navy brand surface regardless of site
          theme, same treatment as the header's top utility bar and the
          footer — not something the light/dark toggle flips. */}
      <aside className="w-[264px] flex-none sticky top-0 h-screen border-e border-white/[0.08] bg-gradient-to-b from-navy to-navy-2 flex flex-col">
        <div className="flex items-center justify-between px-6 py-7">
          <Link href="/hospital" className="flex items-center gap-3">
            <Image src="/logo-icon.png" alt="" width={221} height={192} className="w-9 h-9 flex-none" />
            <span className="font-display font-extrabold text-[16.5px] text-white tracking-tight leading-tight">
              MELLOW
              <small className="block font-body font-semibold text-[9.5px] tracking-[0.16em] text-teal uppercase">
                {tCommon("roleLabels.hospital")}
              </small>
            </span>
          </Link>
          <ThemeToggle className="!border-white/20 !text-white/70 hover:!border-white/40 hover:!text-white" />
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto" aria-label="Hospital">
          <HospitalNavLink href="/hospital" label={t("nav.dashboard")} icon={<DashboardIcon />} />
          <HospitalNavLink href="/hospital/providers" label={t("nav.manageProviders")} icon={<ManageProvidersIcon />} />
          <HospitalNavLink href="/hospital/patients" label={t("nav.allPatients")} icon={<AllPatientsIcon />} />
          <HospitalNavLink href="/hospital/visits" label={t("nav.clinicalVisits")} icon={<ClinicalVisitsIcon />} />
          <HospitalNavLink href="/hospital/diagnoses" label={t("nav.diagnoses")} icon={<DiagnosesIcon />} />
          <HospitalNavLink href="/hospital/lab-reports" label={t("nav.labReports")} icon={<LabReportsIcon />} />
          <HospitalNavLink href="/hospital/schedule" label={t("nav.schedule")} icon={<ScheduleIcon />} />
          <HospitalNavLink href="/hospital/analytics" label={t("nav.analytics")} icon={<AnalyticsIcon />} />
          <HospitalNavLink href="/hospital/settings" label={t("nav.settings")} icon={<SettingsIcon />} />
        </nav>

        <div className="px-3 pb-6 pt-4 border-t border-white/[0.08]">
          <div className="px-3.5 py-2 mb-1">
            <p className="text-[11px] uppercase tracking-[0.08em] text-white/30">{tCommon("signedInAs")}</p>
            <p className="text-[13px] text-white/80 truncate">{user?.email}</p>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
