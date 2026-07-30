# 0002 — Database and hosting

**Date:** 2026-07-29
**Status:** Proposed — decision brief for the operator. Not yet decided.
**Prepared by:** Claude. Written to be decided *from*, not to pre-empt the decision.

## What this is

Context for choosing where Postgres lives (RDS / Neon / Supabase / other) and how the
three deployables reach each other, so the choice is made against this platform's actual
constraints rather than a generic "which Postgres?" comparison.

**Read the "Verify before committing" section.** Vendor regions, pricing and pooler
behaviour change, and several load-bearing facts below are marked as needing a
first-hand check rather than being asserted from memory.

---

## 1. Start with the sizing, because it inverts the usual advice

The target book is **5,000 policies** across roughly 2,000 households, one brokerage,
1–2 concurrent users, scaling to a handful of tenants.

Concretely, today's seeded book is 40 tables and a few hundred rows. At the *target*:

| | Rough scale |
|---|---|
| Accounts / policies | ~2,000 / ~5,000 |
| Transactions per year | ~6,000 |
| Documents (6-yr retention) | ~50,000 rows, blobs in S3 not Postgres |
| Peak concurrent users | Single digits |
| Working set | Comfortably under 1 GB |

**This is a small database.** The entire book fits in RAM on the smallest instance any
vendor sells. Nothing here is a performance decision — read replicas, autoscaling,
sharding and serverless burst capacity are all solving problems this workload does not
have.

That inverts the usual selection criteria. The decision should be made on **compliance,
data residency, operational simplicity and cost floor** — not throughput. Any of the
candidates is fast enough. Choosing for scale you will not reach is how a two-person
brokerage ends up with a platform team's bill.

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
virgin database (21 assertions, including "tenant B sees zero of tenant A's rows"). If
those pass on the real host with the real pooler, the topology is sound. If the host
cannot run them, that is the answer.

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

- **For:** excellent scale-to-zero economics; branching is genuinely useful for
  migrations and preview environments — a per-PR database branch would suit our CI well;
  fast provisioning.
- **Against:** **the serverless-connection advantage does not apply to us** (2b);
  scale-to-zero cold starts are a poor fit for an interactive BMS where a broker is on
  the phone with a client; **Canadian region availability is the open question and must
  be verified — if there is no Canadian region, this is disqualified on 2c**; storage
  architecture is further from stock Postgres, which matters more when the compliance
  story depends on the database behaving exactly as documented.
- **Cost shape:** lowest floor, usage-based.

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

**Do not adopt RDS before it is needed.** Nothing about the current build requires it: the
preview deployment renders from a snapshot with no database at all, and staging can run
anywhere. The trigger to provision production is **the first real client record**, which
is gated on RIBO registration and appointments — months out on the external clock.
Provisioning early buys an idle bill and a security surface, not progress.

**If the operator prefers one vendor and one bill over the above:** Supabase in a
Canadian region is the defensible single choice, provided §5's checks pass. It is a
reasonable trade of some control for materially less operational surface, and I would not
argue against it. RDS is the recommendation, not the only correct answer.

---

## 5. Verify before committing (do not take these on trust)

Vendor facts change and my knowledge has a cutoff. Confirm each **first-hand**:

1. **Canadian region actually available** on the chosen plan — not just "the vendor has a
   Canadian region somewhere", but on the tier you will buy.
2. **You can create a non-owner login role** and `REVOKE`/`GRANT` freely, so RLS applies.
   The proof is not the docs; it is `pnpm --filter @insurimple/db test` passing against
   the real host.
3. **Pooler mode is transaction mode** (or the pooler is bypassed). Record which, and
   why, in this file — a future migration to session pooling would silently break tenant
   isolation.
4. **PITR window and a rehearsed restore.** Actually restore once, to a scratch database,
   before there is client data to lose.
5. **Whether any carrier appointment package imposes data-residency or subprocessor
   terms** — this can override everything above, and it arrives with the appointments.
6. **`pg_trgm` is available** (used by the party search index in `0002_parties.sql`;
   CI enables it explicitly).

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
