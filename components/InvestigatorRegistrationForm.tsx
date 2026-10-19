"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  SALUTATIONS,
  ACCESS_TIERS,
  PROFILE_IMAGE_MAX_BYTES,
  CV_MAX_BYTES,
  isValidUrl,
  splitCommaList,
  splitLines,
} from "@/lib/investigator-registration-constants";

type Status = "idle" | "submitting" | "success" | "error";

export default function InvestigatorRegistrationForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    const form = new FormData(e.currentTarget);
    const get = (name: string) => String(form.get(name) ?? "").trim();

    const first_name = get("first_name");
    const last_name = get("last_name");
    const personal_email = get("personal_email");
    const institution_name = get("institution_name");
    const linkedin_url = get("linkedin_url");
    const website_url = get("website_url");

    if (!first_name || !last_name || !personal_email || !institution_name) {
      setStatus("error");
      setErrorMessage("First name, last name, personal email, and institution are required.");
      return;
    }
    if (linkedin_url && !isValidUrl(linkedin_url)) {
      setStatus("error");
      setErrorMessage("LinkedIn Profile URL isn't a valid URL.");
      return;
    }
    if (website_url && !isValidUrl(website_url)) {
      setStatus("error");
      setErrorMessage("Website / Institute Page URL isn't a valid URL.");
      return;
    }

    const profileImage = form.get("profile_image") as File | null;
    if (profileImage && profileImage.size > 0) {
      if (!profileImage.type.startsWith("image/")) {
        setStatus("error");
        setErrorMessage("Profile image must be an image file.");
        return;
      }
      if (profileImage.size > PROFILE_IMAGE_MAX_BYTES) {
        setStatus("error");
        setErrorMessage("Profile image must be 5MB or smaller.");
        return;
      }
    }

    const cvFile = form.get("cv_file") as File | null;
    if (cvFile && cvFile.size > 0) {
      if (cvFile.type !== "application/pdf") {
        setStatus("error");
        setErrorMessage("CV / Resume must be a PDF file.");
        return;
      }
      if (cvFile.size > CV_MAX_BYTES) {
        setStatus("error");
        setErrorMessage("CV / Resume must be 10MB or smaller.");
        return;
      }
    }

    setStatus("submitting");
    const supabase = createClient();

    let profile_image_path: string | null = null;
    let cv_path: string | null = null;

    if (profileImage && profileImage.size > 0) {
      const path = `${crypto.randomUUID()}-${profileImage.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: uploadError } = await supabase.storage.from("investigator-profile-images").upload(path, profileImage);
      if (uploadError) {
        setStatus("error");
        setErrorMessage(`Could not upload profile image: ${uploadError.message}`);
        return;
      }
      profile_image_path = path;
    }

    if (cvFile && cvFile.size > 0) {
      const path = `${crypto.randomUUID()}-${cvFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: uploadError } = await supabase.storage.from("investigator-cvs").upload(path, cvFile);
      if (uploadError) {
        setStatus("error");
        setErrorMessage(`Could not upload CV: ${uploadError.message}`);
        return;
      }
      cv_path = path;
    }

    const { error } = await supabase.from("investigator_registrations").insert({
      salutation: get("salutation") || null,
      first_name,
      middle_name: get("middle_name") || null,
      last_name,
      personal_email,
      access_tier: get("access_tier") || null,
      institution_name,
      street_address: get("street_address") || null,
      city: get("city") || null,
      state: get("state") || null,
      postal_code: get("postal_code") || null,
      country: get("country") || null,
      department_focus_area: get("department_focus_area") || null,
      professional_bio: get("professional_bio") || null,
      qualifications: get("qualifications") || null,
      core_competencies: splitCommaList(get("core_competencies")),
      publications: splitLines(get("publications")),
      linkedin_url: linkedin_url || null,
      website_url: website_url || null,
      profile_image_path,
      cv_path,
    });

    if (error) {
      setStatus("error");
      setErrorMessage("Something went wrong submitting your registration. Please try again.");
      return;
    }

    setStatus("success");
    formRef.current?.reset();
  }

  if (status === "success") {
    return (
      <div className="rounded-card border border-line dark:border-white/10 bg-lightblue/40 dark:bg-teal/[0.08] p-6">
        <h3 className="text-[18px] text-navy dark:text-white mb-2">Registration received</h3>
        <p className="text-muted dark:text-white/60 text-[14px]">
          Thanks! Our team will review your submission, and you&apos;ll appear in the MELLOW investigator network once
          approved.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <FormSection title="Basic Info">
        <div className="grid grid-cols-2 gap-4">
          <SelectField name="salutation" label="Salutation" options={SALUTATIONS as unknown as string[]} />
          <SelectField name="access_tier" label="Access Tier / Role" options={ACCESS_TIERS as unknown as string[]} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field name="first_name" label="First Name" required />
          <Field name="middle_name" label="Middle Name" />
          <Field name="last_name" label="Last Name" required />
        </div>
        <Field name="personal_email" label="Personal Email" type="email" required />
        <Field name="institution_name" label="Institution / Affiliation" required />
        <Field name="street_address" label="Street Address" />
        <div className="grid grid-cols-2 gap-4">
          <Field name="city" label="City" />
          <Field name="state" label="State" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field name="country" label="Country" />
          <Field name="postal_code" label="Postal / ZIP Code" />
        </div>
      </FormSection>

      <FormSection title="Professional Profile">
        <Field name="department_focus_area" label="Department / Focus Area" />
        <TextAreaField name="professional_bio" label="Professional Biography" rows={4} />
        <TextAreaField name="qualifications" label="Qualifications / Credentials" rows={3} />
        <Field name="core_competencies" label="Core Competencies (comma-separated)" />
        <TextAreaField name="publications" label="Selected Publications (one per line)" rows={4} />
        <div className="grid grid-cols-2 gap-4">
          <Field name="linkedin_url" label="LinkedIn Profile URL" type="url" />
          <Field name="website_url" label="Website / Institute Page URL" type="url" />
        </div>
        <FileField name="profile_image" label="Profile Image" accept="image/*" hint="JPG or PNG, up to 5MB" />
        <FileField name="cv_file" label="CV / Resume" accept="application/pdf" hint="PDF, up to 10MB" />
      </FormSection>

      {status === "error" && errorMessage && <p className="text-[13.5px] text-red-600">{errorMessage}</p>}

      <button type="submit" disabled={status === "submitting"} className="btn-primary w-full">
        {status === "submitting" ? "Submitting…" : "Submit registration"}
      </button>
    </form>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-[13.5px] font-bold uppercase tracking-[0.06em] text-muted dark:text-white/40 pt-2 first:pt-0">{title}</h3>
      {children}
    </div>
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

function TextAreaField({ name, label, rows = 4 }: { name: string; label: string; rows?: number }) {
  return (
    <div>
      <label className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">{label}</label>
      <textarea
        name={name}
        rows={rows}
        className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
      />
    </div>
  );
}

function SelectField({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <div>
      <label className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">{label}</label>
      <select
        name={name}
        defaultValue=""
        className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function FileField({ name, label, accept, hint }: { name: string; label: string; accept: string; hint: string }) {
  return (
    <div>
      <label className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">{label}</label>
      <input
        name={name}
        type="file"
        accept={accept}
        className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white text-[13.5px] file:mr-3 file:py-2 file:px-3 file:rounded-[8px] file:border-0 file:bg-lightblue dark:file:bg-teal/20 file:text-navy dark:file:text-white file:text-[12.5px] file:font-semibold"
      />
      <p className="text-[12px] text-muted dark:text-white/40 mt-1">{hint}</p>
    </div>
  );
}
