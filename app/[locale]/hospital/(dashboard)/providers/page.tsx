import { createClient } from "@/lib/supabase/server";
import CreateProviderForm from "@/components/hospital/CreateProviderForm";
import CreateLocationForm from "@/components/hospital/CreateLocationForm";
import LocationActions from "@/components/hospital/LocationActions";
import ProviderRowActions from "@/components/hospital/ProviderRowActions";

export const dynamic = "force-dynamic";

export default async function HospitalProvidersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: hospital } = await supabase.from("hospitals").select("id, phone, admin_email").eq("user_id", user?.id ?? "").maybeSingle();

  const { data: locations, error } = hospital
    ? await supabase
        .from("locations")
        .select(
          "id, name, address, city, state_province, country, postal_code, provider_locations(provider_id, provider_profiles(id, name, specialty, email))"
        )
        .eq("hospital_id", hospital.id)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-[26px] text-navy dark:text-white">Locations &amp; providers</h1>
        <CreateLocationForm />
      </div>
      <p className="text-muted dark:text-white/60 text-[14.5px] mb-8">Each location is a clinic or branch. Providers are linked to a location.</p>

      {error && <p className="text-[14px] text-red-600 mb-6">Couldn&apos;t load locations. Try refreshing.</p>}

      <div className="space-y-6">
        {(locations ?? []).map((l) => {
          const addressParts = [l.address, l.city, l.state_province, l.postal_code, l.country].filter(Boolean);
          const links = (l.provider_locations ?? []) as unknown as {
            provider_id: string;
            provider_profiles: { id: string; name: string; specialty: string | null; email: string } | null;
          }[];
          const providers = links.map((pl) => pl.provider_profiles).filter((p): p is NonNullable<typeof p> => !!p);

          return (
            <div key={l.id} className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
              <div className="flex items-center justify-between gap-4 p-5 border-b border-line dark:border-white/10">
                <div>
                  <p className="text-[15px] font-display font-bold text-navy dark:text-white">🏥 {l.name}</p>
                  <p className="text-[12.5px] text-muted dark:text-white/50 mt-0.5">{addressParts.join(", ")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <CreateProviderForm locations={[{ id: l.id, name: l.name }]} />
                  <LocationActions location={l} />
                </div>
              </div>

              {providers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13.5px]">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-[0.06em] text-muted dark:text-white/50">
                        <th className="px-5 py-3 font-semibold">Provider</th>
                        <th className="px-5 py-3 font-semibold">Specialty</th>
                        <th className="px-5 py-3 font-semibold">Email</th>
                        <th className="px-5 py-3 font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {providers.map((p) => (
                        <tr key={p.id} className="border-t border-line dark:border-white/10">
                          <td className="px-5 py-3 text-navy dark:text-white font-medium">{p.name}</td>
                          <td className="px-5 py-3 text-muted dark:text-white/60">{p.specialty || ""}</td>
                          <td className="px-5 py-3 text-muted dark:text-white/60">{p.email}</td>
                          <td className="px-5 py-3 text-right">
                            <ProviderRowActions providerId={p.id} name={p.name} specialty={p.specialty} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-5 py-6 text-[13.5px] text-muted dark:text-white/60">No providers assigned to this location yet.</p>
              )}
            </div>
          );
        })}
        {(!locations || locations.length === 0) && !error && (
          <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-10 text-center">
            <p className="text-[14px] text-muted dark:text-white/60">No locations yet. Add one to start assigning providers.</p>
          </div>
        )}
      </div>
    </div>
  );
}
