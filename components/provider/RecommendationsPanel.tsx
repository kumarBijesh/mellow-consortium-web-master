"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { addRecommendation } from "@/lib/actions/connections";

type Recommendation = { id: string; body: string; created_at: string };

export default function RecommendationsPanel({
  connectionId,
  patientId,
  recommendations,
}: {
  connectionId: string;
  patientId: string;
  recommendations: Recommendation[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError(null);
    const result = await addRecommendation(connectionId, patientId, body);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setBody("");
    router.refresh();
  }

  return (
    <div>
      <div className="space-y-3 mb-5">
        {recommendations.map((r) => (
          <div key={r.id} className="rounded-card border border-line dark:border-white/10 p-4 bg-white dark:bg-white/[0.03]">
            <p className="text-[13.5px] text-navy dark:text-white whitespace-pre-wrap">{r.body}</p>
            <p className="text-[11.5px] text-muted dark:text-white/60 mt-2">{new Date(r.created_at).toLocaleString()}</p>
          </div>
        ))}
        {recommendations.length === 0 && (
          <p className="text-muted dark:text-white/60 text-[13.5px]">No recommendations left for this patient yet.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <label htmlFor="recommendation" className="block text-[13px] font-semibold text-navy dark:text-white">
          Add a recommendation
        </label>
        <textarea
          id="recommendation"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="e.g. Increase daily activity, follow up in 3 months…"
          className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
        />
        <button type="submit" disabled={saving || !body.trim()} className="btn-primary text-[13.5px] disabled:opacity-40">
          {saving ? "Saving…" : "Save recommendation"}
        </button>
        {error && <p className="text-[12.5px] text-red-600">{error}</p>}
      </form>
    </div>
  );
}
