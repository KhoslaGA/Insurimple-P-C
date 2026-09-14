# 0003 — The AI action layer

**Date:** 2026-09-13
**Status:** **Proposed** — decision brief for the operator. Five open decisions below; **AI.0
has not started.**
**Supersedes:** nothing. **Touches:** the spine, consent, entitlement, `current_actor`.

> **Read §A first.** Four claims in this ADR describe schema in the present tense that does
> not exist in the repo, and two ticket acceptances depend on them. The reasoning is sound;
> the inventory is not. §A is the reconciliation, measured 2026-09-14 against migration 0018.

---

## Context

The requirement as originally stated was "each tab gets its own LLM chat" — on the Proofs
tab, an assistant that can *send to client*, *send to another person*, *send to reception*.

The underlying want is right: contextual AI that takes action under a human gate is the
stated differentiator against Epic, whose AI is read-only. The framing is wrong, and this
ADR exists to replace it before it reaches the schema.

**Per-tab assistants are per-workflow feature-building.** Eight tabs with their own
assistant means eight prompt surfaces, eight tool sets, eight authority paths, and eight
places a guard can be missing. That is the failure mode the one-spine invariant exists to
prevent, and it decays identically.

**The example disproves itself.** *Send to client*, *send to other person*, *send to
reception* are not three features. They are one primitive — `deliver(document, recipient,
channel)` — differing only in channel and in which guards fire. Build it once and "send
the pink slip to reception" is an argument, not a feature.

---

## Decision

### 1. One assistant, one tool registry, per-screen context

There is a single AI action layer. What varies per screen is the **context** (which
record) and the **entitlement-filtered subset of tools** the actor may see. Nothing else.

Across all eight tabs the AI-actionable verbs collapse to five families:

| Family | Mutating | Human gate | Examples |
|---|---|---|---|
| **Interrogate** | No | No | summarise this household; what changed on this policy; why is this in the queue |
| **Generate** | Yes (creates a document) | Yes | draft an endorsement request; produce a proof |
| **Deliver** | Yes | Yes | send to client / broker / reception |
| **Open** | Yes (creates a txn) | Yes | start a remarket; open an FNOL |
| **Amend** | Yes | Yes | correct a field; add an activity note |

Adding a tool adds a **row in the registry**, not a code path. If a proposed tool does not
fit a family, that is a signal the family list is wrong — raise it rather than adding a
sixth quietly.

### 2. AI tools call the service layer. Never the database.

Every tool invokes the same service method the UI invokes. No direct SQL, no parallel
route, no privileged client.

This is the load-bearing decision in the ADR. The moment the assistant has its own path to
data, every guard becomes optional — RLS, entitlement, licence class, the authority
triggers, the CASL constraint. The `current_actor` fail-open hole was closed at
considerable cost; an AI backdoor reopens it with better ergonomics.

**The AI layer introduces no new guards.** It reuses the existing chain in full. The only
AI-specific control is the approval gate.

### 3. Actor semantics — `app.current_actor` is the approving human, never the model

| Phase | Actor | Writes |
|---|---|---|
| Context assembly | the requesting human | none |
| Draft | the requesting human | `ai_action` draft row only |
| Approval | — | — |
| Execute | **the approving human** | full action |

- **Never `'system'`.** A model-initiated action is not a system action. `'system'` bypasses
  the licence/entitlement, proof-issue, and `team.manage` guards; routing AI through it
  would re-open the hole just closed, on the highest-volume path in the product.
- **Context assembly runs under the requesting human's RLS scope**, as `insurimple_app`,
  with their `app.current_tenant` set. Assembling context under a privileged role is a
  data-exfiltration path: the assistant would answer questions from rows the human is not
  permitted to see, and it would look like a working feature.
- **Accountability lands on the licensed human**, which is legally correct — the broker
  sent the pink slip. `ai_action` preserves that a model drafted it and what the human
  changed.

### 4. Guard chain, in order

Cheapest and broadest first:

1. **Entitlement** — is the tool's module licensed to this tenant?
2. **Capability / licence class** — does this actor's RIBO licence permit this action?
3. **Tenant scope** — application-level, the primary gate.
4. **RLS** — independent backstop.
5. **Domain constraint** — CASL `message_class`, state-machine transition trigger, proof
   currency, trust-account rules.

Layer 5 is why the delivery primitive must stay single. `message_class` physically rejects
a commercial electronic message without consent basis and unsubscribe. One primitive means
an assistant that decides to email a client meets a check constraint. Two code paths means
only one of them remembers.

### 5. The delivery primitive

```
deliver(document_id, recipient, channel)

recipient : party_id | internal_role | external_address
channel   : email | portal | print_queue
```

Guards, in addition to the chain above:
- Document must be in a deliverable state.
- Recipient is a client party + electronic channel + commercial content → CASL constraint.
- **Document is a proof of insurance → must be current, not superseded.** A pink slip is
  legal evidence of coverage; delivering a stale one has consequences outside the app.
  This guard is not optional and does not live in the prompt.

---

## What is deliberately excluded from v1

- **Trust accounting and any money movement.** RIBO trust rules are strict and the failure
  mode is a licence problem, not a bug. Not AI-actionable, at any gate.
