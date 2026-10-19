"use client";

import { useState } from "react";
import { sendMessage } from "@/lib/actions/connections";

type PatientOption = { connectionId: string; name: string };

export default function ShareMeetingLinkForm({ meetingUrl, patients }: { meetingUrl: string | null; patients: PatientOption[] }) {
  const [connectionId, setConnectionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!meetingUrl) {
      setError("Save a room link first.");
      return;
    }
    if (!connectionId) {
      setError("Choose a patient.");
      return;
    }
    setSending(true);
    setError(null);
    setSuccess(false);
    const result = await sendMessage(connectionId, `Join our video consultation here: ${meetingUrl}`);
    setSending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  }

  return (
    <div>
      <p className="text-[13.5px] text-muted dark:text-white/60 mb-5">
        Select a patient to send them your video room link via the messaging system.
      </p>

      <label htmlFor="patient" className="block text-[13px] font-semibold text-navy dark:text-white mb-1.5">
        Patient
      </label>
      <select
        id="patient"
        value={connectionId}
        onChange={(e) => setConnectionId(e.target.value)}
        className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-4 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue mb-4"
      >
        <option value=""></option>
        {patients.map((p) => (
          <option key={p.connectionId} value={p.connectionId}>
            {p.name}
          </option>
        ))}
      </select>

      {error && <p className="text-[12.5px] text-red-600 mb-3">{error}</p>}
      {success && <p className="text-[12.5px] text-teal mb-3">Sent.</p>}

      <button type="button" onClick={handleSend} disabled={sending} className="btn-secondary w-full text-[13.5px] disabled:opacity-40">
        {sending ? "Sending…" : "Send room invite via message"}
      </button>
    </div>
  );
}
