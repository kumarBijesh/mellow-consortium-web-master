import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Target of hospital/provider invite emails (see redirectTo in
// lib/actions/hospitals.ts / providers.ts). Exchanges the invite code for
// a session, then hands off to the set-password page.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/accept-invite/set-password`);
}
