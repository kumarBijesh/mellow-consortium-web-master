"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "submitting" | "success" | "error";

export default function NewsletterForm() {
  const t = useTranslations("NewsletterForm");
  const [status, setStatus] = useState<Status>("idle");
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const supabase = createClient();
    const { error } = await supabase.from("newsletter_subscribers").insert({ email });

    if (error) {
      // Unique-constraint violation just means they're already subscribed —
      // treat that as success rather than surfacing a confusing error.
      setStatus(error.code === "23505" ? "success" : "error");
      return;
    }
    setStatus("success");
  }

  if (status === "success") {
    return <p className="text-[13px] text-meadow font-semibold mt-3.5">{t("subscribed")}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-3.5 max-w-[320px]">
      <label htmlFor="newsletter-email" className="sr-only">
        {t("emailAddressSr")}
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("placeholder")}
        className="flex-1 rounded-[9px] border border-white/[.16] bg-white/5 dark:bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-white placeholder:text-pistachio/50 focus:outline-none focus:ring-2 focus:ring-meadow"
      />
      <button type="submit" disabled={status === "submitting"} className="mkt-btn-primary !px-4 !py-2.5 !text-[13px]">
        {status === "submitting" ? "…" : t("join")}
      </button>
      {status === "error" && <p className="text-[12px] text-red-400 mt-1">{t("error")}</p>}
    </form>
  );
}
