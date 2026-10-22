import { createClient, getCurrentUser } from "@/lib/supabase/server";
import PatientDashboardShell from "@/components/patient/PatientDashboardShell";
import { getPatientUnreadConversations } from "@/lib/patient-data";

export default async function PatientDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const unreadConversations = user ? await getPatientUnreadConversations(user.id) : 0;

  return (
    <PatientDashboardShell userEmail={user?.email} unreadConversations={unreadConversations}>
      {children}
    </PatientDashboardShell>
  );
}
