import { getTranslations } from "next-intl/server";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import DocumentsPanel from "@/components/documents/DocumentsPanel";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const t = await getTranslations("PatientDashboard.pages.documents");
  const supabase = createClient();
  const user = await getCurrentUser();

  const [{ data: documents, error }, { data: connections }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, file_path, file_name, category, uploaded_by, created_at")
      .eq("patient_id", user?.id ?? "")
      .order("created_at", { ascending: false }),
    supabase
      .from("patient_provider_connections")
      .select("id, provider_profiles(name)")
      .eq("patient_id", user?.id ?? "")
      .eq("status", "ACTIVE"),
  ]);

  const connectionOptions = (connections ?? []).map((c) => ({
    id: c.id,
    label: (c.provider_profiles as unknown as { name: string } | null)?.name ?? t("providerFallback"),
  }));

  return (
    <div>
      <h1 className="text-[26px] text-navy dark:text-white mb-1">{t("title")}</h1>
      <p className="text-muted dark:text-white/60 text-[14.5px] mb-10">{t("subtitle")}</p>

      {error && (
        <p className="text-[14px] text-red-600 mb-8">
          {t("loadError", { file1: "supabase/patient-dashboard.sql", file2: "supabase/documents-connection-scoped.sql" })}
        </p>
      )}

      <DocumentsPanel
        patientId={user?.id ?? ""}
        viewerId={user?.id ?? ""}
        documents={documents ?? []}
        title={t("panelTitle")}
        connectionOptions={connectionOptions}
      />
    </div>
  );
}
