"use client";

import { useFormState, useFormStatus } from "react-dom";
import { TextField, TextAreaField, SelectField, CheckboxField } from "@/components/admin/AdminFields";
import EventImageUpload from "@/components/admin/network/EventImageUpload";
import { EVENT_TYPES } from "@/lib/events-constants";

type FormState = { error?: string };
type Defaults = {
  title?: string;
  slug?: string;
  description?: string;
  event_type?: string;
  start_date?: string;
  end_date?: string;
  is_virtual?: boolean;
  location?: string;
  tags?: string;
  cover_image_url?: string;
};

export default function EventForm({
  action,
  defaults,
  submitLabel = "Create event",
  pendingLabel = "Creating…",
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Defaults;
  submitLabel?: string;
  pendingLabel?: string;
}) {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <TextField name="title" label="Title" required defaultValue={defaults?.title} />
      <TextField name="slug" label="Slug" required defaultValue={defaults?.slug} />
      <TextAreaField name="description" label="Description" required defaultValue={defaults?.description} rows={4} />
      <SelectField
        name="event_type"
        label="Type"
        required
        options={EVENT_TYPES.map((t) => ({ value: t, label: t }))}
        defaultValue={defaults?.event_type ?? "conference"}
        placeholder=""
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField name="start_date" label="Start date" type="date" required defaultValue={defaults?.start_date} />
        <TextField name="end_date" label="End date (optional)" type="date" defaultValue={defaults?.end_date} />
      </div>
      <CheckboxField name="is_virtual" label="Virtual / online event" defaultChecked={defaults?.is_virtual} />
      <TextField name="location" label="Location (city, venue — ignored if virtual)" defaultValue={defaults?.location} />
      <TextField name="tags" label="Tags (comma-separated)" defaultValue={defaults?.tags} />
      <EventImageUpload name="cover_image_url" defaultValue={defaults?.cover_image_url} />

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
