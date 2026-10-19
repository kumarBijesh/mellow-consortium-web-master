"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { ORGANIZATION_TYPES, PARTNERSHIP_INTERESTS } from "@/lib/inquiries-constants";

type Status = "idle" | "submitting" | "success" | "error";

// Institution-level inquiries (no specific investigator picked) store this
// in investigator_name, which is NOT NULL; admins see it in the inbox as
// "Re: General institution inquiry at <institution>".
export const INSTITUTION_INQUIRY_LABEL = "General institution inquiry";

export default function InvestigatorInquiryForm({
  investigatorId,
  investigatorName,
  displayName,
  institutionId,
  institutionName,
  onClose,
}: {
  investigatorId: string | null;
  investigatorName: string;
  // Who the visitor sees they're contacting; defaults to investigatorName.
  displayName?: string;
  institutionId: string | null;
  institutionName: string;
  onClose: () => void;
}) {
  const t = useTranslations("InvestigatorInquiry");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.from("investigator_inquiries").insert({
      investigator_id: investigatorId,
      institution_id: institutionId,
      investigator_name: investigatorName,
      institution_name: institutionName,
      first_name: String(form.get("first_name") ?? "").trim(),
      last_name: String(form.get("last_name") ?? "").trim(),
      company_institution: String(form.get("company_institution") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      organization_type: String(form.get("organization_type") ?? ""),
      partnership_interest: String(form.get("partnership_interest") ?? ""),
      message: String(form.get("message") ?? "").trim() || null,
    });

    setStatus(error ? "error" : "success");
  }

  return (
    <div className="mt-2 mb-1 rounded-[14px] border border-meadow/25 bg-white/[.05] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[13px] font-bold text-white">{t("title")}</p>
          <p className="text-[11.5px] text-[#a9c0d5]">{t("requestingIntro", { name: displayName ?? investigatorName })}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("cancel")}
          className="text-[#8fe3dd] hover:text-white text-[15px] leading-none px-1"
        >
          ✕
        </button>
      </div>

      {status === "success" ? (
        <p className="text-[13px] text-meadow font-medium py-2">{t("success")}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <IqField name="first_name" label={t("firstName")} required />
            <IqField name="last_name" label={t("lastName")} required />
          </div>
          <IqField name="company_institution" label={t("companyInstitution")} required />
          <div className="grid grid-cols-2 gap-2.5">
            <IqField name="email" label={t("email")} type="email" required />
            <IqField name="phone" label={t("phone")} type="tel" required />
          </div>
          <IqSelect
            name="organization_type"
            label={t("organizationType")}
            required
            placeholder={t("selectPlaceholder")}
            options={ORGANIZATION_TYPES.map((v) => ({ value: v, label: t(`orgTypes.${v}`) }))}
          />
          <IqSelect
            name="partnership_interest"
            label={t("partnershipInterest")}
            required
            placeholder={t("selectPlaceholder")}
            options={PARTNERSHIP_INTERESTS.map((v) => ({ value: v, label: t(`interests.${v}`) }))}
          />
          <div>
            <label className="block text-[11.5px] font-semibold text-[#c3ddd4] mb-1">{t("message")}</label>
            <textarea
              name="message"
              rows={3}
              className="w-full rounded-[9px] border border-white/15 bg-white/[.04] px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-meadow"
            />
          </div>

          {status === "error" && <p className="text-[12px] text-red-400">{t("error")}</p>}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full mkt-btn-primary !py-2.5 !text-[13px] disabled:opacity-60"
          >
            {status === "submitting" ? t("submitting") : t("submit")}
          </button>
        </form>
      )}
    </div>
  );
}

function IqField({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11.5px] font-semibold text-[#c3ddd4] mb-1">
        {label}
        {required && <span className="text-meadow"> *</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-[9px] border border-white/15 bg-white/[.04] px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-meadow"
      />
    </div>
  );
}

function IqSelect({
  name,
  label,
  required,
  placeholder,
  options,
}: {
  name: string;
  label: string;
  required?: boolean;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[11.5px] font-semibold text-[#c3ddd4] mb-1">
        {label}
        {required && <span className="text-meadow"> *</span>}
      </label>
      <select
        name={name}
        required={required}
        defaultValue=""
        className="w-full rounded-[9px] border border-white/15 bg-white/[.04] px-3 py-2 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-meadow [&>option]:text-ink"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
