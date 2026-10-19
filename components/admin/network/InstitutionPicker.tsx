"use client";

import { useState, type KeyboardEvent } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { REGIONS } from "@/lib/network-constants";
import { quickCreateInstitution, type InstitutionOption } from "@/lib/actions/institutions";

type Prefill = { name?: string; country?: string };

// Quick "new institute" step. Deliberately NOT a <form>: it renders inside
// the investigator <form>, and HTML forbids nested forms. Its inputs also
// have no `name`, so submitting the outer form never sends them.
function QuickInstitutionPanel({
  prefill,
  compact = false,
  onCreated,
  onCancel,
}: {
  prefill?: Prefill;
  compact?: boolean;
  onCreated: (institution: InstitutionOption, existing: boolean) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(prefill?.name ?? "");
  const [country, setCountry] = useState(prefill?.country ?? "");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim() || !country.trim()) {
      setError("Name and country are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await quickCreateInstitution({ name, country, city, region });
    setSaving(false);
    if (result.error || !result.institution) {
      setError(result.error ?? "Could not create institute.");
      return;
    }
    onCreated(result.institution, !!result.existing);
  }

  // Enter would otherwise submit the surrounding investigator form.
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void save();
    }
  }

  const input = `adm-input${compact ? " !py-1.5 !text-[12.5px]" : ""}`;

  return (
    <div className="rounded-xl border border-teal/30 bg-teal/[0.04] p-4 space-y-3 text-left">
      <p className="text-[11px] font-semibold text-muted dark:text-white/50 uppercase tracking-wide">New institute</p>
      <div>
        <label className="adm-label">Name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={onKeyDown} className={input} autoFocus />
      </div>
      <div>
        <label className="adm-label">Country *</label>
        <input value={country} onChange={(e) => setCountry(e.target.value)} onKeyDown={onKeyDown} className={input} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="adm-label">City</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} onKeyDown={onKeyDown} className={input} />
        </div>
        <div>
          <label className="adm-label">Region</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className={input}>
            <option value="" className="bg-[#0d1117]"></option>
            {REGIONS.map((r) => (
              <option key={r} value={r} className="bg-[#0d1117]">
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-[12px] text-red-400">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-[12px] text-muted dark:text-white/40 hover:text-ink dark:hover:text-white transition px-2"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="adm-btn-primary !py-1.5 !px-3 !text-[12.5px] disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save institute"}
        </button>
      </div>
    </div>
  );
}

// Institution dropdown + inline "+ Add institute". A newly created (or
// matched duplicate) institute is added to the options and selected.
export default function InstitutionPicker({
  institutions,
  name = "institution_id",
  label = "Institution",
  defaultValue = "",
  onChange,
  prefill,
  compact = false,
}: {
  institutions: InstitutionOption[];
  name?: string;
  label?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  prefill?: Prefill;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState(defaultValue);
  const [added, setAdded] = useState<InstitutionOption[]>([]);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Server revalidation may already include the new row in `institutions`;
  // merge by id so it isn't listed twice.
  const known = new Set(institutions.map((i) => i.id));
  const options = [...institutions, ...added.filter((i) => !known.has(i.id))].sort((a, b) => a.name.localeCompare(b.name));
  const addedIds = new Set(added.map((i) => i.id));

  function select(id: string) {
    setSelected(id);
    onChange?.(id);
  }

  function handleCreated(institution: InstitutionOption, existing: boolean) {
    if (!existing) setAdded((prev) => [...prev, institution]);
    select(institution.id);
    setAdding(false);
    setNotice(existing ? `"${institution.name}" already exists, so it's been selected.` : null);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <label htmlFor={name} className={compact ? "text-[11px] font-semibold text-muted dark:text-white/50 uppercase tracking-wide" : "adm-label"}>
          {label}
        </label>
        {!adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setNotice(null);
            }}
            className="text-[12px] font-semibold text-teal hover:text-ink dark:hover:text-white transition mb-1.5"
          >
            + Add institute
          </button>
        )}
      </div>
      <select
        id={name}
        name={name}
        value={selected}
        onChange={(e) => {
          select(e.target.value);
          setNotice(null);
        }}
        className={`adm-input${compact ? " !py-1.5 !text-[12.5px] min-w-[240px]" : ""}`}
      >
        <option value="" className="bg-[#0d1117]">
          Select institution…
        </option>
        {options.map((i) => (
          <option key={i.id} value={i.id} className="bg-[#0d1117]">
            {i.name}
            {addedIds.has(i.id) ? " (new)" : ""}
          </option>
        ))}
      </select>
      {notice && <p className="text-[12px] text-teal">{notice}</p>}
      {adding && (
        <QuickInstitutionPanel prefill={prefill} compact={compact} onCreated={handleCreated} onCancel={() => setAdding(false)} />
      )}
    </div>
  );
}

// Standalone "+ Add institute" at the top of the Institutions list.
export function AddInstituteButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<{ institution: InstitutionOption; existing: boolean } | null>(null);

  if (!open) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setCreated(null);
          }}
          className="adm-btn-primary !py-2 !px-4 !text-[13px]"
        >
          + Add institute
        </button>
        {created && (
          <p className="text-[12.5px] text-teal">
            {created.existing ? `"${created.institution.name}" already exists. ` : `Created "${created.institution.name}". `}
            <Link href={`/admin/network/institutions/${created.institution.id}`} className="underline">
              {created.existing ? "Open it" : "Add map coordinates and details"}
            </Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[460px]">
      <QuickInstitutionPanel
        onCreated={(institution, existing) => {
          setCreated({ institution, existing });
          setOpen(false);
          router.refresh();
        }}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
