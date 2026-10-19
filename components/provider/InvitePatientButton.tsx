"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { invitePatient } from "@/lib/actions/connections";
import RequestActions from "@/components/provider/RequestActions";

export default function InvitePatientButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingConnectionId, setPendingConnectionId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    setPendingConnectionId(null);
    const result = await invitePatient(email);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      if (result.existingStatus === "PENDING" && result.existingConnectionId) {
        setPendingConnectionId(result.existingConnectionId);
      }
      return;
    }
    setSuccess(true);
    setEmail("");
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary !px-4 !py-2.5 text-[13.5px]">
        + Invite patient
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="patient@email.com"
          className="rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue"
        />
        <button type="submit" disabled={saving} className="btn-primary !px-4 !py-2.5 text-[13.5px] disabled:opacity-40">
          {saving ? "Connecting…" : "Connect"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
            setPendingConnectionId(null);
          }}
          className="text-[12.5px] text-muted dark:text-white/50 hover:text-ink dark:hover:text-white transition"
        >
          Cancel
        </button>
      </form>
      {error && <p className="text-[12px] text-red-500 text-right max-w-[280px]">{error}</p>}
      {pendingConnectionId && (
        <div className="flex flex-col items-end gap-1.5 rounded-[10px] border border-line dark:border-white/10 p-3">
          <p className="text-[11.5px] text-muted dark:text-white/60">Respond to their pending request:</p>
          <RequestActions
            connectionId={pendingConnectionId}
            onResolved={() => {
              setPendingConnectionId(null);
              setError(null);
              setOpen(false);
            }}
          />
        </div>
      )}
      {success && <p className="text-[12px] text-teal">Patient connected.</p>}
    </div>
  );
}
