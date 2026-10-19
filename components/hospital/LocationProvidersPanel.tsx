"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { assignProviderToLocation, removeProviderFromLocation } from "@/lib/actions/providers";

type Provider = { id: string; name: string; email: string; status: string };

export default function LocationProvidersPanel({
  locationId,
  assignedProviders,
  availableProviders,
}: {
  locationId: string;
  assignedProviders: Provider[];
  availableProviders: Provider[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAssign() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const result = await assignProviderToLocation(selected, locationId);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSelected("");
    router.refresh();
  }

  async function handleRemove(providerId: string) {
    setBusy(true);
    setError(null);
    const result = await removeProviderFromLocation(providerId, locationId);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden overflow-x-auto mb-5">
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-line dark:border-white/10 text-[11px] uppercase tracking-[0.06em] text-muted dark:text-white/60">
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold sr-only">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignedProviders.map((p) => (
              <tr key={p.id} className="border-b border-line dark:border-white/10 last:border-0">
                <td className="px-5 py-3 text-navy dark:text-white font-medium">{p.name}</td>
                <td className="px-5 py-3 text-muted dark:text-white/60">{p.email}</td>
                <td className="px-5 py-3 text-muted dark:text-white/60">{p.status.replaceAll("_", " ")}</td>
                <td className="px-5 py-3 text-right">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleRemove(p.id)}
                    className="btn-chip-danger disabled:opacity-40"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {assignedProviders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-muted dark:text-white/60">
                  No providers assigned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {availableProviders.length > 0 && (
        <div className="flex items-center gap-2.5">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded-[10px] border border-line dark:border-white/10 px-3.5 py-2.5 text-[13.5px] bg-white dark:bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-blue"
          >
            <option value="">Assign a provider…</option>
            {availableProviders.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.email})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selected || busy}
            onClick={handleAssign}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Assign
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-[13.5px] text-red-600 mt-3">
          {error}
        </p>
      )}
    </div>
  );
}
