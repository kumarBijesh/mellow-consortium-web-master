"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { createLocation } from "@/lib/actions/locations";
import { COUNTRIES } from "@/lib/countries";

export default function CreateLocationForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateProvince, setStateProvince] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isValid = useMemo(() => name.trim().length > 0 && country.trim().length > 0, [name, country]);

  function reset() {
    setName("");
    setAddress("");
    setCity("");
    setStateProvince("");
    setCountry("");
    setPostalCode("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("address", address.trim());
    formData.set("city", city.trim());
    formData.set("state_province", stateProvince.trim());
    formData.set("country", country.trim());
    formData.set("postal_code", postalCode.trim());

    const result = await createLocation(formData);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    reset();
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        + Create Location
      </button>
    );
  }

  return (
    <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 mb-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[16px] font-semibold text-navy dark:text-white">Create location</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[13px] text-muted dark:text-white/60 hover:text-navy dark:text-white transition"
        >
          Close
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="loc-name" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
            Location name
          </label>
          <input
            id="loc-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>

        <div>
          <label htmlFor="loc-address" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
            Address
          </label>
          <input
            id="loc-address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="loc-city" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
              City
            </label>
            <input
              id="loc-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>
          <div>
            <label htmlFor="loc-state" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
              State / Province
            </label>
            <input
              id="loc-state"
              type="text"
              value={stateProvince}
              onChange={(e) => setStateProvince(e.target.value)}
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="loc-country" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
              Country
            </label>
            <select
              id="loc-country"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-[10px] border border-line dark:border-white/10 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue bg-white dark:bg-white/[0.03]"
            >
              <option value="" disabled>
                Select…
              </option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="loc-postal" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
              Postal code
            </label>
            <input
              id="loc-postal"
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>
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
          {submitting ? "Creating…" : "Create Location"}
        </button>
      </form>
    </div>
  );
}
