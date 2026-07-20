# Insurimple — Phase 0 Foundation: Completion & Handover

This repo is the uploaded `Insurimple-P-C` with Phase 0 foundation completed, the drifts
fixed, and the whole workspace verified building against real Postgres. Everything below was
run, not asserted.

## What was done

### 1. Backend brought in-repo (fixed the biggest drift)
CLAUDE.md said "backend is the existing NestJS + PostgreSQL BMS — do not reinvent it," but it
wasn't in the repo, so an agent had nothing real to read.
- `packages/db/` — all **7 migrations** (33 tables), `seed_dev.sql`, `test.sql`, and a
  **migration runner** (`scripts/migrate.mjs`) with `migrate` / `seed` / `test` modes and a
  `schema_migrations` tracking table (reruns are no-ops).
- `apps/api/` — the NestJS API (transaction spine, RLS-scoped DB module, accounts, health),
  package.json, tsconfig, Dockerfile.

### 2. The three missing workspace packages built
CLAUDE.md declared these mandatory; none existed.
- `packages/config/` — shared strict `tsconfig.base.json` (the base every package extends).
- `packages/design-system/` — **all seven `_ds` token files ported verbatim** into
  `tokens.css` (single source of brand truth), a Tailwind v4 `@theme` bridge (`theme.css`),
  and typed copy-in components: `Badge` + **`TxnStateBadge`** (encodes the lifecycle
  vocabulary), `Button`, `Table`, `EmptyState`.
- `packages/contracts/` — the single shared type source: txn states/types, the legal-transition
  table + `canTransition()` (mirrors the DB guard), and zod DTOs. Has passing unit tests.

### 3. `apps/bms` un-stubbed
Was still create-next-app boilerplate.
- `globals.css` imports the design-system token + theme layers.
- `layout.tsx` — real metadata, Inter + Lora per the token spec (with build-safe fallbacks).
- `page.tsx` — a real **transactions ledger** rendered from `@insurimple/design-system`
  against `@insurimple/contracts` types. Proves the wiring; Phase 1 swaps the fixture for a
  fetch to `GET /txns`.

### 4. CLAUDE.md drifts fixed
- Backend now points at `apps/api` + `packages/db` with the run command.
- All **five cited docs now exist** in `/docs` (build brief, epic-parity map, both page lists,
  design/brand brief) — written from our research + the real Epic screenshots.
- Next.js **15 → 16** corrected in guidance to match `apps/bms`.

### 5. CI added
`.github/workflows/ci.yml` — a `build` job (`turbo build lint typecheck`) and a `schema` job
that spins ephemeral Postgres 16, enables `pg_trgm`, and runs the assertions.

## What was verified (actually run)

| Check | Result |
|---|---|
| `pnpm install` (full workspace) | ✅ 542 packages, clean |
| `packages/contracts` unit tests | ✅ 3/3 pass |
| `apps/bms` production build + TypeScript | ✅ compiled, types pass, static pages generated |
| `apps/api` build (tsc) | ✅ compiled to `dist/` |
| `packages/db` migrate + **10 schema assertions** on virgin Postgres 16 | ✅ ALL PASSED |
| Runner guards (seed/test mutual-exclusion, virgin-DB check) | ✅ all three paths correct |

Two bugs were found and fixed while verifying, not papered over: `test.sql` dropped a role that
seeding had granted to (made idempotent), and it asserts exact row counts so it now refuses to
run on a non-virgin DB with a clear message.

## The one environment caveat
The Next build's only failure in the sandbox was fetching Inter/Lora from Google Fonts (network
is blocked here). It compiles cleanly with fonts removed, and on Vercel/CI the fetch succeeds;
fallbacks are configured so a blocked fetch degrades gracefully rather than hard-failing.

## Run it locally
```bash
pnpm install
pnpm --filter @insurimple/db migrate      # needs DATABASE_URL (Postgres 16)
pnpm --filter @insurimple/db seed          # dev fixtures (Abtahi book)
pnpm --filter bms dev                      # the app
pnpm turbo build lint typecheck            # the Phase-0 gate
```

## Next ticket (T0.1 is now unblocked)
The foundation an agent needs is real on disk. Next: expand `packages/design-system` to the
full 20-component manifest, add Clerk auth (org→tenant) to `apps/bms` + swap `getCtx()` in
`apps/api`, and stand up the app shell + Locate. Then Phase 1 screens per `pc-leg-page-list.md`.
