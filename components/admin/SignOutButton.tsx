"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoutIcon } from "@/components/admin/AdminIcons";

export default function SignOutButton() {
  const t = useTranslations("DashboardCommon");
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white/55 hover:text-white hover:bg-white/10 transition"
    >
      <LogoutIcon className="w-[17px] h-[17px]" />
      {t("signOut")}
    </button>
  );
}
