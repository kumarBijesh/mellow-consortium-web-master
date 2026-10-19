"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProviderLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    // A valid password for a patient/admin/hospital account must not
    // silently gain provider access just because Supabase Auth accepted
    // the credentials — this form is provider-account-only.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: provider } = await supabase.from("provider_profiles").select("id").eq("provider_user_id", user!.id).maybeSingle();
    if (!provider) {
      await supabase.auth.signOut();
      setError("No provider account matches these credentials.");
      setLoading(false);
      return;
    }

    router.push("/provider");
    router.refresh();
  }

  return (
    <main className="py-32">
      <div className="wrap max-w-[400px]">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted dark:text-white/60">Provider access</span>
        <h1 className="text-[26px] mt-3 mb-8 text-navy dark:text-white">Provider sign in</h1>
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
          <div>
            <label htmlFor="password" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>
          {error && (
            <p role="alert" className="text-[13.5px] text-red-600">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
