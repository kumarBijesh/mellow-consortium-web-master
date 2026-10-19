"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { requestConnection } from "@/lib/actions/connections";

export default function RequestConnectionButton({ providerId }: { providerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await requestConnection(providerId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="btn-secondary !px-4 !py-2 text-[13px] disabled:opacity-40"
      >
        {loading ? "Sending…" : "Request connection"}
      </button>
      {error && <p className="text-[11.5px] text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}
