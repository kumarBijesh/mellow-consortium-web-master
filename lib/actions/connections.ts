"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function requestConnection(providerId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // A patient can be connected to multiple providers at once (many-to-
  // many — see Role Hierarchy & Data-Sharing Spec v2), so no "already
  // connected to a provider" check here. The unique constraint that used
  // to block this (one_active_connection_per_patient) was dropped in
  // patient-provider-many-to-many.sql.
  const { error } = await supabase.from("patient_provider_connections").insert({
    patient_id: user.id,
    provider_id: providerId,
  });

  if (error) {
    if (error.code === "23505") return { error: "You've already requested this provider." };
    console.error("[requestConnection] failed:", error);
    return { error: "Could not send request." };
  }

  revalidatePath("/dashboard/patient/providers");
  return { success: true };
}

export async function respondToConnection(
  connectionId: string,
  accept: boolean
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();

  // A patient can hold multiple ACTIVE connections at once (many-to-many
  // — see Role Hierarchy & Data-Sharing Spec v2), so accepting this
  // request no longer touches any of the patient's other pending/active
  // connections to other providers.
  const { error } = await supabase
    .from("patient_provider_connections")
    .update({ status: accept ? "ACTIVE" : "DECLINED", responded_at: new Date().toISOString() })
    .eq("id", connectionId);

  if (error) {
    console.error("[respondToConnection] failed:", error);
    return { error: "Could not update this request." };
  }

  revalidatePath("/provider/requests");
  revalidatePath("/provider/patients");
  return { success: true };
}

export async function sendMessage(
  connectionId: string,
  body: string
): Promise<{ error?: string; success?: boolean; message?: { id: string; sender_id: string; body: string; created_at: string } }> {
  const trimmed = body.trim();
  if (!trimmed) return { error: "Message can't be empty." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data, error } = await supabase
    .from("messages")
    .insert({ connection_id: connectionId, sender_id: user.id, body: trimmed })
    .select("id, sender_id, body, created_at")
    .single();

  if (error || !data) {
    console.error("[sendMessage] failed:", error);
    return { error: "Could not send message." };
  }

  revalidatePath(`/provider/patients/${connectionId}`);
  revalidatePath(`/provider/messages/${connectionId}`);
  revalidatePath(`/dashboard/patient/messages/${connectionId}`);
  return { success: true, message: data };
}

// Marks every message in this thread that the current user didn't send
// as read. Safe to call whenever a thread is opened — RLS only lets this
// touch rows where the caller is a participant and not the sender, and
// it's a no-op (0 rows) if there's nothing unread.
export async function markThreadRead(connectionId: string): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("connection_id", connectionId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("[markThreadRead] failed:", error);
    return { error: "Could not mark messages as read." };
  }
  return {};
}

