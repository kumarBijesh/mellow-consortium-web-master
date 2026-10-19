"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { acceptApplication, rejectApplication, markInReview } from "@/lib/actions/applications";

type CreatedHospital = { id: string; name: string; kind: string } | null;

const KIND_LABELS: Record<string, string> = {
  external: "Hospital",
  individual_provider: "Individual Provider",
  internal: "Internal",
};

export default function ApplicationActions({
  applicationId,
  status,
  createdHospital,
}: {
  applicationId: string;
  status: string;
  createdHospital: CreatedHospital;
}) {
  const router = useRouter();
  const [choosing, setChoosing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept(kind: "external" | "individual_provider") {
    setBusy(kind);
    setError(null);
    const result = await acceptApplication(applicationId, kind);
    setBusy(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setChoosing(false);
    router.refresh();
  }

  async function handleReject() {
    setBusy("reject");
    setError(null);
    const result = await rejectApplication(applicationId);
    setBusy(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleInReview() {
    setBusy("in_review");
    setError(null);
    const result = await markInReview(applicationId);
    setBusy(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (status === "accepted") {
    return (
      <div className="text-right">
        <span className="adm-pill adm-pill-active">
          Accepted → {createdHospital ? (KIND_LABELS[createdHospital.kind] ?? createdHospital.kind) : "account created"}
        </span>
        {createdHospital && (
          <Link href={`/admin/hospitals/${createdHospital.id}`} className="block text-[12px] text-teal mt-1.5 hover:underline">
            View account →
          </Link>
        )}
      </div>
    );
  }

  if (status === "rejected") {
    return <span className="adm-pill adm-pill-inactive">Rejected</span>;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && <p className="text-[12px] text-red-500 max-w-[240px] text-right">{error}</p>}

      {choosing ? (
        <div className="flex flex-col items-end gap-2">
          <p className="text-[11px] font-semibold text-muted dark:text-white/50 uppercase tracking-wide">Accept as</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!!busy}
              onClick={() => handleAccept("external")}
              className="adm-btn-ghost !py-1.5 !px-3 !text-[12.5px] disabled:opacity-40"
            >
              {busy === "external" ? "Creating…" : "Hospital"}
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => handleAccept("individual_provider")}
              className="adm-btn-ghost !py-1.5 !px-3 !text-[12.5px] disabled:opacity-40"
            >
              {busy === "individual_provider" ? "Creating…" : "Individual Provider"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setChoosing(false)}
            className="text-[11.5px] text-muted dark:text-white/40 hover:text-ink dark:hover:text-white transition"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {status === "new" && (
            <button
              type="button"
              disabled={!!busy}
              onClick={handleInReview}
              className="text-[12.5px] font-semibold text-muted dark:text-white/50 hover:text-ink dark:hover:text-white transition disabled:opacity-40"
            >
              {busy === "in_review" ? "…" : "Mark in review"}
            </button>
          )}
          <button type="button" disabled={!!busy} onClick={handleReject} className="btn-chip-danger disabled:opacity-40">
            {busy === "reject" ? "…" : "Reject"}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => setChoosing(true)}
            className="adm-btn-primary !py-2 !px-4 !text-[13px] disabled:opacity-40"
          >
            Accept
          </button>
        </div>
      )}
    </div>
  );
}
