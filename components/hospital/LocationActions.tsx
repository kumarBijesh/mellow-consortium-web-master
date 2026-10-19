"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { updateLocation, deleteLocation } from "@/lib/actions/locations";
import { COUNTRIES } from "@/lib/countries";

type Location = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state_province: string | null;
  country: string;
  postal_code: string | null;
};

export default function LocationActions({ location }: { location: Location }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await updateLocation(location.id, new FormData(e.currentTarget));
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${location.name}"? Providers assigned here will be unassigned. This can't be undone.`)) return;
    setDeleting(true);
    const result = await deleteLocation(location.id);
    setDeleting(false);
    if (result.error) {
      window.alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setEditing(true)} className="btn-chip">
          Edit
        </button>
        <button type="button" onClick={handleDelete} disabled={deleting} className="btn-chip-danger disabled:opacity-40">
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={() => setEditing(false)}>
          <div
            className="w-full max-w-[480px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#12171f] border border-line dark:border-white/10 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[18px] font-display font-bold text-navy dark:text-white mb-5">Edit location</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-navy dark:text-white mb-1.5">Name</label>
                <input
                  name="name"
                  required
                  defaultValue={location.name}
                  className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-navy dark:text-white mb-1.5">Address</label>
                <input
                  name="address"
                  defaultValue={location.address ?? ""}
                  className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-navy dark:text-white mb-1.5">City</label>
                  <input
                    name="city"
                    defaultValue={location.city ?? ""}
                    className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-navy dark:text-white mb-1.5">State/Province</label>
                  <input
                    name="state_province"
                    defaultValue={location.state_province ?? ""}
                    className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-navy dark:text-white mb-1.5">Country</label>
                  <select
                    name="country"
                    required
                    defaultValue={location.country}
                    className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-navy dark:text-white mb-1.5">Postal code</label>
                  <input
                    name="postal_code"
                    defaultValue={location.postal_code ?? ""}
                    className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue"
                  />
                </div>
              </div>
              {error && <p className="text-[13px] text-red-600">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={submitting} className="btn-primary !px-4 !py-2.5 text-[14px]">
                  {submitting ? "Saving…" : "Save changes"}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary !px-4 !py-2.5 text-[14px]">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
