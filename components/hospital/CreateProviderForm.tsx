"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { createProvider } from "@/lib/actions/providers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LocationOption = { id: string; name: string };

export default function CreateProviderForm({ locations }: { locations: LocationOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isValid = useMemo(() => name.trim().length > 0 && EMAIL_RE.test(email.trim()), [name, email]);

  function toggleLocation(id: string) {
    setLocationIds((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]));
  }

  function reset() {
    setName("");
    setEmail("");
    setSpecialty("");
    setLocationIds([]);
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
    formData.set("specialty", specialty.trim());
    locationIds.forEach((id) => formData.append("locations", id));

    const result = await createProvider(formData);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    setName("");
    setEmail("");
    setSpecialty("");
    setLocationIds([]);
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
        className="btn-primary"
      >
        + Create Provider
      </button>
    );
  }

  return (
    <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 mb-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[16px] font-semibold text-navy dark:text-white">Create provider</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[13px] text-muted dark:text-white/60 hover:text-navy dark:text-white transition"
        >
          Close
        </button>
      </div>

      {success ? (
        <div className="text-[14px] text-teal">
          Invitation sent. The provider will appear below once they finish setup.
          <div className="mt-4">
            <button type="button" onClick={() => setOpen(false)} className="btn-primary">
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="prov-name" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
              Provider name
            </label>
            <input
              id="prov-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>

          <div>
            <label htmlFor="prov-email" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
              Email
            </label>
            <input
              id="prov-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            />
            <p className="text-[12px] text-muted dark:text-white/60 mt-1.5">
              The invitation to set up an account will be sent here.
            </p>
          </div>

          <div>
            <label htmlFor="prov-specialty" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
              Specialty
            </label>
            <input
              id="prov-specialty"
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>

          <div>
            <span className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
              Locations{" "}
              {locationIds.length > 0 && (
                <span className="text-muted dark:text-white/60 font-normal">({locationIds.length} selected)</span>
              )}
            </span>
            {locations.length === 0 ? (
              <p className="text-[13px] text-muted dark:text-white/60">Create a location first to assign providers to it.</p>
            ) : (
              <div className="max-h-[180px] overflow-y-auto rounded-[10px] border border-line dark:border-white/10 p-3 space-y-2">
                {locations.map((loc) => (
                  <label key={loc.id} className="flex items-center gap-2 text-[13px] text-ink dark:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={locationIds.includes(loc.id)}
                      onChange={() => toggleLocation(loc.id)}
                      className="rounded border-line dark:border-white/10 accent-blue"
                    />
                    {loc.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="text-[13.5px] text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!isValid || submitting}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating…" : "Create Provider"}
          </button>
        </form>
      )}
    </div>
  );
}
