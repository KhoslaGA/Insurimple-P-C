# Insurimple — Platform Page List (sitemap)

Platform-wide map across all three modules. The P&C leg is detailed separately in
`pc-leg-page-list.md` (grounded in the 13-screen prototype) — it is the authority for those
screens; this doc is the surrounding structure.

**Legend:** `P0` Phase 0 · `P1` Phase 1 · `P2` Phase 2 · `P3` Phase 3 · `P4+` later
**Entitlement:** every module-scoped route is gated server-side by `tenant_modules` (CLAUDE.md §4).
UI hiding is not enforcement — the route itself must 403.

---

## 0. Shell & platform (module-agnostic)
- `P0` **Sign-in / org switcher** (Clerk) — org = tenant, always from the org claim
- `P0` **App shell** — sidebar, topbar, command palette (`⌘K`), tenant theming from tokens
- `P1` **Locate** — global search across households, policies, txns, documents, activities
- `P1` **My day** — assigned activities, due abeyances, callbacks (the landing screen)
- `P3` **Notifications / alerts** — carrier acks, download exceptions, SLA breaches

## 1. Household & client (shared spine — all modules)
- `P1` Household record: policies view · service summary · billing · documents
- `P1` Consent & communications (CASL evidence, recording consent, preferences)
- `P1` Parties & relationships
- `P2` Merge / duplicate resolution
- `P3` Client portal invitations & delivery log

## 2. P&C module — see `pc-leg-page-list.md`
Policies, property lines, rating & carrier, transactions, claims, proofs & documents,
billing & receivables, work queues, book & compliance.

## 3. Life / LLQP module `P4+`
Same spine, different txn types and templates.
- Client suitability & needs analysis (LLQP-compliant record)
- Application → underwriting → policy delivery (txn types on the spine)
- Product shelf (term, perm, seg funds, annuities, GIAs)
- Beneficiary management · in-force service · commission (FYC + renewals, chargebacks)
- **Licence gating:** a P&C-only user cannot open a Life txn (CLAUDE.md §3)

## 4. Mortgage module `P4+` — referral / handoff only
- Referral intake → advisor handoff → status tracking → outcome & compensation
- Explicitly **not** origination. No underwriting, no lender submission.

## 5. Transactions (the spine, module-agnostic)
- `P1` Transactions ledger (filter by type/state/carrier/owner)
- `P1` Transaction detail — lifecycle stepper, event log, documents, submissions, audit
- `P1` Guided flows: cancellation (flagship), endorsement, remarket, new business
- `P2` Document generation + e-sign round-trip
- `P2` Carrier submission tracking (channel, ack, carrier ref)

## 6. Downloads & ingestion `P2`
- Download reconciliation queue (unmatched, premium discrepancy, new-business download)
- Suspense / abeyance list
- eDoc viewer with routing metadata ("why it filed here")
- Raw payload browser (immutable, replayable)
- Epic shadow reconciliation dashboard (`P3` — BMS vs Epic drift per carrier)

## 7. Accounting `P3`
- Trust position + Form 1 export · receipts & disbursements (balanced-entry only)
- Commission: expected vs received, variance queue, DBCS import
- Agency balance / AR per household

## 8. Compliance & audit `P3`
- Quote log (Take-All-Comers) · disclosure register · consent registry
- Audit event browser (append-only, field-level)
- Retention & destruction schedule (6-year RIBO clock)
- PIPEDA breach log & assessment workflow

## 9. Admin / tenant settings `P0–P3`
- `P0` Users, roles, **licences on file with expiry** (the security boundary)
- `P1` Carriers & market availability (per-line channels: quote/submit/download)
- `P2` Document templates (versioned, effective-dated — Ontario form editions matter)
- `P2` Activity codes & routing rules (the 40 eDoc codes → workflow map)
- `P3` **Entitlements** (`tenant_modules`) · branding/theme · billing & subscription

## 10. Marketing site `P3`
`apps/marketing` — insurimple.com. Thin. Do not build unless a ticket says so.
