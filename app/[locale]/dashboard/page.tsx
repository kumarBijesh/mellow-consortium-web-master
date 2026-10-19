import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

// Not a page itself — routes a signed-in visitor to the dashboard that
// matches them. Staff (present in the `admins` allow-list, see
// supabase/admin.sql) go to the existing /admin panel; hospital/provider
// accounts (role set in user_metadata at invite time — see
// lib/actions/hospitals.ts / lib/actions/providers.ts) go to their own
// dashboards; everyone else goes to the patient dashboard. Reached after
// sign-in/sign-up/OAuth callback, or by visiting /dashboard directly
// (middleware.ts already guarantees a signed-in user gets here).
//
// Hospital/provider accounts that sign in via their dedicated
// /hospital/login or /provider/login pages never hit this file —
// middleware.ts routes them straight to /hospital/locations or
// /provider. This only matters for accounts that sign in through the
// generic /signin page instead, which was landing everyone on
// /dashboard/patient regardless of role.
export default async function DashboardRouterPage() {
  const supabase = createClient();
  const locale = await getLocale();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (admin) redirect(`/${locale}/admin`);

    const role = user.user_metadata?.role;
    if (role === "hospital") redirect(`/${locale}/hospital`);
    if (role === "provider") redirect(`/${locale}/provider`);
  }

  redirect(`/${locale}/dashboard/patient`);
}
