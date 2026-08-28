# Brief for chat — `tickets-DB` DB.0 → DB.8 complete

**Date:** 2026-08-28 · **Branch:** `claude/vscode-claude-chat-continue-2xx3p9` · **11 commits, pushed**
**Repo state:** 18 migrations · 42 tables · 5 test suites green on virgin databases · `infra/` written, **nothing applied**

| suite | assertions | what it proves |
|---|---|---|
| schema (`db test`) | 61 | constraints, triggers, state machine, entitlement, keys, partitions |
| **RLS gate** (`db test:rls`) | **188** | tenant isolation, as `insurimple_app`, over every table carrying `tenant_id` |
| API (`api test`) | 70 | boundaries over HTTP against a real Nest app + real Postgres |
| contracts | 24 | client-code stem, transitions |
| frontend | 26 | preview snapshot, metrics arithmetic |
| export round trip | CI gate | `ai_action` → Parquet → read back |

Everything below DB.8 runs on local and CI Postgres. **No AWS resources exist and none were created.**

---

## 1. Decisions taken — please ratify or overrule

These are recorded as `CLAUDE.md` invariants and are now load-bearing across the schema.

**Entitlement reads and writes gate on different predicates** (invariant 4). Reads require the
`tenant_module` row to **exist**; writes require it to be **`active`**. Gating reads on `active`
was the obvious design and it is wrong: a brokerage that cancels P&C still owes six years of
RIBO retention and must produce records on a spot check, so hiding rows when a card declines is
a compliance failure in the other direction — and a silent one, since the exception report would
return zero. A tenant that *never* bought a module has no row, so it reads nothing and writes
nothing, which is the commercial boundary the module split exists to draw.

**Four modules, not three** — `pc`, `life`, `mortgage`, `marketing`. Per your answer. **Marketing's
capability set is deliberately not invented**: no ticket specifies what Marketing/CRM may do, and
an empty module gates nothing, which is the safe direction. That is the next ticket.

**`current_actor()` now defaults to `anonymous`, not `system`** (invariant 3). It defaulted to
`system` — the actor every authority guard bypasses — so a connection that forgot to set an actor
held full provisioning authority: create transactions with no licence, issue proofs, grant itself
roles. Nothing errored, which is why it survived. `system` must now be named.

**`audit_event` is partitioned** (invariant 14). ADR 0002 §2a-ter had flagged it — *"do it before
the first live book"* — and left it undone; the DB.4 ticket named `activity` and `ai_action` but not
`audit_event`, which by the ADR's own sizing is ~70% of the database. This is the one place I went
beyond the ticket. Say if it should have waited.

**Training-data retention is separate from records retention** (invariant 16). `ai_action.retain_until`
is set independently of `document.retention_until` and neither derives from the other. Client records
are a regulatory obligation; training data is an asset decision and a privacy exposure that grows
with time.

---

## 2. Findings that change how the platform must be built

**Trigram / full-text search is not indexable under RLS.** Measured on 60,000 parties, as
`insurimple_app`:

```
as OWNER   name % 'Surname4242'          Bitmap Index Scan on the GIN index
as APP     name % 'Surname4242'          Index Cond: tenant_id only, Filter: %   51.8 ms
as APP     lower(last_name) >= 'x'       range demoted to Filter
as APP     last_name       >= 'X'        Index Cond: (tenant_id, last_name)     0.256 ms
```

Under RLS a qual the caller wrote sits above the policy's own, and Postgres promotes it into an
index condition only if it is `LEAKPROOF`. Line three is the one that generalises: `>=` **is**
leakproof, `lower()` is not, and one non-leakproof function anywhere poisons the whole qual. So
`similarity_op`, `LIKE`, regex, `to_tsvector`, `||`, `lower`, `upper`, `btrim` are all out —
**any expression index on a tenant table is dead.** A `btree_gin` composite over `(tenant_id, expr)`
does not rescue it; `ALTER FUNCTION … LEAKPROOF` would and needs real superuser, which RDS does not
grant.

*Consequence for product:* type-ahead by name works (normalise on write, compare raw — `search_name`,
maintained by trigger). Typo-tolerant fuzzy matching still works but runs as a filter bounded by one
brokerage's book, not the platform's. **If fuzzy search must be fast at 50k accounts, that is a
search service outside the RLS boundary — a real scope item, not a tuning task.**

**The owner's query plan is meaningless.** A plan captured as the migration user has no policy
applied, so an index can look used and be unreachable in production. Four `EXPLAIN`-as-`insurimple_app`
assertions now hold this.

**`audit_event` had no RLS at all** — found by the backstop written in DB.1. It carries `tenant_id`
and stores full before/after JSON images of every mutation on every tenant. No endpoint reads it
today, which is why it had not bitten; the page list has an audit-log screen at P2 that would have
rendered the entire platform's book on first load.

