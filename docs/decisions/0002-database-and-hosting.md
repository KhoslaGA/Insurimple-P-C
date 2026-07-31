# 0002 — Database and hosting

**Date:** 2026-07-29
**Status:** **Accepted** — 2026-07-29.
**Decision:** AWS RDS PostgreSQL 16, `ca-central-1`, **direct connection** (no RDS Proxy),
non-owner app role. Staging/preview may run anywhere. Provisioning is deferred; the trigger
is the first real client record.
**Rationale:** Canadian residency is settled rather than argued, role control makes the RLS
topology unambiguous, and instance sizing / partitioning / restore time are all things this
platform needs direct control over at the design target.
**Prepared by:** Claude; accepted by the operator via `tickets-DB` gate.

## What this is

Context for choosing where Postgres lives (RDS / Neon / Supabase / other) and how the
three deployables reach each other, so the choice is made against this platform's actual
constraints rather than a generic "which Postgres?" comparison.

**Read the "Verify before committing" section.** Vendor regions, pricing and pooler
behaviour change, and several load-bearing facts below are marked as needing a
first-hand check rather than being asserted from memory.

---

## 1. Start with the sizing, because it decides most of the rest

**Design target: 50,000 accounts and up to 100,000 policies**, across a growing number of
tenants. This is the number to build against — not the single-brokerage starting book.

Deriving the rest from it, at steady state:

| | Rough scale | Notes |
|---|---|---|
| Accounts / policies | 50,000 / 100,000 | ~2 policies per household |
| Parties, vehicles, dwellings | ~75k / ~70k / ~30k | |
| Coverages | ~400,000 | ~4 per policy, structured not PDF |
| **Transactions per year** | **~165,000** | every policy renews annually (100k), plus endorsements (~50k), new business, cancellations |
| `txn_event` per year | ~1,000,000 | ~6 lifecycle transitions per transaction |
| Documents per year | ~330,000 rows | 6-yr retention → ~2M rows. **Blobs in S3, never Postgres** |
| Activities per year | ~250,000 | gated to stages that need documentation |
| **`audit_event` per year** | **~3,000,000** | every mutation on every audited table |
| Concurrent users | ~30–60 | ~125 staff at ~800 policies each |

### The audit trail is the database, not the book

The book itself is small: policies, coverages, parties and risks come to roughly **1–2 GB**.
But `audit_event` stores **two full `jsonb` row images — `before` and `after` — for every
mutation on every tenant-scoped table**. At ~1.5 KB per row and ~3M rows a year, over the
six-year retention window that is **~18M rows and roughly 25–40 GB**, before indexes.

**So: ~50–70 GB total, of which ~70% is the audit trail.** That is the single most
important sizing fact here, and it is a direct consequence of invariant 1 — the
append-only audit spine is the RIBO/E&O backbone, so it cannot simply be trimmed.

### What this changes versus a small book

This is still *comfortably* within one Postgres instance — tens of millions of rows is
routine, not exotic. But three earlier assumptions no longer hold:

1. **Never idle.** With dozens of concurrent users the database is continuously warm, so
   **scale-to-zero is worth nothing and cold starts are a straight cost** — a broker on
   the phone with a client waiting on a spun-down database is the worst version of this
   product.
2. **Connection pooling now matters.** 30–60 concurrent users against a pooled API is a
   real pool-sizing exercise rather than an afterthought.
3. **Indexing and partitioning become load-bearing** — see §3 below. At a few hundred
   rows every query plan is fine; at 100k policies the wrong plan is a visible stall.

The decision is *still* driven by compliance, residency and operational control rather
than raw throughput — no candidate will struggle to serve 60 users — but "any tiny
instance will do" is no longer true, and neither is the case for a serverless-first
database.

---

## 2. The hard constraints (these eliminate options)

### 2a. RLS demands a specific connection topology — this is the real filter

`CLAUDE.md` invariant 2 is not a preference; it dictates how the app may connect:

> Postgres RLS via a **non-owner role**, `FORCE ROW LEVEL SECURITY`, `WITH CHECK` on
> writes. Tenant context is set per transaction:
> `SELECT set_config('app.current_tenant', $1, true)` inside BEGIN/COMMIT — **never
> plain `SET` (pooler leak)**.