- **The carrier submission path.** Submission is the irreversible edge of the spine.
- **Autonomous action.** Every mutating tool requires explicit human approval. No
  auto-approve tier, no "trusted tool" list, no confidence threshold that skips the gate.
  If that changes later it is a separate ADR with its own evidence.
- **Cross-record retrieval.** The assistant sees the record in context and its spine
  relations. It does not roam the book.
- **Per-tab prompt customisation.** Context differs; the system prompt does not.

---

## Build sequence

Sits **on top of the spine**. The tools' actions *are* spine transactions — building the
assistant first means building tools for actions that do not exist. Do not start AI.0 until
DB.6 is complete. **DB.6 is complete** (2026-08-28); the blocker is now §A, not the spine.

| # | Ticket | Acceptance |
|---|---|---|
| **AI.0** | Tool registry schema + guard chain. Zero tools. | Registry is declarative (name, family, required entitlement, required capability, input schema, mutating?, gate?). A tool row with an unmet entitlement is invisible to the actor, not merely blocked. |
| **AI.1** | Context assembly under caller's RLS scope. | **The exfiltration test:** assemble context as actor A for a record in tenant B; assert empty, not error-shaped-differently. Assert assembly connects as `insurimple_app` with tenant context set, and fails closed with no context. |
| **AI.2** | Interrogate tools (3–4, read-only). | No approval gate — nothing mutates. Answers are grounded in assembled context only. |
| **AI.3** | Approval gate + `ai_action` capture. | Records model binding, context hash, draft, verdict, **edit delta**, disposition, resulting txn id. Mutation check: bypassing the gate fails a test that names the gate. |
| **AI.4** | First mutating tool — **Amend: add an activity note.** | Deliberately low-stakes. Proves actor semantics end to end: executes as approving human, `ai_action` links to the resulting row, audit shows the human. |
| **AI.5** | Delivery primitive + email/portal channels. | CASL constraint proven to fire on an unconsented client send. Internal recipients proven to bypass CASL legitimately (not a CEM) without bypassing entitlement. |
| **AI.6** | Proof delivery (the pink slip). | Superseded-proof guard fires. This is last, not first. |

---

## Open decisions for the operator

1. **PII in the training set — decide before AI.3, not after.** The edit delta is the moat,
   and it is also client personal information verbatim. The training bucket has an ordinary
   lifecycle, not Object Lock. Options: redact at capture (cheaper, lossier), or treat the
   training bucket as PII-bearing with the PIPEDA handling, retention, and access controls
   that implies. **Capturing first and deciding later is not available** — it writes the
   PII before the policy exists. *(See §A.5: the export half of this is already decided, in
   the safe direction, and it changes the shape of the question.)*
2. **Does a Marketing-only tenant get the assistant?** Blocked on the unresolved
   Marketing/CRM capability enumeration. That question belongs in the Marketing leg; this
   leg owes only that the mechanism can express the answer.
3. **Model binding for v1** — which model, and what eval gate must a swap pass?
   *(See §A.1: `ai_model_binding` does not exist.)*
4. **Approval granularity** — per action, or batch approve a queue? Batch is better UX and
   materially worse evidence. E&O defensibility argues per-action for anything client-facing.
5. **Carrier data in context.** Carrier agreements commonly restrict retention and
   aggregation. If assembled context includes carrier-returned data and `ai_action` retains
   it, that is the ARS dataset tension arriving here early.

---

## Consequences

- Tool count grows without code-path count growing. That is the whole point.
- The human gate is doing **legal** work, not UX work: it is the E&O boundary and the point
  where RIBO accountability attaches. It must be provable in audit — who approved, what
  they saw, what changed between draft and sent.
- Every draft-approve-edit cycle produces a labelled example as a side effect of ordinary
  work. The rejections show the model was wrong; **the edits show what right looks like**.
  Epic's read-only AI cannot generate this, which is the durable asymmetry.
- The assistant is only as capable as the service layer. Thin service methods produce a
  thin assistant — a useful forcing function for building the spine properly.

---

# §A. Reconciliation with the repo

Measured 2026-09-14 against migration 0018. The ADR's **reasoning** is not in question here
— §1 and §2 in particular are the right calls and §3 is already enforced. What follows is
the **inventory**, which is wrong in four places, two of which make a ticket's acceptance
unreachable as written.

## A.1 `ai_model_binding` does not exist

The ADR says it "already exists as the seam". It appears nowhere — not in the 18
migrations, not in `apps/api`, not in `packages/contracts`. Open decision 3 rests on a
table that has not been built.

What exists is two free-text columns on `ai_action`: `model` and `prompt_version`. Those
record what was used; they are not a binding, and nothing constrains them. **AI.3's "records
model binding" is a build, not a read.**

## A.2 The CASL `message_class` constraint does not exist

§4 layer 5 and §5 both describe it in the present tense — *"physically rejects a commercial
electronic message without consent basis and unsubscribe"*. There is no `message_class`
anywhere, and no `unsubscribe` column on anything.

