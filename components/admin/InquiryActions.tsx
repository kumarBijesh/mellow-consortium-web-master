"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { markInquiryContacted, markInquiryClosed } from "@/lib/actions/inquiries";

export default function InquiryActions({ inquiryId, status }: { inquiryId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "contacted" | "closed") {
    setBusy(action);
    setError(null);
    const result = await (action === "contacted" ? markInquiryContacted(inquiryId) : markInquiryClosed(inquiryId));
    setBusy(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (status === "closed") {
    return <span className="adm-pill adm-pill-inactive">Closed</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {error && <p className="text-[12px] text-red-500 max-w-[220px] text-right">{error}</p>}
      <div className="flex items-center gap-2">
        {status === "new" && (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => run("contacted")}
            className="adm-btn-ghost !py-1.5 !px-3 !text-[12.5px] disabled:opacity-40"
          >
            {busy === "contacted" ? "…" : "Mark contacted"}
          </button>
        )}
        <button
          type="button"
          disabled={!!busy}
          onClick={() => run("closed")}
          className="adm-btn-primary !py-1.5 !px-3 !text-[12.5px] disabled:opacity-40"
        >
          {busy === "closed" ? "…" : "Close"}
        </button>
      </div>
    </div>
  );
}
