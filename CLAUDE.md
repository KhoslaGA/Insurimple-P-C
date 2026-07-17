# CLAUDE.md — Insurimple Platform

You are building Insurimple: a standalone multi-tenant B2B SaaS for Canadian brokerages.
One platform, three subscription modules (P&C, Life/LLQP, Mortgage) on one shared spine.
This file is a contract. Violating an invariant fails the task regardless of feature completeness.

## Repo shape (do not deviate)
- pnpm workspaces + Turborepo.
- `apps/bms` — the product (Next.js 15, React 19, App Router, Tailwind v4).
- `apps/marketing` — insurimple.com (thin; P3; do not build unless a ticket says so).
- `packages/design-system` — tokens + typed components. THE ONLY source of UI primitives.
- `packages/contracts` — shared types/zod schemas + API client. New shared types land here FIRST.
- `packages/config` — eslint, tsconfig, tailwind preset, adherence lint.
- Backend is the existing NestJS + PostgreSQL 16 BMS (33 tables, 7 migrations). Do not
  reinvent it. Domain-critical writes (transactions, trust ledger) go through the NestJS API.

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

## Design system source of truth
`Insurimple-P_C/_ds/insurimple-design-system-*/` — seven token files + `_ds_manifest.json`
(~20 components). Port tokens into Tailwind v4 `@theme` in `packages/design-system`.
Recreate manifest components as typed shadcn-style (copy-in) components. The 13 `.dc.html`
screens are the visual spec for Phase 1 — match them, but never port `ui_kits/rate-family`.

## Working style
- Plan → execute per ticket; do not start a phase before the prior phase's acceptance is green.
- RSC-first reads; TanStack Query only for live-interactive state; `"use client"` at the leaves.
- Next.js 15: `fetch` is uncached by default; `params`/`searchParams` are Promises.
- Prefer full-file rewrites over cumulative small edits past ~20–30% change.
- When a real file/contract exists, read it before building. Never build against inferred shapes.
- Surface blocked external dependencies (RIBO, carriers, CSIO, banks) — never work around them.

## Reference docs (repo /docs)
`unified-platform-12-month-build-brief.md` (the contract) · `epic-parity-map.md` (BMS
requirements) · `pc-leg-page-list.md` · `insurimple-page-list.md` · `design-and-brand-brief.md`
