import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Target of both the Google OAuth redirect and the email-confirmation link
// (see signInWithOAuth / signUp's emailRedirectTo in the signup/signin pages).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
