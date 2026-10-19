"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import SignOutButton from "@/components/auth/SignOutButton";
import PatientNavLink from "@/components/patient/PatientNavLink";
import ThemeToggle from "@/components/theme/ThemeToggle";
import {
  DashboardIcon,
  HealthTrendsIcon,
  MedicalRecordsIcon,
  VisitsIcon,
  DiagnosesIcon,
  DocumentsIcon,
  NearbyServicesIcon,
  RecommendationsIcon,
  CarePlanIcon,
  FindProviderIcon,
  MessagesIcon,
  AccountIcon,
} from "@/components/patient/PatientIcons";

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function PatientDashboardShell({
  userEmail,
  unreadConversations,
  children,
}: {
  userEmail: string | null | undefined;
  unreadConversations: number;
  children: ReactNode;
}) {
  const t = useTranslations("PatientDashboard");
  const tCommon = useTranslations("DashboardCommon");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // A Link navigation swaps children in place under this same layout —
  // without this the drawer would stay open after picking a nav item.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-white dark:bg-darkbg lg:flex">
      {/* Mobile top bar — sidebar below is fixed/off-canvas under lg, so
          this is the only way to reach nav or reopen it on small screens. */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3.5 bg-navy border-b border-white/[0.08]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={tCommon("openMenu")}
          className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white/80 hover:text-white hover:bg-white/[0.08] transition"
        >
          <MenuIcon />
        </button>
        <Link href="/dashboard/patient" className="flex items-center gap-2.5">
          <Image src="/logo-icon.png" alt="" width={221} height={192} className="w-7 h-7 flex-none" />
          <span className="font-display font-extrabold text-[14.5px] text-white tracking-tight">MELLOW</span>
        </Link>
        <ThemeToggle className="!border-white/20 !text-white/70 hover:!border-white/40 hover:!text-white" />
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar stays a fixed navy brand surface regardless of site
          theme — same treatment as the hospital and admin sidebars. Off-
          canvas (fixed + translate) below lg, sticky in-flow at lg+. */}
      <aside
        className={`w-[264px] flex-none fixed inset-y-0 start-0 z-50 h-screen border-e border-white/[0.08] bg-gradient-to-b from-navy to-navy-2 flex flex-col transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-7">
          <Link href="/dashboard/patient" className="flex items-center gap-3">
            <Image src="/logo-icon.png" alt="" width={221} height={192} className="w-9 h-9 flex-none" />
            <span className="font-display font-extrabold text-[16.5px] text-white tracking-tight leading-tight">
              MELLOW
              <small className="block font-body font-semibold text-[9.5px] tracking-[0.16em] text-teal uppercase">
                {tCommon("roleLabels.patient")}
              </small>
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle className="hidden lg:inline-flex !border-white/20 !text-white/70 hover:!border-white/40 hover:!text-white" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={tCommon("closeMenu")}
              className="lg:hidden w-9 h-9 rounded-[10px] flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.08] transition"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto" aria-label="Patient dashboard">
          <PatientNavLink href="/dashboard/patient" label={t("nav.dashboard")} icon={<DashboardIcon />} />
          <PatientNavLink href="/dashboard/patient/health-trends" label={t("nav.healthTrends")} icon={<HealthTrendsIcon />} />
          <PatientNavLink href="/dashboard/patient/medical-records" label={t("nav.medicalRecords")} icon={<MedicalRecordsIcon />} />
          <PatientNavLink href="/dashboard/patient/visits" label={t("nav.clinicalVisits")} icon={<VisitsIcon />} />
          <PatientNavLink href="/dashboard/patient/diagnoses" label={t("nav.diagnoses")} icon={<DiagnosesIcon />} />
          <PatientNavLink href="/dashboard/patient/documents" label={t("nav.documents")} icon={<DocumentsIcon />} />
          <PatientNavLink href="/dashboard/patient/nearby-services" label={t("nav.nearbyServices")} icon={<NearbyServicesIcon />} />
          <PatientNavLink href="/dashboard/patient/recommendations" label={t("nav.recommendations")} icon={<RecommendationsIcon />} />
          <PatientNavLink href="/dashboard/patient/care-plan" label={t("nav.carePlan")} icon={<CarePlanIcon />} />
          <PatientNavLink href="/dashboard/patient/providers" label={t("nav.myProviders")} icon={<FindProviderIcon />} />
          <PatientNavLink href="/dashboard/patient/messages" label={t("nav.messages")} icon={<MessagesIcon />} badge={unreadConversations} />
          <PatientNavLink href="/dashboard/patient/account" label={t("nav.account")} icon={<AccountIcon />} />
        </nav>

        <div className="px-3 pb-6 pt-4 border-t border-white/[0.08]">
          <div className="px-3.5 py-2 mb-1">
            <p className="text-[11px] uppercase tracking-[0.08em] text-white/30">{tCommon("signedInAs")}</p>
            <p className="text-[13px] text-white/80 truncate">{userEmail}</p>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-[1180px] mx-auto px-5 py-8 sm:px-8 sm:py-10">{children}</div>
      </main>
    </div>
  );
}
