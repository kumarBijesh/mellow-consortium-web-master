"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { saveAvailability } from "@/lib/actions/availability";

const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export default function ScheduleGrid({
  providerId,
  days,
  initialAvailable,
}: {
  providerId: string;
  days: { date: string; label: string; dayNum: string }[];
  initialAvailable: Record<string, boolean>; // key: `${date}T${time}`
}) {
  const router = useRouter();
  const [available, setAvailable] = useState(initialAvailable);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(date: string, time: string) {
    const key = `${date}T${time}`;
    setAvailable((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const slots = days.flatMap((d) =>
      HOURS.map((time) => ({ date: d.date, time, available: !!available[`${d.date}T${time}`] }))
    );
    const result = await saveAvailability(providerId, slots);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-card border border-line dark:border-white/10">
        <table className="w-full text-center text-[13px] border-collapse">
          <thead>
            <tr className="border-b border-line dark:border-white/10 bg-lightblue/40 dark:bg-teal/[0.05]">
              <th className="px-4 py-3 text-left font-semibold text-navy dark:text-white">Time</th>
              {days.map((d) => (
                <th key={d.date} className="px-4 py-3 font-semibold text-navy dark:text-white whitespace-nowrap">
                  {d.label}
                  <br />
                  <span className="text-[11px] font-normal text-muted dark:text-white/50">{d.dayNum}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((time) => (
              <tr key={time} className="border-b border-line dark:border-white/10 last:border-0">
                <td className="px-4 py-2.5 text-left text-muted dark:text-white/60 font-medium">{time}</td>
                {days.map((d) => {
                  const key = `${d.date}T${time}`;
                  const isAvailable = !!available[key];
                  return (
                    <td key={key} className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggle(d.date, time)}
                        aria-pressed={isAvailable}
                        aria-label={`${d.date} ${time} ${isAvailable ? "available" : "unavailable"}`}
                        className={`w-5 h-5 rounded border mx-auto block transition ${
                          isAvailable ? "bg-blue border-blue" : "bg-white dark:bg-white/[0.04] border-line dark:border-white/15"
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 mt-5">
        <button type="button" onClick={handleSave} disabled={saving} className="btn-primary !px-4 !py-2.5 text-[13.5px] disabled:opacity-50">
          {saving ? "Saving…" : "Save availability"}
        </button>
        {saved && <span className="text-[13px] text-teal">Saved.</span>}
        {error && <span className="text-[13px] text-red-600">{error}</span>}
      </div>

      <div className="flex items-center gap-5 mt-4 text-[12.5px] text-muted dark:text-white/60">
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-blue inline-block" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-white dark:bg-white/[0.04] border border-line dark:border-white/15 inline-block" /> Unavailable
        </span>
      </div>
    </div>
  );
}
