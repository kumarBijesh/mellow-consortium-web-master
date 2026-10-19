import { createBrowserClient } from "@supabase/ssr";

// Browser-side client. Uses only the anon key — safe to expose.
// Deliberately plain supabase-js calls (no Supabase-specific magic like
// Edge Functions or built-in Auth UI) so swapping the backing store to
// AWS later is a connection-layer change, not a rewrite.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