Three consequences:

1. **We must be able to create and connect as a non-superuser, non-owner role.** Any
   host that only hands you a superuser-ish role, or restricts role creation, is
   disqualified — RLS does not apply to the table owner or a superuser, so the entire
   isolation guarantee silently evaporates. This is the single most dangerous failure
   mode available to us: everything keeps working, and every tenant sees every other
   tenant's book.
2. **Transaction-scoped context is already implemented correctly** (`db.module.ts` uses
   `set_config(..., true)` and `SET LOCAL ROLE` inside `BEGIN`/`COMMIT`). This is
   *compatible with transaction-mode pooling* (PgBouncer-style), because the context
   dies with the transaction that set it.
3. **Session-mode pooling plus plain `SET` would leak across tenants.** We do not do
   this, and the code must not drift into it. Whichever host is chosen, its pooler mode
   must be confirmed and written down.

**Test that survives the choice:** after provisioning anywhere, run
`pnpm --filter @insurimple/db test` against it. It asserts the isolation properties on a
virgin database. Then run `pnpm --filter @insurimple/db test:rls`, which connects as
`insurimple_app` — refusing to start if that role turns out to be a superuser, hold
`BYPASSRLS`, or own the tables — and asserts, for every table carrying `tenant_id`, that a
cross-tenant read returns nothing, a cross-tenant write touches nothing, a planted row is
refused by that table's own `WITH CHECK`, and a query with no tenant context returns zero
rather than everything. If those pass on the real host with the real pooler, the topology
is sound. If the host cannot run them, that is the answer.

### 2a-bis. RLS and the query planner — a scale-specific trap

Because the policy is `USING (tenant_id = current_tenant())`, **every query carries a
`tenant_id` predicate**, whether the application wrote one or not. A composite index must
therefore **lead with `tenant_id`**, or it cannot satisfy both the RLS predicate and the
query's own filter, and the planner falls back to a scan.

The existing schema does this well — nearly every index already leads with `tenant_id`.
The exceptions (`txn_event(txn_id, at)`, `journal_line(entry_id)`) are correct as-is,
because the leading column is highly selective and the tenant predicate is a cheap
recheck.

Reading the queries the app actually runs surfaced two real gaps, now closed in
`0013_scale_indexes.sql`:

- **`policy(tenant_id, status)` did not exist**, yet `WHERE status = 'in_force'` appears
  at **ten call sites** — metrics, compliance, billing, the renewal queue. At 100k
  policies that is a sequential scan of the whole table on every dashboard load.
- **`account` had no index beyond the lookup-code unique constraint**, while Locate,
  Households and the consent-gap check all read it by status and name.

`current_tenant()` is declared `STABLE`, which is what allows the planner to treat it as
a constant within a statement and use these indexes at all. **Do not make it `VOLATILE`.**

**Measured 2026-07-31, and the trap is deeper than index order.** Under RLS a qual the
caller wrote sits at a higher security level than the policy's own, and PostgreSQL will
only promote it into an index condition if it is `LEAKPROOF`. `similarity_op` (`%`) is
not — so the trigram index on party names was **never used by `insurimple_app`**, only by
the owner, whose plan is the one a developer captures and the one that means nothing.
Neither is `lower()`, `upper()`, `btrim()`, `to_tsvector` or even `||`, which makes *any*
expression index on a tenant table unusable. `btree_gin` over `(tenant_id, expr)` does not
rescue it; `ALTER FUNCTION … LEAKPROOF` would and needs real superuser, which RDS does not
grant. The schema now normalises on write (`party.search_name`, `account.search_name`,
maintained by trigger) and compares raw on read, which is indexable. Full detail and the
measurements are in `packages/db/README.md`; `assert_tenant_leading_indexes()` and four
`EXPLAIN`-as-app-role assertions in the RLS suite hold the line.

### 2a-ter. `audit_event` should be partitioned before it is large

