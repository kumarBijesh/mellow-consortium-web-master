"use client";

import { usePathname } from "@/i18n/navigation";

// Admin/hospital/provider pages that render the public marketing chrome
// (light theme, top nav, footer) — everything else under these prefixes
// is its own dashboard shell (sidebar or top-nav, own sign-out/theme
// toggle already built in) and must NOT also get the public Header/
// Footer wrapped around it. That double-chrome bug was invisible on the
// simpler top-nav dashboards (patient, provider) but broke the hospital
// sidebar outright: its sticky h-screen aside rendered below the extra
// ~112px of public header, pushing the sign-out button off the bottom
// of the viewport until the page was scrolled.
const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/admin/forgot-password", "/admin/reset-password"]);
const PUBLIC_HOSPITAL_PATHS = new Set(["/hospital/login"]);
const PUBLIC_PROVIDER_PATHS = new Set(["/provider/login"]);

// Header/Footer are received pre-rendered from the (Server Component)
// layout rather than imported here — Footer is an async Server Component
// (it calls next-intl's getTranslations, a server-only API), and a "use
// client" module can't import and instantiate a Server Component
// directly. Passing its already-resolved output down as a prop is the
// supported pattern for conditionally showing Server Component output
// from inside a Client Component.
export default function SiteChrome({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminDashboard = pathname?.startsWith("/admin") && !PUBLIC_ADMIN_PATHS.has(pathname);
  const isHospitalDashboard = pathname?.startsWith("/hospital") && !PUBLIC_HOSPITAL_PATHS.has(pathname);
  const isProviderDashboard = pathname?.startsWith("/provider") && !PUBLIC_PROVIDER_PATHS.has(pathname);
  const isPatientDashboard = pathname?.startsWith("/dashboard");
  const hideChrome = isAdminDashboard || isHospitalDashboard || isProviderDashboard || isPatientDashboard;

  return (
    <div className="min-h-screen flex flex-col">
      {!hideChrome && header}
      <div id="main-content" className="flex-1">
        {children}
      </div>
      {!hideChrome && footer}
    </div>
  );
}
