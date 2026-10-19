import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import ScheduleGrid from "@/components/hospital/ScheduleGrid";

export const dynamic = "force-dynamic";

function mondayOf(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function weekHref(providerId: string | undefined, weekStart: Date) {
  const params = new URLSearchParams();
  if (providerId) params.set("provider", providerId);
  params.set("week", toISODate(weekStart));
  return `/hospital/schedule?${params.toString()}`;
}

export default async function HospitalSchedulePage({
  searchParams,
}: {
  searchParams: { provider?: string; week?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: hospital } = await supabase.from("hospitals").select("id").eq("user_id", user?.id ?? "").maybeSingle();

  const { data: providers } = hospital
    ? await supabase.from("provider_profiles").select("id, name").eq("hospital_id", hospital.id).order("name")
    : { data: [] };

  const selectedProviderId = searchParams.provider || providers?.[0]?.id;

  const anchorDate = searchParams.week ? new Date(`${searchParams.week}T00:00:00`) : new Date();
  const weekStart = mondayOf(anchorDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return {
      date: toISODate(d),
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
    };
  });
  const weekEnd = days[6].date;

  const { data: availabilityRows } = selectedProviderId
    ? await supabase
        .from("provider_availability")
        .select("slot_date, slot_time, available")
        .eq("provider_id", selectedProviderId)
        .gte("slot_date", days[0].date)
        .lte("slot_date", weekEnd)
    : { data: [] };

  const initialAvailable: Record<string, boolean> = {};
  for (const row of availabilityRows ?? []) {
    if (row.available) initialAvailable[`${row.slot_date}T${row.slot_time.slice(0, 5)}`] = true;
  }

  const prevWeek = new Date(weekStart);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h1 className="text-[26px] text-navy dark:text-white">Schedule</h1>
          <p className="text-muted dark:text-white/60 text-[14.5px] mt-1">Set provider availability. Blue = available.</p>
        </div>
        {providers && providers.length > 0 && (
          <form method="get" className="flex items-end gap-2.5">
            <input type="hidden" name="week" value={toISODate(weekStart)} />
            <div>
              <label className="block text-[12.5px] font-semibold text-navy dark:text-white mb-1.5">Provider</label>
              <select
                name="provider"
                defaultValue={selectedProviderId}
                className="rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-secondary !px-4 !py-2.5 text-[13px]">
              View
            </button>
          </form>
        )}
      </div>

      {!providers || providers.length === 0 ? (
        <p className="text-[14px] text-muted dark:text-white/60 mt-8">Add a provider first to set their availability.</p>
      ) : (
        <>
          <div className="flex items-center justify-between mt-8 mb-5">
            <Link href={weekHref(selectedProviderId, prevWeek)} className="btn-secondary !px-4 !py-2 text-[13px]">
              ← Prev
            </Link>
            <p className="text-[14.5px] font-semibold text-navy dark:text-white">
              {days[0].dayNum} – {days[6].dayNum}
            </p>
            <div className="flex gap-2">
              <Link href={weekHref(selectedProviderId, mondayOf(new Date()))} className="btn-secondary !px-4 !py-2 text-[13px]">
                Today
              </Link>
              <Link href={weekHref(selectedProviderId, nextWeek)} className="btn-secondary !px-4 !py-2 text-[13px]">
                Next →
              </Link>
            </div>
          </div>

          <ScheduleGrid key={`${selectedProviderId}-${toISODate(weekStart)}`} providerId={selectedProviderId!} days={days} initialAvailable={initialAvailable} />
        </>
      )}
    </div>
  );
}
