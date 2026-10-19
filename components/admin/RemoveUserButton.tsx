"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { removeUser } from "@/lib/actions/admin-users";

export default function RemoveUserButton({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!window.confirm(`Remove ${userName}? This permanently deletes their account and can't be undone.`)) return;
    setPending(true);
    setError(null);
    const result = await removeUser(userId);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="text-right">
      <button type="button" onClick={handleClick} disabled={pending} className="btn-chip-danger disabled:opacity-40">
        {pending ? "Removing…" : "Remove"}
      </button>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}
