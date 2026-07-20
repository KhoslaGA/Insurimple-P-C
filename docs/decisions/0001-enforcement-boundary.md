# 0001 — Where enforcement lives

**Date:** 2026-07-19
**Status:** Accepted, pending Gautam's review
**Decided by:** Claude, working autonomously overnight. Flagged for review because it
changes a line in CLAUDE.md, which is a contract.

## The problem

CLAUDE.md instructed: *"Backend is the existing NestJS + PostgreSQL 16 BMS (33 tables,
7 migrations). Do not reinvent it. Domain-critical writes (transactions, trust ledger)
go through the NestJS API."*

That backend does not exist. Verified five independent ways across the whole filesystem
and the `KhoslaGA` GitHub account:

- no `nest-cli.json` anywhere (`find` + Spotlight `mdfind`)
- no `@nestjs/*` in any `package.json` on the machine
- no `*.module.ts` / `*.controller.ts` / `*.service.ts`
- no SQL defining brokerage tables; `trust_ledger`, `tenant_modules`,
  `FORCE ROW LEVEL SECURITY` and `app.current_tenant` match only prose in CLAUDE.md
  and the page-list docs — descriptions, never an implementation
- no pgTAP tests, no RLS policies, no migrations

The claim traces to the source build brief, which read *"Confirm existing 33 tables
first"* — an instruction to verify an assumption. It hardened into CLAUDE.md as settled
fact. The verification was never performed; the answer is that there is nothing there.

The nearest existing backend is `github.com/KhoslaGA/Backend` (`ratefamily-backend`) —
plain Node + `pg`, 5 migrations, 13 tables, a credit-card affiliate schema. It is Rate
Family, which invariant #5 forbids depending on. It is not a fallback.

## Why this blocked everything

Invariants #1 (compliance at the DB/API layer), #2 (RLS + pgTAP) and #4 (`tenant_modules`
gating server-side) all place enforcement in that backend. With it absent, the contract
was unimplementable as written — and any plan saying "call the existing API" would have
been building against a phantom.

## Decision

**PostgreSQL is the enforcement boundary. It is reached from Next.js server-side code
running as a non-owner application role. No NestJS service is introduced.**

Concretely:

- `packages/db` owns schema, migrations, RLS policies, seed and pgTAP tests.
- Every tenant-scoped table carries `tenant_id`, has `FORCE ROW LEVEL SECURITY`, and
  policies with `WITH CHECK` on writes.
- Tenant context is set per transaction via
  `SELECT set_config('app.current_tenant', $1, true)` inside `BEGIN`/`COMMIT` — never
  plain `SET`, which leaks across a pooler.
- Reads and writes happen in Server Components / Server Actions / route handlers. The
  browser never holds a database credential.

## Why not build the NestJS service

The invariants constrain *where* enforcement lives — the database layer, test-asserted —
not which HTTP framework fronts it. RLS in Postgres satisfies every one of them, and
does so more strongly than an API tier would: a policy in the database cannot be bypassed
by a forgotten guard in a controller. Adding a NestJS app would be a large unscoped
commitment, a second deployment target, and a second place for tenancy bugs to hide,
while adding no enforcement the database does not already provide.

## Cost, honestly stated

- Domain logic lives in `packages/db` (SQL functions, triggers, constraints) plus
  server-side TypeScript, rather than in a service layer. Complex workflow logic is
  less pleasant to write in SQL than in NestJS.
- There is no HTTP API for third parties yet. If carrier integrations or a mobile client
  later need one, it must be built.
- Connection pooling becomes the app's concern.

## Reversibility

The seam is preserved. All data access is confined to `packages/db`; no component or
page issues SQL directly. Extracting a service later means moving that package behind
HTTP and swapping the client — the schema, the RLS policies and the pgTAP tests carry
over untouched, because they are where the enforcement actually is.

## What Gautam should check

1. Is a standalone API service required for reasons outside this repo — a carrier
   integration, a partner, an existing contract?
2. `apps/bms` is a single deployment doing both UI and data access. Acceptable?
3. CLAUDE.md line 14 has been rewritten. Confirm the new wording.
