"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "submitting" | "success" | "error";

// Values stored in the DB as-is (contact_messages.reason) — only the
// displayed label is translated (via ContactForm.reasons.<value>).
const REASONS = ["Individual", "Provider", "Hospital", "Researcher", "Partner", "Other"] as const;

export default function ContactForm() {
  const t = useTranslations("ContactForm");
  const [status, setStatus] = useState<Status>("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [reason, setReason] = useState<(typeof REASONS)[number]>("Individual");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const supabase = createClient();
    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      organization: organization.trim() || null,
      reason,
      message,
    });

    setStatus(error ? "error" : "success");
  }

  if (status === "success") {
    return (
      <div className="rounded-card border border-line dark:border-white/10 bg-white dark:bg-white/[0.03] p-8 text-center">
        <p className="text-[16px] font-semibold text-navy dark:text-white mb-1.5">{t("successTitle")}</p>
        <p className="text-muted dark:text-white/60 text-[14px]">{t("successBody")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
            {t("nameLabel")}
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
            {t("emailLabel")}
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
          />
        </div>
      </div>

      <div>
        <label htmlFor="organization" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
          {t("organizationLabel")} <span className="text-muted dark:text-white/40 font-normal">{t("organizationOptional")}</span>
        </label>
        <input
          id="organization"
          type="text"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
        />
      </div>

      <div>
        <label htmlFor="reason" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
          {t("reasonLabel")}
        </label>
        <select
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value as (typeof REASONS)[number])}
          className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
        >
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {t(`reasons.${r}`)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
          {t("messageLabel")}
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue resize-none"
        />
      </div>

      {status === "error" && <p className="text-[13.5px] text-red-600">{t("errorMessage")}</p>}

      <button type="submit" disabled={status === "submitting"} className="btn-primary disabled:opacity-50">
        {status === "submitting" ? t("sending") : t("sendMessage")}
      </button>
    </form>
  );
}
