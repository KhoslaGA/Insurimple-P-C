/**
 * Every screen renders — with a book, and without one.
 *
 * `demo-data.test.ts` already proves the preview snapshot parses against the
 * contract schemas, and `metrics.test.ts` proves the arithmetic. Neither
 * renders anything, so until now nothing asserted that the eleven screens
 * survive the data they are given. A component that throws on an empty array,
 * or on a null the schema permits, would type-check, build, pass both suites
 * and blank the page.
 *
 * Two passes over every screen:
 *
 *   1. WITH the preview snapshot — the realistic shape, including the awkward
 *      rows the fixtures deliberately contain (a lapsed policy, a household
 *      with no consent, a transaction stalled at signature).
 *   2. EMPTY — no accounts, no policies, no queue items. This is a brand new
 *      tenant's first login and a Mortgage-only tenant looking at the P&C
 *      screens, and it is where `rows[0].name` lives. An empty screen must say
 *      something; a blank one is a bug that looks like a slow network.
 *
 * Rendered with renderToStaticMarkup rather than a DOM: these assertions are
 * about the first paint, which is what a broker sees and what breaks. Behaviour
 * that needs clicks belongs in a browser test, not here.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';

const {
  DEMO_QUEUES, DEMO_TXNS, DEMO_TXN_DETAIL, DEMO_TEAM, DEMO_DOCUMENTS,
  DEMO_TEMPLATES, DEMO_CLAIMS, DEMO_POLICIES, DEMO_MARKETS, DEMO_HOUSEHOLDS,
} = await import('../src/lib/demo-data.ts');

const { WorkQueuesView } = await import('../src/components/WorkQueuesView.tsx');
const { PoliciesView } = await import('../src/components/PoliciesView.tsx');
const { ClaimsView } = await import('../src/components/ClaimsView.tsx');
const { ProofsView } = await import('../src/components/ProofsView.tsx');
const { RatingView } = await import('../src/components/RatingView.tsx');
const { TeamView } = await import('../src/components/TeamView.tsx');
const { TxnRows } = await import('../src/components/TxnRows.tsx');
const { TxnStepperView } = await import('../src/components/TxnStepperView.tsx');
const { NewTxnLauncher } = await import('../src/components/NewTxnLauncher.tsx');
const { HouseholdDetailView } = await import('../src/components/HouseholdDetailView.tsx');
const { AppShell } = await import('../src/components/AppShell.tsx');

// Both fixtures are maps keyed by id, not single records — the preview pages
// look up by route param. Writing this test against the shapes I assumed,
// rather than the shapes that exist, is what the first run caught.
const firstHousehold = Object.values(DEMO_HOUSEHOLDS)[0];
const firstTxnDetail = Object.values(DEMO_TXN_DETAIL)[0];

// The option shapes the pickers take are `{ policy_id, label }`, not the list
// row. Hand-building them from the row's own fields typechecked as an object
// literal and rendered fine — the components only read what they read — but it
// was not the contract, and `tsc` said so. Built from the contract instead.
const policyOptions = DEMO_POLICIES.map((p) => ({
  policy_id: p.id,
  label: `${p.policy_number ?? '—'} · ${p.account_name}`,
}));
const fnolOptions = DEMO_POLICIES.map((p) => ({
  policy_id: p.id,
  label: `${p.policy_number ?? '—'} · ${p.account_name}`,
  account_id: p.account_id,
  carrier_id: null,
}));

/** Screen, props with a book, props with nothing. */
const SCREENS: Array<{
  name: string;
  render: (empty: boolean) => string;
  /** Text that must appear when there is no data — the empty state, not a blank. */
  emptyMarker?: RegExp;
}> = [
  {
    name: 'Work queues',
    render: (empty) =>
      renderToStaticMarkup(
        <WorkQueuesView
          preview
          queues={empty ? { activities: [], renewals: [], suspense: [] } : DEMO_QUEUES}
        />,
      ),
  },
  {
    name: 'Policies',
    render: (empty) =>
      renderToStaticMarkup(<PoliciesView policies={empty ? [] : DEMO_POLICIES} />),
  },
  {
    name: 'Claims',
    render: (empty) =>
      renderToStaticMarkup(
        <ClaimsView
          preview
          claims={empty ? [] : DEMO_CLAIMS}
          policies={empty ? [] : fnolOptions}
          canReport={!empty}
        />,
      ),
  },
  {
    name: 'Proofs',
    render: (empty) =>
      renderToStaticMarkup(
        <ProofsView
          preview
          documents={empty ? [] : DEMO_DOCUMENTS}
          templates={empty ? [] : DEMO_TEMPLATES}
          policies={empty ? [] : policyOptions}
          canIssue={!empty}
        />,
      ),
  },
  {
    name: 'Rating',
    render: (empty) =>
      renderToStaticMarkup(
        <RatingView
          preview
          markets={empty ? [] : DEMO_MARKETS}
          policies={empty ? [] : policyOptions}
          canQuote={!empty}
        />,
      ),
  },
  {
    name: 'Team',
    render: (empty) =>
      renderToStaticMarkup(
        <TeamView
          preview
          roster={empty ? { roles: DEMO_TEAM.roles, members: [] } : DEMO_TEAM}
          canManage={!empty}
        />,
      ),
  },
  {
    name: 'Transactions',
    render: (empty) =>
      renderToStaticMarkup(<TxnRows rows={empty ? [] : DEMO_TXNS} problem={null} />),
  },
  {
    name: 'Transaction stepper',
    // No empty case: a stepper without a transaction is not a state the router
    // can reach — the route 404s first.
    render: () => renderToStaticMarkup(<TxnStepperView preview txn={firstTxnDetail} />),
  },
  {
    name: 'New transaction launcher',
    render: () => renderToStaticMarkup(<NewTxnLauncher preview accountId={firstHousehold.header.id} />),
  },
  {
    name: 'Household detail',
    render: () => renderToStaticMarkup(<HouseholdDetailView preview detail={firstHousehold} />),
  },
];

