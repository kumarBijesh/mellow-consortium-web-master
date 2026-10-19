"use client";

import { useFormState, useFormStatus } from "react-dom";
import { TextField, SelectField } from "@/components/admin/AdminFields";

type FormState = { error?: string };
type Option = { id: string; name: string };
type Defaults = { trial_id?: string; country?: string; city?: string; institution_id?: string };

export default function TrialSiteForm({
  action,
  trials,
  institutions,
  defaults,
  submitLabel = "Create trial site",
  pendingLabel = "Creating…",
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  trials: Option[];
  institutions: Option[];
  defaults?: Defaults;
  submitLabel?: string;
  pendingLabel?: string;
}) {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <SelectField
        name="trial_id"
        label="Trial"
        required
        options={trials.map((t) => ({ value: t.id, label: t.name }))}
        defaultValue={defaults?.trial_id}
        placeholder=""
      />
      <TextField name="country" label="Country" required defaultValue={defaults?.country} />
      <TextField name="city" label="City" defaultValue={defaults?.city} />
      <SelectField
        name="institution_id"
        label="Institution"
        options={institutions.map((i) => ({ value: i.id, label: i.name }))}
        defaultValue={defaults?.institution_id}
      />

      {state.error && (
        <div className="text-[13px] text-red-300 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="font-mono break-all">{state.error}</p>
        </div>
      )}

      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="adm-btn-primary w-full">
      {pending ? pendingLabel : label}
    </button>
  );
}
