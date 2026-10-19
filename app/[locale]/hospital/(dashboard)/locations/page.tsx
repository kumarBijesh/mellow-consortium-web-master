import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateLocationForm from "@/components/hospital/CreateLocationForm";

export const dynamic = "force-dynamic";

export default async function HospitalLocationsPage() {
  const supabase = createClient();

  const { data: locations, error } = await supabase
    .from("locations")
    .select("id, name, city, state_province, country, status, provider_locations(count)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-[26px] text-navy dark:text-white">Clinics</h1>
        <CreateLocationForm />
      </div>

      {error && <p className="text-[14px] text-red-600 mb-6">Couldn&apos;t load locations. Try refreshing.</p>}

      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-line dark:border-white/10 text-[11px] uppercase tracking-[0.06em] text-muted dark:text-white/60">
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">City</th>
              <th className="px-5 py-3 font-semibold">Country</th>
              <th className="px-5 py-3 font-semibold">Providers</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {(locations ?? []).map((l) => (
              <tr key={l.id} className="border-b border-line dark:border-white/10 last:border-0">
                <td className="px-5 py-3 text-navy dark:text-white font-medium">
                  <Link href={`/hospital/locations/${l.id}`} className="hover:text-blue transition">
                    {l.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-muted dark:text-white/60">
                  {[l.city, l.state_province].filter(Boolean).join(", ") || ""}
                </td>
                <td className="px-5 py-3 text-muted dark:text-white/60">{l.country}</td>
                <td className="px-5 py-3 text-muted dark:text-white/60">
                  {(l.provider_locations as unknown as { count: number }[])?.[0]?.count ?? 0}
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={l.status} />
                </td>
              </tr>
            ))}
            {(!locations || locations.length === 0) && !error && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted dark:text-white/60">
                  No locations yet. Create your first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-teal/10 text-teal",
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