At ~3M rows a year with two `jsonb` images each, `audit_event` becomes the largest object
in the database. Left as a single table it makes autovacuum, index maintenance and the
eventual six-year retention sweep progressively more painful, and a `DELETE` of a year's
worth is a long, bloating operation.

**Range-partition it by month.** Then the retention sweep is a `DETACH`/`DROP` of a
partition — effectively instant — and vacuum works on tranches rather than one huge heap.

**Done, 2026-07-31**, in `0001_foundation.sql` — rewritten in place per invariant 12,
alongside `activity`. `audit_event` now declares `PRIMARY KEY (id, at) PARTITION BY RANGE
(at)`, which is affordable only because nothing holds a foreign key to it; that is the
same test `txn` fails. `ensure_month_partitions()` is idempotent, so the migration and the
maintenance job are one code path, and `assert_partitions_current()` fails the build if
this month or next has no partition, or if anything has accumulated in the default.

### 2b. The API is a long-lived process, not serverless functions

`apps/api` is a persistent NestJS process holding a `pg.Pool`. It is **not** Lambda or
Vercel functions.

This matters because the headline reason people reach for Neon — thousands of ephemeral
serverless connections needing a scale-to-zero pooler — **does not apply to us**. One
container holds a small pool. Connection exhaustion is not our problem.

If that ever changes (moving the API to serverless), revisit this; today it removes the
strongest argument for a serverless-first database.

### 2c. Data residency is a sales constraint, not just a legal one

PIPEDA does not flatly require Canadian storage, but three things push hard that way:

- **The product promise.** Invariant 2 is *vendor-blind tenancy*; the market is KLC's
  competitors. "Where is my book stored?" is a question a competing brokerage *will*
  ask, and "a US region" is a worse answer than "Canada", regardless of legality.
- **Regulator and carrier expectations.** RIBO/FSRA record-keeping and carrier data
  agreements tend to assume Canadian handling. Some carrier appointments impose it
  contractually — **this is worth checking against a real appointment package.**
- **The brief already assumes it.** §8 names **RDS ca-central-1**.

Treat "offers a Canadian region" as a **hard filter**, and confirm it first-hand for any
candidate rather than trusting a summary — availability by region changes.

### 2d. Records must be durable and restorable for six years

Retention is a *records* obligation (documents, audit trail, trust ledger), not a backup
policy — but they interact: point-in-time recovery, tested restores, and not being able
to lose the trust ledger to a bad migration. Any candidate must offer PITR and a restore
you have actually rehearsed. **A backup you have never restored is a hypothesis.**

---

## 3. The candidates, honestly

Ordered by how well they fit *this* workload, not by general popularity.

### AWS RDS (or Aurora) — `ca-central-1`

- **For:** Canadian region certain; full control of roles, extensions and parameters, so
  the RLS topology is unambiguous; PITR and snapshots are mature; already named in the
  brief; no surprises at audit time; the same account can hold S3 for documents, which
  we need anyway for the 6-year vault.
- **Against:** highest operational surface (VPC, subnet groups, parameter groups,
  security groups); costs money while idle — no scale-to-zero; you own patching windows;
  RDS Proxy has connection-pinning behaviours worth understanding *if* you add it (we
  likely do not need it, per 2b).
- **Cost shape:** a small always-on instance plus storage. Predictable, not free.

### Supabase

- **For:** managed Postgres with a good developer experience; PITR on paid tiers;
  generally permissive about roles and extensions (it *is* Postgres, and you get a real
  `postgres` role); Canadian region believed available — **verify**; bundles storage and
  auth we do not need but do not have to use.
- **Against:** we already use Clerk for auth and would ignore Supabase Auth, so part of
  the value is unused; the pooler (Supavisor) mode must be confirmed as transaction mode
  for our topology; a platform layer between you and Postgres that you must reason about
  during an incident.
- **Cost shape:** low floor, predictable tiers.

### Neon

- **For:** branching is genuinely useful for migrations and preview environments — a
  per-PR database branch would suit our CI well; fast provisioning; lowest floor cost.
