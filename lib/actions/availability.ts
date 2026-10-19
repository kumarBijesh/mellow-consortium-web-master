"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveAvailability(
  providerId: string,
  slots: { date: string; time: string; available: boolean }[]
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();

  const rows = slots.map((s) => ({
    provider_id: providerId,
    slot_date: s.date,
    slot_time: s.time,
    available: s.available,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("provider_availability").upsert(rows, { onConflict: "provider_id,slot_date,slot_time" });

  if (error) {
    console.error("[saveAvailability] failed:", error);
    return { error: "Could not save availability." };
  }

  revalidatePath("/hospital/schedule");
  return { success: true };
}
