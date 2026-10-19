"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { isTransientEmailServiceError } from "@/lib/email-errors";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setServiceError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    setLoading(false);

    // A genuine service-side failure (rate limit hit, SMTP down) is worth
    // telling the user about — anything else, including "no account with
    // that email," stays behind the same generic message on purpose, so
    // this form can't be used to check which emails have admin accounts.
    if (error && isTransientEmailServiceError(error)) {
      setServiceError("We couldn't send the email right now. Our email service is temporarily unavailable. Please try again in a few minutes.");
      return;
    }

    setSubmitted(true);
  }

  return (
    <main className="py-32">
      <div className="wrap max-w-[400px]">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted dark:text-white/60">Staff access</span>
        <h1 className="text-[26px] mt-3 mb-8 text-navy dark:text-white">Reset password</h1>

        {submitted ? (
          <p className="text-[14.5px] text-ink dark:text-white">
            If that email is registered, we&apos;ve sent a reset link. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
              />
            </div>
            {serviceError && <p className="text-[13.5px] text-red-600">{serviceError}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-[13.5px] text-muted dark:text-white/60 mt-6">
          <Link href="/admin/login" className="text-blue font-semibold hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
