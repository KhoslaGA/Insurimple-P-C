# CONTEXT — Insurimple-ARS (P&C Rating & Quoting)

**Paste this into a new chat to bring it up to speed.** `CLAUDE.md` holds the standing
contract (invariants, repo shape); this file holds *current state* — what exists, what's
proven, what's next. Keep it updated as work lands.

Last updated: 2026-07-25

---

## 1. What this is

Insurimple-ARS — the P&C **Rating & Quoting** module ("Insurimple's answer to Applied
Rating Services"). Multi-tenant B2B SaaS for Canadian brokerages. Ontario-first (OAF 1
auto + habitational property).

Delivered as tickets **TR.1–TR.8**. TR.1–TR.6 are year one and are **built**.
**TR.7–TR.8 are year two and GATED — do not start them** unless the owner explicitly
lifts the gate.

## 2. Repos and branches

| Repo | Purpose | Branch |
|---|---|---|
| `KhoslaGA/Insurimple-ARS` | frontend monorepo (primary) | `claude/insurimple-ars-bfaua8` → PR #1 open into `main` |
| `KhoslaGA/Insurimple-P-C` | backup mirror of the above | same branch |
| `KhoslaGA/Insurimple-ARS-Backend-` | NestJS + Postgres API (**note the trailing hyphen**) | `claude/insurimple-ars-bfaua8` |

Always develop on `claude/insurimple-ars-bfaua8`; never push elsewhere without permission.

## 3. Non-negotiable rules (from the kickoff — these are not preferences)

1. **Indicative vs firm is a DATA flag, never a UI label.** A wrong number shown as firm
   is an E&O event, so the distinction lives in the schema and is test-asserted.
2. **NO bind capability anywhere.** No bind/issue functions, endpoints, or identifiers.
   Quoting never crosses into binding. There is a test that asserts this.
3. **Manual entry is a first-class adapter**, not a fallback. Many carriers will never
   have an API.
4. **One risk, many quotes.** Capture the risk once; shop it to N carriers.
5. **Everything goes through the `CarrierAdapter` seam.** Adding a carrier must require no
   frontend change.
6. **UI consumes `packages/design-system` only.** No ad-hoc primitives.
7. **Mock data is first-class** — the app must run fully with no backend.

Plus from `CLAUDE.md`: multi-tenancy from row one via Postgres RLS; tenant context from the
**Clerk org claim, never a request param**; `set_config(..., true)` per transaction, never
plain `SET`.

## 4. What is built

**`packages/contracts`** — the single source of types (zod). Canonical risk model (auto +
property, immutable versioned), mappers (OAF 1, habitational, quote input), quote_shop +
quote_results with the indicative/firm + Take-All-Comers dataset, CarrierAdapter seam
(manual / portal / stub-api) + orchestrator, comparison + drafter gate, renewal remarket
loop + retention scorecard, and the typed API client (read + write).

**`packages/design-system`** — Tailwind v4 `@theme` tokens + typed components (Button,
form primitives, Badge, Card, Tabs, Table, Modal).

**`apps/bms`** — quote workspace (auto + property, prefill from prior policy), comparison +
client summary, renewal queue + live retention scorecard, OAF 1 preview. Reads through a
**data-source seam**: mock by default, live API when `INSURIMPLE_API_URL` is set.

**Backend** — NestJS + Prisma + Postgres 16. Read endpoints (household, policies, renewals,
shop results) and write endpoints (open shop, record result, record remarket outcome),
zod-validated at the trust boundary. Postgres RLS with `FORCE ROW LEVEL SECURITY` and a
non-owner app role. Versioned migrations, deterministic seed, Dockerfile, CI.

**CI** — GitHub Actions on both repos. Backend CI provisions non-superuser roles, migrates,
applies RLS, seeds, builds, and runs the isolation suite on every push.

## 5. What is actually proven (vs merely compiling)

Run against a **real Postgres 16**, not just typechecked:

- migrations apply; seed runs; API serves seeded data to `apps/bms` end to end
- **RLS isolation: 6/6 as the real non-owner role** — sees own rows; cannot see or
  *target by id* another tenant's; sees nothing unscoped; cannot write a row claiming
  another tenant (`WITH CHECK`); cannot delete quote evidence
- server-side validation rejects `quoted`-without-premium and `simulated`+`firm` with 400s
- a remarket outcome recorded over HTTP computed its saving server-side ($3,600 → $3,180 =
  $420) and rendered in the app

