import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import EventForm from "@/components/admin/network/EventForm";
import { strOrNull, parseTags } from "@/lib/events-constants";
import { isRenderableImageUrl } from "@/lib/image-url";

export const dynamic = "force-dynamic";

async function createEvent(_prevState: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  "use server";
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const eventType = String(formData.get("event_type") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "").trim();
  if (!title || !slug || !description || !eventType || !startDate) {
    return { error: "Title, slug, description, type, and start date are required." };
  }

  const coverImageUrl = strOrNull(formData.get("cover_image_url"));
  if (coverImageUrl && !isRenderableImageUrl(coverImageUrl)) {
    return { error: "Cover image URL must be an https link hosted on Supabase storage (*.supabase.co)." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("events").insert({
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
  });

  if (error) {
    console.error("[admin/network/events] insert failed:", error);
    return { error: `${error.code ? `[${error.code}] ` : ""}${error.message}` };
  }

  revalidatePath("/admin/network/events");
  revalidatePath("/conferences");
  return {};
}

export default async function AdminEventsPage() {
  const supabase = createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, event_type, start_date")
    .order("start_date", { ascending: true });

  return (
    <div>
      <Link href="/admin/network" className="text-[13.5px] font-semibold text-teal hover:text-ink dark:text-white transition mb-6 inline-block">
        &larr; Network
      </Link>
      <h1 className="text-[26px] font-display font-bold text-ink dark:text-white mb-1">Events</h1>
      <p className="text-[13.5px] text-muted dark:text-white/40 mb-8">Backs the public /conferences page.</p>

      {error && (
        <div className="text-[14px] text-red-300 mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="font-mono text-[12.5px] break-all">{error.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-2.5">
          {(events ?? []).map((ev) => (
            <Link
              key={ev.id}
              href={`/admin/network/events/${ev.id}`}
              className="adm-card flex items-center justify-between p-4 hover:border-teal/30 transition"
            >
              <span className="text-[14.5px] text-ink dark:text-white">{ev.title}</span>
              <span className="text-[12px] uppercase tracking-wide text-muted dark:text-white/40">
                {ev.event_type} · {new Date(`${ev.start_date}T00:00:00`).toLocaleDateString()}
              </span>
            </Link>
          ))}
          {(!events || events.length === 0) && !error && <p className="text-muted dark:text-white/30 text-[14px]">No events yet.</p>}
        </div>

        <div className="adm-card p-5 h-fit">
          <h2 className="text-[15px] font-semibold text-ink dark:text-white mb-4">New event</h2>
          <EventForm action={createEvent} />
        </div>
      </div>
    </div>
  );
}
