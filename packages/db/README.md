# @insurimple/db

The schema, the migration runner, and the two test suites that decide whether it
is safe to put a second brokerage's book in this database.

```
migrations/          numbered SQL, applied in filename order, one transaction each
scripts/migrate.mjs  the runner  (--seed dev fixtures | --test schema assertions)
scripts/seed_dev.sql dev bootstrap, one tenant
test.sql             26 schema assertions — constraints, triggers, state machine
test/                the tenant isolation suite (pgTAP)
```

## Running it

```bash
export DATABASE_URL=postgres://…            # the OWNER connection

pnpm --filter @insurimple/db migrate        # apply migrations
pnpm --filter @insurimple/db seed           # + dev fixtures (never in production)
pnpm --filter @insurimple/db test           # schema assertions, virgin DB only
pnpm --filter @insurimple/db test:rls       # tenant isolation gate
```

`test` asserts exact row counts, so it only holds against a virgin database.
`test:rls` builds its own two-tenant fixture and rolls everything back.

## The tenant isolation gate

`test:rls` opens **two** connections. `DATABASE_URL` is the owner: it installs
pgTAP, creates the probes, and loads the fixture. The suite itself then runs on a
second connection as `insurimple_app`, which owns nothing and holds neither
`SUPERUSER` nor `BYPASSRLS`, and which the script refuses to start without.

That split is the whole point. Row level security does not apply to a superuser
at all, and applies to the table owner only when `FORCE ROW LEVEL SECURITY` is
set. A suite run on the migration connection measures the owner's visibility and
reports it as the application's — which is the standard way to certify an
isolation model that does not exist.

For each of the 35 tables carrying `tenant_id`, acting as tenant *alpha*:

| assertion | what would otherwise be possible |
|---|---|
| own-tenant `SELECT` returns every fixture row | the probe is blind, and the three below pass for that reason |
| cross-tenant `SELECT` returns zero | read another brokerage's book |
| cross-tenant `UPDATE` affects zero rows | edit it |
| `INSERT` with a foreign `tenant_id` is refused by **that table's own** `WITH CHECK` | plant a row inside it |
| with **no** tenant context, `SELECT` returns zero | a policy with an `IS NULL` escape hatch returns the entire platform |

Coverage comes from the catalogue, not a list: a new table carrying `tenant_id`
is covered the moment it exists.

### Why the fixture exists

The dev seed populates one tenant and leaves five tenant-scoped tables empty.
"The other tenant sees zero rows" is true of an empty table too — and that is the
most common way an RLS certification lies. `test/rls_fixture.sql` plants at least
one row in every tenant-scoped table for **both** tenants and records the
privileged counts in `rls_fixture_census`; the suite asserts against that census,
so a vacuous pass fails instead.

### Mutation checks

The suite has been verified to go red, and to go red on the right table:

```bash
node scripts/rls-test.mjs --mutate=policy:noforce   # 1 failure  — the FORCE backstop
node scripts/rls-test.mjs --mutate=policy:disable   # 5 failures — all on `policy`
```

Two false passes were found and closed this way, both of which a looser suite
would still be reporting green:

- Asserting only that the plant *failed* passes on a table with no policy: the
  audit trigger writes the mutation into `audit_event`, whose own `WITH CHECK`
  refuses a row for an out-of-context tenant. The error says row-level security,
  just about a different table. The assertion now matches the table name.
- A broken policy lets the cross-tenant `UPDATE` reach real rows, and the
  resulting audit failure aborted the entire suite transaction — a crash with no
  indication of which table caused it. `rls_update_count` now returns `-1` so the
  failure stays inside the assertion.

### What RLS does to the planner

Under row level security a qual the caller wrote sits at a **higher security
level** than the policy's own qual, and PostgreSQL will only promote such a qual
into an index condition if it is `LEAKPROOF` — otherwise it could observe rows
the policy is meant to hide before the policy has run. Measured on 60,000
parties across two tenants, PostgreSQL 16:

| connected as | query | plan |
|---|---|---|
| owner | `name % 'Surname4242'` | Bitmap Index Scan on the GIN index |
| `insurimple_app` | `name % 'Surname4242'` | `Index Cond: tenant_id` only, `Filter: %` — **51.8 ms** |
| `insurimple_app` | `lower(last_name) >= 'surname42'` | `Index Cond: tenant_id` only, range demoted |
| `insurimple_app` | `last_name >= 'Surname42'` | `Index Cond: (tenant_id, last_name)` — **0.256 ms** |

