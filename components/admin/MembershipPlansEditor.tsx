"use client";

import { useState } from "react";
import { saveMembershipPlans } from "@/lib/actions/membership-plans";
import type { CellValue, MembershipPlans, MembershipTier, TierKind } from "@/lib/membership-plans";

// Rows created here get a "new-" id until saved (see lib/actions/membership-plans.ts).
const newId = () => `new-${crypto.randomUUID()}`;

function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

// Cell cycle: included (✓) -> custom text -> not included (—) -> ✓
function nextCell(value: CellValue): CellValue {
  if (value === true) return "";
  if (typeof value === "string") return false;
  return true;
}

export default function MembershipPlansEditor({ initial }: { initial: MembershipPlans }) {
  const [saved, setSaved] = useState(initial); // last state known to be in the DB (for Discard)
  const [plans, setPlans] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const sponsorTiers = plans.tiers.filter((t) => t.kind === "sponsor");

  function update(fn: (p: MembershipPlans) => MembershipPlans) {
    setPlans(fn);
    setDirty(true);
    setSavedAt(null);
  }

  function updateTier(id: string, patch: Partial<MembershipTier>) {
    update((p) => ({ ...p, tiers: p.tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  }

  function updateSection(sectionId: string, fn: (s: MembershipPlans["sections"][number]) => MembershipPlans["sections"][number]) {
    update((p) => ({ ...p, sections: p.sections.map((s) => (s.id === sectionId ? fn(s) : s)) }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const result = await saveMembershipPlans(plans);
    setSaving(false);
    if (result.error || !result.plans) {
      setError(result.error ?? "Save failed.");
      return;
    }
    setSaved(result.plans);
    setPlans(result.plans);
    setDirty(false);
    setSavedAt(new Date());
  }

  return (
    <div className="space-y-8 pb-24">
      {/* ---------------- Tiers ---------------- */}
      <section className="adm-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-semibold text-ink dark:text-white">Tiers</h2>
            <p className="text-[12.5px] text-muted dark:text-white/40">
              Sponsor tiers are the comparison-table columns. Individual tiers show as a separate card below the table.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              update((p) => ({
                ...p,
                tiers: [
                  ...p.tiers,
                  { id: newId(), slug: "", name: "", price_label: "", kind: "sponsor", description: null, cta_label: null, is_featured: false },
                ],
              }))
            }
            className="text-[12.5px] font-semibold text-teal hover:text-ink dark:hover:text-white transition"
          >
            + Add tier
          </button>
        </div>

        <div className="space-y-3">
          {plans.tiers.map((tier, i) => (
            <div key={tier.id} className="rounded-xl border border-line dark:border-white/10 p-4">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_150px_1fr] gap-3">
                <div>
                  <label className="adm-label">Name</label>
                  <input value={tier.name} onChange={(e) => updateTier(tier.id, { name: e.target.value })} className="adm-input" />
                </div>
                <div>
                  <label className="adm-label">Price</label>
                  <input
                    value={tier.price_label}
                    placeholder="$65K"
                    onChange={(e) => updateTier(tier.id, { price_label: e.target.value })}
                    className="adm-input"
                  />
                </div>
                <div>
                  <label className="adm-label">Type</label>
                  <select
                    value={tier.kind}
                    onChange={(e) => updateTier(tier.id, { kind: e.target.value as TierKind })}
                    className="adm-input"
                  >
                    <option value="sponsor" className="bg-[#0d1117]">Sponsor</option>
                    <option value="individual" className="bg-[#0d1117]">Individual</option>
                  </select>
                </div>
                <div>
                  <label className="adm-label">Button text</label>
                  <input
                    value={tier.cta_label ?? ""}
                    placeholder="Get started"
                    onChange={(e) => updateTier(tier.id, { cta_label: e.target.value })}
                    className="adm-input"
                  />
                </div>
              </div>

              {tier.kind === "individual" && (
                <div className="mt-3">
                  <label className="adm-label">Description</label>
                  <textarea
                    value={tier.description ?? ""}
                    rows={2}
                    onChange={(e) => updateTier(tier.id, { description: e.target.value })}
                    className="adm-input"
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                {tier.kind === "sponsor" ? (
                  <label className="flex items-center gap-2 text-[12.5px] text-muted dark:text-white/60">
                    <input
                      type="checkbox"
                      checked={tier.is_featured}
                      onChange={(e) => updateTier(tier.id, { is_featured: e.target.checked })}
                    />
                    Highlight this column
                  </label>
                ) : (
                  <span />
                )}
                <RowControls
                  onUp={() => update((p) => ({ ...p, tiers: move(p.tiers, i, -1) }))}
                  onDown={() => update((p) => ({ ...p, tiers: move(p.tiers, i, 1) }))}
                  onDelete={() => update((p) => ({ ...p, tiers: p.tiers.filter((t) => t.id !== tier.id) }))}
                  deleteLabel="Delete tier"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Benefits grid ---------------- */}
      <section className="adm-card p-5">
        <div className="mb-4">
          <h2 className="text-[15px] font-semibold text-ink dark:text-white">Benefits</h2>
          <p className="text-[12.5px] text-muted dark:text-white/40">
            Click a cell to cycle: <b>✓</b> included → <b>text</b> (e.g. &quot;Comp.&quot;, &quot;40–50%&quot;; empty text saves as ✓) → <b>—</b> not
            included.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[720px] text-[13px]">
            <thead>
              <tr>
                <th className="text-left px-2 py-2 text-muted dark:text-white/50 font-semibold">Benefit</th>
                {sponsorTiers.map((t) => (
                  <th key={t.id} className="px-2 py-2 text-center text-ink dark:text-white font-semibold w-[110px]">
                    {t.name || <span className="text-muted dark:text-white/30">(unnamed)</span>}
                  </th>
                ))}
                <th className="w-[120px]" />
              </tr>
            </thead>
            <tbody>
              {plans.sections.map((section, si) => (
                <SectionRows
                  key={section.id}
                  section={section}
                  sponsorTierIds={sponsorTiers.map((t) => t.id)}
                  onTitle={(title) => updateSection(section.id, (s) => ({ ...s, title }))}
                  onUp={() => update((p) => ({ ...p, sections: move(p.sections, si, -1) }))}
                  onDown={() => update((p) => ({ ...p, sections: move(p.sections, si, 1) }))}
                  onDelete={() => update((p) => ({ ...p, sections: p.sections.filter((s) => s.id !== section.id) }))}
                  onChangeBenefits={(fn) => updateSection(section.id, (s) => ({ ...s, benefits: fn(s.benefits) }))}
                />
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={() => update((p) => ({ ...p, sections: [...p.sections, { id: newId(), title: "", benefits: [] }] }))}
          className="mt-4 text-[12.5px] font-semibold text-teal hover:text-ink dark:hover:text-white transition"
        >
          + Add section
        </button>
      </section>

      {/* ---------------- Save bar ---------------- */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-line dark:border-white/10 bg-white/95 dark:bg-[#0d1117]/95 backdrop-blur">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-end gap-4">
          {error && <p className="text-[12.5px] text-red-400 font-mono break-all flex-1">{error}</p>}
          {!error && dirty && <p className="text-[12.5px] text-amber-500 flex-1">Unsaved changes</p>}
          {!error && !dirty && savedAt && <p className="text-[12.5px] text-teal flex-1">Saved. /membership-plans is updated.</p>}
          {dirty && (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setPlans(saved);
                setDirty(false);
                setError(null);
              }}
              className="text-[12.5px] text-muted dark:text-white/40 hover:text-ink dark:hover:text-white transition"
            >
              Discard
            </button>
          )}
          <button type="button" disabled={saving || !dirty} onClick={save} className="adm-btn-primary !py-2 !px-5 disabled:opacity-40">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

type Section = MembershipPlans["sections"][number];
type Benefit = Section["benefits"][number];

function SectionRows({
  section,
  sponsorTierIds,
  onTitle,
  onUp,
  onDown,
  onDelete,
  onChangeBenefits,
}: {
  section: Section;
  sponsorTierIds: string[];
  onTitle: (title: string) => void;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
  onChangeBenefits: (fn: (benefits: Benefit[]) => Benefit[]) => void;
}) {
  const setBenefit = (id: string, patch: (b: Benefit) => Benefit) => onChangeBenefits((list) => list.map((b) => (b.id === id ? patch(b) : b)));

  return (
    <>
      <tr className="bg-teal/[0.06]">
        <td colSpan={sponsorTierIds.length + 1} className="px-2 py-2">
          <input
            value={section.title}
            placeholder="Section title"
            onChange={(e) => onTitle(e.target.value)}
            className="adm-input !py-1.5 !text-[12px] font-bold uppercase tracking-[0.06em]"
          />
        </td>
        <td className="px-2 py-2">
          <RowControls onUp={onUp} onDown={onDown} onDelete={onDelete} deleteLabel="Delete section" />
        </td>
      </tr>

      {section.benefits.map((b, bi) => (
        <tr key={b.id} className="border-b border-line/60 dark:border-white/[0.06]">
          <td className="px-2 py-1.5">
            <input
              value={b.label}
              placeholder="Benefit"
              onChange={(e) => setBenefit(b.id, (x) => ({ ...x, label: e.target.value }))}
              className="adm-input !py-1.5 !text-[13px]"
            />
          </td>
          {sponsorTierIds.map((tierId) => {
            const value = b.values[tierId] ?? false;
            const setValue = (v: CellValue) => setBenefit(b.id, (x) => ({ ...x, values: { ...x.values, [tierId]: v } }));
            return (
              <td key={tierId} className="px-2 py-1.5 text-center">
                {typeof value === "string" ? (
                  <div className="flex items-center gap-1">
                    <input
                      value={value}
                      placeholder="text"
                      onChange={(e) => setValue(e.target.value)}
                      className="adm-input !py-1 !px-2 !text-[12.5px] text-center"
                      autoFocus={value === ""}
                    />
                    <button
                      type="button"
                      onClick={() => setValue(nextCell(value))}
                      title="Next: not included"
                      className="text-[11px] text-muted dark:text-white/40 hover:text-ink dark:hover:text-white"
                    >
                      ↻
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setValue(nextCell(value))}
                    title={value ? "Included. Click for custom text" : "Not included. Click to include"}
                    className={`w-full rounded-lg py-1.5 border transition ${
                      value
                        ? "border-teal/40 bg-teal/10 text-teal font-bold"
                        : "border-line dark:border-white/10 text-muted/60 dark:text-white/25"
                    }`}
                  >
                    {value ? "✓" : "—"}
                  </button>
                )}
              </td>
            );
          })}
          <td className="px-2 py-1.5">
            <RowControls
              onUp={() => onChangeBenefits((list) => move(list, bi, -1))}
              onDown={() => onChangeBenefits((list) => move(list, bi, 1))}
              onDelete={() => onChangeBenefits((list) => list.filter((x) => x.id !== b.id))}
              deleteLabel="Delete benefit"
            />
          </td>
        </tr>
      ))}

      <tr>
        <td colSpan={sponsorTierIds.length + 2} className="px-2 pt-1 pb-4">
          <button
            type="button"
            onClick={() => onChangeBenefits((list) => [...list, { id: newId(), label: "", values: {} }])}
            className="text-[12px] font-semibold text-teal hover:text-ink dark:hover:text-white transition"
          >
            + Add benefit
          </button>
        </td>
      </tr>
    </>
  );
}

function RowControls({
  onUp,
  onDown,
  onDelete,
  deleteLabel,
}: {
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
  const btn = "w-7 h-7 rounded-md border border-line dark:border-white/10 text-[12px] text-muted dark:text-white/50 hover:text-ink dark:hover:text-white transition";
  return (
    <div className="flex items-center justify-end gap-1">
      <button type="button" onClick={onUp} className={btn} aria-label="Move up">
        ↑
      </button>
      <button type="button" onClick={onDown} className={btn} aria-label="Move down">
        ↓
      </button>
      <button type="button" onClick={onDelete} className={`${btn} hover:!text-red-400`} aria-label={deleteLabel} title={deleteLabel}>
        ✕
      </button>
    </div>
  );
}
