"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { describeEmailSendError } from "@/lib/email-errors";
import { isValidUrl } from "@/lib/investigator-registration-constants";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type MellowMemberInput = {
  salutation: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  street_address: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  specialty: string | null;
  bio: string | null;
  credentials: string | null;
  core_competencies: string[];
  professional_background: string | null;
  publications: string[];
  linkedin_url: string | null;
  website_url: string | null;
  // Already uploaded by the wizard (admin-only storage policies, see
  // mellow-members.sql) — files go straight to Storage from the browser
  // since a 10MB CV is well past the Server Action body limit.
  profile_image_path: string | null;
  cv_path: string | null;
};

// Creates a provider account under the internal Mellow Consortium org:
// same invite -> set password -> /provider dashboard flow as
// createProvider() in providers.ts, but Admin-initiated, so the hospital
// comes from hospitals.kind = 'internal' instead of the signed-in user.
export type InviteDelivery =
  | { emailSent: true }
  // Account exists either way; the admin can copy this link and send it
  // themselves, or retry from the Mellow Members list later.
  | { emailSent: false; emailError: string; inviteLink: string | null };

type CreateResult = { error?: string; success?: boolean; delivery?: InviteDelivery };

// Cheap check the wizard runs before uploading files: if the admin session
// has lapsed, middleware redirects this call to /admin/login and it
// resolves to undefined, so the wizard stops before orphaning uploads.
export async function verifyAdminSession(): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { data: isAdmin } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return { ok: Boolean(isAdmin) };
}

// Safety net: an unexpected exception (network failure mid-call, etc.)
// comes back as { error } instead of rejecting the client's await.
export async function createMellowMember(input: MellowMemberInput): Promise<CreateResult> {
  try {
    return await createMellowMemberImpl(input);
  } catch (err) {
    console.error("[createMellowMember] unexpected exception:", err);
    return { error: "Something went wrong creating this member. Nothing was sent; please try again." };
  }
}

async function createMellowMemberImpl(input: MellowMemberInput): Promise<CreateResult> {
  // Auth first: fail() deletes the passed upload paths with the service
  // role, so it must never run for a caller who isn't a verified admin.
  const supabase = createClient();
  const {
    data: { user: currentAdmin },
  } = await supabase.auth.getUser();
  if (!currentAdmin) return { error: "Not signed in." };

  const { data: isAdmin } = await supabase.from("admins").select("user_id").eq("user_id", currentAdmin.id).maybeSingle();
  if (!isAdmin) return { error: "Not authorized." };

  const email = input.email.trim().toLowerCase();
  const firstName = input.first_name.trim();
  const lastName = input.last_name.trim();

  const uploadedPaths = { image: input.profile_image_path, cv: input.cv_path };
  const fail = async (error: string) => {
    await removeUploads(uploadedPaths);
    return { error };
  };

  if (!firstName || !lastName || !email) return fail("First name, last name, and email are required.");
  if (!EMAIL_RE.test(email)) return fail("Enter a valid email address.");
  if (input.linkedin_url && !isValidUrl(input.linkedin_url)) return fail("LinkedIn URL isn't a valid URL.");
  if (input.website_url && !isValidUrl(input.website_url)) return fail("Website URL isn't a valid URL.");

  const { data: org } = await supabase.from("hospitals").select("id").eq("kind", "internal").maybeSingle();
  if (!org) return fail("The internal Mellow Consortium org doesn't exist yet. Run supabase/mellow-members.sql first.");

  const { data: existing } = await supabase.from("provider_profiles").select("id").eq("email", email).maybeSingle();
  if (existing) return fail("A provider with this email already exists.");

  const name = [input.salutation, firstName, input.middle_name?.trim(), lastName].filter(Boolean).join(" ");

  // Account creation and email delivery are deliberately separate steps
  // (same principle as the Discovery Call form): generateLink() creates
  // the auth user and its invite token WITHOUT sending anything, so a
  // mail outage can't block the account. Only a genuine account problem
  // (e.g. the email already has a login) stops creation here.
  const adminClient = createAdminClient();
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "invite",
    email,
    options: inviteOptions(name),
  });

  if (linkError || !linkData?.user) {
    console.error("[createMellowMember] creating auth user failed:", linkError);
    return fail(describeEmailSendError(linkError));
  }
  const invited = { user: linkData.user };

  const { error: rpcError } = await supabase.rpc("admin_create_mellow_member", {
    p_provider_user_id: invited.user.id,
    p_email: email,
    p_name: name,
    p_salutation: input.salutation,
    p_first_name: firstName,
    p_middle_name: input.middle_name?.trim() || null,
    p_last_name: lastName,
    p_street_address: input.street_address,
    p_city: input.city,
    p_state_province: input.state_province,
    p_postal_code: input.postal_code,
    p_country: input.country,
    p_specialty: input.specialty,
    p_bio: input.bio,
    p_credentials: input.credentials,
    p_core_competencies: input.core_competencies,
    p_professional_background: input.professional_background,
    p_publications: input.publications,
    p_linkedin_url: input.linkedin_url,
    p_website_url: input.website_url,
    p_profile_image_path: input.profile_image_path,
    p_cv_path: input.cv_path,
  });

  if (rpcError) {
    console.error("[createMellowMember] admin_create_mellow_member failed:", rpcError);
    // Roll back the auth user so the invite link in their inbox dead-ends
    // instead of activating an account with no provider row behind it,
    // and so a retry with the same email isn't blocked.
    await adminClient.auth.admin.deleteUser(invited.user.id);
    return fail(`Creating the provider record failed: ${rpcError.message}`);
  }

  revalidatePath("/admin/mellow-members");
  return { success: true, delivery: await sendInvite(email, name, adminClient) };
}

