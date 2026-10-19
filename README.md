# MELLOW Consortium — Website

Next.js 14 (App Router) + Tailwind + Supabase. Built against the official
"MELLOW Consortium — Website Production Document" spec (MusB Research) and
its accompanying `mellow-home.html` reference implementation, which the spec
calls the visual/interaction baseline for the build. Design tokens (navy/
blue/teal/gold, Sora + Inter) and homepage copy are taken directly from that
reference. Separate from the MELLOW-Age patient/provider/hospital app, which
stays on AWS Amplify.

## Stack notes

- **Supabase now, AWS later.** Data access is plain `supabase-js` calls only
  (no Edge Functions, no Supabase Auth UI helpers) so the eventual move to
  AWS is a connection-layer swap, not a rewrite.
- **`applications` table** is a single table for all 7 persona sign-up paths
  (biotech company, investigator, institution, individual, provider,
  hospital/wellness group, journal/conference partner), using a `persona_type`
  enum + a `jsonb form_data` column for the fields specific to each persona.
  This avoids a schema migration every time a form field changes.
- **RLS**: content tables (`divisions`, `trials`, `news_posts`, etc.) are
  public-read only. `applications` is public-**insert**-only — nobody can
  read submitted applications from the browser. Review them from the
  Supabase dashboard, or build an authenticated admin route later using the
  service-role key server-side.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a Supabase project at supabase.com, then in the SQL editor run,
   in order:
   ```
   supabase/schema.sql            -- tables, RLS policies, seeds the 5 divisions
   supabase/seed.sql              -- placeholder institutions/trials/news/founders
   supabase/admin.sql             -- admins table + RLS for the /admin panel
   supabase/institutions-geo.sql  -- region/lat/lon/specializations for the homepage's Global Network map
   supabase/accounts.sql          -- links applications to visitor accounts for /dashboard
   supabase/profiles.sql          -- profiles table + role, powers /dashboard/patient routing
   supabase/profiles-admin-view.sql -- profiles.email + lets admins read every profile, for /admin's users table
   supabase/hospitals.sql         -- hospitals/locations/providers hierarchy + RLS, powers /admin/hospitals and /hospital/*
   supabase/provider-dashboard.sql -- patient<->provider connections/messages/recommendations + RLS, powers /provider/* and /dashboard/patient/providers
   supabase/patient-dashboard.sql  -- documents (+ storage bucket) and visits tables + RLS, powers the rest of /dashboard/patient/*
   ```
   `seed.sql` is realistic placeholder content so every page has something
   to show — swap it for real content whenever it's ready (safe to skip
   if you'd rather start from empty tables).

   **If your project already ran an older version of `admin.sql`,
   `profiles-admin-view.sql`, or `hospitals.sql`** (i.e. any admin-gated
   page throws `[42P17] infinite recursion detected in policy for
   relation "admins"`), run `supabase/fix-admin-rls-recursion.sql` once
   — it patches the existing policies in place. Fresh setups following
   the list above don't need it; the fix is already baked in.
3. Copy the env template and fill in your project's URL + anon key
   (Supabase dashboard → Settings → API):
   ```bash
   cp .env.local.example .env.local
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```

## Admin access

The `/admin` panel (applications review + news publishing) is gated by
Supabase Auth plus an `admins` allow-list — logging in isn't enough on its
own, RLS also checks the `admins` table.

1. Supabase dashboard → Authentication → Users → **Add user** (email +
   password). Public sign-up isn't wired up on purpose — this creates a
   single admin account directly.
2. In the SQL editor:
   ```sql
   insert into admins (user_id) values ('<the user''s UUID from step 1>');
   ```
3. Sign in at `/admin/login`. You'll land on `/admin/applications`; `/admin`
   itself just redirects there. Unauthenticated visits to any `/admin/*`
   route (except `/admin/login`) bounce to the login page via
   `middleware.ts`.

## Visitor accounts (`/signup`, `/signin`, `/dashboard`)

Separate from admin — anyone can create an account. Email/password works
out of the box once `supabase/accounts.sql` is run. Google sign-in needs
one-time setup outside this repo, since it can't be done via SQL:

1. Google Cloud Console → APIs & Services → Credentials → **Create OAuth
   client ID** (type: Web application). Add
   `https://<your-project-ref>.supabase.co/auth/v1/callback` as an
   authorized redirect URI.
2. Supabase dashboard → Authentication → Providers → **Google** → enable
   it and paste in the Client ID/Secret from step 1.

Until that's done, the "Continue with Google" button will error — email/
password sign-up/sign-in works regardless. `/dashboard` (profile +
submitted applications) is gated the same way `/admin` is, via
`middleware.ts`, redirecting signed-out visitors to `/signin`.

## What's built so far

