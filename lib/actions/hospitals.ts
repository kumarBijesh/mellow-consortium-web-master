"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { describeEmailSendError } from "@/lib/email-errors";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type HospitalKind = "external" | "individual_provider" | "internal";

// Shared core for every path that provisions a hospitals-table account —
// the admin's direct "Create hospital" form (kind='external'), and the
// application-acceptance pipeline (kind='external' or
// 'individual_provider', see lib/actions/applications.ts). Per the Role
// Hierarchy spec, an Individual Provider account IS a hospital-type
// account, so this is the one place that actually creates one; only the
// `kind` value and where the input comes from differ.
export async function provisionHospitalAccount({
  name,
  email,
  phone,
  countries,
  kind,
  createdByAdminId,
}: {
  name: string;
  email: string;
  phone?: string | null;
  countries: string[];
  kind: HospitalKind;
  createdByAdminId?: string;
}): Promise<{ error?: string; hospitalId?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!name.trim() || !normalizedEmail) {
    return { error: "Name and email are required." };
  }
  if (!EMAIL_RE.test(normalizedEmail)) {
    return { error: "Enter a valid email address." };
  }

  const supabase = createClient();

  const { data: existing, error: existingCheckError } = await supabase
    .from("hospitals")
    .select("id")
    .eq("admin_email", normalizedEmail)
    .maybeSingle();
  if (existingCheckError) {
    console.error("[provisionHospitalAccount] existing-email check failed:", existingCheckError);
    return { error: `Could not check for an existing account: ${existingCheckError.message}` };
  }
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  // Auth Admin API — the one operation here that genuinely needs the
  // service role; everything else below goes through the regular
  // RLS-scoped client so the "admins can insert hospitals" policy is
  // actually exercised, not bypassed. `role: "hospital"` in the invite
  // metadata is correct for both kinds — accept-invite's activateAccount()
  // branches on that role, not on `kind`, since an Individual Provider
  // account activates exactly like a hospital does (see hospitals.kind
  // for the Hospital-vs-Individual-Provider distinction instead).
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const adminClient = createAdminClient();
  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
    data: { role: "hospital", full_name: name },
    redirectTo: `${siteUrl}/accept-invite`,
  });

  if (inviteError || !invited?.user) {
    console.error("[provisionHospitalAccount] invite failed:", inviteError);
    return { error: describeEmailSendError(inviteError) };
  }

  const { data: hospital, error: insertError } = await supabase
    .from("hospitals")
    .insert({
      name,
      admin_email: normalizedEmail,
      phone: phone || null,
      kind,
      countries,
      user_id: invited.user.id,
      created_by_admin_id: createdByAdminId,
    })
    .select("id")
    .single();

  if (insertError || !hospital) {
    console.error("[provisionHospitalAccount] hospitals insert failed:", insertError);
    return {
      error: `Invitation sent, but creating the account record failed: ${insertError?.message ?? "unknown error"}`,
    };
  }

  return { hospitalId: hospital.id };
}

export async function createHospital(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const countries = formData.getAll("countries").map(String).filter(Boolean);
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name || !email || countries.length === 0) {
    return { error: "Hospital name, email, and at least one country are required." };
  }

  const supabase = createClient();
  const {
    data: { user: currentAdmin },
  } = await supabase.auth.getUser();

  const result = await provisionHospitalAccount({
    name,
    email,
    phone,
    countries,
    kind: "external",
    createdByAdminId: currentAdmin?.id,
  });

  if (result.error) return { error: result.error };

  revalidatePath("/admin/hospitals");
  return { success: true };
}
