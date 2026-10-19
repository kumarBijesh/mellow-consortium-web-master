import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LocationProvidersPanel from "@/components/hospital/LocationProvidersPanel";

export const dynamic = "force-dynamic";

export default async function HospitalLocationDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: location } = await supabase
    .from("locations")
    .select("id, hospital_id, name, address, city, state_province, country, postal_code, status")
    .eq("id", params.id)
    .maybeSingle();

  if (!location) notFound();

  const [{ data: assignedRows }, { data: allProviders }] = await Promise.all([
    supabase
      .from("provider_locations")
      .select("provider_id, provider_profiles(id, name, email, status)")
      .eq("location_id", params.id),
    supabase
      .from("provider_profiles")
      .select("id, name, email, status")
      .eq("hospital_id", location.hospital_id)
      .order("name"),
  ]);

  type ProviderRow = { id: string; name: string; email: string; status: string };
  const assignedProviders = (assignedRows ?? [])
    .map((r) => r.provider_profiles as unknown as ProviderRow)
    .filter(Boolean);
  const assignedIds = new Set(assignedProviders.map((p) => p.id));
  const availableProviders = (allProviders ?? []).filter((p) => !assignedIds.has(p.id));

  return (
    <div>
      <Link href="/hospital/locations" className="text-[13px] text-muted dark:text-white/60 hover:text-navy dark:text-white transition">
        ← All locations
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-[26px] text-navy dark:text-white">{location.name}</h1>
        <p className="text-[13.5px] text-muted dark:text-white/60 mt-1">
          {[location.address, location.city, location.state_province, location.country, location.postal_code]
            .filter(Boolean)
            .join(", ")}
        </p>
      </div>

      <h2 className="text-[15px] font-semibold text-navy dark:text-white mb-4">Assigned providers</h2>
      <LocationProvidersPanel
        locationId={location.id}
        assignedProviders={assignedProviders}
        availableProviders={availableProviders}
      />
    </div>
  );
}
