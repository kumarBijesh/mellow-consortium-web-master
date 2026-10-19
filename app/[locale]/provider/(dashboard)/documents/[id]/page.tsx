import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DocumentsPanel from "@/components/documents/DocumentsPanel";

export const dynamic = "force-dynamic";

export default async function ProviderDocumentsThreadPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: connection } = await supabase
    .from("patient_provider_connections")
    .select("id, patient_id, status, provider_profiles(provider_user_id)")
    .eq("id", params.id)
    .maybeSingle();

  const provider = connection?.provider_profiles as unknown as { provider_user_id: string | null } | null;
  if (!connection || connection.status !== "ACTIVE" || provider?.provider_user_id !== user?.id) notFound();

  const [{ data: patient }, { data: documents }] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", connection.patient_id).maybeSingle(),
    supabase
      .from("documents")
      .select("id, file_path, file_name, category, uploaded_by, created_at")
      .eq("connection_id", connection.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <Link href="/provider/documents" className="text-[13px] text-muted dark:text-white/60 hover:text-navy dark:text-white transition">
        ← All documents
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-[22px] text-navy dark:text-white">{patient?.full_name || "Unnamed patient"}</h1>
        {patient?.email && <p className="text-[13.5px] text-muted dark:text-white/60 mt-1">{patient.email}</p>}
      </div>

      <DocumentsPanel
        patientId={connection.patient_id}
        viewerId={user?.id ?? ""}
        documents={documents ?? []}
        title="Patient documents"
        connectionId={connection.id}
      />
    </div>
  );
}
