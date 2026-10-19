"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { respondToConnection } from "@/lib/actions/connections";

export default function RequestActions({ connectionId, onResolved }: { connectionId: string; onResolved?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(accept: boolean) {
    setBusy(accept ? "accept" : "decline");
    setError(null);
    const result = await respondToConnection(connectionId, accept);
    setBusy(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    onResolved?.();
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button type="button" disabled={busy !== null} onClick={() => respond(false)} className="btn-chip-danger disabled:opacity-40">
          {busy === "decline" ? "Declining…" : "Decline"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => respond(true)}
          className="btn-primary !px-5 !py-2.5 text-[13px] disabled:opacity-40"
        >
          {busy === "accept" ? "Accepting…" : "Accept"}
        </button>
      </div>
      {error && <p className="text-[12.5px] text-red-600">{error}</p>}
    </div>
  );
}
