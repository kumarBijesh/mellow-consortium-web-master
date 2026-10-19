"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markInquiryContacted(id: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const {
    data: { user: admin },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("investigator_inquiries")
    .update({ status: "contacted", reviewed_at: new Date().toISOString(), reviewed_by: admin?.email ?? admin?.id ?? null })
    .eq("id", id);

  if (error) return { error: "Could not update inquiry." };
  revalidatePath("/admin/network/inquiries");
  return { success: true };
}

export async function markInquiryClosed(id: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const {
    data: { user: admin },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("investigator_inquiries")
    .update({ status: "closed", reviewed_at: new Date().toISOString(), reviewed_by: admin?.email ?? admin?.id ?? null })
    .eq("id", id);

  if (error) return { error: "Could not update inquiry." };
  revalidatePath("/admin/network/inquiries");
  return { success: true };
}