- **Against:** at the design target **both of its headline advantages evaporate**. The
  serverless-connection benefit does not apply (2b), and scale-to-zero is worth nothing
  on a database that is continuously warm — while cold starts remain a real cost to a
  broker mid-call. **Canadian region availability is the open question and must be
  verified — if there is no Canadian region, this is disqualified on 2c.** Storage
  architecture is further from stock Postgres, which matters more once partitioning,
  vacuum behaviour and a 70 GB restore are part of the operational story.
- **Verdict:** good for **staging and per-PR branches**; not the live book.

### Railway / Render managed Postgres

- **For:** trivially simple; the API is likely hosted on one of them anyway, so it is one
  vendor and one bill.
- **Against:** these are convenience databases. Backup/PITR guarantees are weaker than
  RDS/Supabase, Canadian regions are generally **not** offered (verify), and "our trust
  ledger and 6-year records live on the same box as the app on a hobby-tier host" is not
  a sentence you want to say to a regulator or a prospect. **Fine for staging. Not for
  the live book.**

---

## 4. Recommendation

**Two databases, chosen for different jobs:**

1. **Production / live book → AWS RDS Postgres 16 in `ca-central-1`.**
   The residency question is settled rather than argued, role control makes the RLS
   topology unambiguous, PITR is mature, and S3 for the document vault sits in the same
   account. The extra operational surface is a real cost, but it is paid once at setup
   and the workload is small enough that the instance is then boring — which is the point.

2. **Staging / preview → the cheapest thing that runs Postgres 16**, most likely Neon or
   Supabase free tier. Seeded, disposable, no client data, no residency constraint.
   Neon's branching is genuinely attractive here for per-PR databases.

**Sizing:** at 50–70 GB with a hot set of roughly the current year, target an instance
with **8–16 GB RAM** so the working set stays cached, on SSD storage with headroom for
the audit trail's growth. That is a modest instance, not a large one — but it is not the
smallest tier either, and it should be sized deliberately rather than by default.

**Do not adopt RDS before it is needed.** Nothing about the current build requires it: the
preview deployment renders from a snapshot with no database at all, and staging can run
anywhere. The trigger to provision production is **the first real client record**, which
is gated on RIBO registration and appointments — months out on the external clock.
Provisioning early buys an idle bill and a security surface, not progress.

**If the operator prefers one vendor and one bill over the above:** Supabase in a
Canadian region remains defensible, provided §5's checks pass — it is stock Postgres with
real role control, which is what the compliance story depends on. At the design target I
hold the recommendation more firmly than I would have at 5,000 policies, because instance
sizing, partitioning and restore time all become things you want direct control over. But
RDS is the recommendation, not the only correct answer.

### What the scale target changed

For the record, since this document was first drafted against a 5,000-policy book:
- Serverless/scale-to-zero went from *plausible* to *actively wrong* — the database is
  never idle, so the saving does not exist and the cold start is pure cost.
- Indexing moved from "irrelevant at this size" to load-bearing; two real gaps were found
  and closed (`0013_scale_indexes.sql`).
- `audit_event` partitioning became a **pre-launch requirement** rather than a nicety.
- Instance sizing became a deliberate choice rather than "the smallest tier".
- The recommendation itself did **not** change — the constraints that produced it
  (residency, role control, restore discipline) got stronger, not weaker.

---

## 5. Connection topology — decided, and why (DB.5)

**Direct connection. No RDS Proxy. Decided 2026-07-31.**

RDS Proxy pins a client connection to a backend the moment the session issues any
session-altering statement, and `set_config()` is one. There is no session-pinning filter
for PostgreSQL the way there is for MySQL, so there is no exemption to configure. This
application calls `set_config('app.current_tenant', …)` on **every** transaction, by
design — that is invariant 2. The proxy would therefore pin every connection it ever
hands out, which is a pooler that pools nothing, billed per hour.

`apps/api` is one long-lived NestJS process with a small `pg.Pool`. It does not need an
external pooler, and adding one buys a failure mode instead of a capability.

**If this is ever revisited, the mode is the whole question.** A transaction-mode pooler
in front of transaction-local settings is safe — `set_config(…, is_local => true)` reverts
at COMMIT, so the next borrower of that backend starts clean. A **session-mode** pooler is
also safe. What is *not* safe is any arrangement where the setting outlives the
transaction: then the connection carries the previous request's tenant into the next one,
every policy evaluates correctly against the wrong tenant, and the result is a plausible
page showing another brokerage's book. There is no error to alert on.

