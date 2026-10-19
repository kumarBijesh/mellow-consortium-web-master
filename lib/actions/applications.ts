"use server";

import { createClient } from "@/lib/supabase/server";
import { provisionHospitalAccount, type HospitalKind } from "@/lib/actions/hospitals";
import { revalidatePath } from "next/cache";

// "Become a Partner" applications only ever resolve to one of these two
// account kinds, regardless of the persona_type the applicant originally
// picked on the form — Admin's choice at accept-time governs (Role
// Hierarchy & Data-Sharing Spec v2, decision #2). 'internal' isn't
// choosable here — that's reserved for the one Mellow Consortium org.
type AcceptableKind = Extract<HospitalKind, "external" | "individual_provider">;

export async function acceptApplication(
  applicationId: string,
  accountKind: AcceptableKind
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const {
    data: { user: admin },
  } = await supabase.auth.getUser();

  const { data: application, error: fetchError } = await supabase
    .from("applications")
    .select("id, contact_name, contact_email, organization_name, country, status")
    .eq("id", applicationId)
    .maybeSingle();

  if (fetchError || !application) {
    return { error: "Application not found." };
  }
  if (application.status === "accepted") {
    return { error: "This application was already accepted." };
  }

  // A real hospital's account should be named after the organization, not
  // whoever filled out the form; an Individual Provider account
  // represents the person themselves, so it always uses their name even
  // if they mentioned an employer in organization_name.
  const name = accountKind === "external" ? application.organization_name || application.contact_name : application.contact_name;

  const result = await provisionHospitalAccount({
    name,
    email: application.contact_email,
    countries: application.country ? [application.country] : [],
    kind: accountKind,
    createdByAdminId: admin?.id,
  });

  if (result.error) {
    return { error: result.error };
  }

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      status: "accepted",
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin?.email ?? admin?.id ?? null,
      created_hospital_id: result.hospitalId,
    })
    .eq("id", applicationId);

  if (updateError) {
    console.error("[acceptApplication] application update failed:", updateError);
    return {
      error: `Account created and invited, but updating the application record failed: ${updateError.message}. The account exists. Check /admin/hospitals.`,
    };
  }

  revalidatePath("/admin/applications");
  revalidatePath("/admin/hospitals");
  return { success: true };
}

export async function rejectApplication(applicationId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const {
    data: { user: admin },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("applications")
    .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: admin?.email ?? admin?.id ?? null })
    .eq("id", applicationId);

  if (error) return { error: "Could not reject application." };

  revalidatePath("/admin/applications");
  return { success: true };
}

export async function markInReview(applicationId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();

  const { error } = await supabase.from("applications").update({ status: "in_review" }).eq("id", applicationId);

  if (error) return { error: "Could not update application." };

  revalidatePath("/admin/applications");
  return { success: true };
}
