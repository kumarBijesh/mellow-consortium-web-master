"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { createMellowMember, verifyAdminSession, type InviteDelivery } from "@/lib/actions/mellow-members";
import InviteDeliveryNotice from "@/components/admin/InviteDeliveryNotice";
import { COUNTRIES } from "@/lib/countries";
import {
  SALUTATIONS,
  PROFILE_IMAGE_MAX_BYTES,
  CV_MAX_BYTES,
  isValidUrl,
  splitCommaList,
  splitLines,
} from "@/lib/investigator-registration-constants";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A server action resolves to undefined when middleware redirects it to
// /admin/login (expired session, or this browser is now signed in as
// someone else), so "no result" is treated as a session problem.
const SESSION_LOST =
  "Your admin session has expired or changed. Sign in again in another tab, then press Create again. Your entries are still here.";

// The reference form had 4 steps; "Permissions & Access Control" is
// dropped for v1 because almost none of its toggles map to a real
// provider-dashboard feature, and the globe-visibility toggle is dropped
// from Location because the public globe only plots institutions.
const STEPS = ["Identity & Affiliation", "Location", "Professional Profile"] as const;

type Values = {
  salutation: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  street_address: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  specialty: string;
  bio: string;
  credentials: string;
  core_competencies: string;
  professional_background: string;
  publications: string;
  linkedin_url: string;
  website_url: string;
};

const EMPTY: Values = {
  salutation: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  email: "",
  street_address: "",
  city: "",
  state_province: "",
  postal_code: "",
  country: "",
  specialty: "",
  bio: "",
  credentials: "",
  core_competencies: "",
  professional_background: "",
  publications: "",
  linkedin_url: "",
  website_url: "",
};

