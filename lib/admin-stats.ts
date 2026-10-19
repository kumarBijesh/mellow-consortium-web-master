import "server-only";
import { createClient } from "@/lib/supabase/server";

// Pricing used for the revenue *projection* only — there's no payment
// integration in this project, so this is never real billing data. Same
// honest framing as the reference: "figures below are projections only
// based on current user counts × your pricing model."
export const PRICING = {
  hospital: 299,
  provider: 99,
  patient: 2,
};

export type AdminStats = {
  hospitals: number;
  providers: number;
  patients: number;
  admins: number;
  totalUsers: number;
  projectedMRR: number;
  labReportUploads: number;
  // No risk-scoring model exists anywhere in this project (see the
  // biological-age discussion elsewhere) — always 0, never fabricated.
  highRiskAlerts: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = createClient();

  const [{ count: hospitals }, { count: providers }, { count: profiles }, { count: admins }, labReportsResult] =
    await Promise.all([
      supabase.from("hospitals").select("id", { count: "exact", head: true }),
      supabase.from("provider_profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("admins").select("user_id", { count: "exact", head: true }),
      // `category` only exists once patient-provider-documents-and-single-
      // connection.sql has been run — fall back to 0 rather than break the
      // whole dashboard if that migration hasn't landed yet.
      supabase.from("documents").select("id", { count: "exact", head: true }).eq("category", "Lab reports"),
    ]);
  const labReportUploads = labReportsResult.error ? 0 : (labReportsResult.count ?? 0);

  // Every admin account also gets a `profiles` row (the signup trigger
  // doesn't distinguish admins from patients), so subtract admins out to
  // get a true patient count — same fix already applied on the Overview
  // page before this shared helper existed.
  const patients = Math.max((profiles ?? 0) - (admins ?? 0), 0);
  const hospitalsCount = hospitals ?? 0;
  const providersCount = providers ?? 0;
  const adminsCount = admins ?? 0;

  const projectedMRR = hospitalsCount * PRICING.hospital + providersCount * PRICING.provider + patients * PRICING.patient;

  return {
    hospitals: hospitalsCount,
    providers: providersCount,
    patients,
    admins: adminsCount,
    totalUsers: hospitalsCount + providersCount + patients + adminsCount,
    projectedMRR,
    labReportUploads,
    highRiskAlerts: 0,
  };
}