describe('every screen renders against the preview book', () => {
  for (const screen of SCREENS) {
    it(`${screen.name} renders and produces markup`, () => {
      const html = screen.render(false);
      assert.ok(html.length > 200, `${screen.name} rendered ${html.length} characters — that is a blank page`);
      // React escapes text, so a raw "undefined" or "NaN" in the output is a
      // formatter that was handed a null the schema permits.
      assert.doesNotMatch(html, />undefined</, `${screen.name} rendered a literal "undefined"`);
      assert.doesNotMatch(html, />NaN</, `${screen.name} rendered a literal "NaN"`);
      assert.doesNotMatch(html, />Invalid Date</, `${screen.name} rendered "Invalid Date"`);
    });
  }
});

describe('every screen survives an empty book', () => {
  // A brand new tenant's first login, and a Mortgage-only tenant opening the
  // P&C screens. Both are real, and both are where rows[0] lives.
  for (const screen of SCREENS.filter((s) => s.name !== 'Transaction stepper'
                                          && s.name !== 'New transaction launcher'
                                          && s.name !== 'Household detail')) {
    it(`${screen.name} renders with no data at all`, () => {
      let html: string;
      assert.doesNotThrow(() => { html = screen.render(true); },
        `${screen.name} threw on empty data — this is a new tenant's first login`);
      assert.ok(html!.length > 100, `${screen.name} rendered nothing for an empty book`);
      assert.doesNotMatch(html!, />undefined</, `${screen.name} rendered "undefined" when empty`);
      assert.doesNotMatch(html!, />NaN</, `${screen.name} rendered "NaN" when empty`);
    });
  }
});

describe('the preview badge is not decorative', () => {
  // Invariant 7: fixtures can never pass as live carrier data, so a broker
  // looking at seeded numbers has to be able to tell.
  //
  // The first version of this asserted the word "Preview" in every screen's
  // markup and failed on seven of them. That was the test being wrong about
  // the architecture, not the product being wrong: the badge belongs to the
  // SHELL, which wraps every route, and putting it in each view would be
  // eleven places to forget it. Asserted where it actually lives.
  it('the shell says so when the data is fixtures', () => {
    const html = renderToStaticMarkup(<AppShell preview><p>book</p></AppShell>);
    assert.match(html, /Preview data/,
      'the shell renders fixture data with nothing on the page saying so');
  });

  it('the shell stays silent when the data is real', () => {
    const html = renderToStaticMarkup(<AppShell><p>book</p></AppShell>);
    assert.doesNotMatch(html, /Preview data/,
      'a live book is being labelled as preview, which is the same lie in reverse');
  });
});

describe('the grant form states the licence rule instead of hiding it', () => {
  // The DB guard (0011) refuses an unanchored grant for a licensed role, and
  // refuses an anchor whose class cannot carry the role. Until now neither rule
  // reached the screen, so a principal broker learned them by submitting the
  // form and reading a 403 — once per role.
  const teamHtml = (canManage: boolean) =>
    renderToStaticMarkup(<TeamView preview={false} roster={DEMO_TEAM} canManage={canManage} />);

  it('every role in the roster carries its licence classes', () => {
    // The screen cannot state a rule the API does not send. This is the
    // contract field, asserted on the snapshot the screen is built from.
    for (const role of DEMO_TEAM.roles) {
      assert.ok(
        Array.isArray(role.licence_classes),
        `${role.code} has no licence_classes — the grant form has nothing to say`,
      );
    }
    const principal = DEMO_TEAM.roles.find((r) => r.code === 'admin_principal');
    assert.deepEqual(
      principal?.licence_classes, ['ribo_l2', 'ribo_l3'],
      'the principal broker must hold RIBO Level 2 or 3 (0011) — the snapshot disagrees with the schema',
    );
    const support = DEMO_TEAM.roles.find((r) => r.code === 'llqp_no_life');
    assert.deepEqual(
      support?.licence_classes, [],
      'llqp_no_life carries no licensed capability, so it needs no anchor',
    );
  });

  // The rule itself is asserted in src/lib/role-eligibility.test.ts. It cannot
  // be asserted here: the grant form is a modal, closed on first paint, so a
  // static render never contains it. That is the honest boundary of this
  // approach — driving it open needs a browser, and pretending otherwise would
  // mean testing a re-implementation of the component rather than the component.

  it('renders the roster read-only without the grant controls', () => {
    const html = teamHtml(false);
    assert.ok(html.length > 200);
    assert.match(html, /not change it|view the roster/,
      'a user without team.manage gets no explanation of why nothing is editable');
  });
});
