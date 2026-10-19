"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { updateMeetingUrl } from "@/lib/actions/connections";

export default function MeetingRoomForm({ meetingUrl }: { meetingUrl: string | null }) {
  const router = useRouter();
  const [url, setUrl] = useState(meetingUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    const formData = new FormData();
    formData.set("meeting_url", url);
    const result = await updateMeetingUrl(formData);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <div>
      <p className="text-[13.5px] text-muted dark:text-white/60 mb-4">
        Your dedicated video room link is stored on your profile. Share it with patients to start a teleconsultation.
      </p>

      {meetingUrl ? (
        <a
          href={meetingUrl}
          target="_blank"
          rel="noreferrer"
          className="block rounded-[14px] border border-line dark:border-white/10 p-5 mb-5 text-blue hover:underline break-all text-[14px]"
        >
          {meetingUrl}
        </a>
      ) : (
        <div className="rounded-[14px] border border-line dark:border-white/10 p-5 mb-5 text-center text-muted dark:text-white/60 text-[13.5px]">
          No video room configured yet.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="meeting_url" className="block text-[13.5px] font-semibold text-navy dark:text-white">
          Video room URL (Whereby, Daily.co, Zoom, etc.)
        </label>
        <input
          id="meeting_url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://whereby.com/your-room-name"
          className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
        />
        {error && <p className="text-[12.5px] text-red-600">{error}</p>}
        {success && <p className="text-[12.5px] text-teal">Saved.</p>}
        <button type="submit" disabled={saving} className="btn-primary !px-4 !py-2.5 text-[13.5px] disabled:opacity-40">
          {saving ? "Saving…" : "Save room link"}
        </button>
      </form>
    </div>
  );
}
