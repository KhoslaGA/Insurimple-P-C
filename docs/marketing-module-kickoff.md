# Marketing module kickoff — Insurimple's "vertical HubSpot"

**For:** Claude Code, executed as tickets TM.1–TM.8
**Maps to:** build brief Phase 4 (Month 8). **Prerequisite gate:** Phases 0–3 acceptance green — party model, Clerk orgs + roles, RLS proven, Activities, entitlements, and the CASL consent records from the spine must exist. Do not start TM.1 before that gate.

## What this module is
The ~20% of HubSpot a brokerage actually uses, made compliance-native: segments on the book, campaigns, nurture sequences, email/SMS sends with CASL evidence end-to-end, a public preference/unsubscribe center, and in-app attribution (campaign → activity → policy). Operated day-to-day by the Support/Unlicensed role; all client-facing content rides the drafter gate.

## What this module is NOT (permanent non-goals — refuse tickets that drift here)
- No email client, no mail transport (Resend/Postmark + Twilio are the rented rails)
- No landing-page/form builder in year one (P3; templates + preference center only)
- No purchased/imported cold lists — segments derive from the tenant's own book + consented leads via the lead-intake API
- No Rate Family imports or coupling (invariant #5); leads arrive only through the public lead-intake API
- No advice in any message, ever — marketing explains and invites; the advisor role has no path here

## Non-negotiable design rules
1. **CASL is the skeleton, not a checkbox.** Every send resolves a consent record first (express, or implied with computed expiry — existing-business-relationship 2 years, inquiry 6 months). No consent → no send, structurally (FK + check, not an if-statement in the worker).
2. **One message, one class.** `message_class ∈ {service, marketing}` is a column with teeth: a service message (renewal notice, cancellation confirmation) cannot carry marketing content, and a marketing send (CEM) requires consent + sender ID + unsubscribe. The schema rejects mixed messages; the drafter's system prompt and the review gate both enforce the split.
3. **Unsubscribe is instant and global per tenant.** The law allows 10 business days; we honor it at click time. Suppression applies across all campaigns and sequences in the tenant. Evidence (who, when, what they unsubscribed from) is retained.
4. **Every send is an Activity.** Sends land on the party record like calls and emails do — same spine, same audit, same RLS.
5. **Attribution is in-app.** Touch → activity → policy, per tenant. No cross-tenant or external analytics.
6. **UI consumes `packages/design-system` only**; email templates render from the same token layer (tenant-branded).

## Ticket backlog

### TM.1 — Consent & evidence foundation
Extend the spine's consent records: consent class (express/implied-EBR/implied-inquiry), source, captured-at, computed expiry; unsubscribe ledger; per-tenant suppression list; the public **preference center** page (per-tenant themed, no login, signed link).
**Accept:** consent expiry math test-asserted (EBR 2y, inquiry 6m); a suppressed address provably cannot receive any marketing send (constraint-level test); preference center updates consent + evidence in one transaction.

### TM.2 — Message classes & template library
`message_class` with structural enforcement; template CRUD (email + SMS) on design tokens with tenant branding; drafter integration (AI drafts template copy → human approves; explain-not-advise constraint in the generation prompt); template variables from the party/policy contract only.
**Accept:** inserting a marketing-class message without unsubscribe block fails at the DB; a service-class send with campaign linkage fails; template renders in tenant A's and tenant B's branding from the same source.

### TM.3 — Segments
Segment builder over book data: renewal window (e.g., T-45–T-30), lines held / not held (cross-sell), carrier, premium band, client tenure, consent-class filter (marketing segments auto-exclude no-consent). Saved segments recompute on demand; count preview.
**Accept:** a marketing segment can never include a suppressed or consent-less party (test-asserted); segment membership is tenant-isolated under RLS red-team.

### TM.4 — Campaigns & email sends
Campaign = template + segment + schedule. Send pipeline via Resend/Postmark: per-recipient send row (queued → sent → delivered/bounced/complained), consent resolved per recipient at send time (not at schedule time), sender identification injected, unsubscribe link mandatory on marketing class, bounce/complaint feedback loops update suppression. Every send writes an Activity on the party.
**Accept:** a consent that expires between scheduling and sending blocks that recipient; bounce webhook suppresses future sends; each sent message appears on the party's activity timeline with evidence payload.

### TM.5 — Nurture sequences
Sequence engine: trigger (new client, renewal T-45, policy added, lead received via intake API) → steps with delays → exit rules (goal met: replied/renewed/converted; or unsubscribed; or consent expired). Quiet hours per tenant timezone. Sequences are marketing-class by default; service-class steps prohibited inside sequences.
**Accept:** exit-on-unsubscribe test (mid-sequence unsubscribe halts remaining steps); a renewal-trigger sequence enrolls exactly the T-45 cohort once (idempotent enrollment); quiet-hours send defers correctly.

### TM.6 — SMS (Twilio)
SMS sends on the same pipeline: separate SMS consent class, STOP-keyword handling writes to the same suppression list + evidence, sender ID per tenant number, character-safe template rendering.
**Accept:** STOP suppresses across email+SMS marketing per tenant policy config; SMS send without SMS consent fails structurally.

### TM.7 — Attribution
Touch model: campaign/sequence touch → party activity → subsequent transaction/policy within a config attribution window. Report: per campaign — sends, delivered, engaged, activities generated, policies written, premium. Last-touch default; window config per tenant.
**Accept:** a seeded journey (campaign send → client calls → endorsement transaction → policy) attributes end-to-end in the report; attribution never crosses tenants.

### TM.8 — Dashboards & role wiring
Marketing dashboard (campaign performance, sequence health, consent/suppression stats) using the CRM-dashboard layout grammar; Support/Unlicensed role operates everything here but has zero transaction/advice capabilities (verify grants); principal sees marketing in the roll-up; entitlement gate (`tenant_modules.marketing`) on the whole module.
**Accept:** Support-role user can run a campaign but provably cannot open a transaction; tenant without the marketing entitlement gets the module-gated state server-side.

## Kickoff prompt (paste to Claude Code when the Phase 0–3 gate is green)
> Read CLAUDE.md, then docs/marketing-module-kickoff.md. Verify the prerequisite gate (party model, roles incl. Support/Unlicensed, RLS pgTAP suite, consent records, entitlements) is green before starting. Execute tickets TM.1–TM.8 one at a time; plan before executing; STOP for my review after each ticket's acceptance passes. The non-goals list is binding — refuse and flag any work that drifts into mail clients, landing builders, purchased lists, or Rate Family coupling. Start with TM.1.
