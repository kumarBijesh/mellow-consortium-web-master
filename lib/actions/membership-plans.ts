"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { fetchMembershipPlans, type MembershipPlans } from "@/lib/membership-plans";

// Ids the editor gives rows that don't exist in the DB yet.
const isNewId = (id: string) => id.startsWith("new-");

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "tier"
  );
}

// Returns the saved state re-read from the DB, so the editor swaps its
// temporary "new-" ids for real ones before any further save.
export async function saveMembershipPlans(plans: MembershipPlans): Promise<{ error?: string; plans?: MembershipPlans }> {
  for (const t of plans.tiers) {
    if (!t.name.trim() || !t.price_label.trim()) return { error: "Every tier needs a name and a price." };
  }
  for (const s of plans.sections) {
    if (!s.title.trim()) return { error: "Every section needs a title." };
    for (const b of s.benefits) {
      if (!b.label.trim()) return { error: `A benefit in "${s.title}" has no label.` };
    }
  }

  // Existing tiers keep their slug; new ones get a unique one from their name.
  const usedSlugs = new Set(plans.tiers.filter((t) => !isNewId(t.id)).map((t) => t.slug));
  const tiers = plans.tiers.map((t) => {
    let slug = t.slug;
    if (isNewId(t.id)) {
      const base = slugify(t.name);
      slug = base;
      for (let n = 2; usedSlugs.has(slug); n++) slug = `${base}-${n}`;
      usedSlugs.add(slug);
    }
    return {
      id: isNewId(t.id) ? null : t.id,
      key: t.id,
      slug,
      name: t.name.trim(),
      price_label: t.price_label.trim(),
      kind: t.kind,
      description: t.description?.trim() ?? "",
      cta_label: t.cta_label?.trim() ?? "",
      is_featured: t.is_featured,
    };
  });

  const sponsorIds = new Set(plans.tiers.filter((t) => t.kind === "sponsor").map((t) => t.id));
  const sections = plans.sections.map((s) => ({
    id: isNewId(s.id) ? null : s.id,
    title: s.title.trim(),
    benefits: s.benefits.map((b) => ({
      id: isNewId(b.id) ? null : b.id,
      label: b.label.trim(),
      // Only sponsor tiers are comparison-table columns; false = no row.
      values: Object.entries(b.values)
        .flatMap(([tierId, v]) =>
          sponsorIds.has(tierId) && v !== false
            ? [{ tier_key: tierId, value_text: v === true ? null : v.trim() || null }]
            : []
        ),
    })),
  }));

  const supabase = createClient();
  const { error } = await supabase.rpc("save_membership_plans", { payload: { tiers, sections } });
  if (error) {
    console.error("[actions/membership-plans] save failed:", error);
    return { error: `${error.code ? `[${error.code}] ` : ""}${error.message}` };
  }

  revalidatePath("/[locale]/membership-plans", "page");
  revalidatePath("/[locale]/admin/cms/membership-plans", "page");

  const fresh = await fetchMembershipPlans(supabase);
  return fresh.error ? { error: `Saved, but reloading failed: ${fresh.error}. Refresh the page.` } : { plans: fresh.plans };
}
