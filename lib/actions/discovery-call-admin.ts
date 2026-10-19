"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markDiscoveryCallContacted(id: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const {
    data: { user: admin },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("discovery_call_requests")
    .update({ status: "contacted", reviewed_at: new Date().toISOString(), reviewed_by: admin?.email ?? admin?.id ?? null })
    .eq("id", id);

  if (error) return { error: "Could not update request." };
  revalidatePath("/admin/applications/discovery-call-requests");
  return { success: true };
}

export async function markDiscoveryCallClosed(id: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const {
    data: { user: admin },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("discovery_call_requests")
    .update({ status: "closed", reviewed_at: new Date().toISOString(), reviewed_by: admin?.email ?? admin?.id ?? null })
    .eq("id", id);

  if (error) return { error: "Could not update request." };
  revalidatePath("/admin/applications/discovery-call-requests");
  return { success: true };
}
