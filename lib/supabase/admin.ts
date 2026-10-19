import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS entirely. Only ever call this from a
// Server Action or Route Handler, never from a "use client" component; the
// `server-only` import above throws a build error if this module ever
// ends up in a client bundle.
//
// Used for: sending hospital/provider invite emails
// (auth.admin.inviteUserByEmail) and the account-activation status flip,
// both of which are privileged operations regular RLS-scoped clients
// can't do.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
