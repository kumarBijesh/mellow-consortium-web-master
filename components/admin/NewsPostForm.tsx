"use client";

import { useFormState, useFormStatus } from "react-dom";
import { TextField, TextAreaField } from "@/components/admin/AdminFields";

type Division = { id: string; name: string };
type FormState = { error?: string };

export default function NewsPostForm({
  action,
  divisions,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  divisions: Division[];
}) {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <TextField name="title" label="Title" required />
      <TextField name="slug" label="Slug" required />
      <div>
        <label htmlFor="division_id" className="adm-label">
          Division
        </label>
        <select id="division_id" name="division_id" className="adm-input">
          <option value="" className="bg-[#0d1117]"></option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id} className="bg-[#0d1117]">
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <TextField name="excerpt" label="Excerpt" />
      <TextAreaField name="body" label="Body" />
      <TextField name="cover_image_url" label="Cover image URL" />
      <label className="flex items-center gap-2 text-[13px] text-muted dark:text-white/70">
        <input type="checkbox" name="publish" className="rounded border-line dark:border-white/20 bg-white/5 dark:bg-white/[0.03] accent-teal" />
        Publish immediately
      </label>

      {state.error && (
        <div className="text-[13px] text-red-300 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="font-mono break-all">{state.error}</p>
          <p className="text-[11.5px] text-muted dark:text-white/30 mt-1">Full details logged server-side (see terminal running `npm run dev`).</p>
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="adm-btn-primary w-full">
      {pending ? "Creating…" : "Create post"}
    </button>
  );
}
