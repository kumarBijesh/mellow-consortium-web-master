import "server-only";
import { Resend } from "resend";

// Sends the internal notification email for a new Discovery Call
// request. Best-effort: the request is already stored in
// discovery_call_requests before this runs (see
// lib/actions/discovery-call.ts), so a missing/failing send never loses
// the lead — it's just logged. RESEND_API_KEY isn't provisioned yet
// (see supabase/discovery-call-requests.sql commit / chat), so this is
// currently a no-op that logs why.
export async function sendDiscoveryCallNotification(request: {
  full_name: string;
  email: string;
  organization: string;
  job_title: string | null;
  area_of_expertise: string | null;
  country: string | null;
  collaboration_type: string | null;
  source_tier: string | null;
  message: string | null;
}): Promise<{ error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[discovery-call email] RESEND_API_KEY not set — skipping notification email. Request is still stored in discovery_call_requests.");
    return { error: "RESEND_API_KEY not configured" };
  }

  const resend = new Resend(apiKey);
  const fromAddress = process.env.DISCOVERY_CALL_FROM_EMAIL || "MELLOW Consortium <onboarding@resend.dev>";

  const lines = [
    `Name: ${request.full_name}`,
    `Email: ${request.email}`,
    `Organization: ${request.organization}`,
    request.job_title ? `Job Title / Role: ${request.job_title}` : null,
    request.area_of_expertise ? `Area of Expertise: ${request.area_of_expertise}` : null,
    request.country ? `Country: ${request.country}` : null,
    request.collaboration_type ? `How they'd like to collaborate: ${request.collaboration_type}` : null,
    request.source_tier ? `Came from tier: ${request.source_tier}` : null,
    request.message ? `Message: ${request.message}` : null,
  ].filter(Boolean);

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: "mellowresearch@gmail.com",
    replyTo: request.email,
    subject: `New Discovery Call request — ${request.full_name} (${request.organization})`,
    text: lines.join("\n"),
  });

  if (error) {
    console.error("[discovery-call email] send failed:", error);
    return { error: error.message };
  }
  return {};
}
