"use client";

import { useMemo, useState } from "react";
import RequestConnectionButton from "@/components/patient/RequestConnectionButton";

export type DirectoryProvider = {
  id: string;
  name: string;
  specialty: string | null;
  hospitalName: string;
  locationCount: number | null;
  status: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Request sent",
  ACTIVE: "Connected",
  DECLINED: "Request declined",
};

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted dark:text-white/50 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.has(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              aria-pressed={active}
              className={active ? "btn-chip-primary" : "btn-chip"}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ProviderDirectory({ providers }: { providers: DirectoryProvider[] }) {
  const [query, setQuery] = useState("");
  const [hospitals, setHospitals] = useState<Set<string>>(new Set());
  const [specialties, setSpecialties] = useState<Set<string>>(new Set());

  const hospitalOptions = useMemo(
    () => Array.from(new Set(providers.map((p) => p.hospitalName))).sort((a, b) => a.localeCompare(b)),
    [providers]
  );
  const specialtyOptions = useMemo(
    () =>
      Array.from(new Set(providers.map((p) => p.specialty).filter((s): s is string => !!s))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [providers]
  );

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    return providers.filter((p) => {
      if (hospitals.size > 0 && !hospitals.has(p.hospitalName)) return false;
      if (specialties.size > 0 && (!p.specialty || !specialties.has(p.specialty))) return false;
      if (q.length > 0) {
        const haystack = `${p.name} ${p.specialty ?? ""} ${p.hospitalName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [providers, hospitals, specialties, q]);

  const grouped = useMemo(() => {
    const map = new Map<string, DirectoryProvider[]>();
    for (const p of filtered) {
      const list = map.get(p.hospitalName) ?? [];
      list.push(p);
      map.set(p.hospitalName, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const hasActiveFilters = q.length > 0 || hospitals.size > 0 || specialties.size > 0;

  return (
    <div>
      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 mb-8 space-y-5">
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-muted dark:text-white/40 pointer-events-none"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, specialty, or hospital…"
            className="w-full rounded-[12px] border border-line dark:border-white/15 bg-white dark:bg-white/[0.04] text-navy dark:text-white text-[14.5px] pl-11 pr-4 py-3 outline-none transition focus:border-blue/50 focus:ring-2 focus:ring-blue/15 placeholder:text-muted dark:placeholder:text-white/40"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-8">
          <ChipGroup
            label="Hospital"
            options={hospitalOptions}
            selected={hospitals}
            onToggle={(v) => toggle(hospitals, setHospitals, v)}
          />
          <ChipGroup
            label="Specialty"
            options={specialtyOptions}
            selected={specialties}
            onToggle={(v) => toggle(specialties, setSpecialties, v)}
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setHospitals(new Set());
              setSpecialties(new Set());
            }}
            className="text-[12.5px] font-semibold text-blue hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[14px] border border-line dark:border-white/10 p-10 text-center">
          <p className="text-navy dark:text-white text-[14.5px] font-semibold mb-1">No providers match your search</p>
          <p className="text-muted dark:text-white/60 text-[13.5px]">Try a different name, specialty, or clear a filter.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(([hospitalName, providerList]) => (
            <section key={hospitalName}>
              <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted dark:text-white/60 mb-4">
                {hospitalName}
              </h2>
              <div className="space-y-2.5">
                {providerList.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-[14px] border border-line dark:border-white/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-[14.5px] font-semibold text-navy dark:text-white truncate">{p.name}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                        {p.specialty && <span className="text-[13px] text-muted dark:text-white/60">{p.specialty}</span>}
                        {p.specialty && p.locationCount !== null && (
                          <span className="text-muted/50 dark:text-white/20" aria-hidden="true">
                            ·
                          </span>
                        )}
                        {p.locationCount !== null && (
                          <span className="text-[12.5px] text-muted dark:text-white/50">
                            {p.locationCount} {p.locationCount === 1 ? "location" : "locations"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-none">
                      {p.status ? (
                        <span className="text-[12px] font-semibold text-muted dark:text-white/60 whitespace-nowrap">
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      ) : (
                        <RequestConnectionButton providerId={p.id} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
