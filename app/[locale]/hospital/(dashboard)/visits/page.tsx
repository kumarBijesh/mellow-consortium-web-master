import { Link } from "@/i18n/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Visit = {
  id: string;
  visit_date: string;
  diagnosis: string | null;
  notes: string | null;
  provider_id: string;
  patient: { full_name: string | null; email: string | null } | null;
};

export default async function HospitalVisitsPage({
  searchParams,
}: {
  searchParams: { q?: string; provider?: string; from?: string; to?: string };
}) {
  const supabase = createClient();
  const user = await getCurrentUser();
  const { q, provider: providerFilter, from, to } = searchParams;

  const { data: hospital } = await supabase.from("hospitals").select("id").eq("user_id", user?.id ?? "").maybeSingle();

  const { data: providers } = hospital
    ? await supabase.from("provider_profiles").select("id, name").eq("hospital_id", hospital.id).order("name")
    : { data: [] };
  const providerIds = (providers ?? []).map((p) => p.id);
  const providerNames = new Map((providers ?? []).map((p) => [p.id, p.name]));

  let query =
    providerIds.length > 0
      ? supabase
          .from("visits")
          .select("id, visit_date, diagnosis, notes, provider_id, patient:profiles(full_name, email)")
          .in("provider_id", providerIds)
          .order("visit_date", { ascending: false })
      : null;

  if (query && providerFilter) query = query.eq("provider_id", providerFilter);
  if (query && from) query = query.gte("visit_date", from);
  if (query && to) query = query.lte("visit_date", to);

  const { data: visitsRaw, error } = query ? await query : { data: [] as Visit[], error: null };

  let visits = (visitsRaw ?? []) as unknown as Visit[];
  if (q?.trim()) {
    const needle = q.trim().toLowerCase();
    visits = visits.filter(
      (v) => v.patient?.full_name?.toLowerCase().includes(needle) || v.patient?.email?.toLowerCase().includes(needle)
    );
  }

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-1">Clinical Visits</h1>
      <p className="text-muted dark:text-white/60 text-[14.5px] mb-8">Aggregated from all providers under this hospital.</p>

      {error && <p className="text-[14px] text-red-600 mb-6">Couldn&apos;t load visits. Try refreshing.</p>}

      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 mb-6">
        <h2 className="text-[14px] font-display font-bold text-navy dark:text-white mb-4">Filters</h2>
        <form method="get" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-navy dark:text-white mb-1.5">Search patient</label>
            <input
              type="search"
              name="q"
              placeholder="Name or email…"
              defaultValue={q ?? ""}
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-navy dark:text-white mb-1.5">Provider</label>
            <select
              name="provider"
              defaultValue={providerFilter ?? ""}
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            >
              <option value="">All providers</option>
              {(providers ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-navy dark:text-white mb-1.5">From date</label>
            <input
              type="date"
              name="from"
              defaultValue={from ?? ""}
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-navy dark:text-white mb-1.5">To date</label>
            <input
              type="date"
              name="to"
              defaultValue={to ?? ""}
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>
          <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
            <button type="submit" className="btn-primary !px-4 !py-2.5 text-[13.5px]">
              Apply filters
            </button>
            <Link href="/hospital/visits" className="btn-secondary !px-4 !py-2.5 text-[13.5px]">
              Clear
            </Link>
          </div>
        </form>
      </div>

      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-5 border-b border-line dark:border-white/10">
          <h2 className="text-[15px] font-display font-bold text-navy dark:text-white">Clinical visits ({visits.length} records)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line dark:border-white/10 text-[11px] uppercase tracking-[0.06em] text-muted dark:text-white/60">
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Patient</th>
                <th className="px-5 py-3 font-semibold">Provider</th>
                <th className="px-5 py-3 font-semibold">Diagnosis</th>
                <th className="px-5 py-3 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((v) => (
                <tr key={v.id} className="border-b border-line dark:border-white/10 last:border-0">
                  <td className="px-5 py-3 text-navy dark:text-white font-medium whitespace-nowrap">
                    {new Date(v.visit_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 text-muted dark:text-white/60">{v.patient?.full_name || ""}</td>
                  <td className="px-5 py-3 text-muted dark:text-white/60">{providerNames.get(v.provider_id) ?? ""}</td>
                  <td className="px-5 py-3 text-muted dark:text-white/60">{v.diagnosis || ""}</td>
                  <td className="px-5 py-3 text-muted dark:text-white/60 max-w-[280px] truncate">{v.notes || ""}</td>
                </tr>
              ))}
              {visits.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted dark:text-white/60">
                    No visits found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
