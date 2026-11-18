# NEMO security baseline

## Implemented in the demo foundation

- Supabase Auth owns password verification and email confirmation. NEMO application tables never contain passwords.
- The browser may use only the Supabase **publishable** key. Keep any secret/service-role key in a trusted server environment; it bypasses row-level security.
- Row-level security is enabled for profiles, saved places, and saved searches. User-owned rows are restricted to the authenticated user's ID. Public visitors can read only published restaurant/menu rows.
- Restaurant/menu write access is reserved for a trusted ingestion process. The browser has no table write grant for those tables.
- Uploaded photos are type/size checked and previewed locally. They are not sent to a server, retained, or used for training in this demo.
- Search text is length-limited and escaped before rendering. Saved rows use parameterized Supabase client operations.
- Credentials and build output are excluded by `.gitignore`; use `.env.local` for local values and never commit it.

## Required configuration before enabling accounts

1. Create a Supabase project and apply the versioned SQL migration in `supabase/migrations/`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in an untracked `.env.local` file. A publishable key is expected to be visible in the browser; security depends on RLS and restrictive grants.
3. In Supabase Auth, keep email confirmation enabled, set the site URL, and allow only the exact local/deployed redirect URLs needed by NEMO.
4. Review password policy, email sender configuration, abuse/rate limits, and CAPTCHA options before public launch. Test signup, confirmation, login, reset, logout, and account deletion against a non-production project.
5. Keep database backups and restore procedures outside this repository. Free service tiers may not provide production availability or backup guarantees.
6. The browser Content Security Policy allows standard Supabase `*.supabase.co` endpoints. If using a custom Supabase domain, update the policy in `index.html` and `scripts/dev.mjs`.

## Not yet implemented; required before public launch

- Social login (Google/Apple), MFA or passkeys, account deletion/export UI, privacy/consent screens, and retention/deletion workflows.
- Server-side secrets handling for licensed data ingestion; provider-specific access/retention rules and audit logging.
- Real map tile/routing provider configuration, location permission flow, restaurant-data quality monitoring, and error/availability handling.
- Production hosting security headers, dependency update automation, continuous vulnerability review, deployment secret management, abuse monitoring, and a documented incident/restore process. The loopback demo server sends security headers but is not a deployment server.
- Security review of the actual Supabase project settings and policies. This repository does not contain or verify your provider credentials/settings.

## Data rules

Collect only what the feature needs. Do not store raw passwords, payment details, precise location history, or user photos in this prototype. Do not scrape third-party reviews. Track source, license/terms, attribution, field retention, and freshness for every imported restaurant/menu field. User photos must not enter training data without explicit, revocable consent.