// Re-sends the invite for a member who hasn't set their password yet —
// the recovery path when the first email failed or never arrived.
export async function resendMellowMemberInvite(providerId: string): Promise<{ error?: string; delivery?: InviteDelivery }> {
  try {
    return await resendMellowMemberInviteImpl(providerId);
  } catch (err) {
    console.error("[resendMellowMemberInvite] unexpected exception:", err);
    return { error: "Something went wrong resending the invite. Please try again." };
  }
}

async function resendMellowMemberInviteImpl(providerId: string): Promise<{ error?: string; delivery?: InviteDelivery }> {
  const supabase = createClient();
  const {
    data: { user: currentAdmin },
  } = await supabase.auth.getUser();
  if (!currentAdmin) return { error: "Not signed in." };

  const { data: isAdmin } = await supabase.from("admins").select("user_id").eq("user_id", currentAdmin.id).maybeSingle();
  if (!isAdmin) return { error: "Not authorized." };

  const { data: member } = await supabase
    .from("provider_profiles")
    .select("email, name, status")
    .eq("id", providerId)
    .maybeSingle();
  if (!member) return { error: "Member not found." };
  if (member.status !== "PENDING_SETUP") return { error: "This member has already set up their account." };

  return { delivery: await sendInvite(member.email, member.name, createAdminClient()) };
}

function inviteOptions(name: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return { data: { role: "provider", full_name: name }, redirectTo: `${siteUrl}/accept-invite` };
}

// Sends the invite email through Supabase Auth. For a user that exists
// but hasn't confirmed, inviteUserByEmail re-sends rather than erroring.
// On failure, falls back to a fresh copyable link so the admin is never
// stuck.
async function sendInvite(
  email: string,
  name: string,
  adminClient: ReturnType<typeof createAdminClient>
): Promise<InviteDelivery> {
  const { error: sendError } = await adminClient.auth.admin.inviteUserByEmail(email, inviteOptions(name));
  if (!sendError) return { emailSent: true };

  console.error("[mellow-members] invite email failed:", sendError);
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "invite",
    email,
    options: inviteOptions(name),
  });
  if (linkError) console.error("[mellow-members] fallback invite link failed:", linkError);

  return {
    emailSent: false,
    emailError: describeEmailSendError(sendError),
    inviteLink: linkData?.properties?.action_link ?? null,
  };
}

async function removeUploads({ image, cv }: { image: string | null; cv: string | null }) {
  const adminClient = createAdminClient();
  await Promise.all([
    image ? adminClient.storage.from("provider-profile-images").remove([image]) : null,
    cv ? adminClient.storage.from("provider-cvs").remove([cv]) : null,
  ]);
}