export default function AddMellowMemberWizard({ orgName }: { orgName: string }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(EMPTY);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ email: string; delivery: InviteDelivery } | null>(null);

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function validateStep(index: number): string | null {
    if (index === 0) {
      if (!values.first_name.trim() || !values.last_name.trim()) return "First and last name are required.";
      if (!EMAIL_RE.test(values.email.trim())) return "Enter a valid email address.";
    }
    if (index === 2) {
      if (values.linkedin_url.trim() && !isValidUrl(values.linkedin_url.trim())) return "LinkedIn URL isn't a valid URL.";
      if (values.website_url.trim() && !isValidUrl(values.website_url.trim())) return "Website URL isn't a valid URL.";
      if (profileImage) {
        if (!profileImage.type.startsWith("image/")) return "Profile image must be an image file.";
        if (profileImage.size > PROFILE_IMAGE_MAX_BYTES) return "Profile image must be 5MB or smaller.";
      }
      if (cvFile) {
        if (cvFile.type !== "application/pdf") return "CV / Resume must be a PDF file.";
        if (cvFile.size > CV_MAX_BYTES) return "CV / Resume must be 10MB or smaller.";
      }
    }
    return null;
  }

  function next() {
    const problem = validateStep(step);
    setError(problem);
    if (!problem) setStep((s) => s + 1);
  }

  async function upload(bucket: string, file: File): Promise<string> {
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error: uploadError } = await createClient().storage.from(bucket).upload(path, file);
    if (uploadError) throw new Error(uploadError.message);
    return path;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < STEPS.length - 1) return next();

    const problem = validateStep(0) ?? validateStep(2);
    if (problem) return setError(problem);

    setSubmitting(true);
    setError(null);

    // Check the session before uploading, so an expired session can't
    // leave orphaned files in Storage.
    let session: { ok: boolean } | undefined;
    try {
      session = await verifyAdminSession();
    } catch (err) {
      console.error("[AddMellowMemberWizard] session check failed:", err);
    }
    if (!session?.ok) {
      setSubmitting(false);
      setError(SESSION_LOST);
      return;
    }

    let profile_image_path: string | null = null;
    let cv_path: string | null = null;
    try {
      if (profileImage) profile_image_path = await upload("provider-profile-images", profileImage);
      if (cvFile) cv_path = await upload("provider-cvs", cvFile);
    } catch (err) {
      setSubmitting(false);
      setError(`Could not upload file: ${(err as Error).message}`);
      return;
    }

    const trimmed = (key: keyof Values) => values[key].trim() || null;
    let result: Awaited<ReturnType<typeof createMellowMember>> | undefined;
    try {
      result = await createMellowMember({
        salutation: trimmed("salutation"),
        first_name: values.first_name,
        middle_name: trimmed("middle_name"),
        last_name: values.last_name,
        email: values.email,
        street_address: trimmed("street_address"),
        city: trimmed("city"),
        state_province: trimmed("state_province"),
        postal_code: trimmed("postal_code"),
        country: trimmed("country"),
        specialty: trimmed("specialty"),
        bio: trimmed("bio"),
        credentials: trimmed("credentials"),
        core_competencies: splitCommaList(values.core_competencies),
        professional_background: trimmed("professional_background"),
        publications: splitLines(values.publications),
        linkedin_url: trimmed("linkedin_url"),
        website_url: trimmed("website_url"),
        profile_image_path,
        cv_path,
      });
    } catch (err) {
      console.error("[AddMellowMemberWizard] createMellowMember threw:", err);
    }
    setSubmitting(false);

    if (!result) {
      console.error("[AddMellowMemberWizard] createMellowMember returned no result (request likely redirected to login)");
      return setError(SESSION_LOST);
    }
    if (result.error || !result.delivery) return setError(result.error ?? "Something went wrong. Please try again.");
    setCreated({ email: values.email.trim().toLowerCase(), delivery: result.delivery });
  }

  if (created) {
    return (
      <div className="adm-card p-7 max-w-[720px]">
        <h2 className="text-[20px] font-display font-bold text-ink dark:text-white mb-2">Mellow Member created</h2>
        <p className="text-[14px] text-muted dark:text-white/60 mb-4">
          {created.email} shows as Pending setup until they set their password, then they sign in to the provider
          dashboard.
        </p>
        <InviteDeliveryNotice delivery={created.delivery} email={created.email} />
        <div className="flex gap-3 mt-6">
          <Link href="/admin/mellow-members" className="adm-btn-primary">
            Back to Mellow Members
          </Link>
          <button
            type="button"
            className="adm-btn-ghost"
            onClick={() => {
              setValues(EMPTY);
              setProfileImage(null);
              setCvFile(null);
              setStep(0);
              setCreated(null);
            }}
          >
            Add another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="adm-card p-7 max-w-[720px]" noValidate>
      <ol className="flex flex-wrap gap-2 mb-7" aria-label="Steps">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold ${
              i === step
                ? "bg-teal/15 text-teal"
                : i < step
                  ? "text-ink dark:text-white/70"
                  : "text-muted dark:text-white/35"
            }`}
          >
            <span className="w-5 h-5 rounded-full grid place-items-center text-[11px] border border-current">{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4">
            <Select label="Salutation" value={values.salutation} onChange={set("salutation")} options={[...SALUTATIONS]} />
            <Input label="Personal email" type="email" required value={values.email} onChange={set("email")} hint="Becomes their sign-in email. They'll get an invite to set a password." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="First name" required value={values.first_name} onChange={set("first_name")} />
            <Input label="Middle name" value={values.middle_name} onChange={set("middle_name")} />
            <Input label="Last name" required value={values.last_name} onChange={set("last_name")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnly label="Access tier" value="Mellow Member · Provider" />
            <ReadOnly label="Institution / affiliation" value={orgName} />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <Input label="Street address" value={values.street_address} onChange={set("street_address")} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="City" value={values.city} onChange={set("city")} />
            <Input label="State / province" value={values.state_province} onChange={set("state_province")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Country" value={values.country} onChange={set("country")} options={COUNTRIES} />
            <Input label="Postal / ZIP code" value={values.postal_code} onChange={set("postal_code")} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <Input label="Department / focus area" value={values.specialty} onChange={set("specialty")} />
          <TextArea label="Professional biography" rows={4} value={values.bio} onChange={set("bio")} />
          <TextArea label="Qualifications / credentials" rows={3} value={values.credentials} onChange={set("credentials")} />
          <Input label="Core competencies" hint="Comma-separated" value={values.core_competencies} onChange={set("core_competencies")} />
          <TextArea label="Full professional background" rows={5} value={values.professional_background} onChange={set("professional_background")} />
          <TextArea label="Selected publications" hint="One per line" rows={4} value={values.publications} onChange={set("publications")} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="LinkedIn URL" type="url" value={values.linkedin_url} onChange={set("linkedin_url")} />
            <Input label="Website URL" type="url" value={values.website_url} onChange={set("website_url")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FileInput label="Profile image" hint="JPG or PNG, up to 5MB" accept="image/*" file={profileImage} onChange={setProfileImage} />
            <FileInput label="CV / resume" hint="PDF, up to 10MB" accept="application/pdf" file={cvFile} onChange={setCvFile} />
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-[13.5px] text-red-400 mt-5">
          {error}
        </p>
      )}

      <div className="flex gap-3 mt-7">
        {step > 0 && (
          <button type="button" onClick={() => (setError(null), setStep((s) => s - 1))} className="adm-btn-ghost" disabled={submitting}>
            Back
          </button>
        )}
        <button type="submit" className="adm-btn-primary" disabled={submitting}>
          {step < STEPS.length - 1 ? "Next" : submitting ? "Creating…" : "Create & send invite"}
        </button>
      </div>
    </form>
  );
}

type FieldProps = { label: string; hint?: string; required?: boolean };

function Label({ label, required }: FieldProps) {
  return (
    <>
      {label}
      {required && <span className="text-teal"> *</span>}
    </>
  );
}

function Hint({ hint }: { hint?: string }) {
  return hint ? <p className="text-[12px] text-muted dark:text-white/35 mt-1.5">{hint}</p> : null;
}

function Input({
  label,
  hint,
  required,
  type = "text",
  value,
  onChange,
}: FieldProps & { type?: string; value: string; onChange: React.ChangeEventHandler<HTMLInputElement> }) {
  return (
    <label className="block">
      <span className="adm-label">
        <Label label={label} required={required} />
      </span>
      <input type={type} value={value} onChange={onChange} required={required} className="adm-input" />
      <Hint hint={hint} />
    </label>
  );
}

function TextArea({
  label,
  hint,
  rows,
  value,
  onChange,
}: FieldProps & { rows: number; value: string; onChange: React.ChangeEventHandler<HTMLTextAreaElement> }) {
  return (
    <label className="block">
      <span className="adm-label">{label}</span>
      <textarea rows={rows} value={value} onChange={onChange} className="adm-input" />
      <Hint hint={hint} />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: FieldProps & { value: string; onChange: React.ChangeEventHandler<HTMLSelectElement>; options: readonly string[] }) {
  return (
    <label className="block">
      <span className="adm-label">{label}</span>
      <select value={value} onChange={onChange} className="adm-input">
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="adm-label">{label}</span>
      <div className="adm-input opacity-70 cursor-not-allowed" aria-readonly="true">
        {value}
      </div>
    </div>
  );
}

function FileInput({
  label,
  hint,
  accept,
  file,
  onChange,
}: FieldProps & { accept: string; file: File | null; onChange: (file: File | null) => void }) {
  return (
    <label className="block">
      <span className="adm-label">{label}</span>
      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="block w-full text-[13px] text-muted dark:text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-teal/15 file:px-3 file:py-2 file:text-teal file:font-semibold"
      />
      <Hint hint={file ? file.name : hint} />
    </label>
  );
}
