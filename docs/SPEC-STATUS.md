# SPEC-STATUS — read this before the master spec

`insurimple-master-spec.md` is the venture's narrative brief: mission, business model,
phase plan, dependency register, human/regulatory track. It is excellent for *why* and
*what order*. Parts of it were written before Phase 0 was built, so they describe a repo
that no longer exists.

## Precedence — when two documents disagree

1. **The repo** (code, migrations, git history) — ground truth, always
2. **`CLAUDE.md`** — the invariant contract the agent reads every session
3. **This file** — the reconciliation layer
4. **`insurimple-master-spec.md`** — narrative plan and business context

The master spec's own rule agrees: *"When a real file/contract exists, read it before
building. Never build against inferred shapes."*

---

## Superseded — do not act on these sections

| Master spec says | Reality | Action |
|---|---|---|
| §3 "Phase 0 kickoff" — run `create-turbo` / `create-next-app`, bootstrap the monorepo | Phase 0 is built and committed; the design system, shell, Locate, auth, API and 15 migrations all exist | Treat §3 as **historical**. Never bootstrap. |
| "Next.js 15" | `apps/bms` runs **Next.js 16**, React 19 | Guidance holds directionally; the version number is stale |
| "7 migrations, 33 tables" | **15 migrations, 40 tables**, validated on virgin Postgres 16 | Update the count before quoting it |
| "Six custom roles" (T0.5) | The six roles now exist as data (`app_role`), with capabilities, licence anchoring and licence-class validity — see `0009`–`0011` | Built. |
| "NestJS backend does not exist" (ADR 0001) | `apps/api` exists — NestJS 11, Clerk auth guard, tenant-scoped services, 25 endpoints | Enforcement = NestJS + Postgres RLS |
| **Database is undecided** | **Decided 2026-07-29: AWS RDS PostgreSQL 16, `ca-central-1`, direct connection, non-owner app role.** See `docs/decisions/0002-database-and-hosting.md` (Accepted) | **RDS `ca-central-1` is repo truth.** Any spec text implying Neon, Supabase, a US region, or an undecided database is superseded. Staging/preview may run anywhere; provisioning is deferred until the first real client record. |

---

## Resolved — formerly open contradictions

### 1. Client code format — **RESOLVED 2026-07-29**

The spec proposed `first4(last) + first2(first) + counter` → `NAULSU001`. Every code in
the seeded book and the operator's live Epic seat uses `first6 + first2 + counter` →
`ABTAHISE01`, `KAPOORGA01`, `MEHTARA01`.

**Decision: match Epic.** Code continuity across migration outranks a shorter stem — a
migrated client keeps the code already printed on their documents and quoted in their
correspondence, and "we move your book without changing a single client code" is a
migration sales point. Recorded as **`CLAUDE.md` invariant 11**. Only the slice lengths
changed; the collision-counter semantics, normalization rules, tenant-scoped uniqueness,
immutability and the two-function contract are all as originally specified.

### 2. Migration policy — **RESOLVED 2026-07-29**

Migrations are **rewritten in place, not layered**, while there is no production data and
no external consumer of the migration set. Recorded as **invariant 12**. This licence
expires at the first real client record, after which migrations are append-only forever.

### 3. Partition scope — **RESOLVED 2026-07-29**

Partition **append-only leaves only** (`activity`, `ai_action`). **Not `txn`**: Postgres
requires the partition key in the primary key, so partitioning `txn` would force a
composite `(id, created_at)` PK and push a composite foreign key into every table hanging
off it — documents, signatures, carrier submissions, activities, ledger entries — to solve
a problem a 30M-row table does not have. Recorded as **invariant 13**.

---

## Still open — the human decides, the agent must not guess

### The quoter — "native" vs Rate Family independence

The parity map calls the quoter NATIVE — *"our quoter is the platform — Rate Family front
end on the CarrierAdapter seam."* Invariant 5 and the scope statement say the opposite:
complete independence from Rate Family, lead intake only over an arm's-length public API.

Likely intent: the **rating / CarrierAdapter seam is native to Insurimple**, and Rate
Family is merely one lead source over the public API. The current wording invites an agent
to couple them, which would violate invariant 5.

**Current position: the CarrierAdapter seam is built (`apps/api/src/carriers/`) with a
deterministic mock adapter and no bind method. No consumer quoter UI exists in this repo,
and none should be built until this is reworded.**

### Anchor tenant naming

The master spec names **KLC Group** as tenant #1 (Life module, Phase 3). The seeded
database names tenant `1111…` **"Insurimple Brokerage Inc."** (P&C). Both may be true over
time. Harmless today; clarify before onboarding a second real tenant.

---

## Still fully authoritative in the master spec

- §0 scope statement and the engineering invariants (§4)
- §6 phase plan from Phase 1 onward, and the acceptance criteria
- §7 human/regulatory track and §10 dependency register — the external clock (RIBO Level 3,
  carrier appointments, CSIO/IVANS, trust account) is unchanged and remains the real
  constraint on the live-book date
- §9 compliance requirements
- The Epic parity map — still the requirements checklist
- The client-code spec's rules other than slice length (see resolved item 1)
- Page lists (P&C leg, product, auto) — the build backlog
- Design & brand brief — subordinate to the `_ds` token files, which win on any specific value