`consent` has `party_id`, `channel` (email/phone/sms/mail), `basis`
(express/implied/did_not_obtain/withdrawn), `captured_at`, `expires_at`. That is the raw
material for a CASL check and it is not a CASL check: nothing classifies a message as
commercial, nothing requires an unsubscribe mechanism, and nothing joins the two at write
time.

**AI.5's acceptance — "CASL constraint proven to fire on an unconsented client send" —
cannot pass.** The constraint has to be built first, and it is a spine ticket, not an AI
ticket: a broker sending a marketing email by hand needs it just as much.

## A.3 `document` has no deliverable state

§5 requires "document must be in a deliverable state". `document` columns are: `id`,
`tenant_id`, `account_id`, `policy_id`, `txn_id`, `template_id`, `doc_type`,
`csio_edoc_code`, `filename`, `storage_key`, `source`, `retention_until`, `created_at`,
`updated_at`, `issued_to`, `rendered_body`.

There is no state column. `source` (generated / uploaded / edocs_download / carrier) says
where a document came from, not whether it may be sent.

## A.4 There is no superseded-proof concept

§5's third guard and **AI.6's entire acceptance** depend on knowing that a proof has been
superseded. Nothing in the schema expresses it: no `superseded_by`, no version chain, no
"current" flag. Two pink slips for the same policy are two unrelated rows.

This is the one worth building early regardless of AI, because it is a real-world
correctness problem today: a broker can already re-send a stale pink slip by hand, and a
pink slip is legal evidence of coverage.

## A.5 The PII decision is half-made, in the safe direction

Open decision 1 says *"capturing first and deciding later is not available"*. That is right
about the database and **already wrong about the lake**, which changes the question.

`ai_action_export` — the view the Parquet export reads — emits labels, identifiers and the
*shape* of a suggestion. It deliberately omits `context`, `suggestion` and `amendment`
(CLAUDE.md invariant 16), because a copy in object storage is outside RLS, outside the
audit trigger and outside the retention sweep. `TEST15d` fails the build if any of those
three columns appear in the view.

So today: **capture is full, inside the RLS boundary, audited and retention-swept; export
carries no client context at all.** Which means

- capturing now does **not** write PII to the training bucket, and
- the edit delta — the moat — is **not in the training set** either.

The real decision is therefore not "redact or accept PIPEDA scope". It is: *do we ever want
the delta in the lake, and if so on what terms?* Leaving it as-is is a coherent third
option — the labels train a reranker, the deltas stay home and are read in place — and it is
the current default rather than a deferral.

## A.6 `ai_action` captures most, but not all, of what AI.3 needs

Present: `model`, `prompt_version`, `suggestion`, `context`, `confidence`, `decision`
(pending/accepted/rejected/amended), `decided_by`, `decided_at`, `amendment`,
`reject_reason`, `retain_until`, `exported_at`. Constraint: a decision other than `pending`
requires both `decided_by` and `decided_at` — an unsigned approval is refused.

Missing for AI.3 and AI.4:

| Needed | Status |
|---|---|
| context hash | **absent** — without it you cannot later prove what the model saw, only what was stored alongside it |
| resulting row id | **absent** — `txn_id` is what the suggestion was *about*, not what the approval *produced*. AI.4's "links to the resulting row" needs its own column |
| edit delta | **partial** — `amendment` holds the amended value, not a delta. The delta is derivable from `suggestion` + `amendment` today, which is enough to start and worth deciding explicitly |

## A.7 What the ADR gets right, and is already true

- **§3 actor semantics are already enforced.** `current_actor()` defaults to `anonymous`;
  `system` must be named explicitly (invariant 3, TEST9a–c). The hole the ADR warns about
  re-opening was closed in DB.1 and is asserted against.
- **§2's "no privileged client"** is enforceable today: `topology.test.mjs` fails the build
  on a second `pg.Pool` outside `DbService`, or on `adminQuery` called from anywhere but the
  auth guard. An AI service taking its own connection would fail that test.
- **AI.1's exfiltration test** is already the shape of the RLS gate — 188 assertions run as
  `insurimple_app`, and the suite refuses to start if the role turns out to be privileged.
  AI.1 should reuse that harness rather than build a second one.
- **`ai_action` is partitioned** by month and append-only to the app role; only `system`
  deletes, only through `sweep_ai_action_retention()`.

## A.8 Suggested resequencing

Three of the ADR's tickets depend on spine work it assumes is done. Written as AI tickets
they would be built inside the AI layer, which is precisely the per-workflow coupling §1
exists to prevent.

| Ticket | Depends on | Belongs |
|---|---|---|
| AI.3 | context hash + resulting-row columns on `ai_action` | a migration, before AI.3 |
| AI.5 | CASL `message_class` + consent join + unsubscribe | **spine ticket** — hand-sent email needs it too |
| AI.6 | document versioning / superseded-proof | **spine ticket** — a broker can re-send a stale pink slip today |

**Unblocked now:** AI.0 (registry schema + guard chain) and AI.1 (context assembly), neither
of which depends on anything in §A. AI.2 follows. AI.3 needs a small migration and open
decision 1. AI.5 and AI.6 need spine tickets that do not exist yet.
