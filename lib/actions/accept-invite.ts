"use server";

import { createAdminClient } from "@/lib/supabase/admin";

// Called right after the invited user sets their password. Flips
// PENDING_SETUP -> ACTIVE on their hospitals/provider_profiles row.
// Needs the service-role client because neither role has (or should have)
// an RLS policy letting them update that row themselves — this status
// transition is system-driven, not a user-editable field.
//
// Takes the invite's access token explicitly instead of reading the
// cookie session: the set-password page never signs the invitee into
// this browser (so an admin testing an invite link in their own browser
// isn't logged out), which means there's no cookie session to read.
// The token is verified against Supabase Auth before anything is trusted.
export async function activateAccount(accessToken: string): Promise<{ error?: string; redirectTo: string }> {
  const adminClient = createAdminClient();
  const {
    data: { user },
    error: userError,
  } = await adminClient.auth.getUser(accessToken);

  if (userError || !user) {
    return { error: "Your invite link has expired. Ask whoever invited you to send a new one.", redirectTo: "/" };
  }

  const role = (user.user_metadata as { role?: string } | undefined)?.role;

  if (role === "hospital") {
    const { error } = await adminClient.from("hospitals").update({ status: "ACTIVE" }).eq("user_id", user.id);
    if (error) return { error: "Could not activate hospital account.", redirectTo: "/accept-invite/set-password" };
    return { redirectTo: "/hospital/login" };
  }

  if (role === "provider") {
    const { error } = await adminClient
      .from("provider_profiles")
      .update({ status: "ACTIVE" })
      .eq("provider_user_id", user.id);
    if (error) return { error: "Could not activate provider account.", redirectTo: "/accept-invite/set-password" };
    return { redirectTo: "/provider/login" };
  }

  return { error: "Unrecognized account type.", redirectTo: "/" };
}
