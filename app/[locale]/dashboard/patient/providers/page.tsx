import { getTranslations } from "next-intl/server";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import ProviderDirectory, { type DirectoryProvider } from "@/components/patient/ProviderDirectory";

export const dynamic = "force-dynamic";

export default async function FindProviderPage() {
  const t = await getTranslations("PatientDashboard.pages.providers");
  const supabase = createClient();
  const user = await getCurrentUser();

  const [{ data: providers, error }, { data: connections }] = await Promise.all([
    supabase
      .from("provider_profiles")
      .select("id, name, specialty, hospitals(name), provider_locations(count)")
      .eq("status", "ACTIVE")
      .order("name"),
    supabase
      .from("patient_provider_connections")
      .select("provider_id, status")
      .eq("patient_id", user?.id ?? ""),
  ]);

  const connectionByProvider = new Map((connections ?? []).map((c) => [c.provider_id, c.status]));

  // Requires supabase/patient-provider-locations-read.sql — without it,
  // provider_locations has no patient read policy and this embed comes
  // back empty for every row under RLS (0, not an error).
  const directoryProviders: DirectoryProvider[] = (providers ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    specialty: p.specialty,
    hospitalName: (p.hospitals as unknown as { name: string } | null)?.name ?? t("unknownHospital"),
    locationCount: (p.provider_locations as unknown as { count: number }[] | undefined)?.[0]?.count ?? 0,
    status: connectionByProvider.get(p.id) ?? null,
  }));

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-1">{t("title")}</h1>
      <p className="text-muted dark:text-white/60 text-[14.5px] mb-10">{t("subtitle")}</p>

      {error && (
        <p className="text-[14px] text-red-600 mb-8">{t("loadError", { file: "supabase/provider-dashboard.sql" })}</p>
      )}

      {directoryProviders.length === 0 && !error ? (
        <p className="text-muted dark:text-white/60 text-[14.5px]">{t("empty")}</p>
      ) : (
        <ProviderDirectory providers={directoryProviders} />
      )}
    </div>
  );
}
