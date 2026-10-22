import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import MessageThread from "@/components/messaging/MessageThread";
import RecommendationsPanel from "@/components/provider/RecommendationsPanel";
import VisitsPanel from "@/components/provider/VisitsPanel";
import DocumentsPanel from "@/components/documents/DocumentsPanel";
import BiomarkerReportsPanel from "@/components/provider/BiomarkerReportsPanel";
import CarePlanForm from "@/components/provider/CarePlanForm";

export const dynamic = "force-dynamic";

export default async function ProviderPatientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: connection } = await supabase
    .from("patient_provider_connections")
    .select("id, patient_id, status")
    .eq("id", params.id)
    .maybeSingle();

  if (!connection || connection.status !== "ACTIVE") notFound();

  const [{ data: patient }, { data: messages }, { data: recommendations }, { data: visits }, { data: documents }, { data: biomarkerReports }, { data: carePlan }] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", connection.patient_id).maybeSingle(),
    supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("connection_id", connection.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("provider_recommendations")
      .select("id, body, created_at")
      .eq("connection_id", connection.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("visits")
      .select("id, visit_date, diagnosis, notes")
      .eq("connection_id", connection.id)
      .order("visit_date", { ascending: false }),
    supabase
      .from("documents")
      .select("id, file_path, file_name, category, uploaded_by, created_at")
      .eq("connection_id", connection.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("biomarker_reports")
      .select("id, recorded_date, biological_age, chronological_age, crp, glucose, risk_level, notes")
      .eq("connection_id", connection.id)
      .order("recorded_date", { ascending: false }),
    supabase
      .from("care_plans")
      .select("diet_plan, exercise_protocol, yoga, meditation, medications, cautions, clinical_note")
      .eq("connection_id", connection.id)
      .maybeSingle(),
  ]);

  return (
    <div>
      <Link href="/provider/patients" className="text-[13px] text-muted dark:text-white/60 hover:text-navy dark:text-white transition">
        ← All patients
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-[26px] text-navy dark:text-white">{patient?.full_name || "Unnamed patient"}</h1>
        <p className="text-[13.5px] text-muted dark:text-white/60 mt-1">{patient?.email ?? ""}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section>
          <h2 className="text-[15px] font-semibold text-navy dark:text-white mb-4">Messages</h2>
          <MessageThread connectionId={connection.id} currentUserId={user?.id ?? ""} messages={messages ?? []} />
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-navy dark:text-white mb-4">Recommendations</h2>
          <RecommendationsPanel
            connectionId={connection.id}
            patientId={connection.patient_id}
            recommendations={recommendations ?? []}
          />
        </section>

        <section className="lg:col-span-2">
          <h2 className="text-[15px] font-semibold text-navy dark:text-white mb-4">Visits &amp; diagnoses</h2>
          <VisitsPanel connectionId={connection.id} patientId={connection.patient_id} visits={visits ?? []} />
        </section>

        <section className="lg:col-span-2">
          <h2 className="text-[15px] font-semibold text-navy dark:text-white mb-4">Biomarker reports</h2>
          <BiomarkerReportsPanel connectionId={connection.id} patientId={connection.patient_id} reports={biomarkerReports ?? []} />
        </section>

        <section className="lg:col-span-2">
          <h2 className="text-[15px] font-semibold text-navy dark:text-white mb-1">Care plan builder</h2>
          <p className="text-[12.5px] text-muted dark:text-white/60 mb-4">Pushes to the patient app when saved.</p>
          <CarePlanForm connectionId={connection.id} patientId={connection.patient_id} plan={carePlan ?? null} />
        </section>

        <section className="lg:col-span-2">
          <h2 className="text-[15px] font-semibold text-navy dark:text-white mb-4">Documents</h2>
          <DocumentsPanel
            patientId={connection.patient_id}
            viewerId={user?.id ?? ""}
            documents={documents ?? []}
            title="Patient documents"
            connectionId={connection.id}
          />
        </section>
      </div>
    </div>
  );
}