**Test counts:** contracts **74**, bms **9**, backend RLS **6**.

The isolation suite **refuses to run** if the owner/app database URLs are missing or
identical — a silent pass there would look like proof while proving nothing.

## 6. Next steps, in priority order

1. **Clerk auth — BLOCKING.** The tenant still comes from an `x-tenant-id` header, which
   any client can forge. This is the one thing that cannot ship. Needs Clerk keys.
2. **Carrier fan-out as background jobs.** See §7 — a synchronous shop is not viable at
   ~20 carriers. Recommended: **pg-boss** (runs on the Postgres you already have; no Redis,
   transactional with your data). One job per `(shop, carrier)` with retries, timeouts, and
   per-carrier concurrency caps, writing each result as it lands.
3. **UI pending states** — the comparison must treat partial results as normal, not an error.
4. **Hosting** — see §8.
5. Observability (structured logs + error tracking).

## 7. Scale analysis (worked out for ~100k clients, ~20 carriers/shop)

- **Volume:** ~120k shops/year × 20 carriers ≈ **2.4M quote results/year**, ~12M rows over
  5 years. **This is small.** One Postgres instance handles it. Do **not** shard or go
  microservices over this.
- **Concurrency** is the real constraint: ~85–170 carrier sessions in flight at peak
  (Little's Law, portal quotes 30s–3min). That's a worker fleet, not a background thread.
- **Latency is a product decision:** 20 carriers sequentially is 20+ minutes, and manual
  results arrive hours-to-days later. A shop is *never* simply "complete". It must be
  **asynchronous and progressive** — results stream in, partial is the normal state.
  The data model already supports this (results are independent rows keyed by `shopId`),
  so no migration is needed — only the queue and the UI.
- **Cost centre** is the **portal browser fleet** (~35–70 concurrent headless browsers,
  10–20GB RAM), not the database.
- **The dataset is the moat:** 2.4M results/year across 20 carriers is market-wide pricing
  data no single carrier has.

## 8. Hosting

You do **not** need AWS specifically — no ECS/EKS/Aurora/auto-scaling. Everything ships as
a container with versioned migrations, so hosts are swappable. But you **do** need managed
hosting with **automated backups and point-in-time recovery**; "one Postgres instance" means
don't shard, not don't administer.

**The deciding factor is data residency, not scale.** This holds Canadian PII (DOB, licence
numbers, addresses, claims history) — PIPEDA, and brokerages/carriers often contractually
require data stay in Canada. Confirm what your prospective clients' contracts demand *before*
choosing. Verify current Canadian region availability directly with the provider; check where
the **managed Postgres** physically lives, not just the app servers.

Ballpark: ~$50–150/month early, ~$500–1,500/month at 100k clients, mostly workers.

## 9. Gotchas already discovered (don't rediscover these the hard way)

- **`FORCE ROW LEVEL SECURITY` applies to the table OWNER too.** The seed failed with
  `42501` until it set `app.current_tenant` like the runtime does.
- **RLS without GRANTs locks the app out of its own database.** `rls.sql` must grant table
  privileges to the app role. `DELETE` is deliberately **withheld** — quote evidence is
  append-only at the database level.
- **Testing isolation as the owner proves nothing** (owners bypass RLS). Use a non-owner role.
- **`prisma migrate deploy` ships nothing if `prisma/migrations` is empty.** It was.
- The build emits **`dist/src/main.js`**, not `dist/main.js` (use `npm run start:prod`).
- **A technical failure is not a decline.** `runShop` isolates adapters and reports
  `ShopRun.failures` separately from results — an outage must never read as "the market
  declined this risk".

## 10. Running it locally

```bash
# frontend (mock spine, no backend needed)
pnpm install && pnpm --filter bms dev

# backend
cp .env.example .env          # DATABASE_URL = OWNER role; app connects as a NON-owner
npx prisma migrate deploy
npm run prisma:rls            # needs APP_DB_ROLE set
npm run seed
npm run start:dev

# point the app at the live API
INSURIMPLE_API_URL=http://localhost:4000 INSURIMPLE_TENANT_ID=tenant-klc pnpm --filter bms dev
```

Verify everything: `pnpm typecheck && pnpm test && pnpm build` (frontend);
`npm run typecheck && npm run build && npm test` (backend, needs a live Postgres).

## 11. Working agreement

One ticket at a time; plan before executing; **stop for review after each acceptance
passes**. Report honestly what is verified vs merely compiling. Never touch TopRates content.
**TR.7–TR.8 stay gated.**
