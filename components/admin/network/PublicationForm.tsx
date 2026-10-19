"use client";

import { useFormState, useFormStatus } from "react-dom";
import { TextField, SelectField } from "@/components/admin/AdminFields";

type FormState = { error?: string };
type Option = { id: string; name: string };
type Defaults = { title?: string; authors?: string; journal?: string; published_on?: string; url?: string; trial_id?: string };

export default function PublicationForm({
  action,
  trials,
  defaults,
  submitLabel = "Create publication",
  pendingLabel = "Creating…",
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  trials: Option[];
  defaults?: Defaults;
  submitLabel?: string;
  pendingLabel?: string;
}) {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <TextField name="title" label="Title" required defaultValue={defaults?.title} />
      <TextField name="authors" label="Authors" defaultValue={defaults?.authors} />
      <TextField name="journal" label="Journal" defaultValue={defaults?.journal} />
      <TextField name="published_on" label="Published on" type="date" defaultValue={defaults?.published_on} />
      <TextField name="url" label="URL" type="url" defaultValue={defaults?.url} />
      <SelectField
        name="trial_id"
        label="Related trial"
        options={trials.map((t) => ({ value: t.id, label: t.name }))}
        defaultValue={defaults?.trial_id}
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
