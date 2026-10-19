"use client";

import { useState, type FormEvent } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { TextField, SelectField, CheckboxField } from "@/components/admin/AdminFields";
import { REGIONS } from "@/lib/network-constants";

type FormState = { error?: string; savedAt?: number };
type Defaults = {
  name?: string;
  country?: string;
  city?: string;
  website?: string;
  logo_url?: string;
  region?: string;
  lat?: string;
  lon?: string;
  is_hq?: boolean;
  specializations?: string;
};

export default function InstitutionForm({
  action,
  defaults,
  submitLabel = "Create institution",
  pendingLabel = "Creating…",
  successMessage = "Institution created.",
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Defaults;
  submitLabel?: string;
  pendingLabel?: string;
  successMessage?: string;
}) {
  const [state, formAction] = useFormState(action, {});
  // Browser validation (e.g. a malformed Website URL) cancels the submit
  // before any request is sent and only shows a transient tooltip. Surface
  // it on the page so a blocked save is never silent.
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  // Rebuild from the form's current state on each attempt, so fixed fields drop off.
  function onInvalidCapture(e: FormEvent<HTMLFormElement>) {
    const invalid = Array.from(e.currentTarget.elements).filter(
      (el): el is HTMLInputElement => el instanceof HTMLInputElement && !!el.name && !el.checkValidity()
    );
    setInvalidFields(invalid.map((el) => `${el.labels?.[0]?.textContent ?? el.name}: ${el.validationMessage}`));
  }

  return (
    <form action={formAction} onInvalidCapture={onInvalidCapture} onSubmitCapture={() => setInvalidFields([])} className="space-y-4">
      <TextField name="name" label="Name" required defaultValue={defaults?.name} />
      <TextField name="country" label="Country" required defaultValue={defaults?.country} />
      <TextField name="city" label="City" defaultValue={defaults?.city} />
      <SelectField name="region" label="Region" options={REGIONS.map((r) => ({ value: r, label: r }))} defaultValue={defaults?.region} />
      <div className="grid grid-cols-2 gap-4">
        {/* step="any": real coordinates have 4-6 decimals; a fixed step makes the browser reject them. */}
        <TextField name="lat" label="Latitude" type="number" step="any" defaultValue={defaults?.lat} />
        <TextField name="lon" label="Longitude" type="number" step="any" defaultValue={defaults?.lon} />
      </div>
      <TextField name="specializations" label="Specializations (comma-separated)" defaultValue={defaults?.specializations} />
      <TextField name="website" label="Website" type="url" defaultValue={defaults?.website} />
      <TextField name="logo_url" label="Logo URL" defaultValue={defaults?.logo_url} />
      <CheckboxField name="is_hq" label="This is the HQ marker" defaultChecked={defaults?.is_hq} />

      {invalidFields.length > 0 && (
        <div className="text-[13px] text-red-300 rounded-xl border border-red-500/20 bg-red-500/5 p-3" role="alert">
          <p className="font-semibold mb-1">Not saved. Fix these fields:</p>
          <ul className="list-disc pl-5">
            {invalidFields.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {state.error && (
        <div className="text-[13px] text-red-300 rounded-xl border border-red-500/20 bg-red-500/5 p-3" role="alert">
          <p className="font-mono break-all">{state.error}</p>
        </div>
      )}

      {!state.error && state.savedAt && invalidFields.length === 0 && (
        <p className="text-[13px] text-teal" role="status">
          {successMessage} ({new Date(state.savedAt).toLocaleTimeString()})
        </p>
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
