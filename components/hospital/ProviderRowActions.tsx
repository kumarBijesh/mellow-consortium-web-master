"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { updateProviderDetails, deleteProvider } from "@/lib/actions/providers";

export default function ProviderRowActions({ providerId, name, specialty }: { providerId: string; name: string; specialty: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await updateProviderDetails(providerId, new FormData(e.currentTarget));
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleRemove() {
    if (!window.confirm(`Remove ${name} from your hospital? This can't be undone.`)) return;
    setRemoving(true);
    const result = await deleteProvider(providerId);
    setRemoving(false);
    if (result.error) {
      window.alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => setEditing(true)} className="btn-chip">
        Edit
      </button>
      <button type="button" onClick={handleRemove} disabled={removing} className="btn-chip-danger disabled:opacity-40">
        {removing ? "Removing…" : "Remove"}
      </button>

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={() => setEditing(false)}>
          <div
            className="w-full max-w-[420px] rounded-2xl bg-white dark:bg-[#12171f] border border-line dark:border-white/10 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[18px] font-display font-bold text-navy dark:text-white mb-5">Edit provider</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-navy dark:text-white mb-1.5">Name</label>
                <input
                  name="name"
                  required
                  defaultValue={name}
                  className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-navy dark:text-white mb-1.5">Specialty</label>
                <input
                  name="specialty"
                  defaultValue={specialty ?? ""}
                  className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue"
                />
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
    </div>
  );
}
