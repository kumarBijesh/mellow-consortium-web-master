"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import InvestigatorInquiryForm from "@/components/network-map/InvestigatorInquiryForm";

// Primary action is the investigator inquiry (lands in the admin Inquiries
// inbox, tied to this investigator); the discovery call is only a
// secondary link, since that form is the membership sales flow.
export default function InvestigatorContact({
  investigatorId,
  investigatorName,
  institutionId,
  institutionName,
}: {
  investigatorId: string;
  investigatorName: string;
  institutionId: string | null;
  institutionName: string;
}) {
  const t = useTranslations("Investigators");
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-meadow/25 bg-darkgreen/40 p-6">
      <h2 className="text-[18px] font-brand font-bold text-white">{t("detail.ctaHeading", { name: investigatorName })}</h2>
      <p className="text-[14px] text-pistachio/80 mt-1.5">{t("detail.ctaBody")}</p>
      {open ? (
        <InvestigatorInquiryForm
          investigatorId={investigatorId}
          investigatorName={investigatorName}
          institutionId={institutionId}
          institutionName={institutionName}
          onClose={() => setOpen(false)}
        />
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="mkt-btn-primary w-full mt-5">
          {t("detail.ctaButton")}
        </button>
      )}
      <p className="text-[13px] text-pistachio/60 mt-5 pt-4 border-t border-white/10">
        {t("detail.membershipPrompt")}{" "}
        <Link href="/discovery-call" className="font-semibold text-meadow hover:text-white transition">
          {t("detail.membershipLink")} <span className="inline-block rtl:-scale-x-100">→</span>
        </Link>
      </p>
    </div>
  );
}
