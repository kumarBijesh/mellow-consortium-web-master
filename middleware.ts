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

  const isAdminRoute = pathnameWithoutLocale.startsWith("/admin");
  const isHospitalRoute = pathnameWithoutLocale.startsWith("/hospital");
  const isProviderRoute = pathnameWithoutLocale.startsWith("/provider");
  const isPatientRoute = pathnameWithoutLocale.startsWith("/dashboard");
  const isAuthPage =
    pathnameWithoutLocale === "/signin" ||
    pathnameWithoutLocale === "/signup" ||
    pathnameWithoutLocale === "/access";
  const isProtectedOrAuthRoute =
    isAdminRoute || isHospitalRoute || isProviderRoute || isPatientRoute || isAuthPage;

  // FAST PATH: Public marketing/content pages do not require auth gating or session checks.
  // Returning immediately avoids 150-500ms of unnecessary Supabase network latency on every page request & link prefetch.
  if (!isProtectedOrAuthRoute) {
    return response;
  }

  const redirectTo = (path: string) => NextResponse.redirect(new URL(`/${locale}${path}`, request.url));

  // Check if a Supabase auth token cookie is present.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

  // FAST PATH: If there is no auth cookie, the user is definitely unauthenticated.
  if (!hasAuthCookie) {
    if (isPatientRoute) {
      return redirectTo("/signin");
    }
    if (isHospitalRoute && pathnameWithoutLocale !== "/hospital/login") {
      return redirectTo("/hospital/login");
    }
    if (isProviderRoute && pathnameWithoutLocale !== "/provider/login") {
      return redirectTo("/provider/login");
    }
    if (isAdminRoute) {
      const isPublicAdminPage =
        pathnameWithoutLocale === "/admin/login" ||
        pathnameWithoutLocale === "/admin/forgot-password" ||
        pathnameWithoutLocale === "/admin/reset-password";
      if (!isPublicAdminPage) {
        return redirectTo("/admin/login");
      }
    }
    return response;
  }

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

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch (err) {
    console.error("Middleware auth check error:", err);
  }

  // Staff admin panel — separate from visitor accounts, gated by the
  // `admins` allow-list at the RLS level (see supabase/admin.sql).
  if (isAdminRoute) {
    const isLoginPage = pathnameWithoutLocale === "/admin/login";
    const isPublicAdminPage =
      isLoginPage ||
      pathnameWithoutLocale === "/admin/forgot-password" ||
      pathnameWithoutLocale === "/admin/reset-password";

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

  // Hospital dashboard — separate from both staff admin and patient accounts.
  if (isHospitalRoute) {
    const isHospitalLoginPage = pathnameWithoutLocale === "/hospital/login";
    if (!user && !isHospitalLoginPage) {
      return redirectTo("/hospital/login");
    }
    if (user && supabase) {
      try {
        const role = user.user_metadata?.role;
        const isHospital = role === "hospital" || (
          await supabase.from("hospitals").select("user_id").eq("user_id", user.id).maybeSingle()
        ).data != null;

        if (!isHospital && !isHospitalLoginPage) {
          return redirectTo("/hospital/login");
        }
        if (isHospital && isHospitalLoginPage) {
          return redirectTo("/hospital");
        }
      } catch (err) {
        console.error("Hospital check failed in middleware:", err);
      }
    }
    return response;
  }

  // Provider dashboard — separate from admin/hospital/patient accounts.
  if (isProviderRoute) {
    const isProviderLoginPage = pathnameWithoutLocale === "/provider/login";
    if (!user && !isProviderLoginPage) {
      return redirectTo("/provider/login");
    }
    if (user && supabase) {
      try {
        const role = user.user_metadata?.role;
        const isProvider = role === "provider" || (
          await supabase.from("provider_profiles").select("provider_user_id").eq("provider_user_id", user.id).maybeSingle()
        ).data != null;

        if (!isProvider && !isProviderLoginPage) {
          return redirectTo("/provider/login");
        }
        if (isProvider && isProviderLoginPage) {
          return redirectTo("/provider");
        }
      } catch (err) {
        console.error("Provider check failed in middleware:", err);
      }
    }
    return response;
  }

  // Visitor accounts (dashboard + sign-in/up).
  if (isPatientRoute && !user) {
    return redirectTo("/signin");
  }
  if (isAuthPage && user) {
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
