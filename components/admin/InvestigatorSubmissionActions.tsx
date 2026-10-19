"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { approveInvestigatorRegistration, rejectInvestigatorRegistration } from "@/lib/actions/investigator-registrations";
import InstitutionPicker from "@/components/admin/network/InstitutionPicker";

type Institution = { id: string; name: string };

export default function InvestigatorSubmissionActions({
  registrationId,
  status,
  institutions,
  suggestedInstitutionId,
  applicantInstitution,
}: {
  registrationId: string;
  status: string;
  institutions: Institution[];
  suggestedInstitutionId: string;
  // What the applicant typed, used to pre-fill "+ Add institute".
  applicantInstitution: { name: string; country: string };
}) {
  const router = useRouter();
  const [choosing, setChoosing] = useState(false);
  const [institutionId, setInstitutionId] = useState(suggestedInstitutionId);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setBusy("approve");
    setError(null);
    const result = await approveInvestigatorRegistration(registrationId, institutionId);
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
    const result = await rejectInvestigatorRegistration(registrationId);
    setBusy(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (status === "approved") {
    return <span className="adm-pill adm-pill-active">Approved</span>;
  }
  if (status === "rejected") {
    return <span className="adm-pill adm-pill-inactive">Rejected</span>;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && <p className="text-[12px] text-red-500 max-w-[260px] text-right">{error}</p>}

      {choosing ? (
        <div className="flex flex-col items-end gap-2">
          <div className="w-[300px]">
            <InstitutionPicker
              institutions={institutions}
              name={`institution-${registrationId}`}
              label="Link to institution"
              defaultValue={suggestedInstitutionId}
              onChange={setInstitutionId}
              prefill={applicantInstitution}
              compact
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setChoosing(false)}
              className="text-[11.5px] text-muted dark:text-white/40 hover:text-ink dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!!busy || !institutionId}
              onClick={handleApprove}
              className="adm-btn-primary !py-1.5 !px-3 !text-[12.5px] disabled:opacity-40"
            >
              {busy === "approve" ? "Approving…" : "Confirm approve"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button type="button" disabled={!!busy} onClick={handleReject} className="btn-chip-danger disabled:opacity-40">
            {busy === "reject" ? "…" : "Reject"}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => setChoosing(true)}
            className="adm-btn-primary !py-2 !px-4 !text-[13px] disabled:opacity-40"
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
}
