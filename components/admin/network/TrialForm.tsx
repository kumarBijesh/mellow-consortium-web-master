"use client";

import { useFormState, useFormStatus } from "react-dom";
import { TextField, TextAreaField, SelectField } from "@/components/admin/AdminFields";
import { TRIAL_STATUSES } from "@/lib/network-constants";

type FormState = { error?: string };
type Option = { id: string; name: string };
type Defaults = {
  title?: string;
  slug?: string;
  summary?: string;
  status?: string;
  therapeutic_area?: string;
  lead_investigator_id?: string;
  sponsor_institution_id?: string;
  starts_on?: string;
  ends_on?: string;
  location?: string;
  enroll_url?: string;
};

export default function TrialForm({
  action,
  investigators,
  institutions,
  defaults,
  submitLabel = "Create trial",
  pendingLabel = "Creating…",
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  investigators: Option[];
  institutions: Option[];
  defaults?: Defaults;
  submitLabel?: string;
  pendingLabel?: string;
}) {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <TextField name="title" label="Title" required defaultValue={defaults?.title} />
      <TextField name="slug" label="Slug" required defaultValue={defaults?.slug} />
      <TextAreaField name="summary" label="Summary" defaultValue={defaults?.summary} rows={4} />
      <SelectField
        name="status"
        label="Status"
        required
        options={TRIAL_STATUSES.map((s) => ({ value: s, label: s }))}
        defaultValue={defaults?.status ?? "active"}
        placeholder=""
      />
      <TextField name="therapeutic_area" label="Therapeutic area" defaultValue={defaults?.therapeutic_area} />
      <SelectField
        name="lead_investigator_id"
        label="Lead investigator"
        options={investigators.map((i) => ({ value: i.id, label: i.name }))}
        defaultValue={defaults?.lead_investigator_id}
      />
      <SelectField
        name="sponsor_institution_id"
        label="Sponsor institution"
        options={institutions.map((i) => ({ value: i.id, label: i.name }))}
        defaultValue={defaults?.sponsor_institution_id}
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField name="starts_on" label="Starts on" type="date" defaultValue={defaults?.starts_on} />
        <TextField name="ends_on" label="Ends on" type="date" defaultValue={defaults?.ends_on} />
      </div>
      <TextField name="location" label="Location" defaultValue={defaults?.location} />
      <TextField name="enroll_url" label="Enrol / listing URL" type="url" defaultValue={defaults?.enroll_url} />
      <p className="text-[12px] text-muted dark:text-white/40 -mt-2">
        Link to the trial&apos;s listing on musbresearch.com/trials (or wherever patients enrol). Shown as an enrol button on the public trial page.
      </p>

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
