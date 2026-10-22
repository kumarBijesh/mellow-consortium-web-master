import { createClient, getCurrentUser } from "@/lib/supabase/server";
import ChangePasswordForm from "@/components/hospital/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function HospitalSettingsPage() {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: hospital } = await supabase
    .from("hospitals")
    .select("name, status, admin_email, created_at")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-6">Settings</h1>

      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 max-w-[640px] mb-6">
        <h2 className="text-[16px] font-display font-bold text-navy dark:text-white mb-4">Account</h2>
        {hospital ? (
          <dl className="text-[14px] space-y-2">
            <div className="flex justify-between gap-4">
              <dt className="text-muted dark:text-white/50">Hospital name</dt>
              <dd className="text-navy dark:text-white font-medium">{hospital.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted dark:text-white/50">Status</dt>
              <dd className="text-navy dark:text-white font-medium capitalize">
                {hospital.status.toLowerCase().replaceAll("_", " ")}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted dark:text-white/50">Admin email</dt>
              <dd className="text-navy dark:text-white font-medium">{hospital.admin_email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted dark:text-white/50">Account created</dt>
              <dd className="text-navy dark:text-white font-medium">
                {new Date(hospital.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-[14px] text-muted dark:text-white/60">No hospital record found for this account.</p>
        )}
        <p className="text-[12.5px] text-muted dark:text-white/40 mt-4">
          To change your hospital name or contact email, reach out to your MELLOW administrator.
        </p>
      </div>

      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 max-w-[640px]">
        <h2 className="text-[16px] font-display font-bold text-navy dark:text-white mb-4">Password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
