"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { createHospital } from "@/lib/actions/hospitals";
import { COUNTRIES } from "@/lib/countries";
import { HospitalsIcon } from "@/components/admin/AdminIcons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreateHospitalForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isValid = useMemo(
    () => name.trim().length > 0 && EMAIL_RE.test(email.trim()) && countries.length > 0,
    [name, email, countries]
  );

  function toggleCountry(country: string) {
    setCountries((prev) => (prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]));
  }

  function reset() {
    setName("");
    setEmail("");
    setPhone("");
    setCountries([]);
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("email", email.trim());
    formData.set("phone", phone.trim());
    countries.forEach((c) => formData.append("countries", c));

    const result = await createHospital(formData);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          reset();
        }}
        className="adm-btn-primary"
      >
        + Add hospital
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#12171f] border border-line dark:border-white/10 p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-display font-bold text-ink dark:text-white">Add hospital</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="w-8 h-8 rounded-lg grid place-items-center text-muted dark:text-white/40 hover:bg-lightblue dark:hover:bg-white/10 hover:text-ink dark:hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="text-[14px] text-teal">
            Invitation sent. The hospital will appear in the list once they finish setup.
            <div className="mt-4">
              <button type="button" onClick={() => setOpen(false)} className="adm-btn-primary">
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="hospital-name" className="adm-label">
                Hospital / organisation name
              </label>
              <input
                id="hospital-name"
                type="text"
                required
                placeholder="e.g. Tampa Bay Medical Center"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="adm-input"
              />
            </div>

            <div>
              <label htmlFor="hospital-email" className="adm-label">
                Admin email address
              </label>
              <input
                id="hospital-email"
                type="email"
                required
                placeholder="admin@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="adm-input"
              />
              <p className="text-[12px] text-muted dark:text-white/35 mt-1.5">
                This becomes the hospital&apos;s sign-in email. They will receive an email to set their password.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="adm-label">
                  Countries {countries.length > 0 && <span className="text-muted dark:text-white/35 font-normal">({countries.length})</span>}
                </span>
                <div className="max-h-[160px] overflow-y-auto rounded-xl border border-line dark:border-white/10 bg-white dark:bg-white/[0.02] p-3 grid grid-cols-2 gap-x-3 gap-y-2">
                  {COUNTRIES.map((country) => (
                    <label key={country} className="flex items-center gap-2 text-[12.5px] text-muted dark:text-white/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={countries.includes(country)}
                        onChange={() => toggleCountry(country)}
                        className="rounded border-line dark:border-white/20 accent-teal"
                      />
                      {country}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="hospital-phone" className="adm-label">
                  Phone (optional)
                </label>
                <input
                  id="hospital-phone"
                  type="tel"
                  placeholder="+1 (800) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="adm-input"
                />
              </div>
            </div>

            <div className="rounded-xl bg-teal/10 dark:bg-teal/[0.08] border border-teal/20 p-4">
              <p className="text-[13px] font-semibold text-ink dark:text-white mb-2">How it works:</p>
              <ol className="text-[12.5px] text-muted dark:text-white/60 space-y-1 list-decimal list-inside">
                <li>A hospital account is created in the system immediately.</li>
                <li>A password-reset email is sent to the admin email so they can set their own password.</li>
                <li>Once they sign in, they manage their own locations and providers.</li>
              </ol>
            </div>

            {error && (
              <p role="alert" className="text-[13.5px] text-red-300">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={!isValid || submitting} className="adm-btn-primary">
                <HospitalsIcon className="w-4 h-4" />
                {submitting ? "Creating…" : "Create hospital"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="adm-btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
