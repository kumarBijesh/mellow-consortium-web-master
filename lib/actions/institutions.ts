"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseSpecializations, numOrNull, strOrNull } from "@/lib/network-constants";

export type InstitutionOption = { id: string; name: string };

type InstitutionInsert = {
  name: string;
  country: string;
  city: string | null;
  region: string | null;
  lat?: number | null;
  lon?: number | null;
  specializations?: string[];
  website?: string | null;
  logo_url?: string | null;
  is_hq?: boolean;
};

// Same name + country (case-insensitive) counts as the same institution.
// Both the full sidebar form and the inline quick-create go through this so
// neither path can create a duplicate the other would have caught.
async function findDuplicate(name: string, country: string): Promise<InstitutionOption | null> {
  const supabase = createClient();
  // Escape ilike wildcards so "St_Mary%" matches literally.
  const pattern = name.replace(/[\\%_]/g, (c) => `\\${c}`);
  const { data } = await supabase.from("institutions").select("id, name, country").ilike("name", pattern);
  const match = (data ?? []).find((i) => i.country.trim().toLowerCase() === country.trim().toLowerCase());
  return match ? { id: match.id, name: match.name } : null;
}

// Routes live under /[locale]; a plain "/" or "/admin/..." path matches no
// real route, which left the homepage map stale until its 5-minute ISR.
function revalidateInstitutionPages() {
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/admin/network/institutions", "page");
  revalidatePath("/[locale]/admin/network/institutions/[id]", "page");
  revalidatePath("/[locale]/admin/network/investigators", "page");
  revalidatePath("/[locale]/admin/network/investigator-submissions", "page");
  revalidatePath("/[locale]/institutions", "page");
  revalidatePath("/[locale]/institutions/[id]", "page");
}

async function insertInstitution(row: InstitutionInsert): Promise<{ institution?: InstitutionOption; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.from("institutions").insert(row).select("id, name").single();

  if (error || !data) {
    console.error("[actions/institutions] insert failed:", error);
    return { error: error ? `${error.code ? `[${error.code}] ` : ""}${error.message}` : "Insert failed." };
  }

  revalidateInstitutionPages();
  return { institution: data };
}

type FormState = { error?: string; savedAt?: number };

function institutionFields(formData: FormData) {
  return {
    city: strOrNull(formData.get("city")),
    region: strOrNull(formData.get("region")),
    lat: numOrNull(formData.get("lat")),
    lon: numOrNull(formData.get("lon")),
    specializations: parseSpecializations(formData.get("specializations")),
    website: strOrNull(formData.get("website")),
    logo_url: strOrNull(formData.get("logo_url")),
    is_hq: formData.get("is_hq") === "on",
  };
}

// Full form in the Institutions sidebar (useFormState signature).
export async function createInstitution(_prevState: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  if (!name || !country) return { error: "Name and country are required." };

  const duplicate = await findDuplicate(name, country);
  if (duplicate) return { error: `"${duplicate.name}" (${country}) already exists.` };

  const { error } = await insertInstitution({ name, country, ...institutionFields(formData) });
  return error ? { error } : { savedAt: Date.now() };
}

// Edit page. Bound to the institution id: updateInstitution.bind(null, id).
export async function updateInstitution(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  if (!name || !country) return { error: "Name and country are required." };

  const supabase = createClient();
  // select() returns the updated rows, so an update RLS silently filtered
  // out (0 rows, no error) is reported instead of looking like success.
  const { data, error } = await supabase
    .from("institutions")
    .update({ name, country, ...institutionFields(formData) })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("[actions/institutions] update failed:", error);
    return { error: `${error.code ? `[${error.code}] ` : ""}${error.message}` };
  }
  if (!data || data.length === 0) {
    return { error: "Nothing was saved: this institution wasn't found or your account can't edit it." };
  }

  revalidateInstitutionPages();
  return { savedAt: Date.now() };
}

// Inline quick-create from InstitutionPicker / the "+ Add institute" button.
// On a duplicate, returns the existing row (existing: true) so the caller
// can select it instead of creating a copy.
export async function quickCreateInstitution(input: {
  name: string;
  country: string;
  city?: string;
  region?: string;
}): Promise<{ institution?: InstitutionOption; existing?: boolean; error?: string }> {
  const name = input.name.trim();
  const country = input.country.trim();
  if (!name || !country) return { error: "Name and country are required." };

  const duplicate = await findDuplicate(name, country);
  if (duplicate) return { institution: duplicate, existing: true };

  return insertInstitution({
    name,
    country,
    city: input.city?.trim() || null,
    region: input.region?.trim() || null,
  });
}
