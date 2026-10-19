"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import AuthToggle from "@/components/auth/AuthToggle";

type Status = "idle" | "submitting" | "check-email" | "error";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setStatus("error");
      setError("Password must be at least 8 characters.");
      return;
    }

    setStatus("submitting");
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setStatus("error");
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      // Email confirmation is off on this project — session is live already.
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setStatus("check-email");
  }

  if (status === "check-email") {
    return (
      <main className="py-32">
        <div className="wrap max-w-[420px] text-center">
          <span className="eyebrow justify-center">Almost there</span>
          <h1 className="text-[28px] mt-4 mb-3 text-navy dark:text-white">Check your email</h1>
          <p className="text-muted dark:text-white/60 text-[15px]">
            We sent a confirmation link to <b className="text-navy dark:text-white">{email}</b>. Click it to activate your account,
            then sign in.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="py-24">
      <div className="wrap max-w-[420px]">
        <span className="eyebrow">Patient access</span>
        <h1 className="text-[30px] mt-4 mb-8 text-navy dark:text-white">Create your account</h1>

        <AuthToggle active="signup" />

        <GoogleSignInButton />

        <div className="flex items-center gap-3 my-6">
          <span className="h-px bg-line dark:bg-white/10 flex-1" />
          <span className="text-[12.5px] text-muted dark:text-white/60">or</span>
          <span className="h-px bg-line dark:bg-white/10 flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="fullName" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
              Full name
            </label>
            <input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>
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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>

          {status === "error" && error && (
            <p role="alert" className="text-[13.5px] text-red-600">
              {error}
            </p>
          )}

          <button type="submit" disabled={status === "submitting"} className="btn-primary w-full">
            {status === "submitting" ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
