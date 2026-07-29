# Deploying Insurimple

The platform is three pieces:

- **`apps/bms`** — the Next.js web app → deploy to **Vercel**.
- **`apps/api`** — the NestJS API (transaction spine, RLS-scoped reads/writes) →
  deploy to a **Node host** (Railway / Render / Fly). Vercel runs the Next app
  only; it does not host the long-lived API.
- **`packages/db`** — Postgres 16 schema + migrations → a **managed Postgres**
  (Neon / Supabase / RDS).

## One repo, separate deploys

The API lives in this monorepo (`apps/api`) and still deploys **independently**
to its own host — monorepo is not monolith-deploy. Every host supports a
subdirectory/Dockerfile root:

| Host | How |
|---|---|
| **Render** | `render.yaml` at the repo root (checked in) — `dockerfilePath: ./apps/api/Dockerfile`, `dockerContext: .` |
| **Railway** | `apps/api/railway.json` (checked in), or set the service **Root Directory** to `apps/api` |
| **Fly** | `fly launch --dockerfile apps/api/Dockerfile` from the repo root |

`apps/api` has **no workspace-package imports**, so its Dockerfile copies only
`apps/api/**` and builds standalone. Keeping it in the monorepo is deliberate:
`packages/contracts` is the single type source shared by the API and the web app
(invariant 6), and a feature that spans contract + endpoint + screen lands as
one atomic commit under one CI gate. A separate backend repo would reintroduce
exactly the type drift the contracts package exists to prevent.

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

### Vercel settings — first-time setup

1. **Vercel → Add New → Project**, import `KhoslaGA/Insurimple-P-C`.
2. **Root Directory:** `apps/bms` (this is the one setting that matters —
   everything else is auto-detected, and `apps/bms/vercel.json` pins the
   framework and build command).
3. Leave **Environment Variables empty** for the preview. The app detects the
   absence of `API_URL` and renders the seed snapshot, badged "Preview data".
4. **Deploy.**

Vercel installs from the workspace root automatically (it detects the pnpm
workspace); `next.config.ts` already lists the workspace packages in
`transpilePackages`, so the shipped-as-TypeScript packages compile as part of
the app. A plain `next build` from `apps/bms` is all it needs.

### Seeing changes as they're built

Once the repo is connected, **every push gets its own preview URL**
automatically — no action needed. Pushing to the working branch
(`claude/vscode-claude-chat-continue-2xx3p9`) produces a preview deployment;
merging to `main` updates production. The Vercel dashboard lists each
deployment against its commit, so a screen can be reviewed at the commit that
introduced it.

### Domains

`insurimple.com` and `insurimple.ca` are held at GoDaddy.

**The P&C leg does not get its own domain.** P&C is a module gated by
`tenant_modules`, not a separate product — one platform, three modules on a
shared spine (brief §3: *"Single app domain (`app.insurimple.com`) year one;
vanity subdomains later"*). A per-module domain would fragment exactly what
the shared spine exists to unify, and would have to be undone when Life and
Mortgage land.

| Host | Points at | Tracks |
|---|---|---|
| `app.insurimple.com` | `apps/bms` on Vercel | production (`main`) |
| `next.insurimple.com` | `apps/bms` on Vercel | the working branch — always the latest build |
| `api.insurimple.com` | `apps/api` on its Node host | production API *(add once the API is hosted)* |
| `insurimple.com` | `apps/marketing` | P3 — not built yet |

**Setup:** in Vercel → **Settings → Domains**, add the host and assign it to
the branch it should track. Then at GoDaddy add one DNS record per subdomain:

```
CNAME   next   cname.vercel-dns.com
CNAME   app    cname.vercel-dns.com
```

(An apex domain instead needs `A @ 76.76.21.21`.) TLS is issued automatically
once DNS resolves. Don't point `api.` anywhere until the API actually has a
host.

**Renewals:** `insurimple.com` and `insurimple.ca` both renew **15 August**.
Keep auto-renew and the registrar lock on, and enable ownership protection —
a lapse takes down the app, the marketing site and any email on the domain at
once.

### Troubleshooting

- **`MIDDLEWARE_INVOCATION_FAILED`** — Clerk keys are partially set. Set both
  (`CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`) or neither.
- **Screens render but every list is empty** — `API_URL` is set but the API is
  unreachable, so the preview fallback is off and the fetch is failing. Unset
  `API_URL` to go back to the snapshot, or fix the API host.
- **Build cannot resolve `@insurimple/*`** — Root Directory is not `apps/bms`,
  so Vercel installed only the app rather than the workspace.

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
