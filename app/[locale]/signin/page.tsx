"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/navigation";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import AuthToggle from "@/components/auth/AuthToggle";

export default function SignInPage() {
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

    // This form is patient-only — a valid password for an admin, hospital,
    // or provider account must not silently log in here just because
    // Supabase Auth accepted the credentials. Each account type has its
    // own login page; check the signed-in user isn't one of the other
    // three before letting the session stand.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const [{ data: admin }, { data: hospital }, { data: provider }] = await Promise.all([
      supabase.from("admins").select("user_id").eq("user_id", user!.id).maybeSingle(),
      supabase.from("hospitals").select("id").eq("user_id", user!.id).maybeSingle(),
      supabase.from("provider_profiles").select("id").eq("provider_user_id", user!.id).maybeSingle(),
    ]);
    if (admin || hospital || provider) {
      await supabase.auth.signOut();
      setError("No patient account matches these credentials. Use the sign-in page for your account type.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="py-24">
      <div className="wrap max-w-[420px]">
        <span className="eyebrow">Patient access</span>
        <h1 className="text-[30px] mt-4 mb-8 text-navy dark:text-white">Sign in</h1>

        <AuthToggle active="signin" />

        <GoogleSignInButton />

        <div className="flex items-center gap-3 my-6">
          <span className="h-px bg-line dark:bg-white/10 flex-1" />
          <span className="text-[12.5px] text-muted dark:text-white/60">or</span>
          <span className="h-px bg-line dark:bg-white/10 flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
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

        <p className="text-center mt-8">
          <Link href="/admin/login" className="text-[12.5px] text-muted dark:text-white/60 hover:text-navy dark:text-white transition">
            Admin login
          </Link>
        </p>
      </div>
    </main>
  );
}
