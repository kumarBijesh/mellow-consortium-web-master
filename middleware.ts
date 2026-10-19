import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);
const LOCALE_PATTERN = routing.locales.join("|");
const localePrefixRe = new RegExp(`^/(${LOCALE_PATTERN})(?=/|$)`);

export async function middleware(request: NextRequest) {
  // Locale detection/redirect/rewrite first. With localePrefix: "always",
  // a bare "/about" gets a 308 redirect to "/en/about" (or the visitor's
  // cookied/Accept-Language locale) — that redirect is a full response on
  // its own; the browser re-requests the prefixed URL and middleware runs
  // again for THAT request, where intlMiddleware only rewrites (strips the
  // prefix for route matching) instead of redirecting. So: a redirect here
  // means there's no route to auth-gate yet on this pass — return early.
  const intlResponse = intlMiddleware(request);
  if (intlResponse.headers.get("location")) {
    return intlResponse;
  }

  const { pathname } = request.nextUrl;
  const localeMatch = pathname.match(localePrefixRe);
  const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
  const pathnameWithoutLocale = pathname.replace(localePrefixRe, "") || "/";

  // Every cookie mutation below lands on `response` (the intl response) in
  // place — never a fresh NextResponse.next() — so we don't clobber the
  // locale rewrite/cookie that intlMiddleware already set on it.
  const response = intlResponse;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Middleware: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Add them to your deployment environment variables.");
    return response;
  }

  let user = null;
  let supabase = null;

  try {
    supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    // getUser() (not getSession()) so the token is validated against Supabase,
    // not just read from the cookie.
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch (err) {
    console.error("Middleware auth check error:", err);
  }

  const redirectTo = (path: string) => NextResponse.redirect(new URL(`/${locale}${path}`, request.url));

  // Staff admin panel — separate from visitor accounts, gated by the
  // `admins` allow-list at the RLS level (see supabase/admin.sql).
  //
  // Being logged in is NOT being an admin — a patient/hospital/provider
  // session is still "user truthy", so beyond the login-page redirect we
  // must also confirm this specific user is actually in `admins` before
  // letting them past. Without this check, any signed-in account of any
  // role could load /admin/* directly (the pages themselves fetch with
  // the service-role client and don't re-check the caller's role,
  // trusting this middleware to have already gated access).
  if (pathnameWithoutLocale.startsWith("/admin")) {
    const isLoginPage = pathnameWithoutLocale === "/admin/login";
    // forgot-password/reset-password must stay reachable while signed
    // out — reset-password in particular arrives via a hash-fragment
    // token (#access_token=...) that the browser never sends to the
    // server, so there's no cookie-based session for middleware to see
    // yet at this point; the client-side page exchanges it after load.
    const isPublicAdminPage = isLoginPage || pathnameWithoutLocale === "/admin/forgot-password" || pathnameWithoutLocale === "/admin/reset-password";
    if (!user && !isPublicAdminPage) {
      return redirectTo("/admin/login");
    }
    if (user && supabase) {
      try {
        const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
        if (!admin && !isPublicAdminPage) {
          return redirectTo("/admin/login");
        }
        if (admin && isLoginPage) {
          return redirectTo("/admin");
        }
      } catch (err) {
        console.error("Admin check failed in middleware:", err);
      }
    }
    return response;
  }

  // Hospital dashboard — separate from both staff admin and patient
  // accounts. Hospitals sign in via /hospital/login (email/password only,
  // provisioned by an admin invite, see supabase/hospitals.sql). Same
  // reasoning as /admin above: confirm this user actually owns a
  // `hospitals` row, not just that they're signed in as someone.
  if (pathnameWithoutLocale.startsWith("/hospital")) {
    const isHospitalLoginPage = pathnameWithoutLocale === "/hospital/login";
    if (!user && !isHospitalLoginPage) {
      return redirectTo("/hospital/login");
    }
    if (user && supabase) {
      try {
        const { data: hospital } = await supabase.from("hospitals").select("user_id").eq("user_id", user.id).maybeSingle();
        if (!hospital && !isHospitalLoginPage) {
          return redirectTo("/hospital/login");
        }
        if (hospital && isHospitalLoginPage) {
          return redirectTo("/hospital");
        }
      } catch (err) {
        console.error("Hospital check failed in middleware:", err);
      }
    }
    return response;
  }

  // Provider dashboard — separate from admin/hospital/patient accounts.
  // Providers sign in via /provider/login (email/password only,
  // provisioned by a hospital invite, see supabase/hospitals.sql). Same
  // reasoning as /admin above: confirm this user actually owns a
  // `provider_profiles` row, not just that they're signed in as someone.
  if (pathnameWithoutLocale.startsWith("/provider")) {
    const isProviderLoginPage = pathnameWithoutLocale === "/provider/login";
    if (!user && !isProviderLoginPage) {
      return redirectTo("/provider/login");
    }
    if (user && supabase) {
      try {
        const { data: provider } = await supabase
          .from("provider_profiles")
          .select("provider_user_id")
          .eq("provider_user_id", user.id)
          .maybeSingle();
        if (!provider && !isProviderLoginPage) {
          return redirectTo("/provider/login");
        }
        if (provider && isProviderLoginPage) {
          return redirectTo("/provider");
        }
      } catch (err) {
        console.error("Provider check failed in middleware:", err);
      }
    }
    return response;
  }

  // Visitor accounts (dashboard + sign-in/up).
  if (pathnameWithoutLocale.startsWith("/dashboard") && !user) {
    return redirectTo("/signin");
  }
  if ((pathnameWithoutLocale === "/signin" || pathnameWithoutLocale === "/signup" || pathnameWithoutLocale === "/access") && user) {
    return redirectTo("/dashboard");
  }

  return response;
}

export const config = {
  // next-intl needs to run on virtually every page route (to redirect a
  // bare path into a locale prefix, or rewrite a prefixed one). Excluded:
  // Next internals, static files (anything with a dot — favicon, images,
  // fonts, etc.), and /auth/callback, which is Supabase's OAuth redirect
  // target — a fixed URL registered with the provider, so it must never
  // get locale-prefixed or redirected.
  matcher: ["/((?!api|_next|_vercel|auth/callback|.*\\..*).*)"],
};
