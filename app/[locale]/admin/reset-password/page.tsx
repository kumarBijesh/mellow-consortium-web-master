"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "expired" | "invalid" | "ready";

export default function AdminResetPasswordPage() {
  const router = useRouter();
  // Captured synchronously on first render, before any effect runs —
  // including Header's, which creates its own Supabase client and can
  // race to auto-process (and clear) this same hash. Same fix as
  // accept-invite/set-password.
  const [initialHash] = useState(() => (typeof window !== "undefined" ? window.location.hash : ""));
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(initialHash.replace(/^#/, ""));
    const hashError = params.get("error") || params.get("error_code");

    if (hashError) {
      setStatus("expired");
      return;
    }

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const supabase = createClient();

    if (accessToken && refreshToken) {
      // Establish the session explicitly from this reset link's own
      // tokens, instead of trusting whatever session might already be
      // active in this browser — same fix as the accept-invite bug:
      // setSession() overwrites the current session outright, so the
      // password update below is guaranteed to land on the account this
      // link was actually issued for.
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ data, error: setSessionError }) => {
        window.history.replaceState(null, "", window.location.pathname);
        setStatus(setSessionError || !data.user ? "invalid" : "ready");
      });
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setStatus(data.user ? "ready" : "invalid");
    });
  }, [initialHash]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Unlike the hospital/provider invite flow, there's no role/status
    // field to flip here — this is just a password change on an
    // existing admin account, so there's no equivalent of the
    // "unrecognized account type" check to trip over. Sign out so they
    // come back through /admin/login and prove the new password works.
    await supabase.auth.signOut();
    setLoading(false);
    setDone(true);
    setTimeout(() => {
      router.push("/admin/login");
      router.refresh();
    }, 1500);
  }

  if (status === "checking") return null;

  if (status === "expired") {
    return (
      <main className="py-32">
        <div className="wrap max-w-[420px] text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted dark:text-white/60">Reset link expired</span>
          <h1 className="text-[26px] mt-3 mb-4 text-navy dark:text-white">This link has expired</h1>
          <p className="text-muted dark:text-white/60 text-[14.5px] mb-6">
            Password reset links are only valid for a limited time. Request a new one below.
          </p>
          <Link href="/admin/forgot-password" className="btn-primary">
            Request a new link
          </Link>
        </div>
      </main>
    );
  }

  if (status === "invalid") {
    return (
      <main className="py-32">
        <div className="wrap max-w-[420px] text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted dark:text-white/60">Reset link expired</span>
          <h1 className="text-[26px] mt-3 mb-4 text-navy dark:text-white">This link isn&apos;t valid</h1>
          <p className="text-muted dark:text-white/60 text-[14.5px] mb-6">Your reset link may have expired or already been used.</p>
          <Link href="/admin/forgot-password" className="btn-primary">
            Request a new link
          </Link>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="py-32">
        <div className="wrap max-w-[420px] text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted dark:text-white/60">Password updated</span>
          <h1 className="text-[26px] mt-3 mb-4 text-navy dark:text-white">You&apos;re all set</h1>
          <p className="text-muted dark:text-white/60 text-[14.5px]">Redirecting you to sign in…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="py-32">
      <div className="wrap max-w-[400px]">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted dark:text-white/60">Admin access</span>
        <h1 className="text-[26px] mt-3 mb-8 text-navy dark:text-white">Set a new password</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
              New password
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
          <div>
            <label htmlFor="confirm" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
            />
          </div>

          {error && (
            <p role="alert" className="text-[13.5px] text-red-600">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </main>
  );
}
