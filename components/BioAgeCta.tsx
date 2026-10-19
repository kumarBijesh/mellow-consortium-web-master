"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

// The homepage this renders on is ISR-cached (revalidate = 300s) and shared
// across every visitor, so the sign-in check can't happen server-side there
// — it would bake one visitor's auth state into everyone else's cached HTML.
// Same client-side pattern as Header.tsx's signedIn detection.
export default function BioAgeCta({ children, className }: { children: React.ReactNode; className?: string }) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <Link href={signedIn ? "/dashboard" : "/signin"} className={className}>
      {children}
    </Link>
  );
}
