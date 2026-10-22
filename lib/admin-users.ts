import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type UnifiedUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "patient" | "hospital" | "provider";
  status: string;
  createdAt: string;
  hospitalName?: string;
};

export const getUnifiedUsers = cache(async function getUnifiedUsers(): Promise<{
  users: UnifiedUser[];
  error: { code?: string; message: string } | null;
}> {
  const supabase = createClient();

  const [{ data: profiles, error }, { data: admins }, { data: hospitals }, { data: providers }] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, created_at"),
    supabase.from("admins").select("user_id"),
    supabase.from("hospitals").select("id, user_id, name, admin_email, status, created_at"),
    supabase.from("provider_profiles").select("id, provider_user_id, name, email, status, created_at, hospital_id, hospitals(name)"),
  ]);

  const adminIds = new Set((admins ?? []).map((a) => a.user_id));

  const patientAndAdminUsers: UnifiedUser[] = (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.full_name || "",
    email: p.email ?? "",
    role: adminIds.has(p.id) ? "admin" : "patient",
    status: "Active",
    createdAt: p.created_at,
  }));

  const hospitalUsers: UnifiedUser[] = (hospitals ?? []).map((h) => ({
    id: h.user_id ?? h.id,
    name: h.name,
    email: h.admin_email,
    role: "hospital",
    status: h.status,
    createdAt: h.created_at,
  }));

  const providerUsers: UnifiedUser[] = (providers ?? []).map((p) => ({
    id: p.provider_user_id ?? p.id,
    name: p.name,
    email: p.email,
    role: "provider",
    status: p.status,
    createdAt: p.created_at,
    hospitalName: (p.hospitals as unknown as { name: string } | null)?.name,
  }));

  const users = [...patientAndAdminUsers, ...hospitalUsers, ...providerUsers].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return { users, error };
});
