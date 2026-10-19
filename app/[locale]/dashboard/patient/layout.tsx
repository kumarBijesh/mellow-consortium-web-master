import { createClient } from "@/lib/supabase/server";
import PatientDashboardShell from "@/components/patient/PatientDashboardShell";

export default async function PatientDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Nav badge = conversations with unread messages, not total conversation
  // count (the messages list page already shows the total once you're in
  // it — an unread count is the more useful nav-level signal).
  let unreadConversations = 0;
  if (user) {
    const { data: activeConnections } = await supabase
      .from("patient_provider_connections")
      .select("id")
      .eq("patient_id", user.id)
      .eq("status", "ACTIVE");
    const connectionIds = (activeConnections ?? []).map((c) => c.id);
    if (connectionIds.length > 0) {
      const { data: unreadRows } = await supabase
        .from("messages")
        .select("connection_id")
        .in("connection_id", connectionIds)
        .neq("sender_id", user.id)
        .is("read_at", null);
      unreadConversations = new Set((unreadRows ?? []).map((m) => m.connection_id)).size;
    }
  }

  return (
    <PatientDashboardShell userEmail={user?.email} unreadConversations={unreadConversations}>
      {children}
    </PatientDashboardShell>
  );
}
