/**
 * The grant rule, stated rather than discovered.
 *
 * 0011_capability_licence_scope.sql refuses an unanchored grant for a licensed
 * role, and refuses an anchor whose class cannot carry the role. The database
 * is the enforcement — invariant 1 — and these assertions are about the screen
 * telling the truth about it in advance, so a principal broker stops learning
 * the rule one 403 at a time.
 *
 * The role→class table here mirrors the migration. If the two ever disagree the
 * screen confidently states a rule the database does not apply, which is worse
 * than saying nothing; `api.test.mjs` asserts the API's copy against the live
 * schema, so a drift fails there.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { roleEligibility, eligibilityMessage, classList } from './role-eligibility.ts';

const licence = (over: Record<string, unknown> = {}) => ({
  id: 'l1', staff_id: 's1', licence_class: 'ribo_l2', licence_number: 'R-1',
  regulator: 'RIBO', issued_on: '2020-01-01', expires_on: '2030-01-01',
  status: 'active', expired: false, expiring_soon: false, ...over,
}) as never;

const PRINCIPAL = { code: 'admin_principal', name: 'Admin / Principal broker',
                    licence_classes: ['ribo_l2', 'ribo_l3'] };
const SUPPORT = { code: 'llqp_no_life', name: 'LLQP (no life sales)', licence_classes: [] };

describe('role eligibility', () => {
  it('a role with no declared classes needs no anchor', () => {
    const e = roleEligibility(SUPPORT, { licences: [licence()] });
    assert.equal(e.needsLicence, false);
    assert.match(eligibilityMessage(SUPPORT, e), /no licensed capability/);
  });

  it('a licensed role with a matching active licence is grantable', () => {
    const e = roleEligibility(PRINCIPAL, { licences: [licence({ licence_class: 'ribo_l3' })] });
    assert.equal(e.needsLicence, true);
    assert.equal(e.eligible.length, 1);
    assert.equal(e.live.length, 1);
    assert.equal(eligibilityMessage(PRINCIPAL, e),
      'Admin / Principal broker requires a licence on file: RIBO Level 2, RIBO Level 3.');
  });

  it('a licence of the wrong class does not count, however valid', () => {
    // A RIBO Level 1 is a real, active licence — it just cannot carry the
    // principal-broker role. This is the 403 the form used to produce.
    const e = roleEligibility(PRINCIPAL, { licences: [licence({ licence_class: 'ribo_l1' })] });
    assert.equal(e.eligible.length, 0);
    assert.match(eligibilityMessage(PRINCIPAL, e), /holds none of those/);
  });

  it('an LLQP cannot carry a P&C role', () => {
    const e = roleEligibility(PRINCIPAL, { licences: [licence({ licence_class: 'llqp' })] });
    assert.equal(e.eligible.length, 0);
  });

  it('an expired licence of the right class can be granted but confers nothing', () => {
    // The guard checks the CLASS, not the expiry — actor_capabilities()
    // resolves that at use time. So this grant saves cleanly and silently does
    // nothing, which is exactly the case worth warning about.
    const e = roleEligibility(PRINCIPAL, { licences: [licence({ expired: true })] });
    assert.equal(e.eligible.length, 1, 'the DB would accept this anchor');
    assert.equal(e.live.length, 0, 'but it confers no authority');
    assert.match(eligibilityMessage(PRINCIPAL, e), /has lapsed.*confer nothing/);
  });

  it('a revoked licence of the right class is treated the same way', () => {
    const e = roleEligibility(PRINCIPAL, { licences: [licence({ status: 'revoked' })] });
    assert.equal(e.live.length, 0);
    assert.match(eligibilityMessage(PRINCIPAL, e), /confer nothing/);
  });

  it('a member with no licences at all', () => {
    const e = roleEligibility(PRINCIPAL, { licences: [] });
    assert.equal(e.eligible.length, 0);
    assert.match(eligibilityMessage(PRINCIPAL, e), /record the licence first/);
  });

  it('handles no member selected without throwing', () => {
    assert.doesNotThrow(() => roleEligibility(PRINCIPAL, null));
  });

  it('labels classes in the operator vocabulary, not the enum', () => {
    assert.equal(classList(['ribo_l2', 'llqp']), 'RIBO Level 2, LLQP');
    assert.equal(classList(['something_new']), 'something_new',
      'an unmapped class must still render its code rather than blank');
  });
});
