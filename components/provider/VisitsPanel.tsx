"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { logVisit } from "@/lib/actions/connections";

type Visit = { id: string; visit_date: string; diagnosis: string | null; notes: string | null };

export default function VisitsPanel({
  connectionId,
  patientId,
  visits,
}: {
  connectionId: string;
  patientId: string;
  visits: Visit[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await logVisit(connectionId, patientId, formData);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <div>
      <div className="space-y-3 mb-5">
        {visits.map((v) => (
          <div key={v.id} className="rounded-card border border-line dark:border-white/10 p-4 bg-white dark:bg-white/[0.03]">
            <p className="text-[13px] font-semibold text-navy dark:text-white">{new Date(v.visit_date).toLocaleDateString()}</p>
            {v.diagnosis && <p className="text-[13.5px] text-navy dark:text-white mt-1">{v.diagnosis}</p>}
            {v.notes && <p className="text-[13px] text-muted dark:text-white/60 mt-1 whitespace-pre-wrap">{v.notes}</p>}
          </div>
        ))}
        {visits.length === 0 && <p className="text-muted dark:text-white/60 text-[13.5px]">No visits logged yet.</p>}
      </div>

      {open ? (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-card border border-line dark:border-white/10 p-4 bg-white dark:bg-white/[0.03]">
          <div>
            <label htmlFor="visit_date" className="block text-[13px] font-semibold text-navy dark:text-white mb-1.5">
              Visit date
            </label>
            <input
              id="visit_date"
              name="visit_date"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>
          <div>
            <label htmlFor="diagnosis" className="block text-[13px] font-semibold text-navy dark:text-white mb-1.5">
              Diagnosis
            </label>
            <input
              id="diagnosis"
              name="diagnosis"
              type="text"
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>
          <div>
            <label htmlFor="notes" className="block text-[13px] font-semibold text-navy dark:text-white mb-1.5">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>
          {error && <p className="text-[12.5px] text-red-600">{error}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn-primary text-[13.5px] disabled:opacity-40">
              {saving ? "Saving…" : "Save visit"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-[13px] text-muted dark:text-white/60 hover:text-navy dark:text-white transition">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="btn-secondary text-[13.5px]">
          + Log a visit
        </button>
      )}
    </div>
  );
}
