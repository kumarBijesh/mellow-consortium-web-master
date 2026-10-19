import { Link } from "@/i18n/navigation";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddMellowMemberWizard from "@/components/admin/AddMellowMemberWizard";

export const dynamic = "force-dynamic";

export default async function AddMellowMemberPage({ params }: { params: { locale: string } }) {
  const supabase = createClient();
  const { data: org } = await supabase.from("hospitals").select("name").eq("kind", "internal").maybeSingle();
  // The list page explains the missing-org setup step; nothing to fill in here without it.
  if (!org) redirect(`/${params.locale}/admin/mellow-members`);

  return (
    <div>
      <Link href="/admin/mellow-members" className="text-[13.5px] font-semibold text-teal hover:text-ink dark:hover:text-white transition mb-6 inline-block">
        &larr; Mellow Members
      </Link>
      <h1 className="text-[26px] font-display font-bold text-ink dark:text-white mb-1">Add Mellow Member</h1>
      <p className="text-[13.5px] text-muted dark:text-white/40 mb-8">
        Creates a provider account under {org.name} and emails them an invite to set their password.
      </p>
      <AddMellowMemberWizard orgName={org.name} />
    </div>
  );
}
