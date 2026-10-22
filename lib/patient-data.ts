import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getPatientUnreadConversations = cache(async (userId: string) => {
  const supabase = createClient();
  const { data: activeConnections } = await supabase
    .from("patient_provider_connections")
    .select("id")
    .eq("patient_id", userId)
    .eq("status", "ACTIVE");
  const connectionIds = (activeConnections ?? []).map((c) => c.id);
  if (connectionIds.length === 0) return 0;

  const { data: unreadRows } = await supabase
    .from("messages")
    .select("connection_id")
    .in("connection_id", connectionIds)
    .neq("sender_id", userId)
    .is("read_at", null);
  return new Set((unreadRows ?? []).map((m) => m.connection_id)).size;
});
