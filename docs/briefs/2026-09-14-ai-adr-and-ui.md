# Brief for chat — ADR 0003 filed, two UI items shipped

**Date:** 2026-09-14 · **Branch:** `claude/vscode-claude-chat-continue-2xx3p9` · **3 commits since the 08-28 brief**
**Repo state:** 18 migrations · 42 tables · `infra/` written, **nothing applied** · **no AI layer built**

| suite | tests | change |
|---|---|---|
| schema (`db test`) | 61 assertions | — |
| RLS gate (`db test:rls`) | 188 assertions | — |
| API | **74** | +3 |
| frontend | **56** | +30 |
| contracts | 24 | — |

---

## 1. ADR 0003 — the AI action layer. Filed as **Proposed**, nothing built.

The reasoning is right and I have not touched it. Two parts of it are **already enforced**,
which is worth knowing before anyone re-builds them:

- **§3's actor semantics** — never `system`, context assembled under the requesting human's
  RLS scope — are invariant 3 and TEST9a–c. The fail-open hole the ADR warns about
  re-opening was closed in DB.1 and is asserted against.
- **§2's "no privileged client"** is enforceable today. `topology.test.mjs` fails the build
  on a second `pg.Pool` outside `DbService`, or on `adminQuery` called from anywhere but the
  auth guard. An AI service taking its own connection fails that test.

### The inventory is wrong in four places

Each of these is stated in the present tense and does not exist in the repo. Measured
against migration 0018.

| The ADR says | Repo |
|---|---|
| `ai_model_binding` "already exists as the seam" | **Nowhere.** Not in 18 migrations, not in `apps/api`, not in contracts. Open decision 3 rests on a table nobody built. What exists is two free-text columns on `ai_action`. |
| `message_class` "physically rejects a commercial electronic message without consent basis and unsubscribe" | **No `message_class`, no `unsubscribe` column.** `consent` has `channel` and `basis` — the raw material, not the check. |
| "Document must be in a deliverable state" | `document` has **no state column**. `source` says where it came from, not whether it may be sent. |
| Proof "must be current, not superseded" | **Nothing expresses supersession.** Two pink slips for one policy are two unrelated rows. |

**Two ticket acceptances therefore cannot pass as written.** AI.5 ("CASL constraint proven
to fire") and AI.6 ("superseded-proof guard fires") both assert against constraints that do
not exist.

And both are **spine tickets, not AI tickets.** A broker sending a marketing email by hand
needs the CASL check just as much, and can re-send a stale pink slip today — a pink slip is
legal evidence of coverage, so that is a live correctness problem with or without an
assistant. Writing them as AI tickets would build them *inside* the AI layer, which is
precisely the per-workflow coupling §1 exists to prevent.

### One open decision is half-made already, in the safe direction

Open decision 1 says of PII in the training set: *"capturing first and deciding later is not
available — it writes the PII before the policy exists."*

That is right about the database and **already wrong about the lake.** `ai_action_export`
omits `context`, `suggestion` and `amendment` by construction (invariant 16), and TEST15d
fails the build if any of the three appears in the view. So:

- capture is **full**, inside the RLS boundary, audited, retention-swept;
- export carries **no client context at all**.

Which means capturing now writes **no PII to the training bucket** — and also that the edit
delta, the thing the ADR calls the moat, is **not in the training set either**.

So the question is not "redact at capture, or accept PIPEDA scope on the bucket". It is:
**do we ever want the delta in the lake, and on what terms?** Leaving it as-is is a coherent
third option — labels train a reranker, deltas stay home and are read in place — and it is
the current default rather than a deferral.

### Suggested resequencing

| Ticket | Blocked on | Belongs |
|---|---|---|
| **AI.0** registry + guard chain | nothing | **ready** |
| **AI.1** context assembly | nothing | **ready** — should reuse the RLS harness, not build a second one |
| AI.2 interrogate tools | AI.0/AI.1 | after |
| AI.3 approval gate | a small migration + open decision 1 | `ai_action` has no context hash, and no link to the row an approval *produced* (`txn_id` is what it was *about*) |
| AI.5 delivery | CASL `message_class` | **spine ticket, not written** |
| AI.6 proof delivery | document supersession | **spine ticket, not written** |

---

## 2. Shipped since the last brief

**Screens now have rendering coverage.** The BMS had 26 frontend tests and none rendered
anything. Every screen is now rendered twice — against the preview book, and **empty**, which
is a new tenant's first login and a Mortgage-only tenant opening the P&C screens. Both are
real and both are where `rows[0].name` lives. Mutation-checked: making `PoliciesView` read
`policies[0]` turns exactly the Policies empty-book assertion red.

Four of my own errors surfaced in the writing, which is the argument for the tests: two
fixtures are maps keyed by id rather than records; `DEMO_TEAM` is not the shape I assumed;
the preview-badge assertion failed on seven of eleven screens because **the badge belongs to
the shell, not the views** — my test was wrong about the architecture, not the product; and
`tsc` caught picker options that rendered fine but were not the contract.

**The grant form states the licence rule instead of hiding it.** 0011 refuses an unanchored
grant for a licensed role and refuses a wrong-class anchor. Both facts were in the database
and neither reached the screen, so a principal broker learned the rule one 403 at a time.
`role_licence_class` existed the whole time; nothing selected from it.

The distinction worth the code: **can it be granted** (does the member hold a licence of an
accepted class — what the guard checks) versus **will it confer authority** (is that licence
active and unexpired — which the guard does *not* check, because `actor_capabilities()`
resolves it at use time). A grant anchored to a lapsed licence saves cleanly and silently
confers nothing. A form that only said "granted" would be telling the truth and omitting the
part that matters.

The form blocks a grant it knows will be refused — a courtesy, not enforcement. An API test
still submits an LLQP licence against a P&C role directly and asserts the 403, and asserts
the API's copy of the rule against `role_licence_class` itself so the two cannot drift.

---

## 3. Open — all of these need you, none of them need code

1. **AI ADR: the five open decisions**, of which decision 1 is reshaped (§1 above) and
   decision 3 rests on a table that does not exist.
2. **Marketing/CRM capabilities.** Still blocks the third revenue leg, and now also blocks
   AI open decision 2.
3. **Fuzzy search at scale** — accept a per-tenant filter, or scope a search service outside
   the RLS boundary.
4. **Two spine tickets nobody has written:** CASL message classification, and document
   supersession. Both are worth doing on their own merits; AI.5 and AI.6 merely wait on them.

**Unblocked without any decision:** AI.0 and AI.1, or the runbook §4 gaps (CI/CD to ECS,
CloudWatch alarms, the scheduled archive job).
