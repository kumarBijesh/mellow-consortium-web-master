"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createLocation(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state_province = String(formData.get("state_province") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const postal_code = String(formData.get("postal_code") ?? "").trim();

  if (!name || !country) {
    return { error: "Location name and country are required." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: hospital } = await supabase.from("hospitals").select("id").eq("user_id", user.id).maybeSingle();
  if (!hospital) return { error: "No hospital account found for this session." };

  const { error } = await supabase.from("locations").insert({
    hospital_id: hospital.id,
    name,
    address: address || null,
    city: city || null,
    state_province: state_province || null,
    country,
    postal_code: postal_code || null,
  });

  if (error) return { error: "Could not create location." };

  revalidatePath("/hospital/locations");
  revalidatePath("/hospital/providers");
  revalidatePath("/hospital");
  return { success: true };
}

export async function updateLocation(locationId: string, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state_province = String(formData.get("state_province") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const postal_code = String(formData.get("postal_code") ?? "").trim();

  if (!name || !country) return { error: "Location name and country are required." };

  const supabase = createClient();
  const { error } = await supabase
    .from("locations")
    .update({
      name,
      address: address || null,
      city: city || null,
      state_province: state_province || null,
      country,
      postal_code: postal_code || null,
    })
    .eq("id", locationId);

  if (error) return { error: "Could not update location." };

  revalidatePath("/hospital/locations");
  revalidatePath("/hospital/providers");
  revalidatePath("/hospital");
  return { success: true };
}

export async function deleteLocation(locationId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();
  const { error } = await supabase.from("locations").delete().eq("id", locationId);

  if (error) return { error: "Could not delete location." };

  revalidatePath("/hospital/locations");
  revalidatePath("/hospital/providers");
  revalidatePath("/hospital");
  return { success: true };
}