export async function addRecommendation(
  connectionId: string,
  patientId: string,
  body: string
): Promise<{ error?: string; success?: boolean }> {
  const trimmed = body.trim();
  if (!trimmed) return { error: "Recommendation can't be empty." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select("id")
    .eq("provider_user_id", user.id)
    .maybeSingle();
  if (!provider) return { error: "No provider account found for this session." };

  const { error } = await supabase.from("provider_recommendations").insert({
    connection_id: connectionId,
    provider_id: provider.id,
    patient_id: patientId,
    body: trimmed,
  });

  if (error) {
    console.error("[addRecommendation] failed:", error);
    return { error: "Could not save recommendation." };
  }

  revalidatePath(`/provider/patients/${connectionId}`);
  return { success: true };
}

export async function logVisit(
  connectionId: string,
  patientId: string,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const visitDate = String(formData.get("visit_date") ?? "").trim();
  const diagnosis = String(formData.get("diagnosis") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!visitDate) return { error: "Visit date is required." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select("id")
    .eq("provider_user_id", user.id)
    .maybeSingle();
  if (!provider) return { error: "No provider account found for this session." };

  const { error } = await supabase.from("visits").insert({
    connection_id: connectionId,
    provider_id: provider.id,
    patient_id: patientId,
    visit_date: visitDate,
    diagnosis: diagnosis || null,
    notes: notes || null,
  });

  if (error) {
    console.error("[logVisit] failed:", error);
    return { error: "Could not log this visit." };
  }

  revalidatePath(`/provider/patients/${connectionId}`);
  return { success: true };
}

export async function updateProviderProfile(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const name = String(formData.get("name") ?? "").trim();
  const specialty = String(formData.get("specialty") ?? "").trim();
  const credentials = String(formData.get("credentials") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const stateProvince = String(formData.get("state_province") ?? "").trim();
  const latitude = String(formData.get("latitude") ?? "").trim();
  const longitude = String(formData.get("longitude") ?? "").trim();

  if (!name) return { error: "Name is required." };

  const { error } = await supabase
    .from("provider_profiles")
    .update({
      name,
      specialty: specialty || null,
      credentials: credentials || null,
      bio: bio || null,
      city: city || null,
      state_province: stateProvince || null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
    })
    .eq("provider_user_id", user.id);

  if (error) {
    console.error("[updateProviderProfile] failed:", error);
    return { error: "Could not update profile." };
  }

  revalidatePath("/provider/profile");
  return { success: true };
}

// Separate from updateProviderProfile deliberately — that action rewrites
// every profile field from its own form each time, so reusing it here
// with a form that only has a URL field would null out name/specialty/
// bio/location on every save.
export async function updateMeetingUrl(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const meetingUrl = String(formData.get("meeting_url") ?? "").trim();

  const { error } = await supabase.from("provider_profiles").update({ meeting_url: meetingUrl || null }).eq("provider_user_id", user.id);

  if (error) {
    console.error("[updateMeetingUrl] failed:", error);
    return { error: "Could not save the room link." };
  }

  revalidatePath("/provider/meeting");
  return { success: true };
}

export async function addBiomarkerReport(
  connectionId: string,
  patientId: string,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const recordedDate = String(formData.get("recorded_date") ?? "").trim();
  const biologicalAge = String(formData.get("biological_age") ?? "").trim();
  const chronologicalAge = String(formData.get("chronological_age") ?? "").trim();
  const crp = String(formData.get("crp") ?? "").trim();
  const glucose = String(formData.get("glucose") ?? "").trim();
  const riskLevel = String(formData.get("risk_level") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!recordedDate) return { error: "Report date is required." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select("id")
    .eq("provider_user_id", user.id)
    .maybeSingle();
  if (!provider) return { error: "No provider account found for this session." };

  const { error } = await supabase.from("biomarker_reports").insert({
    connection_id: connectionId,
    provider_id: provider.id,
    patient_id: patientId,
    recorded_date: recordedDate,
    biological_age: biologicalAge ? Number(biologicalAge) : null,
    chronological_age: chronologicalAge ? Number(chronologicalAge) : null,
    crp: crp ? Number(crp) : null,
    glucose: glucose ? Number(glucose) : null,
    risk_level: riskLevel || null,
    notes: notes || null,
  });

  if (error) {
    console.error("[addBiomarkerReport] failed:", error);
    return { error: "Could not save this report." };
  }

  revalidatePath(`/provider/patients/${connectionId}`);
  revalidatePath("/provider/lab-reports");
  revalidatePath("/provider");
  return { success: true };
}

export async function saveCarePlan(connectionId: string, patientId: string, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select("id")
    .eq("provider_user_id", user.id)
    .maybeSingle();
  if (!provider) return { error: "No provider account found for this session." };

  const fields = {
    diet_plan: String(formData.get("diet_plan") ?? "").trim() || null,
    exercise_protocol: String(formData.get("exercise_protocol") ?? "").trim() || null,
    yoga: String(formData.get("yoga") ?? "").trim() || null,
    meditation: String(formData.get("meditation") ?? "").trim() || null,
    medications: String(formData.get("medications") ?? "").trim() || null,
    cautions: String(formData.get("cautions") ?? "").trim() || null,
    clinical_note: String(formData.get("clinical_note") ?? "").trim() || null,
  };

  const { error } = await supabase
    .from("care_plans")
    .upsert(
      { connection_id: connectionId, patient_id: patientId, provider_id: provider.id, ...fields, updated_at: new Date().toISOString() },
      { onConflict: "connection_id" }
    );

  if (error) {
    console.error("[saveCarePlan] failed:", error);
    return { error: "Could not save the care plan." };
  }

  revalidatePath(`/provider/patients/${connectionId}`);
  revalidatePath(`/dashboard/patient`);
  return { success: true };
}

// Provider-initiated enrollment — the reverse direction of
// requestConnection(). A provider already has a real-world relationship
// with this patient (e.g. an existing in-person patient), so this
// connects them directly as ACTIVE rather than creating a request the
// patient has to separately accept — we don't have that reverse-accept
// UI built, and "Invite" reads as enrollment, not a request. Only works
// for patients who already have an account (looked up by email); we
// don't send a signup invite to a non-existent account here.
export async function invitePatient(
  email: string
): Promise<{ error?: string; success?: boolean; existingConnectionId?: string; existingStatus?: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { error: "Enter a patient email address." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select("id")
    .eq("provider_user_id", user.id)
    .maybeSingle();
  if (!provider) return { error: "No provider account found for this session." };

  // profiles RLS only allows reading your own row (or an admin's), and
  // deliberately so — a provider has no business browsing arbitrary
  // patient profiles. But this lookup needs to happen BEFORE any
  // connection exists, so the normal RLS-scoped client can't do it. The
  // service-role client is used narrowly for just this existence check
  // (id only, nothing else exposed) — the actual connection insert right
  // below still goes through the RLS-scoped client, so "provider can
  // create own connections" is genuinely exercised, not bypassed.
  const adminClient = createAdminClient();
  const { data: patientProfile, error: lookupError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", trimmed)
    .maybeSingle();

  if (lookupError) {
    console.error("[invitePatient] profile lookup failed:", lookupError);
    return { error: "Could not look up that email." };
  }
  if (!patientProfile) {
    return { error: "No patient account found with that email yet. They need to sign up first." };
  }

  const { error } = await supabase
    .from("patient_provider_connections")
    .insert({ patient_id: patientProfile.id, provider_id: provider.id, status: "ACTIVE", responded_at: new Date().toISOString() });

  if (error) {
    if (error.code === "23505") {
      // The unique(patient_id, provider_id) constraint fired — a row for
      // this pair already exists. Look it up so the UI can distinguish
      // an already-ACTIVE connection from a still-PENDING request (which
      // just needs approving, not a generic "already connected" dead end)
      // rather than collapsing both into the same message.
      const { data: existing } = await supabase
        .from("patient_provider_connections")
        .select("id, status")
        .eq("patient_id", patientProfile.id)
        .eq("provider_id", provider.id)
        .maybeSingle();

      if (existing?.status === "PENDING") {
        return {
          error: "This patient already has a pending request with you. Approve or decline it below.",
          existingConnectionId: existing.id,
          existingStatus: "PENDING",
        };
      }
      if (existing?.status === "DECLINED") {
        return { error: "You previously declined this patient's request." };
      }
      return { error: "This patient is already connected to you." };
    }
    console.error("[invitePatient] insert failed:", error);
    return { error: "Could not connect this patient." };
  }

  revalidatePath("/provider/patients");
  revalidatePath("/provider/requests");
  return { success: true };
}
