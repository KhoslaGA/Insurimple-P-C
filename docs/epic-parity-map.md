# Epic Parity Map

**Purpose:** what Insurimple must match, beat, or deliberately skip versus Applied Epic.
Grounded in the operator's live Epic instance (`docs/epic-parity/*.png`, Sound Insurance,
Jul 2026) plus Epic's published capability set.

**Tags:** `MUST` core parity · `BEAT` where we win · `SKIP` enterprise bloat · `LATER` post-cutover

---

## Observed Epic vocabulary (from the screenshots — use these words in the UI)

The operator thinks in these terms; matching them lowers the learning curve to near zero.

| Epic term | Meaning | Our field |
|---|---|---|
| **Lookup code** | e.g. `KAPOORGA01`, `ROCHONMI01` | `account.lookup_code` |
| **ICO** | Issuing Company (e.g. `AVITR1` Aviva Traders) | `policy.issuing_carrier_id` |
| **PPE** | Premium Payable Entity | `policy.premium_payable_carrier_id` |
| **Bill** | `D` = direct, agency otherwise | `policy.billing_type` |
| **Invoice to** | who is invoiced | account/party link |
| **Agency balance** | AR position on the account | ledger-derived |
| **Line** | `AUTO`, `TENA`, `HAB` | `policy.line` |
| **Service Summary** | the transaction chain on a policy | `txn` + `txn_event` |
| **Stage** | `Issued`, `NEW - New Business` | `txn.state` / `policy.status` |
| **Permission / Marketing Opt-Out** | CASL basis | `consent` |
| **Structure (Agcy/Brch)** | agency + branch | `branch` (re-taggable) |

Epic's policy tree (screenshot 124537/124608) — *Applicant · Policy Info · Drivers · Vehicles ·
Locations · Loss History · Additional Interests · Forms & Endorsements · Agent/Broker ·
Payment Authorization* — is the required shape of our per-line detail panel.

---

## 1. Account / client
- `MUST` household-centric record; multiple contacts; lookup code; type of business; status
- `MUST` **Structure (agency/branch)** — but `BEAT`: re-taggable at any time. Epic locks
  branch/department changes to renewal, forcing copy-and-cancel (~99 clicks/account observed
  in the field). Ours is a pointer update.
- `MUST` confidential client access (restricted accounts)
- `MUST` CASL consent per channel — Epic shows `Permission: Did Not Obtain` as free text in a
  Comments blob; ours is a typed `consent` row with basis + timestamp + source
- `MUST` typed party relationships
- `BEAT` merge / duplicate resolution — downloads *will* create dupes; Epic has no first-class tool

## 2. Policy
- `MUST` policy header + per-line detail (the tree above), structured coverages (never PDF-only)
- `MUST` **Service Summary** = our txn chain; every transaction visible with stage + who + when
- `MUST` ICO vs PPE distinction (they differ; it drives DBCS reconciliation)
- `BEAT` **OPCF endorsements as first-class premium-bearing rows.** Epic ships the *generic*
  CSIO change form and leaves specific OPCFs as attachments. Ours are structured.
- `BEAT` Ontario auto reform (Jul 1 2026): SABS optional-benefit elections + OPCF 47R + DCPD
  opt-out captured as data, per person

## 3. Documents / attachments
- `MUST` vault with policy/txn linkage, retention clock (6yr RIBO), eDoc code, source
- `MUST` **`.msg` email filing** — Epic files correspondence as attachments (observed:
  `T/F INSD ASK FOR RMK DOCS W/JEVCO`); we must ingest Outlook `.msg`, parse it, and make the
  body searchable
- `BEAT` full-text search across document *and* activity bodies. **Epic searches activity
  titles only — the single most-cited broker complaint.**
- `MUST` template-driven generation (LPV, cancellation agreement, OPCF, Letter of Experience)

## 4. Activities / diary (the E&O backbone)
- `MUST` code + description + priority + owner + follow-up/end + association
- Confirmed Epic codes: `EREN` (eDoc received), `DPRI` (downloaded premium renewal increase),
  `CHGE` (policy change). Vocabulary extends as observed.
- `MUST` "at a glance": attachments/tasks/notes rollup, issuing+payable carrier, contact
- `BEAT` gate activity creation to stages that need documentation. Epic's default generates an
  activity for *every* event; users drown and work around it, which destroys the E&O trail.
- `BEAT` work queues as a designed surface (CSR day, renewal triage, remarket, download
  reconciliation, suspense). Epic has a home screen; it has no queues.

## 5. Downloads / carrier connectivity
- `MUST` CSIO eDocs (40 codes) auto-filing, AL3 policy download, suspense for unmatched
- `MUST` DBCS commission download + reconciliation
- `MUST` exception handling: out-of-sequence endorsements, IBC/insurer code mismatch, recall
- `LATER` real-time CSIO JSON quote/bind as carriers expose it

## 6. Accounting
- `MUST` trust vs general books, double-entry, append-only, Form 1 from `trust_position`
- `MUST` direct-bill dominant flows; commission expected-vs-received variance queue
- `SKIP` Epic's full GL with month-end close — small brokerages outsource bookkeeping

## 7. Proofs of insurance
- `MUST` pink slips / **eSlips** via My Proof of Insurance; evidence of property for mortgagees
- `SKIP` high-volume commercial certificate factory (holder lists, bulk reissue)

## 8. Deliberately skipped
Benefits module · commercial submissions depth · Salesforce-grade CRM · full GL · the
marketplace surface. Revisit only if the book shifts to commercial.

---

## The five things we win on

1. **Clicks** — Epic's top complaint by volume. Every screen has a click budget.
2. **Search** — full-text over activity and document *bodies*.
3. **Work queues** — a designed CSR day, not a home screen.
4. **Ontario-native** — OPCFs and SABS elections as data, not attachments.
5. **Tracking the out-of-band carrier step** — `carrier_submission` is the moat: Epic hands you
   the portal and abandons you; we track submission → acknowledgement → close.
