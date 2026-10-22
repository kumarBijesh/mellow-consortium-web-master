import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import SignOutButton from "@/components/provider/SignOutButton";
import ProviderNavLink from "@/components/provider/ProviderNavLink";
import ThemeToggle from "@/components/theme/ThemeToggle";
import {
  DashboardIcon,
  PatientsIcon,
  LabReportsIcon,
  RequestsIcon,
  MessagesIcon,
  DocumentsIcon,
  MeetingIcon,
  ProfileIcon,
} from "@/components/provider/ProviderIcons";

export default async function ProviderDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const user = await getCurrentUser();

  let unreadConversations = 0;
  if (user) {
    const { data: provider } = await supabase.from("provider_profiles").select("id").eq("provider_user_id", user.id).maybeSingle();
    if (provider) {
      const { data: activeConnections } = await supabase
        .from("patient_provider_connections")
        .select("id")
        .eq("provider_id", provider.id)
        .eq("status", "ACTIVE");
      const connectionIds = (activeConnections ?? []).map((c) => c.id);
      if (connectionIds.length > 0) {
        const { data: unreadRows } = await supabase
          .from("messages")
          .select("connection_id")
          .in("connection_id", connectionIds)
          .neq("sender_id", user.id)
          .is("read_at", null);
        unreadConversations = new Set((unreadRows ?? []).map((m) => m.connection_id)).size;
      }
    }
  }

  const t = await getTranslations("ProviderDashboard");
  const tCommon = await getTranslations("DashboardCommon");

  return (
    <div className="min-h-screen flex bg-white dark:bg-darkbg">
      {/* Sidebar stays a fixed navy brand surface regardless of site
          theme — same treatment as the hospital/patient/admin sidebars. */}
      <aside className="w-[264px] flex-none sticky top-0 h-screen border-e border-white/[0.08] bg-gradient-to-b from-navy to-navy-2 flex flex-col">
        <div className="flex items-center justify-between px-6 py-7">
          <Link href="/provider" className="flex items-center gap-3">
            <Image src="/logo-icon.png" alt="" width={221} height={192} className="w-9 h-9 flex-none" />
            <span className="font-display font-extrabold text-[16.5px] text-white tracking-tight leading-tight">
              MELLOW
              <small className="block font-body font-semibold text-[9.5px] tracking-[0.16em] text-teal uppercase">
                {tCommon("roleLabels.provider")}
              </small>
            </span>
          </Link>
          <ThemeToggle className="!border-white/20 !text-white/70 hover:!border-white/40 hover:!text-white" />
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto" aria-label="Provider">
          <ProviderNavLink href="/provider" label={t("nav.dashboard")} icon={<DashboardIcon />} />
          <ProviderNavLink href="/provider/patients" label={t("nav.patients")} icon={<PatientsIcon />} />
          <ProviderNavLink href="/provider/lab-reports" label={t("nav.labReports")} icon={<LabReportsIcon />} />
          <ProviderNavLink href="/provider/requests" label={t("nav.requests")} icon={<RequestsIcon />} />
          <ProviderNavLink href="/provider/messages" label={t("nav.messages")} icon={<MessagesIcon />} badge={unreadConversations} />
          <ProviderNavLink href="/provider/documents" label={t("nav.documents")} icon={<DocumentsIcon />} />
          <ProviderNavLink href="/provider/meeting" label={t("nav.meeting")} icon={<MeetingIcon />} />
          <ProviderNavLink href="/provider/profile" label={t("nav.profile")} icon={<ProfileIcon />} />
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
