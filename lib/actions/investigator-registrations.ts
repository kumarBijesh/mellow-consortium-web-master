"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function approveInvestigatorRegistration(
  registrationId: string,
  institutionId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const {
    data: { user: admin },
  } = await supabase.auth.getUser();

  const { data: reg, error: fetchError } = await supabase
    .from("investigator_registrations")
    .select("*")
    .eq("id", registrationId)
    .maybeSingle();

  if (fetchError || !reg) {
    return { error: "Registration not found." };
  }
  if (reg.status === "approved") {
    return { error: "This registration was already approved." };
  }
  if (!institutionId) {
    return { error: "Select an institution before approving." };
  }

  const full_name = [reg.salutation, reg.first_name, reg.middle_name, reg.last_name].filter(Boolean).join(" ");

  let photo_url: string | null = null;
  if (reg.profile_image_path) {
    const { data } = supabase.storage.from("investigator-profile-images").getPublicUrl(reg.profile_image_path);
    photo_url = data.publicUrl;
  }

  const investigatorRow = {
    full_name,
    institution_id: institutionId,
    bio: reg.professional_bio,
    photo_url,
    salutation: reg.salutation,
    access_tier: reg.access_tier,
    country: reg.country,
    department_focus_area: reg.department_focus_area,
    qualifications: reg.qualifications,
    core_competencies: reg.core_competencies,
    publications: reg.publications,
    linkedin_url: reg.linkedin_url,
    website_url: reg.website_url,
  };

  // Contact details go to the admin-only investigator_private table, never
  // to `investigators`, which is publicly readable.
  const privateRow = {
    personal_email: reg.personal_email,
    street_address: reg.street_address,
    city: reg.city,
    state: reg.state,
    postal_code: reg.postal_code,
    cv_path: reg.cv_path,
  };

  // Re-approving an edit: update the existing investigators row rather
  // than creating a duplicate.
  const { data: investigator, error: upsertError } = reg.investigator_id
    ? await supabase.from("investigators").update(investigatorRow).eq("id", reg.investigator_id).select("id").maybeSingle()
    : await supabase.from("investigators").insert(investigatorRow).select("id").maybeSingle();

  if (upsertError || !investigator) {
    return { error: `Could not create investigator: ${upsertError?.message ?? "unknown error"}` };
  }

  const { error: privateError } = await supabase
    .from("investigator_private")
    .upsert({ investigator_id: investigator.id, ...privateRow, updated_at: new Date().toISOString() });
  if (privateError) {
    console.error("[approveInvestigatorRegistration] investigator_private upsert failed:", privateError);
    // A brand-new investigator row would otherwise be orphaned and a retry
    // would insert a duplicate; an existing one (re-approval) is left as-is.
    if (!reg.investigator_id) await supabase.from("investigators").delete().eq("id", investigator.id);
    return {
      error: `Saving the investigator's private contact details failed: ${privateError.message}. The registration is still pending; approve it again to retry.`,
    };
  }

  const { error: updateError } = await supabase
    .from("investigator_registrations")
    .update({
      status: "approved",
      investigator_id: investigator.id,
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin?.email ?? admin?.id ?? null,
    })
    .eq("id", registrationId);

  if (updateError) {
    console.error("[approveInvestigatorRegistration] registration update failed:", updateError);
    return {
      error: `Investigator created, but updating the registration record failed: ${updateError.message}. Check /admin/network/investigators.`,
    };
  }

  revalidatePath("/admin/network/investigator-submissions");
  revalidatePath("/admin/network/investigators");
  revalidatePath("/");
  return { success: true };
}

export async function rejectInvestigatorRegistration(registrationId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const {
    data: { user: admin },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("investigator_registrations")
    .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: admin?.email ?? admin?.id ?? null })
    .eq("id", registrationId);

  if (error) return { error: "Could not reject registration." };

  revalidatePath("/admin/network/investigator-submissions");
  return { success: true };
}