The owner's plan is the one a developer captures, and it is meaningless: a
superuser or an unforced owner never had the policy applied.

Nothing rescues the trigram index. A composite GIN over `(tenant_id, expr)`
using `btree_gin` was tried — the tenant equality becomes the index condition
and `%` stays a filter. `ALTER FUNCTION similarity_op(text,text) LEAKPROOF`
would fix it and requires actual superuser, which RDS does not grant.

And it is not only the trigram operator, which is the part that generalises:

```
proleakproof = false   similarity_op (%)  textlike (~~)  texticlike (~~*)
                       textregexeq (~)    ts_match_vq (@@)  to_tsvector
                       textcat (||)       lower  upper  btrim
proleakproof = true    texteq (=)  text_lt/le/ge/gt  bttextcmp
```

`lower(last_name) >= 'x'` is demoted even though `>=` is leakproof — the
`lower()` wrapper poisons it. **Any expression index on a tenant table is dead
under RLS unless every function in the expression is leakproof.**

So: **normalise on write, compare raw on read.** `party.search_name` and
`account.search_name` are folded by trigger (where leakproofness is irrelevant
because nothing is being planned) and indexed `(tenant_id, search_name)`. A
prefix search then touches a plain text column with plain comparison operators
and both halves become index conditions. Four assertions in the RLS suite pin
this in both directions — the path that works must keep working, and the one
that does not must stay documented rather than quietly reappear as an index
nobody notices is dead.

Fuzzy and full-text matching still **work**; they run as a filter over the
caller's own tenant, bounded by one brokerage's book rather than the platform's.
If that ever needs accelerating, the answer is a search service outside the RLS
boundary, not an index the planner has already refused.

### Partitions

`activity` is range-partitioned by month. It is an append-only leaf — nothing
holds a foreign key to it — so the composite primary key that partitioning
forces (`PRIMARY KEY (id, created_at)`, because PostgreSQL requires the
partition key in the PK) stops there. That is exactly why `txn` is **not**
partitioned: documents, signatures, carrier submissions, activities and ledger
entries all reference it, and each would have to carry `(txn_id, created_at)`
forever.

`ensure_month_partitions(table, from, months)` is idempotent, so the migration
and the maintenance job are the same code path. Every partition gets its **own**
`ENABLE` + `FORCE ROW LEVEL SECURITY`: policies are inherited through the
parent, but `insurimple_app` can name a partition directly, and a partition
without row security is an open door with a date in its name.

A `DEFAULT` partition exists so a row outside every declared range is filed
rather than refused — losing the ability to write diary entries because
maintenance fell behind is the worse failure. The cost is that a non-empty
default blocks creating the partition those rows belong to, so
`assert_partitions_current()` fails the build if anything is in there.

### pgTAP

Not present in the `postgres:16` image. It is pure SQL and PL/pgSQL, so
installing it is a package install rather than a build:

```bash
apt-get install postgresql-16-pgtap                                   # host
docker exec <container> apt-get install -y postgresql-16-pgtap        # container
```

CI does the second in the `rls` job. pgTAP is a test dependency only — nothing in
`apps/api` or the migrations references it, so it is not needed on RDS.

## Roles

| role | holds | used by |
|---|---|---|
| `insurimple_migrator` | owns every object | migrations |
| `insurimple_app` | `SELECT/INSERT/UPDATE/DELETE`, no ownership, no DDL, `NOSUPERUSER NOBYPASSRLS` | `apps/api` — the only role in its `DATABASE_URL` |
| `app` | legacy dev name, granted `insurimple_app` | local dev, existing tests |

`insurimple_app` is created `LOGIN` with **no password**: a login role without a
password cannot authenticate under scram, so the migration creates the identity
and the deployment supplies the credential. No password belongs in a checked-in
migration. `scripts/rls-test.mjs` sets a local one because it is test-only.

Tenant context is set per transaction —
`SELECT set_config('app.current_tenant', $1, true)` inside `BEGIN`/`COMMIT`,
never a plain `SET`, which leaks across a pooled connection.
