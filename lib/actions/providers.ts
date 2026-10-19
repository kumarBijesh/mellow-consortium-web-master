"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { describeEmailSendError } from "@/lib/email-errors";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createProvider(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const specialty = String(formData.get("specialty") ?? "").trim();
  const locationIds = formData.getAll("locations").map(String).filter(Boolean);

  if (!name || !email) {
    return { error: "Provider name and email are required." };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const supabase = createClient();
  const {
    data: { user: hospitalUser },
  } = await supabase.auth.getUser();
  if (!hospitalUser) return { error: "Not signed in." };

  const { data: hospital } = await supabase.from("hospitals").select("id").eq("user_id", hospitalUser.id).maybeSingle();
  if (!hospital) return { error: "No hospital account found for this session." };

  const { data: existing } = await supabase.from("provider_profiles").select("id").eq("email", email).maybeSingle();
  if (existing) return { error: "A provider with this email already exists." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const adminClient = createAdminClient();
  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { role: "provider", full_name: name },
    redirectTo: `${siteUrl}/accept-invite`,
  });

  if (inviteError || !invited?.user) {
    console.error("[createProvider] invite failed:", inviteError);
    return { error: describeEmailSendError(inviteError) };
  }

  // Provider profile + location assignments happen in one Postgres
  // function call (create_provider_with_locations, see
  // fix-provider-locations-recursion.sql) instead of two separate
  // inserts — a plpgsql function body is one transaction, so if the
  // location-assignment step fails for any reason, the provider row
  // from this same call is automatically rolled back too. Previously
  // these were separate awaited inserts, which is exactly how a
  // provider could end up created but not linked to anywhere.
  const { data: providerId, error: rpcError } = await supabase.rpc("create_provider_with_locations", {
    p_name: name,
    p_email: email,
    p_specialty: specialty || null,
    p_hospital_id: hospital.id,
    p_provider_user_id: invited.user.id,
    p_location_ids: locationIds.length > 0 ? locationIds : null,
  });

  if (rpcError || !providerId) {
    console.error("[createProvider] create_provider_with_locations failed:", rpcError);
    return { error: "Invitation sent, but creating the provider record failed. Contact support." };
  }

  revalidatePath("/hospital/providers");
  revalidatePath("/hospital/locations");
  return { success: true };
}

export async function assignProviderToLocation(providerId: string, locationId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("provider_locations")
    .insert({ provider_id: providerId, location_id: locationId, assigned_by: user?.id });

  // 23505 = unique_violation — already assigned, treat as a no-op success.
  if (error && error.code !== "23505") {
    console.error("[assignProviderToLocation] insert failed:", error);
    return { error: "Could not assign provider to location." };
  }
  revalidatePath("/hospital/providers");
  revalidatePath("/hospital/locations");
  return { success: true };
}

export async function removeProviderFromLocation(providerId: string, locationId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("provider_locations")
    .delete()
    .eq("provider_id", providerId)
    .eq("location_id", locationId);

  if (error) return { error: "Could not remove provider from location." };
  revalidatePath("/hospital/providers");
  revalidatePath("/hospital/locations");
  return { success: true };
}

export async function updateProviderDetails(
  providerId: string,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const name = String(formData.get("name") ?? "").trim();
  const specialty = String(formData.get("specialty") ?? "").trim();

  if (!name) return { error: "Provider name is required." };

  const supabase = createClient();
  const { error } = await supabase
    .from("provider_profiles")
    .update({ name, specialty: specialty || null })
    .eq("id", providerId);

  if (error) return { error: "Could not update provider." };

  revalidatePath("/hospital/providers");
  revalidatePath("/hospital");
  return { success: true };
}

export async function deleteProvider(providerId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const { error } = await supabase.from("provider_profiles").delete().eq("id", providerId);

  if (error) return { error: "Could not remove provider." };

  revalidatePath("/hospital/providers");
  revalidatePath("/hospital");
  return { success: true };
}