**Names with stroke/ligature letters lose their first character.** NFKD decomposes `é` but not
`Đ Ø Ł Æ Þ ß` — those are indivisible code points that survive normalisation and are then dropped by
the A–Z filter. `Đặng` folded to `ANGTH`. Because the client code is immutable, that wrong code would
have been printed on the client's pink slip and carried through six years of records. Vietnamese,
Polish, Scandinavian and Icelandic surnames are ordinary in a Canadian book.

---

## 3. What is genuinely done

- **Two-role topology.** `insurimple_migrator` owns everything; `insurimple_app` is `NOSUPERUSER
  NOBYPASSRLS`, owns nothing, holds only DML. The RLS suite **refuses to start** if it finds itself
  superuser, holding `BYPASSRLS`, or owning the tables.
- **The isolation gate**, 188 assertions over every tenant table: cross-tenant read returns nothing,
  cross-tenant write touches nothing, a planted row is refused by *that table's own* `WITH CHECK`, and
  with no tenant context a bare select returns zero rather than everything.
- **UUIDv7 keys**, supplied by the caller, no defaults anywhere.
- **Entitlement enforced in RLS** on `txn` and `policy` and inherited by fourteen child tables.
- **Client codes issued by trigger**, serialised on an advisory lock keyed on tenant + stem.
- **Every edge of the state machine** — 64 ordered pairs, 9 legal, 47 refused, 8 no-ops.
- **`ai_action`** born partitioned, with a Parquet export that emits labels and identifiers, never
  client context.
- **No RDS Proxy**, decided and written into ADR 0002 §5, with a source-reading test that fails the
  build on a plain `SET app.current_tenant` or `SET ROLE`.

Every assertion above was **mutation-checked** — deliberately broken to confirm it goes red, on the
right thing. That found four false passes that a conventionally-written suite would still be
reporting green, including one where disabling RLS on `policy` entirely still produced a green tick,
because the audit trigger's own `WITH CHECK` raised a row-level-security error about a *different*
table.

---

## 4. Open — needs a decision, or is not scheduled

1. **Marketing/CRM capabilities.** The module exists in the vocabulary and gates nothing. What may a
   Marketing-only tenant do? Until this is answered the third revenue leg is not sellable.
2. **Fuzzy search at scale.** See §2. Product decision: accept a per-tenant filter, or scope a
   search service.
3. **Grant-modal UX.** Which roles need which licence class is currently discovered by hitting a 403.
4. **Component-level rendering tests** for the BMS screens — flagged twice, never scheduled.
5. **DB.8 — the IaC is written; nothing is applied.** `infra/` has the VPC, RDS PG16 `ca-central-1`
   db.t4g.small Single-AZ with a customer-managed KMS key and PITR 35 days, ECS Fargate in the same
   VPC, two S3 buckets (archive under Object Lock COMPLIANCE for six years; training on an ordinary
   lifecycle, because those are two different obligations), and two IAM roles so the application
   cannot read the credential that can drop the policies protecting every tenant.

   **Two caveats, stated rather than buried.** `terraform validate` did **not** run — the proxy
   denies `registry.terraform.io` with a 403, so provider schemas could not be fetched. HCL parses
   and `fmt -check` is clean; resource attributes are unverified. And `infra/RUNBOOK.md` is
   **unrehearsed**, which the ticket itself calls a hypothesis; it says so at the top.

   Still missing before go-live, listed in the runbook §4: CI/CD to ECS, CloudWatch alarms, the
   scheduled archive job, and DNS.

---

## 5. Audit against the ticket's literal acceptance

Re-read against the authoritative text, two gaps were open and are now closed:

- **DB.3** said *"insert 10k rows and confirm IDs are monotonically increasing."* I had tested the
  generator, not the database. Now 10,000 rows are inserted and read back in insertion order by
  `id`, with `EXPLAIN` confirming no sort step — because monotonic as a *string* is necessary but
  not sufficient; what matters is Postgres sorting the `uuid` column with its own comparator.
- **DB.4** said to evaluate `document` on one question: does anything FK to it? Five tables do —
  `signature`, `carrier_submission`, `disclosure_record`, `loss_history`, `licence` — so it stays
  unpartitioned, same composite-FK reason as `txn`. I had done this implicitly; it is now written
  into ADR 0002 §2a-ter.

**One acceptance I did not meet and cannot.** DB.4 asks that *"the party-search `EXPLAIN` as app
role shows a bitmap index scan, not a seq scan."* It never will. The ticket correctly predicted the
`LEAKPROOF` problem and then assumed a fix existed; measurement says none does short of real
superuser, which RDS does not grant. The suite asserts the true behaviour in both directions
instead — see §2.

## 6. Two corrections to earlier reporting

- I labelled the client-code work "DB.6". **It is gate item 1**, which DB.6 depends on. DB.6 is the
  txn spine — mostly built in Phase 0; what was missing was the exhaustive transition proof.
- The environment was reclaimed mid-session: the Postgres cluster, `node_modules`, pgTAP and the
  uploaded `tickets-DB.md` were all wiped. Everything code-side rebuilt from the repo with no loss.
  Nothing depends on local state.
