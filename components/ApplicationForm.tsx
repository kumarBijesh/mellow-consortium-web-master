"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PersonaType } from "@/lib/personas";

// Persona-specific extra fields, stored inside applications.form_data (jsonb).
// Add/remove fields here freely — no migration needed, this is exactly the
// churn the jsonb column exists to absorb while these are still settling.
const EXTRA_FIELDS: Record<PersonaType, { name: string; label: string }[]> = {
  biotech_company: [
    { name: "product_area", label: "Product / therapeutic area" },
    { name: "trial_interest", label: "What kind of trial are you interested in?" },
  ],
  // Never actually rendered — /apply/clinical_investigator is intercepted
  // in app/[locale]/apply/[type]/page.tsx before this component is used.
  // Kept only so Record<PersonaType, ...> below still type-checks.
  clinical_investigator: [],
  academic_institution: [
    { name: "institution_name", label: "Institution name" },
    { name: "department", label: "Department" },
  ],
  individual: [],
  healthcare_provider: [
    { name: "specialty", label: "Specialty" },
    { name: "practice_name", label: "Practice / clinic name" },
  ],
  hospital_wellness_group: [
    { name: "org_type", label: "Organization type (hospital, gym, studio, etc.)" },
    { name: "locations", label: "Number of locations" },
  ],
  journal_conference_partner: [
    { name: "publication_name", label: "Publication / event name" },
    { name: "partnership_type", label: "Type of partnership" },
  ],
};

type Status = "idle" | "submitting" | "success" | "error";

export default function ApplicationForm({ personaType }: { personaType: PersonaType }) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const extraFields = EXTRA_FIELDS[personaType] ?? [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const form = new FormData(e.currentTarget);
    const contact_name = String(form.get("contact_name") ?? "").trim();
    const contact_email = String(form.get("contact_email") ?? "").trim();
    const organization_name = String(form.get("organization_name") ?? "").trim();
    const country = String(form.get("country") ?? "").trim();

    if (!contact_name || !contact_email) {
      setStatus("error");
      setErrorMessage("Name and email are required.");
      return;
    }

    const form_data: Record<string, string> = {};
    for (const field of extraFields) {
      form_data[field.name] = String(form.get(field.name) ?? "").trim();
    }
    const notes = String(form.get("notes") ?? "").trim();
    if (notes) form_data.notes = notes;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("applications").insert({
      persona_type: personaType,
      contact_name,
      contact_email,
      organization_name: organization_name || null,
      country: country || null,
      form_data,
      user_id: user?.id ?? null,
    });

    if (error) {
      setStatus("error");
      setErrorMessage("Something went wrong submitting your application. Please try again.");
      return;
    }

    setStatus("success");
  }

  if (status === "success") {
    return (
      <div className="rounded-card border border-line dark:border-white/10 bg-lightblue/40 dark:bg-teal/[0.08] p-6">
        <h3 className="text-[18px] text-navy dark:text-white mb-2">Application received</h3>
        <p className="text-muted dark:text-white/60 text-[14px]">
          Thanks! Our team will review this and get back to you by email shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field name="contact_name" label="Full name" required />
      <Field name="contact_email" label="Email" type="email" required />
      <Field name="organization_name" label="Organization (optional)" />
      <Field name="country" label="Country" />

      {extraFields.map((f) => (
        <Field key={f.name} name={f.name} label={f.label} />
      ))}

      <div>
        <label className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
          Anything else we should know? (optional)
        </label>
        <textarea
          name="notes"
          rows={4}
          className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
        />
      </div>

      {status === "error" && errorMessage && (
        <p className="text-[13.5px] text-red-600">{errorMessage}</p>
      )}

      <button type="submit" disabled={status === "submitting"} className="btn-primary w-full">
        {status === "submitting" ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
        {label}
        {required && <span className="text-blue"> *</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
      />
    </div>
  );
}
