# @insurimple/db

Schema, migrations, RLS policies, seed and tests. **This package is the
enforcement boundary** — see `docs/decisions/0001-enforcement-boundary.md`.

## Quick start

Requires a local PostgreSQL. Target is 16; the schema is written to run on 14+
so it can be developed against a Homebrew `postgresql@14` (RLS semantics are
identical across those versions).

```bash
createdb insurimple_dev
pnpm --filter @insurimple/db reset   # drop, create, migrate, seed
pnpm --filter @insurimple/db test    # reset, then run the isolation suite
```

Then give the app role a password so the app can connect as a non-owner:

```sql
ALTER ROLE insurimple_app LOGIN PASSWORD 'devpassword';
GRANT CONNECT ON DATABASE insurimple_dev TO insurimple_app;
```

Copy `apps/bms/.env.example` to `apps/bms/.env.local`.

## Connect as the non-owner role. Always.

`DATABASE_URL` must authenticate as `insurimple_app`, never as the database
owner and never as a superuser.

**A superuser bypasses row level security entirely**, regardless of
`FORCE ROW LEVEL SECURITY`. Develop as a superuser and every screen will
cheerfully show you every tenant's data, RLS will appear to be "working", and
the first time it runs with real credentials it will behave completely
differently. Tables are `FORCE`d so the policies also bind the owner, but the
superuser bypass is above that — the only defence is not connecting as one.

## Tenant context

Set per transaction, never with a plain `SET`:

```sql
BEGIN;
SELECT set_config('app.current_tenant', $1, true);   -- true = transaction-local
-- ... queries ...
COMMIT;
```

A plain `SET` persists on the connection after it returns to the pool, so the
next checkout — a different tenant — inherits it. `withTenant()` in `src/index.ts`
is the only place this is done; use it for everything.

Unset context yields NULL, and `tenant_id = NULL` matches no rows. Absence of
context denies access; it never grants it.

## Layout

| Path | What |
|---|---|
| `migrations/0001` | roles, `app` schema, tenant/user context functions |
| `migrations/0002` | tenants, modules, `tenant_modules` entitlement (inv. #4) |
| `migrations/0003` | users, licences, the licensing guards (inv. #3) |
| `migrations/0004` | households, addresses, parties |
| `migrations/0005` | carriers, policies, drivers, vehicles, locations |
| `migrations/0006` | transactions, state machine, **no-bind guard** (inv. #1) |
| `migrations/0007` | row level security on every tenant-scoped table (inv. #2) |
| `seed.sql` | deterministic fixtures, two tenants |
| `tests/isolation.sql` | 32 assertions, runs as the non-owner role |

Migrations are tracked in `schema_migrations` by filename and checksum. Editing
an already-applied migration is refused — add a new one, or `reset` in
development.

## The tests

`tests/isolation.sql` asserts tenant isolation, entitlement, licensing, the
no-bind guard, and the append-only audit trail. It runs as `insurimple_app`
inside one transaction and rolls back, so the seeded database is unchanged.

It has been mutation-verified: disabling RLS on `households` produces 7
failures, and neutering `app.may_transact_module()` produces 3. A suite that
cannot fail is not evidence.

### pgTAP

CLAUDE.md invariant #2 calls for pgTAP in CI. `tests/isolation.pgtap.sql` is a
translation of the same assertions, but **it has not been executed** — pgTAP is
not installable via Homebrew and was not built from source here. Treat it as
unverified until it runs green once. `tests/isolation.sql` is the suite that
has actually been run.
