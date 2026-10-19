"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import InvestigatorInquiryForm, { INSTITUTION_INQUIRY_LABEL } from "@/components/network-map/InvestigatorInquiryForm";

export type ContactInvestigator = {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  photoUrl: string | null;
};

// Investigator list plus the institution-level CTA. Both open the same
// inquiry form the network map uses, so every request lands in the admin
// Inquiries inbox; only one form is open at a time.
export default function InstitutionContact({
  institutionId,
  institutionName,
  investigators,
}: {
  institutionId: string;
  institutionName: string;
  investigators: ContactInvestigator[];
}) {
  const t = useTranslations("Institutions");
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      <section className="mt-14">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-[#8fe3dd] mb-4">{t("detail.investigatorsHeading")}</h2>
        {investigators.length === 0 ? (
          <p className="text-[14.5px] text-pistachio/70">{t("detail.noInvestigators")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {investigators.map((inv) => (
              <li key={inv.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {inv.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- storage URLs aren't in next/image's allowed hosts
                    <img src={inv.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover flex-none" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[16px] font-semibold text-white">
                      <Link href={`/investigators/${inv.id}`} className="hover:text-meadow transition">
                        {inv.name}
                      </Link>
                    </h3>
                    {inv.title && <p className="text-[13px] text-pistachio/70 mt-0.5">{inv.title}</p>}
                    {inv.bio && <p className="text-[14px] text-pistachio/80 mt-2.5 line-clamp-3">{inv.bio}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(open === inv.id ? null : inv.id)}
                    aria-expanded={open === inv.id}
                    className="self-start flex-none rounded-full border border-white/20 px-4 py-2 text-[13px] font-semibold text-white hover:border-meadow transition"
                  >
                    {t("detail.requestIntro")}
                  </button>
                </div>
                {open === inv.id && (
                  <InvestigatorInquiryForm
                    investigatorId={inv.id}
                    investigatorName={inv.name}
                    institutionId={institutionId}
                    institutionName={institutionName}
                    onClose={() => setOpen(null)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14 rounded-2xl border border-meadow/25 bg-darkgreen/40 p-7 sm:p-9">
        <h2 className="text-[22px] sm:text-[26px] font-brand font-bold text-white">
          {t("detail.ctaHeading", { name: institutionName })}
        </h2>
        <p className="text-pistachio/80 text-[15px] mt-2">{t("detail.ctaBody")}</p>
        {open === "institution" ? (
          <InvestigatorInquiryForm
            investigatorId={null}
            investigatorName={INSTITUTION_INQUIRY_LABEL}
            displayName={institutionName}
            institutionId={institutionId}
            institutionName={institutionName}
            onClose={() => setOpen(null)}
          />
        ) : (
          <button type="button" onClick={() => setOpen("institution")} className="mkt-btn-primary mt-6">
            {t("detail.ctaButton")}
          </button>
        )}
      </section>
    </>
  );
}