- `app/signup/`, `app/signin/`, `app/auth/callback/` — visitor accounts:
  email/password + Google OAuth via Supabase Auth. Every new sign-up gets a
  `profiles` row with `role` defaulting to `'patient'` (via a trigger on
  `auth.users`, see `supabase/profiles.sql` — covers both auth methods).
  `app/dashboard/page.tsx` is a thin server-side router, not a page itself:
  staff (present in the `admins` allow-list) go to the existing `/admin`
  panel, everyone else goes to `app/dashboard/patient/` — profile info,
  a placeholder "reports & results" section, and the applications they've
  submitted (linked via `applications.user_id`, set automatically by
  `ApplicationForm` when the visitor is signed in — anonymous submissions
  still work exactly as before). See "Visitor accounts" above.
- `app/page.tsx` — full homepage matching the reference: hero (with an
  animated canvas network background), live stat counters, audience
  selector (7 personas + icons), the interactive Global Network map,
  ecosystem grid, "why MELLOW" value grid, country-tabbed active trials,
  MELLOW-Age promo, founders, news feed, and closing CTA.
- `components/network-map/GlobalNetworkMap.tsx` — the signature
  interactive component: flat-map/globe toggle (`d3-geo` + `d3-geo`'s
  `geoNaturalEarth1`/`geoOrthographic` projections, `topojson-client` +
  `world-atlas` for country geography — all bundled as real npm packages,
  not the reference's embedded vendor blobs), drag/zoom, region filters,
  hover tooltips, and a click-through site profile panel. Fed by real
  Supabase `institutions` data (see `supabase/institutions-geo.sql`) with
  live investigator/active-study counts, not hardcoded sample sites.
- `components/network-map/HeroNetworkCanvas.tsx` — the decorative hero
  background animation (illustrative hub positions, not real geography).
- `components/StatsBar.tsx` — count-up stat bar, `IntersectionObserver`-
  triggered.
- `components/NewsletterForm.tsx` — real Supabase-backed signup (see
  `supabase/newsletter.sql`), not a dead form.
- `app/apply/[type]/page.tsx` + `components/ApplicationForm.tsx` — the 7
  persona application forms, writing straight to `applications` in Supabase.
- `app/trials/page.tsx` + `app/trials/[slug]/page.tsx` — full trials
  listing (with status filters) and detail pages (sponsor, lead
  investigator, trial sites).
- `app/news/page.tsx` + `app/news/[slug]/page.tsx` — full news listing and
  detail pages.
- `components/Header.tsx` / `Footer.tsx` — site-wide nav, mobile menu,
  footer; wired into `app/layout.tsx` along with a skip-to-content link.
- `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx` — 404 page
  and error boundaries.
- `app/icon.tsx`, `app/opengraph-image.tsx`, `app/robots.ts`,
  `app/sitemap.ts` — favicon, OG image, and basic SEO plumbing, all
  generated (no binary assets to keep in sync).
- `app/coming-soon/page.tsx` — placeholder destination for the
  MELLOW-Age/JLIVE/Conferences division links until those are live.
- `lib/supabase/client.ts` / `server.ts` — browser and server Supabase
  clients.
- `supabase/schema.sql` — full schema: divisions, institutions,
  investigators, trials, trial_sites, news_posts, founders, applications.
- `supabase/seed.sql` — realistic placeholder content for every content
  table (see Local setup above).
- `supabase/institutions-geo.sql` — region/lat/lon/is_hq/specializations
  on `institutions`, required by the Global Network map.
- `supabase/newsletter.sql` — `newsletter_subscribers` table backing the
  footer signup form.
- `middleware.ts` + `app/admin/**` — Supabase Auth-gated admin panel:
  review and update application status, and create/edit/delete news
  posts. See "Admin access" above. `supabase/admin.sql` adds the
  `admins` table and the RLS policies that back it.

## Not built yet (next steps)

The production spec defines ~19 pages across a 4-phase roadmap; only the
homepage and the pages listed above exist so far. Still missing from the
spec's own Phase 1 (public marketing site): About, Sponsors (landing +
membership + enquiry), Institutions directory + profile pages (would
reuse `GlobalNetworkMap`), Investigators directory + profile + join,
Clinical Trials directory filtering (detail pages already exist),
MELLOW-Age landing/segments, JLIVE landing + publications, Conferences +
Annual Meeting, a tabbed News hub, Contact, and Global Search. Phases 2-4
(member portals, CMS editorial workflow, multi-role auth, advanced
intelligence) haven't been started.
- No admin UI for managing trials yet — lower churn than applications/
  news, so it stays Supabase-dashboard-managed for now.

## Known Next.js quirk

`app/trials/[slug]` and `app/news/[slug]` deliberately have **no**
route-level `loading.tsx`. Next.js 14.2.x has a confirmed bug
([vercel/next.js#76474](https://github.com/vercel/next.js/issues/76474)):
a `loading.tsx` sibling to a dynamic segment that calls `notFound()`
locks the HTTP response to status 200 even though the 404 page renders
correctly — bad for SEO and for any tooling that checks status codes.
If you add a loading skeleton back to either route, use an inline
`<Suspense>` boundary around the data-fetching part of the page instead
of a `loading.tsx` file.

<!-- auto-deploy test: 2026-09-18T17:17:49Z -->
