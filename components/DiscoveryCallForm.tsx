"use client";

import { useState } from "react";
import { submitDiscoveryCallRequest } from "@/lib/actions/discovery-call";
import { COLLABORATION_TYPES } from "@/lib/discovery-call-constants";

type Status = "idle" | "submitting" | "success" | "error";

export default function DiscoveryCallForm({ sourceTier }: { sourceTier: string | null }) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    const form = new FormData(e.currentTarget);
    const get = (name: string) => String(form.get(name) ?? "").trim();

    setStatus("submitting");
    const result = await submitDiscoveryCallRequest({
      full_name: get("full_name"),
      email: get("email"),
      organization: get("organization"),
      job_title: get("job_title") || null,
      area_of_expertise: get("area_of_expertise") || null,
      country: get("country") || null,
      collaboration_type: get("collaboration_type") || null,
      source_tier: sourceTier,
      message: get("message") || null,
    });

    if (result.error) {
      setStatus("error");
      setErrorMessage(result.error);
      return;
    }
    setStatus("success");
  }

  if (status === "success") {
    return (
      <div className="rounded-card border border-line dark:border-white/10 bg-lightblue/40 dark:bg-teal/[0.08] p-6">
        <h3 className="text-[18px] text-navy dark:text-white mb-2">Request received</h3>
        <p className="text-muted dark:text-white/60 text-[14px]">
          Thanks! Our team will get back to you to schedule a brief discovery call.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field name="full_name" label="Full Name" required />
        <Field name="email" label="Email Address" type="email" required />
      </div>
      <Field name="organization" label="Organization / Institution" required />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field name="job_title" label="Job Title / Role" />
        <Field name="area_of_expertise" label="Area of Expertise" />
      </div>
      <Field name="country" label="Country" />

      <div>
        <label className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">How would you like to collaborate?</label>
        <select
          name="collaboration_type"
          defaultValue=""
          className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink dark:bg-white/[0.04] dark:text-white px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
        >
          <option value="">Select...</option>
          {COLLABORATION_TYPES.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
          Message / Additional Information <span className="text-muted dark:text-white/40 font-normal">(optional)</span>
        </label>
        <textarea
          name="message"
          rows={4}
          className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
        />
      </div>

      {status === "error" && errorMessage && <p className="text-[13.5px] text-red-600">{errorMessage}</p>}

      <button type="submit" disabled={status === "submitting"} className="btn-primary w-full">
        {status === "submitting" ? "Submitting…" : "Request a Discovery Call"}
      </button>
    </form>
  );
}

function Field({
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
      <label className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
        {label}
        {required && <span className="text-blue"> *</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
      />
    </div>
  );
}
