"use client";

import { useEffect, useRef, useState } from "react";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { Link } from "@/i18n/navigation";
import { activateAccount } from "@/lib/actions/accept-invite";

type Status = "checking" | "expired" | "invalid" | "ready" | "done";

// The invitee's session lives only in memory on this page — never in the
// site's auth cookie. Supabase keeps one session per browser, so writing
// the invitee's session there (setSession on the shared client) signed out
// whoever was already logged in, e.g. an admin testing an invite link.
// The invitee signs in normally once their password is set.
function createIsolatedClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

// The invite link is single-use, so its tokens are kept for this tab only
// (sessionStorage) to survive a refresh, and cleared once setup finishes.
const TOKEN_KEY = "mellow-invite-tokens";

export default function SetPasswordPage() {
  // Captured synchronously on first render, before any effect runs —
  // including Header's, which creates its own Supabase client and can
  // race to auto-process (and clear) this same hash. Reading
  // window.location.hash later, inside our own effect, isn't safe.
  const [initialHash] = useState(() => (typeof window !== "undefined" ? window.location.hash : ""));
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginPath, setLoginPath] = useState("/access");
  const clientRef = useRef<SupabaseClient | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(initialHash.replace(/^#/, ""));
    const hashError = params.get("error") || params.get("error_code");

    if (hashError) {
      setStatus("expired");
      return;
    }

    let accessToken = params.get("access_token");
    let refreshToken = params.get("refresh_token");
    if (accessToken && refreshToken) {
      try {
        sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ accessToken, refreshToken }));
      } catch {}
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      // Refresh after the hash was cleared: recover this tab's tokens.
      // Deliberately NOT falling back to the browser's cookie session —
      // that belongs to whoever else is signed in here, not the invitee.
      try {
        const saved = JSON.parse(sessionStorage.getItem(TOKEN_KEY) ?? "null");
        accessToken = saved?.accessToken ?? null;
        refreshToken = saved?.refreshToken ?? null;
      } catch {}
    }

    if (!accessToken || !refreshToken) {
      setStatus("invalid");
      return;
    }

    const supabase = createIsolatedClient();
    clientRef.current = supabase;
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ data, error: setSessionError }) => {
        setStatus(setSessionError || !data.user ? "invalid" : "ready");
      })
      // A malformed token makes setSession throw rather than return an
      // error; without this the page stayed blank on "checking" forever.
      .catch(() => setStatus("invalid"));
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

    const supabase = clientRef.current;
    if (!supabase) return;
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    const { data } = await supabase.auth.getSession();
    const result = data.session ? await activateAccount(data.session.access_token) : undefined;
    if (!result || result.error) {
      setError(result?.error ?? "Your password was saved, but we couldn't finish setup. Please try again.");
      setLoading(false);
      return;
    }
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {}
    setLoginPath(result.redirectTo);
    setStatus("done");
  }

  if (status === "checking") return null;

  if (status === "expired") {
    return (
      <main className="py-32">
        <div className="wrap max-w-[420px] text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted dark:text-white/60">Invite link expired</span>
          <h1 className="text-[26px] mt-3 mb-4 text-navy dark:text-white">This link has expired</h1>
          <p className="text-muted dark:text-white/60 text-[14.5px]">
            Invite links are only valid for a limited time. Contact whoever invited you and ask them to send a new
            one.
          </p>
        </div>
      </main>
    );
  }

  if (status === "done") {
    return (
      <main className="py-32">
        <div className="wrap max-w-[420px] text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted dark:text-white/60">Account setup</span>
          <h1 className="text-[26px] mt-3 mb-4 text-navy dark:text-white">Your account is ready</h1>
          <p className="text-muted dark:text-white/60 text-[14.5px] mb-7">Sign in with your email and the password you just set.</p>
          <Link href={loginPath} className="btn-primary inline-flex">
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  if (status === "invalid") {
    return (
      <main className="py-32">
        <div className="wrap max-w-[420px] text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted dark:text-white/60">Invite link expired</span>
          <h1 className="text-[26px] mt-3 mb-4 text-navy dark:text-white">This link isn&apos;t valid</h1>
          <p className="text-muted dark:text-white/60 text-[14.5px]">
            Your invitation link may have expired or already been used. Contact whoever invited you for a new one.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="py-32">
      <div className="wrap max-w-[400px]">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted dark:text-white/60">Account setup</span>
        <h1 className="text-[26px] mt-3 mb-8 text-navy dark:text-white">Set your password</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            {loading ? "Completing setup…" : "Complete account setup"}
          </button>
        </form>
      </div>
    </main>
  );
}
