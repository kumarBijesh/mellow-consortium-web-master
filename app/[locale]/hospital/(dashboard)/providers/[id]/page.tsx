import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProviderLocationsPanel from "@/components/hospital/ProviderLocationsPanel";

export const dynamic = "force-dynamic";

export default async function HospitalProviderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select("id, hospital_id, name, email, specialty, status")
    .eq("id", params.id)
    .maybeSingle();

  if (!provider) notFound();

  const [{ data: allLocations }, { data: assignedRows }] = await Promise.all([
    supabase.from("locations").select("id, name").eq("hospital_id", provider.hospital_id).order("name"),
    supabase.from("provider_locations").select("location_id").eq("provider_id", params.id),
  ]);

  return (
    <div>
      <Link href="/hospital/providers" className="text-[13px] text-muted dark:text-white/60 hover:text-navy dark:text-white transition">
        ← All providers
      </Link>

      <div className="flex items-start justify-between gap-4 mt-4 mb-8">
        <div>
          <h1 className="text-[26px] text-navy dark:text-white">{provider.name}</h1>
          <p className="text-[13.5px] text-muted dark:text-white/60 mt-1">
            {provider.email}
            {provider.specialty ? ` · ${provider.specialty}` : ""}
          </p>
        </div>
        <StatusBadge status={provider.status} />
      </div>

      <h2 className="text-[15px] font-semibold text-navy dark:text-white mb-4">Assigned locations</h2>
      <ProviderLocationsPanel
        providerId={provider.id}
        allLocations={allLocations ?? []}
        assignedLocationIds={(assignedRows ?? []).map((r) => r.location_id)}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-teal/10 text-teal",
    PENDING_SETUP: "bg-gold/15 text-[#8a6d1f]",
    DISABLED: "bg-line dark:bg-white/10 text-muted dark:text-white/60",
  };
  return (
    <span
      className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${styles[status] ?? "bg-line dark:bg-white/10 text-muted dark:text-white/60"}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
