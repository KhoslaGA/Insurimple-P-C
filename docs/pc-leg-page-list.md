# P&C leg — page list (Insurimple BMS)

**Scope:** the property & casualty side of the software — Ontario personal lines (auto + property), lean 1–2 person operation scaling to the 5,000-policy book. Complements the auto-vertical list (quoter + auto ops) and the master sitemap; overlapping pages are cross-referenced, not repeated.

**Grounding:** the `PC_Policies_dc.html` prototype establishes the design language — household-centric records, a policy tree with per-line detail panel, Epic-vocabulary accounting fields (agency balance, bill, ICO, invoice-to, est. commission), and transactions launched from the record. Several destinations it references do not exist yet and appear below marked **(named in prototype)**.

---

## 1. Household & client (extends the prototype screen)
- **Household record — policies view** *(exists as prototype — harden)*
- **Household record — service summary** *(named in prototype)* — activities, open items, last contact
- **Household record — billing view** — AR per client, invoices, payments, agency balance drill-down
- **Household record — documents** — proofs, apps, letters, eDocs per policy
- **Household record — consent & communications** — CASL evidence, recording consent, preferences
- **Merge / duplicate resolution** — households and parties (downloads create dupes)

## 2. Property lines (the non-auto half the prototype implies)
- **Dwelling detail editor** — homeowners: construction, year, roof, heating, distance to hydrant/firehall, mortgagee
- **Tenant / condo detail editor** *(prototype has rented-location types)* — contents limits, unit details, condo deductible assessment
- **Additional interests** — mortgagee / lienholder / landlord management
- **Property coverage & endorsements** — sewer backup, overland water, earthquake, home business, short-term rental
- **Umbrella / excess liability** — attaches across household policies
- **Seasonal / secondary / rental property** — additional locations on the household

## 3. Work queues (the CSR's day — the biggest gap in the prototype)
- **My day / CSR home** — assigned activities, due abeyances, callbacks
- **Renewal work queue** — book-wide, by expiry window; triage status (Sonnet triage output surfaces here)
- **Remarket queue** — flagged renewals → re-shop through the compare engine → outcome
- **Download reconciliation queue** — AL3/eDocs items needing review: unmatched policies, premium discrepancies, new-business downloads
- **Suspense / abeyance list** — everything waiting on carrier, client, or lender
- **Lapsed / cancellation follow-up queue** — save attempts, reinstatement window

## 4. Transactions — P&C-wide (state machine views)
- **New transaction launcher** *(named in prototype)* — pick line + type from the household
- **Property new business / endorsement / renewal / cancellation forms** — property equivalents of the auto set
- **Cross-line transaction view** — one household, multiple lines moving together (move house: auto address + property new business)
- **Transaction work list** — all in-flight transactions by state, assignee, age

## 5. Proofs & documents
- **Proofs of insurance hub** *(named in prototype)* — issue/reissue pink card, property binder letter, proof for lender
- **Certificate / confirmation for landlord or lender**
- **Letter of experience / loss history** — generate + intake
- **Batch document runs** — renewal letters, lapse notices

## 6. Rating & carrier
- **Export to rating services** *(named in prototype)* — send risk to rater / CarrierAdapter; results return to the compare view
- **Carrier submission tracker** — per-transaction carrier status (extends `carrier_ack`)
- **Carrier appointment & contract records** — per-carrier commission schedules, binding authority levels
- **Download activity log** — what arrived, what auto-matched, what needs the queue (§3)

## 7. Claims (intake-only scope)
- **FNOL intake** — capture, attach to policy, refer to carrier
- **Claim record** — status, adjuster, notes; feeds loss history
- **Claims list per household / book**

## 8. Billing & receivables (P&C specifics)
- **Agency-bill invoice + receipt flow** — where agency balance in the prototype comes from
- **Direct-bill commission reconciliation** — statement import vs expected
- **NSF / payment-failure follow-up**

## 9. Book & compliance views
- **Book of business — P&C** — by line, carrier, expiry month; growth to 5,000 target
- **Retention dashboard** — P&C service scorecard detail
- **E&O / open-items audit** — unsigned docs, undelivered proofs, expired follow-ups
- **Principal broker review queue** — items requiring Level 3 sign-off

## 10. States & small screens
- Empty/loading/error for every queue and list
- **Download-conflict resolution modal** — accept carrier version vs keep local
- **Effective-date / backdating guard** — warns and logs
- **Policy-tree line statuses** — in-force, pending, lapsed, cancelled, remarket-in-progress (prototype tree needs the full status set)

---

## Build order for this leg

1. **Harden the prototype screen** — household policies view + detail panel against real schema fields.
2. **New transaction launcher + property forms** — makes the record actionable beyond auto.
3. **Renewal + download reconciliation queues** — the two queues that run a real book daily; downloads validated in Epic shadow mode land here.
4. **Proofs hub** — highest-frequency client-facing output.
5. **Remarket queue** — the compare-engine tie-in that differentiates from Epic.
6. Billing views, claims intake, book/compliance dashboards.

The work queues in §3 are the difference between a policy database and a working brokerage system — Epic's equivalent is where CSRs live all day. Design them first-class, not as filtered lists bolted on.
