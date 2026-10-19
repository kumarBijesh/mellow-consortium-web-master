import { notFound, redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { TextField, TextAreaField, SelectField, CheckboxField } from "@/components/admin/AdminFields";
import EventImageUpload from "@/components/admin/network/EventImageUpload";
import { EVENT_TYPES, strOrNull, parseTags } from "@/lib/events-constants";
import { isRenderableImageUrl } from "@/lib/image-url";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: event } = await supabase.from("events").select("*").eq("id", params.id).maybeSingle();
  if (!event) notFound();

  async function updateEvent(formData: FormData) {
    "use server";
    const locale = await getLocale();
    const title = String(formData.get("title") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const eventType = String(formData.get("event_type") ?? "").trim();
    const startDate = String(formData.get("start_date") ?? "").trim();
    if (!title || !slug || !description || !eventType || !startDate) return;

    const coverImageUrl = strOrNull(formData.get("cover_image_url"));
    if (coverImageUrl && !isRenderableImageUrl(coverImageUrl)) {
      redirect(
        `/${locale}/admin/network/events/${params.id}?error=${encodeURIComponent("Cover image URL must be an https link hosted on Supabase storage (*.supabase.co).")}`
      );
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .update({
        title,
        slug,
        description,
        event_type: eventType,
        start_date: startDate,
        end_date: strOrNull(formData.get("end_date")),
        is_virtual: formData.get("is_virtual") === "on",
        location: strOrNull(formData.get("location")),
        tags: parseTags(formData.get("tags")),
        cover_image_url: coverImageUrl,
      })
      .eq("id", params.id);

    if (error) {
      console.error("[admin/network/events/[id]] update failed:", error);
      redirect(`/${locale}/admin/network/events/${params.id}?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/admin/network/events");
    revalidatePath("/conferences");
    revalidatePath(`/conferences/${slug}`);
  }

  async function deleteEvent() {
    "use server";
    const locale = await getLocale();
    const supabase = createClient();
    const { error } = await supabase.from("events").delete().eq("id", params.id);
    if (error) {
      console.error("[admin/network/events/[id]] delete failed:", error);
      redirect(`/${locale}/admin/network/events/${params.id}?error=${encodeURIComponent(error.message)}`);
    }
    revalidatePath("/admin/network/events");
    revalidatePath("/conferences");
    redirect(`/${locale}/admin/network/events`);
  }

  return (
    <div className="max-w-[560px]">
      <Link href="/admin/network/events" className="text-[13.5px] font-semibold text-teal hover:text-ink dark:text-white transition mb-6 inline-block">
        &larr; All events
      </Link>
      <h1 className="text-[24px] font-display font-bold text-ink dark:text-white mb-6">Edit event</h1>

      {searchParams.error && (
        <div className="text-[13px] text-red-300 mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="font-mono break-all">{searchParams.error}</p>
        </div>
      )}

      <form action={updateEvent} className="space-y-4">
        <TextField name="title" label="Title" required defaultValue={event.title} />
        <TextField name="slug" label="Slug" required defaultValue={event.slug} />
        <TextAreaField name="description" label="Description" required defaultValue={event.description} rows={4} />
        <SelectField
          name="event_type"
          label="Type"
          required
          options={EVENT_TYPES.map((t) => ({ value: t, label: t }))}
          defaultValue={event.event_type}
          placeholder=""
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField name="start_date" label="Start date" type="date" required defaultValue={event.start_date} />
          <TextField name="end_date" label="End date (optional)" type="date" defaultValue={event.end_date ?? ""} />
        </div>
        <CheckboxField name="is_virtual" label="Virtual / online event" defaultChecked={event.is_virtual} />
        <TextField name="location" label="Location (city, venue — ignored if virtual)" defaultValue={event.location ?? ""} />
        <TextField name="tags" label="Tags (comma-separated)" defaultValue={(event.tags ?? []).join(", ")} />
        <EventImageUpload name="cover_image_url" defaultValue={event.cover_image_url ?? ""} />
        <button type="submit" className="adm-btn-primary w-full">
          Save changes
        </button>
      </form>

      <form action={deleteEvent} className="mt-6">
        <button type="submit" className="text-[13px] font-semibold text-red-400 hover:text-red-300 transition">
          Delete event
        </button>
      </form>
    </div>
  );
}
