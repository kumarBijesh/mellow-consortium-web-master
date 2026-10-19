"use server";

import { createClient } from "@/lib/supabase/server";
import { sendDiscoveryCallNotification } from "@/lib/email/discovery-call";

export async function submitDiscoveryCallRequest(input: {
  full_name: string;
  email: string;
  organization: string;
  job_title: string | null;
  area_of_expertise: string | null;
  country: string | null;
  collaboration_type: string | null;
  source_tier: string | null;
  message: string | null;
}): Promise<{ error?: string; success?: boolean }> {
  const { full_name, email, organization } = input;
  if (!full_name.trim() || !email.trim() || !organization.trim()) {
    return { error: "Full name, email, and organization are required." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("discovery_call_requests").insert(input);

  if (error) {
    console.error("[submitDiscoveryCallRequest] insert failed:", error);
    return { error: "Something went wrong submitting your request. Please try again." };
  }

  // Best-effort — the request is already saved above, so a failed/skipped
  // send never loses the lead. Admin still sees it in the dashboard.
  await sendDiscoveryCallNotification(input);

  return { success: true };
}
