# Auth — Clerk org → tenant over Postgres RLS

## How it works
- `apps/bms` protects every route with `clerkMiddleware` (only `/sign-in` is public).
- Server-side calls (`src/lib/api.ts`) attach the Clerk **session token** as
  `Authorization: Bearer`. The app never sends tenant identifiers.
- `apps/api` (`common/auth.guard.ts`) verifies the JWT with `CLERK_SECRET_KEY`:
  - **org claim** (`o.id` / `org_id`) → `tenant.clerk_org_id` → `tenant_id`
  - **sub** → `staff.external_auth_id`; staff auto-provisions on first request
    (profile pulled from Clerk; org `admin` → `principal_broker`, else `csr`).
- RLS then scopes every query via `set_config('app.current_tenant', …, true)`
  inside the transaction — the database enforces isolation, not the app.

## Modes (logged loudly at API boot)
- `CLERK-JWT` — whenever `CLERK_SECRET_KEY` is set. Bearer token required.
- `DEV-HEADERS` — ONLY when `NODE_ENV=development` **and** `CLERK_SECRET_KEY`
  is unset: the pre-Clerk `x-tenant-id`/`x-actor-id` headers.

## One-time setup
1. Create a Clerk application (clerk.com) with **Organizations enabled**.
2. `apps/bms/.env.local`:
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_…` and `CLERK_SECRET_KEY=sk_…`
   (plus `API_URL=http://localhost:3001` if non-default).
3. `apps/api/.env` (copy from `.env.example`): same `CLERK_SECRET_KEY`,
   plus `DATABASE_URL` and `DB_SET_ROLE=app`.
4. Run the app, sign up, and create the organization **“Insurimple Brokerage”**
   in the org switcher. Copy its ID (`org_…`) from the switcher or the Clerk
   dashboard → Organizations.
5. **Backfill** the seed tenant with that org ID:
   ```bash
   DATABASE_URL=… pnpm --filter @insurimple/db link-org -- \
     11111111-1111-1111-1111-111111111111 org_XXXXXXXX
   ```
   (Migration `0008_clerk_org.sql` added `tenant.clerk_org_id`; the script is
   `packages/db/scripts/link-clerk-org.mjs`.)

## The isolation test (run it every time auth changes)
1. Signed out → any route redirects to `/sign-in`.
2. Sign in with the **Insurimple Brokerage** org active → `/households` shows
   the Abtahi book from Postgres.
3. Create a **second organization** in the switcher, link it to the second
   seed tenant (`22222222-…`, "Other Brokerage Inc.") with `link-org`, switch
   to it → `/households` is **empty**. Same user, same browser, different org:
   RLS over the JWT org claim is the only thing separating the books.
