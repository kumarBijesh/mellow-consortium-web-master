"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";

export default function UseLocationButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location lookup.");
      return;
    }
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoading(false);
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", position.coords.latitude.toFixed(6));
        params.set("lng", position.coords.longitude.toFixed(6));
        if (!params.get("category")) params.set("category", "clinics");
        router.push(`${pathname}?${params.toString()}`);
      },
      (err) => {
        setLoading(false);
        setError(err.code === err.PERMISSION_DENIED ? "Location permission was denied." : "Could not get your location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="text-right">
      <button type="button" onClick={handleClick} disabled={loading} className="btn-primary !px-4 !py-2.5 text-[13.5px] disabled:opacity-60">
        {loading ? "Finding you…" : "Use my location"}
      </button>
      {error && <p className="text-[12px] text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}
