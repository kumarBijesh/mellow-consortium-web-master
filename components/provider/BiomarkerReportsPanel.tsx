"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { addBiomarkerReport } from "@/lib/actions/connections";

type Report = {
  id: string;
  recorded_date: string;
  biological_age: number | null;
  chronological_age: number | null;
  crp: number | null;
  glucose: number | null;
  risk_level: string | null;
  notes: string | null;
};

const RISK_LEVELS = ["Very low", "Low", "Moderate", "High"];

const RISK_STYLES: Record<string, string> = {
  "Very low": "bg-lightblue text-blue dark:bg-blue/[0.15] dark:text-blue",
  Low: "bg-lightblue text-blue dark:bg-blue/[0.15] dark:text-blue",
  Moderate: "bg-[#fdf3d9] text-[#8a6a12] dark:bg-gold/[0.15] dark:text-gold",
  High: "bg-red-50 text-red-600 dark:bg-red-500/[0.15] dark:text-red-400",
};

export default function BiomarkerReportsPanel({
  connectionId,
  patientId,
  reports,
}: {
  connectionId: string;
  patientId: string;
  reports: Report[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await addBiomarkerReport(connectionId, patientId, formData);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setFormOpen(false);
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-muted dark:text-white/60">{reports.length} report{reports.length === 1 ? "" : "s"} logged</p>
        <button type="button" onClick={() => setFormOpen((v) => !v)} className="btn-secondary !px-3.5 !py-2 text-[13px]">
          {formOpen ? "Close" : "Log new report"}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="rounded-[14px] border border-dashed border-line dark:border-white/15 p-5 mb-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="recorded_date" className="adm-label !mb-1.5 !text-[12.5px]">
                Date
              </label>
              <input
                id="recorded_date"
                name="recorded_date"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
              />
            </div>
            <div>
              <label htmlFor="risk_level" className="adm-label !mb-1.5 !text-[12.5px]">
                Risk level
              </label>
              <select
                id="risk_level"
                name="risk_level"
                className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
              >
                {RISK_LEVELS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label htmlFor="biological_age" className="adm-label !mb-1.5 !text-[12.5px]">
                Biological age
              </label>
              <input
                id="biological_age"
                name="biological_age"
                type="number"
                step="0.1"
                className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
              />
            </div>
            <div>
              <label htmlFor="chronological_age" className="adm-label !mb-1.5 !text-[12.5px]">
                Chronological age
              </label>
              <input
                id="chronological_age"
                name="chronological_age"
                type="number"
                step="0.1"
                className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
              />
            </div>
            <div>
              <label htmlFor="crp" className="adm-label !mb-1.5 !text-[12.5px]">
                hs-CRP (mg/L)
              </label>
              <input
                id="crp"
                name="crp"
                type="number"
                step="0.1"
                className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
              />
            </div>
            <div>
              <label htmlFor="glucose" className="adm-label !mb-1.5 !text-[12.5px]">
                Glucose (mg/dL)
              </label>
              <input
                id="glucose"
                name="glucose"
                type="number"
                step="0.1"
                className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="adm-label !mb-1.5 !text-[12.5px]">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>

          {error && <p className="text-[12.5px] text-red-600">{error}</p>}

          <button type="submit" disabled={saving} className="btn-primary !px-4 !py-2.5 text-[13.5px] disabled:opacity-40">
            {saving ? "Saving…" : "Save report"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-card border border-line dark:border-white/10">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-line dark:border-white/10 text-[11px] uppercase tracking-[0.06em] text-muted dark:text-white/50">
              <th className="px-4 py-2.5 font-semibold">Date</th>
              <th className="px-4 py-2.5 font-semibold">Bio age</th>
              <th className="px-4 py-2.5 font-semibold">Chrono age</th>
              <th className="px-4 py-2.5 font-semibold">Risk</th>
              <th className="px-4 py-2.5 font-semibold">CRP</th>
              <th className="px-4 py-2.5 font-semibold">Glucose</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-line dark:border-white/10 last:border-0">
                <td className="px-4 py-2.5 text-navy dark:text-white">{new Date(r.recorded_date).toLocaleDateString()}</td>
                <td className="px-4 py-2.5 text-navy dark:text-white">{r.biological_age ?? ""}</td>
                <td className="px-4 py-2.5 text-muted dark:text-white/60">{r.chronological_age ?? ""}</td>
                <td className="px-4 py-2.5">
                  {r.risk_level ? (
                    <span className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-full ${RISK_STYLES[r.risk_level] ?? "bg-lightblue text-blue"}`}>
                      {r.risk_level}
                    </span>
                  ) : (
                    ""
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted dark:text-white/60">{r.crp ?? ""}</td>
                <td className="px-4 py-2.5 text-muted dark:text-white/60">{r.glucose ?? ""}</td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted dark:text-white/60">
                  No reports logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
