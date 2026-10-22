import { createClient, getCurrentUser } from "@/lib/supabase/server";
import EditProfileForm from "@/components/provider/EditProfileForm";

export const dynamic = "force-dynamic";

export default async function ProviderProfilePage() {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: provider, error } = await supabase
    .from("provider_profiles")
    .select("name, email, specialty, credentials, bio, city, state_province, latitude, longitude, status, hospitals(name)")
    .eq("provider_user_id", user?.id ?? "")
    .maybeSingle();

  if (error || !provider) {
    return (
      <div>
        <h1 className="text-[26px] text-navy dark:text-white mb-6">Profile</h1>
        <p className="text-[14px] text-red-600">
          Couldn&apos;t load your provider profile. Make sure{" "}
          <code className="px-1.5 py-0.5 bg-lightblue dark:bg-teal/[0.08] rounded text-[13px]">supabase/provider-dashboard.sql</code> has
          been run.
        </p>
      </div>
    );
  }

  const hospitalName = (provider.hospitals as unknown as { name: string } | null)?.name;

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-1">Profile</h1>
      <p className="text-[13.5px] text-muted dark:text-white/60 mb-8">
        {provider.email}
        {hospitalName ? ` · ${hospitalName}` : ""}
      </p>

      <EditProfileForm
        provider={{
          name: provider.name,
          specialty: provider.specialty,
          credentials: provider.credentials,
          bio: provider.bio,
          city: provider.city,
          state_province: provider.state_province,
          latitude: provider.latitude,
          longitude: provider.longitude,
        }}
      />
    </div>
  );
}
