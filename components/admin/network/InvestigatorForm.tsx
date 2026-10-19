"use client";

import { useFormState, useFormStatus } from "react-dom";
import { TextField, TextAreaField } from "@/components/admin/AdminFields";
import InstitutionPicker from "@/components/admin/network/InstitutionPicker";

type FormState = { error?: string };
type Institution = { id: string; name: string };
type Defaults = { full_name?: string; title?: string; institution_id?: string; bio?: string; photo_url?: string };

export default function InvestigatorForm({
  action,
  institutions,
  defaults,
  submitLabel = "Create investigator",
  pendingLabel = "Creating…",
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  institutions: Institution[];
  defaults?: Defaults;
  submitLabel?: string;
  pendingLabel?: string;
}) {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <TextField name="full_name" label="Full name" required defaultValue={defaults?.full_name} />
      <TextField name="title" label="Title (e.g. MD, PhD)" defaultValue={defaults?.title} />
      <InstitutionPicker institutions={institutions} defaultValue={defaults?.institution_id} />
      <TextAreaField name="bio" label="Bio" defaultValue={defaults?.bio} rows={4} />
      <TextField name="photo_url" label="Photo URL" defaultValue={defaults?.photo_url} />

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
