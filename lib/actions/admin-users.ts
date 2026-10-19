"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function removeUser(userId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const {
    data: { user: currentAdmin },
  } = await supabase.auth.getUser();
  if (!currentAdmin) return { error: "Not signed in." };

  const { data: isAdmin } = await supabase.from("admins").select("user_id").eq("user_id", currentAdmin.id).maybeSingle();
  if (!isAdmin) return { error: "Not authorized." };

  if (userId === currentAdmin.id) return { error: "You can't remove your own account." };

  // Deleting the auth.users row cascades to profiles/hospitals/
  // provider_profiles/admins (all declared `on delete cascade`), so one
  // call cleans up whichever role this account actually has.
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    console.error("[removeUser] failed:", error);
    return { error: "Could not remove this user." };
  }

  revalidatePath("/admin/overview");
  revalidatePath("/admin/users");
  return { success: true };
}
