// Membership plans data model (supabase/membership-plans.sql). Shared by
// the public /membership-plans page and the /admin/cms/membership-plans
// editor.

import type { SupabaseClient } from "@supabase/supabase-js";

export type TierKind = "sponsor" | "individual";

export type MembershipTier = {
  id: string;
  slug: string;
  name: string;
  price_label: string;
  kind: TierKind;
  description: string | null;
  cta_label: string | null;
  is_featured: boolean;
};

// A comparison-table cell: true = checkmark, string = text instead of a
// checkmark, false = not included (no row in membership_benefit_values).
export type CellValue = true | false | string;

export type MembershipBenefit = { id: string; label: string; values: Record<string, CellValue> }; // keyed by tier id

export type MembershipSection = { id: string; title: string; benefits: MembershipBenefit[] };

export type MembershipPlans = { tiers: MembershipTier[]; sections: MembershipSection[] };

export async function fetchMembershipPlans(
  supabase: SupabaseClient
): Promise<{ plans: MembershipPlans; error: string | null }> {
  const [tiersRes, sectionsRes, benefitsRes, valuesRes] = await Promise.all([
    supabase
      .from("membership_tiers")
      .select("id, slug, name, price_label, kind, description, cta_label, is_featured")
      .order("sort_order"),
    supabase.from("membership_benefit_sections").select("id, title").order("sort_order"),
    supabase.from("membership_benefits").select("id, section_id, label").order("sort_order"),
    supabase.from("membership_benefit_values").select("benefit_id, tier_id, value_text"),
  ]);

  const error = tiersRes.error ?? sectionsRes.error ?? benefitsRes.error ?? valuesRes.error;
  if (error) {
    console.error("[membership-plans] fetch failed:", error);
    return { plans: { tiers: [], sections: [] }, error: `${error.code ? `[${error.code}] ` : ""}${error.message}` };
  }

  const tiers = (tiersRes.data ?? []) as MembershipTier[];
  const cells = new Map<string, Record<string, CellValue>>();
  for (const v of valuesRes.data ?? []) {
    const row = cells.get(v.benefit_id) ?? {};
    row[v.tier_id] = v.value_text ?? true;
    cells.set(v.benefit_id, row);
  }

  const sections: MembershipSection[] = (sectionsRes.data ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    benefits: (benefitsRes.data ?? [])
      .filter((b) => b.section_id === s.id)
      .map((b) => {
        const row = cells.get(b.id) ?? {};
        return { id: b.id, label: b.label, values: Object.fromEntries(tiers.map((t) => [t.id, row[t.id] ?? false])) };
      }),
  }));

  return { plans: { tiers, sections }, error: null };
}
