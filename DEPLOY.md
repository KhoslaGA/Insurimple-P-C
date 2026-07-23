# Deploying Insurimple

The platform is three pieces:

- **`apps/bms`** — the Next.js web app → deploy to **Vercel**.
- **`apps/api`** — the NestJS API (transaction spine, RLS-scoped reads/writes) →
  deploy to a **Node host** (Railway / Render / Fly). Vercel runs the Next app
  only; it does not host the long-lived API.
- **`packages/db`** — Postgres 16 schema + migrations → a **managed Postgres**
  (Neon / Supabase / RDS).

There are two levels: a zero-config **preview** (see the UI immediately) and the
**full stack** (real data + auth).

---

## Level 1 — Preview (no backend, renders immediately)

With **no environment variables set**, the app runs in *preview mode*:

- `/locate` renders its fixture book, `/households` and `/households/[id]` render
  a deterministic seed snapshot (`apps/bms/src/lib/demo-data.ts`), each badged
  **"Preview data"** so it never reads as live.
- Clerk is not mounted (no login gate); the middleware passes through.

This is what makes the Vercel deploy viewable with one click.

### Vercel settings
- **Root Directory:** `apps/bms`
- **Framework preset:** Next.js (auto-detected)
- Install/build are handled by the pnpm workspace + Turborepo; the default
  `pnpm install` / `next build` works. No `vercel.json` required.
- If a deploy ever 500s with `MIDDLEWARE_INVOCATION_FAILED`, it means Clerk keys
  are partially set — either set both (`CLERK_SECRET_KEY` +
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`) or neither.

Deploy → open the URL → click **Households** or a **Locate** row.

---

## Level 2 — Full stack (real RLS data + Clerk auth)

### a) Database (Postgres 16)
Provision a managed Postgres 16, then once:
```bash
DATABASE_URL="postgres://…"  pnpm --filter @insurimple/db migrate --seed
```
`migrate` applies the 8 migrations; `--seed` loads the dev book (Abtahi + 5).

### b) API (`apps/api`) on a Node host
Build (`pnpm --filter @insurimple/api build`) and run `node dist/main.js`.
Environment:
| Var | Value |
|---|---|
| `DATABASE_URL` | the Postgres URL above |
| `CLERK_SECRET_KEY` | from the Clerk dashboard — boots the API in `CLERK-JWT` mode |
| `PORT` | host-provided (defaults 3001) |
| `DB_SET_ROLE` | `app` **only if** you connect as a superuser (dev); leave unset when connecting as a non-superuser login role in prod |

Confirm the log prints `AUTH MODE: CLERK-JWT` (not `DEV-HEADERS`).

### c) Web (`apps/bms`) on Vercel
Set these env vars, then redeploy:
| Var | Value |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `API_URL` | the public URL of the API from (b) |

With `API_URL` set, the household screens fetch **live RLS-scoped data** (the
"Preview data" badges disappear); with Clerk set, every route is protected and
tenant comes from the org claim.

### d) Link each Clerk org to a tenant
Auth resolves the tenant from `tenant.clerk_org_id`. For each organization:
```bash
DATABASE_URL="postgres://…" node packages/db/scripts/link-clerk-org.mjs \
  <clerk_org_id> <tenant_uuid>
```
e.g. map your first org to `11111111-1111-1111-1111-111111111111`. This is also
what proves tenant isolation end-to-end (T1.0): a second org linked to
`22222222-…` sees zero accounts.

---

## Invariants that still hold in every deploy
- Tenancy is enforced by **Postgres RLS + the API auth guard**, never by the web
  app. Preview mode shows seed data only and cannot reach another tenant's book.
- The web app never sends a tenant id; it comes from the Clerk org claim.
- Preview/seed data is always badged and can never pass as live carrier data.