The mutation that produces it is one word: `SET app.current_tenant` instead of
`set_config(..., true)`, or `SET ROLE` instead of `SET LOCAL ROLE`. Both are natural
things for a refactor to write. `apps/api/test/topology.test.mjs` reads the source and
fails the build on either, on `adminQuery` being called from anywhere but the auth guard,
and on a second `pg.Pool` being constructed outside `DbService`. It was mutation-checked
by introducing both forms and confirming the suite goes red.

**Session guard rails** (`0014_role_topology.sql`), on `insurimple_app`:

| setting | value | why |
|---|---|---|
| `statement_timeout` | `30s` | a runaway query on a 100k-policy table should be killed, not survive to be retried |
| `idle_in_transaction_session_timeout` | `60s` | an abandoned open transaction holds tenant context and blocks vacuum on the largest tables in the database |

Both are set on the role rather than in the connection string, so they apply however the
application connects — including a psql session someone opens with the app credentials.

---

## 5b. Verify before committing (do not take these on trust)

Vendor facts change and my knowledge has a cutoff. Confirm each **first-hand**:

1. **Canadian region actually available** on the chosen plan — not just "the vendor has a
   Canadian region somewhere", but on the tier you will buy.
2. **You can create a non-owner login role** and `REVOKE`/`GRANT` freely, so RLS applies.
   The proof is not the docs; it is `pnpm --filter @insurimple/db test` passing against
   the real host.
3. **Pooler mode is transaction mode** (or the pooler is bypassed) — **settled in §5:
   bypassed, no RDS Proxy.** What remains to verify first-hand is that the chosen host
   does not interpose a pooler of its own on the connection string you are given.
4. **PITR window and a rehearsed restore.** Actually restore once, to a scratch database,
   before there is client data to lose.
5. **Whether any carrier appointment package imposes data-residency or subprocessor
   terms** — this can override everything above, and it arrives with the appointments.
6. **`pg_trgm` is available** (used by the party and account search indexes in
   `0002_parties.sql` and `0013_scale_indexes.sql`; CI enables it explicitly).
7. **Restore time for a ~70 GB database on the chosen tier.** At this size a restore is
   tens of minutes, not seconds — know the number before you need it, and rehearse it.
8. **Whether the host permits declarative partitioning and `DETACH PARTITION`**, which
   the `audit_event` retention strategy depends on.

---

## 6. The rest of the stack, for completeness

| Piece | Where | Notes |
|---|---|---|
| `apps/bms` (Next.js) | Vercel | Config pinned in `apps/bms/vercel.json`; Root Directory `apps/bms` |
| `apps/api` (NestJS) | Railway / Render / Fly | `render.yaml` and `apps/api/railway.json` are checked in. Choose the region **nearest the database**, not nearest the user — every request makes several round trips to Postgres |
| Documents | S3 (`ca-central-1`) | `document.storage_key` already anticipates this; blobs must never live in Postgres |
| Auth | Clerk | Org claim → tenant. Production instance is separate from development |
| Email / SMS | Resend or Postmark, Twilio | Domain warm-up takes 2–4 weeks — start before you need it |

**Co-locate the API and the database.** The API makes several round trips per request; a
cross-continent hop between them is the one latency mistake that would actually be felt.
If the database is in `ca-central-1`, host the API in a Canadian or at minimum
US-northeast region. Vercel's edge location for the web app matters far less, because it
makes one call to the API per render.

---

## 7. Consequences

- Production data residency is settled and defensible in a sales conversation.
- We accept a non-zero idle cost for the live book, in exchange for control over the
  exact property the product is sold on.
- Staging and production are different vendors, so the migration runner and the schema
  assertions must keep working on both — which they do, since both are stock Postgres 16
  and CI already runs the assertions on ephemeral Postgres.
- Choosing later rather than now is deliberate: nothing is blocked by deferring, and the
  external clock (RIBO, appointments) sets the real date.
