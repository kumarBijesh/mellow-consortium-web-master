"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    // A valid password for a patient/hospital/provider account must not
    // silently gain admin access just because Supabase Auth accepted the
    // credentials — admin membership is the `admins` allow-list only.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", user!.id).maybeSingle();
    if (!admin) {
      await supabase.auth.signOut();
      setError("No admin account matches these credentials.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="py-32">
      <div className="wrap max-w-[400px]">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted dark:text-white/60">Staff access</span>
        <h1 className="text-[26px] mt-3 mb-8 text-navy dark:text-white">Admin sign in</h1>
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
            <p className="mt-2 text-right">
              <Link href="/admin/forgot-password" className="text-[13px] font-semibold text-blue hover:underline">
                Forgot password?
              </Link>
            </p>
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
