"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { assignProviderToLocation, removeProviderFromLocation } from "@/lib/actions/providers";

type Location = { id: string; name: string };

export default function ProviderLocationsPanel({
  providerId,
  allLocations,
  assignedLocationIds,
}: {
  providerId: string;
  allLocations: Location[];
  assignedLocationIds: string[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const assigned = new Set(assignedLocationIds);

  async function handleToggle(locationId: string, checked: boolean) {
    setPending(locationId);
    setError(null);
    const result = checked
      ? await assignProviderToLocation(providerId, locationId)
      : await removeProviderFromLocation(providerId, locationId);
    setPending(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (allLocations.length === 0) {
    return <p className="text-[13.5px] text-muted dark:text-white/60">No locations to assign yet.</p>;
  }

  return (
    <div>
      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 space-y-2.5">
        {allLocations.map((loc) => (
          <label key={loc.id} className="flex items-center gap-2.5 text-[13.5px] text-ink dark:text-white cursor-pointer">
            <input
              type="checkbox"
              checked={assigned.has(loc.id)}
              disabled={pending === loc.id}
              onChange={(e) => handleToggle(loc.id, e.target.checked)}
              className="rounded border-line dark:border-white/10 accent-blue"
            />
            {loc.name}
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-[13.5px] text-red-600 mt-3">
          {error}
        </p>
      )}
    </div>
  );
}
