"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { saveCarePlan } from "@/lib/actions/connections";

type CarePlan = {
  diet_plan: string | null;
  exercise_protocol: string | null;
  yoga: string | null;
  meditation: string | null;
  medications: string | null;
  cautions: string | null;
  clinical_note: string | null;
} | null;

const FIELDS: { name: keyof NonNullable<CarePlan>; label: string; placeholder: string; full?: boolean }[] = [
  { name: "diet_plan", label: "Diet plan", placeholder: "e.g. Low glycemic, 1800 kcal/day…", full: true },
  { name: "exercise_protocol", label: "Exercise protocol", placeholder: "e.g. Zone 2 cardio 3×/week…", full: true },
  { name: "yoga", label: "Yoga", placeholder: "e.g. Yoga nidra 20 min" },
  { name: "meditation", label: "Meditation", placeholder: "e.g. 10-min mindfulness" },
  { name: "medications", label: "Medications & supplements", placeholder: "e.g. Berberine 500mg, Vit D3…", full: true },
  { name: "cautions", label: "Cautions", placeholder: "e.g. Avoid NSAIDs…", full: true },
  { name: "clinical_note", label: "Clinical note (visible to patient)", placeholder: "Freeform note…", full: true },
];

export default function CarePlanForm({ connectionId, patientId, plan }: { connectionId: string; patientId: string; plan: CarePlan }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    const result = await saveCarePlan(connectionId, patientId, formData);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FIELDS.map((f) => (
          <div key={f.name} className={f.full ? "sm:col-span-2" : ""}>
            <label htmlFor={f.name} className="block text-[13px] font-semibold text-navy dark:text-white mb-1.5">
              {f.label}
            </label>
            <textarea
              id={f.name}
              name={f.name}
              rows={f.full ? 3 : 2}
              defaultValue={plan?.[f.name] ?? ""}
              placeholder={f.placeholder}
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue resize-y"
            />
          </div>
        ))}
      </div>

      {error && <p className="text-[12.5px] text-red-600">{error}</p>}
      {success && <p className="text-[12.5px] text-teal">Saved and pushed to the patient app.</p>}

      <button type="submit" disabled={saving} className="btn-primary !px-4 !py-2.5 text-[13.5px] disabled:opacity-40">
        {saving ? "Saving…" : "Save & push to app"}
      </button>
    </form>
  );
}
