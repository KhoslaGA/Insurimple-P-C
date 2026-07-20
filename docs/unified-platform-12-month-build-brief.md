# Insurimple — Unified Platform 12-Month Build Brief

**Status:** the contract. CLAUDE.md's invariants govern *how*; this doc governs *what and when*.
**Horizon:** Jul 2026 – Jul 2027. Brokerage launch ~May 2027. Epic cutover ~Q1 2028.

---

## 1. What is being built

A standalone **multi-tenant B2B SaaS** for Canadian brokerages. One platform, one spine, three
subscription modules:

| Module | Scope | Status at launch |
|---|---|---|
| **P&C** | Ontario personal lines (auto + property); full transaction lifecycle | Primary — build first |
| **Life / LLQP** | Life, A&S, seg funds, annuities, GIAs; advisory workflows | Second module, spine reuse |
| **Mortgage** | Referral / advisor-handoff only (no origination) | Thinnest; handoff + tracking |

Anchor tenant is the operator's own brokerage. **It gets zero privileged code paths**
(CLAUDE.md §8) — if a feature only works for the anchor, it is built wrong.

## 2. The spine (why this isn't three products)

Every carrier-facing action in every module is **one primitive**: a `txn` moving through a
DB-enforced state machine.

```
draft → doc_generated → sig_pending → signed → submitted → carrier_ack → completed | rejected
```

New business, renewal, endorsement, cancellation, reinstatement, remarket, claim FNOL — and,
in the Life module, application/suitability/delivery — are **txn types**, not separate
workflows. Documents, signatures, carrier submissions, activities and ledger entries all hang
off the txn. A module is a *configuration* of the spine: its txn types, its document templates,
its carrier channels, its licence grants.

**If a proposed feature needs its own state machine, the design is wrong.** Stop and re-model
it as a txn type.

## 3. Phases and acceptance gates

A phase is not done until its gate is green in CI. Do not start a phase early (CLAUDE.md
working style).

### Phase 0 — Foundation (T0.1–T0.8)
Turborepo pipeline, `packages/config`, strict TS, `packages/design-system` (tokens ported to
Tailwind v4 `@theme`), `packages/contracts`, `packages/db` wired, Clerk auth with org→tenant
mapping, CI running build+lint+typecheck+pgTAP.
**Gate:** `pnpm turbo build lint typecheck test` green; schema assertions pass against
ephemeral Postgres; a second Clerk org sees zero rows of the first org's data.

### Phase 1 — P&C core (Sep–Dec 2026)
Household & client record, PC policies, transactions ledger + lifecycle, work queues, locate,
proofs & documents. Document generation (LPV, OPCF) → e-sign → carrier submission tracking.
**Gate:** a cancellation runs end-to-end in the UI against the real API; the txn's six state
transitions and its carrier submission are visible and audited.

### Phase 2 — Ingestion (Oct 2026–Feb 2027, tracks CSIOnet activation)
AL3 parser, CSIO XML eDocs parser, 40-code routing table, suspense queue, Epic export harness.
Raw payloads stored immutably before parsing; every parser fix gets a replay test.
**Gate:** a real eDoc auto-files to the correct policy and raises an activity; an unmatched
one lands in suspense and can be assigned.

### Phase 3 — Money + carriers (Jan–Mar 2027)
Per-carrier shadow validation vs Epic, DBCS commission reconciliation, trust accounting UI +
Form 1, quote log + disclosures, My Proof of Insurance eSlips.
**Gate:** one month of ≥99% shadow reconciliation against Epic on ≥2 carriers; DBCS reconciles
to the dollar.

### Phase 4 — Launch hardening (Apr–May 2027)
Client-facing delivery, DR drill, PIPEDA breach workflow, audit browser, book load.
**Gate:** brokerage live on Epic; every Epic transaction visible in Insurimple within 24h.

### Phase 5 — Cutover + module 2 (Jun 2027–)
**Cutover gate:** 60 consecutive days of clean reconciliation (policies, documents, trust).
Then migrate, exit Epic before the year-two invoice. Life/LLQP module begins after cutover;
renewal automation and the AI layer follow, never before.

## 4. Calendar-locked external dependencies

Build must track these; they cannot be accelerated by writing code.

| When | Dependency | Unblocks |
|---|---|---|
| Now | Applied Epic live (yr-1 deal) | Real book data; export harness; shadow baseline |
| Now → Q4 2026 | **Level 3 Principal Broker** | *Hard blocker* — RIBO registration |
| Q3 2026 → | Carrier appointments (3–6 mo each) | Downloads, real placements |
| ~Dec 2026 | CSIOnet mailbox + CSIO vendor membership | Live AL3/eDocs payloads |
| Q1 2027 | IVANS activation per carrier | Per-carrier download validation |
| May 2027 | Brokerage launch (on Epic) | Production shadow traffic |
| ~Q1 2028 | Epic renewal invoice | Hard cutover deadline |

Surface blockers, never work around them (CLAUDE.md working style).

## 5. Out of scope (explicitly)

Consumer-facing web (that is Rate Family — see invariant 5), rating engine (integrate a
comparative rater; do not build one), full general ledger (trust + commission only),
commercial lines depth, benefits, mortgage origination, renewal automation before cutover.

## 6. Definition of done

A ticket is done when its assertions pass in CI (CLAUDE.md §9). Not when it renders.
