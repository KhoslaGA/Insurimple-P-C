# CLAUDE.md — Insurimple Platform

You are building Insurimple: a standalone multi-tenant B2B SaaS for Canadian brokerages.
One platform, three subscription modules (P&C, Life/LLQP, Mortgage) on one shared spine.
This file is a contract. Violating an invariant fails the task regardless of feature completeness.

## Repo shape (do not deviate)
- pnpm workspaces + Turborepo.
- `apps/bms` — the product (Next.js 16, React 19, App Router, Tailwind v4).
- `apps/marketing` — insurimple.com (thin; P3; do not build unless a ticket says so).
- `packages/design-system` — tokens + typed components. THE ONLY source of UI primitives.
- `packages/contracts` — shared types/zod schemas + API client. New shared types land here FIRST.
- `packages/config` — eslint, tsconfig, tailwind preset, adherence lint.
- Backend is the NestJS + PostgreSQL 16 BMS in `apps/api` + `packages/db` (40 tables,
  15 migrations, validated). Do not reinvent it. Domain-critical writes (transactions, trust
  ledger) go through the NestJS API. Run the schema locally with
  `pnpm --filter @insurimple/db migrate` (+ `seed` for dev fixtures, `test` for the CI gate).

## Non-negotiable invariants
1. COMPLIANCE IS STRUCTURAL. Regulatory constraints live at the DB/API layer and are
   test-asserted. No-bind is a state-machine guard, not a hidden button.
2. MULTI-TENANCY FROM ROW ONE; VENDOR-BLIND. Postgres RLS via a non-owner role,
   `FORCE ROW LEVEL SECURITY`, `WITH CHECK` on writes. Tenant context comes from the
   Clerk org claim, NEVER from a request param. Tenant context is set per transaction:
   `SELECT set_config('app.current_tenant', $1, true)` inside BEGIN/COMMIT — never plain
   `SET` (pooler leak). pgTAP isolation tests must stay green in CI.
3. LICENCE IS THE SECURITY BOUNDARY. Role grants derive from a licence on file with
   expiry. A Life-only user cannot create a P&C transaction — enforced by grant, test-asserted.
   `current_actor()` defaults to `anonymous`, which holds no capability. `system` — the actor
   every authority guard bypasses — must be named explicitly; it is never inherited by a
   caller that forgot to set one.
4. ENTITLEMENT IS THE COMMERCIAL BOUNDARY. `tenant_modules` gates every module-scoped
   capability server-side. UI hiding is not enforcement.
5. INDEPENDENCE FROM RATE FAMILY. No imports, no shared DB, no runtime dependency on any
   Rate Family code or data. If you find `operator-os` or Rate Family remnants, flag and remove.
6. CONTRACTS PACKAGE IS THE SINGLE TYPE SOURCE.
7. MOCK DATA IS FIRST-CLASS. Deterministic seeds; fixtures can never pass as live carrier
   data; carrier-facing features build against the CarrierAdapter seam pre-appointment.
8. BUILD FOR SEPARABILITY. No coupling to KLC or Webhub4u internals; the anchor tenant
   (KLC) gets zero privileged code paths.
9. TESTS ARE THE ACCEPTANCE CRITERIA. A ticket is done when its assertions pass in CI.
10. EVERY SCREEN CONSUMES `packages/design-system` ONLY. No local styles, no hardcoded
    colors — tenant theming reads CSS variables from the token layer. Adherence lint enforces this.
11. CLIENT CODE IS CANONICAL AND IMMUTABLE: `first6(last) + first2(first) + counter`,
    e.g. `ABTAHISE01`. This matches the live Epic book, so a migrated client keeps the code
    already printed on their documents — code continuity across migration outranks a shorter
    stem. Normalization (NFKD fold, A–Z only, never pad), the per-stem collision counter,
    tenant-scoped uniqueness, immutability (a name change updates display name only), and the
    two-function contract (`normalizeNameToStem` / `issueClientCode`) are all as specified.
    Only the slice lengths differ from the original spec. Decided 2026-07-29 (tickets-DB gate 1).
12. MIGRATIONS ARE REWRITTEN IN PLACE, NOT LAYERED. There is no production data and no
    external consumer of the migration set. A corrective migration stacked on top is a
    permanent archaeological layer for zero benefit. This holds only until the first real
    client record exists; after that, migrations are append-only forever.
13. PRIMARY KEYS ARE UUIDv7, SUPPLIED BY THE CALLER. No table declares a default on `id`.
    Application code mints ids with `newId()` (`apps/api/src/db/id.ts`, the `uuidv7` npm
    package); SQL-side callers — the state-machine trigger, seeds, fixtures — use the
    `uuidv7()` function from 0001. UUIDv4 scatters inserts across the index and is the one
    scale decision that is not cheaply reversible. The default is removed rather than
    changed so that code which stops supplying an id fails loudly instead of quietly
    diverging. Test-asserted: `assert_no_generated_keys()` plus TEST10a–d.
14. PARTITION APPEND-ONLY LEAVES ONLY. `activity` and `audit_event` are range-partitioned
    by month (`ai_action` joins them when DB.6 creates it, born partitioned). `txn` is NOT
    partitioned: Postgres requires the partition key in the primary key,
    so partitioning `txn` would force a composite `(id, created_at)` PK and propagate a
    composite FK into every table that hangs off it — documents, signatures, carrier
    submissions, activities, ledger entries — forever, to solve a problem a 30M-row table
    does not have. Partitions carry their own `ENABLE` + `FORCE` row security: policies are
    inherited through the parent, but the app role can name a partition directly.
15. NO EXPRESSION INDEX ON A TENANT TABLE. Under RLS, a qual becomes an index condition only
    if it is `LEAKPROOF`, and `lower`, `upper`, `btrim`, `||`, `to_tsvector`, `LIKE`, regex
    and the pg_trgm operators are all non-leakproof — so such an index is used by the owner,
    never by the app, and a plan captured as owner will hide that. Normalise on WRITE
    (`search_name`, by trigger) and compare the raw column on read. Test-asserted:
    `assert_tenant_leading_indexes()` plus four `EXPLAIN`-as-`insurimple_app` assertions.

## Design system source of truth
`Insurimple-P_C/_ds/insurimple-design-system-*/` — seven token files + `_ds_manifest.json`
(~20 components). Port tokens into Tailwind v4 `@theme` in `packages/design-system`.
Recreate manifest components as typed shadcn-style (copy-in) components. The prototype lives in `prototype/`. The 13 `.dc.html`
screens are the visual spec for Phase 1 — match them, but never port `ui_kits/rate-family`.

## Working style
- Plan → execute per ticket; do not start a phase before the prior phase's acceptance is green.
- RSC-first reads; TanStack Query only for live-interactive state; `"use client"` at the leaves.
- Next.js 16: `fetch` is uncached by default; `params`/`searchParams` are Promises.
- Prefer full-file rewrites over cumulative small edits past ~20–30% change.
- When a real file/contract exists, read it before building. Never build against inferred shapes.
- Surface blocked external dependencies (RIBO, carriers, CSIO, banks) — never work around them.

## Reference docs (repo /docs)
`unified-platform-12-month-build-brief.md` (the contract) · `epic-parity-map.md` (BMS
requirements) · `pc-leg-page-list.md` · `insurimple-page-list.md` · `design-and-brand-brief.md`
