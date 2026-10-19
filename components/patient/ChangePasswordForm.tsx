"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ error?: string; success?: boolean }>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({});

    if (password.length < 8) {
      setStatus({ error: "Password must be at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      setStatus({ error: "Passwords don't match." });
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (error) {
      setStatus({ error: error.message });
      return;
    }
    setPassword("");
    setConfirm("");
    setStatus({ success: true });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-[380px]">
      <div>
        <label htmlFor="new-password" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-[13.5px] font-semibold text-navy dark:text-white mb-1.5">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-[10px] border border-line dark:border-white/10 bg-white text-ink placeholder-muted dark:bg-white/[0.04] dark:text-white dark:placeholder-white/25 px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue"
        />
      </div>
      {status.error && <p className="text-[13.5px] text-red-600">{status.error}</p>}
      {status.success && <p className="text-[13.5px] text-teal">Password updated.</p>}
      <button type="submit" disabled={pending} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
