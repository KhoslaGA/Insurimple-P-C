/**
 * The preview dashboard computes its own metrics from the household snapshot,
 * while the real dashboard reads SQL aggregates. Two implementations of the
 * same numbers is a standing risk: they can drift, and the preview is where
 * nobody is watching. These pin the arithmetic.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import type { HouseholdDetail } from '@insurimple/contracts';
import { computeMetrics } from './metrics.ts';
import { DEMO_HOUSEHOLDS } from './demo-data.ts';

/** Minimal household; only the fields computeMetrics reads are meaningful. */
function household(over: {
  status?: string;
  policies?: Array<{ status?: string; premium?: number; expiry?: string | null; carrier?: string | null }>;
  txnStates?: string[];
  source?: string | null;
}): HouseholdDetail {
  return {
    header: {
      id: '00000000-0000-0000-0000-000000000001',
      lookup_code: 'TESTAA01',
      display_name: 'Test Household',
      kind: 'personal',
      status: (over.status ?? 'active') as HouseholdDetail['header']['status'],
      source: over.source === undefined ? 'referral' : over.source,
      city: 'Brampton, ON',
      servicing_broker: null,
      servicing_csr: null,
    },
    applicants: [],
    policies: (over.policies ?? []).map((p, i) => ({
      id: `90000000-0000-0000-0000-00000000000${i}`,
      policy_number: `POL-${i}`,
      line: 'auto',
      status: (p.status ?? 'in_force') as 'in_force',
      carrier_name: p.carrier === undefined ? 'Pembridge' : p.carrier,
      effective_date: '2026-01-01',
      expiry_date: p.expiry === undefined ? null : p.expiry,
      annual_premium: p.premium ?? 0,
      billing_type: 'agency',
      payment_plan: 'monthly',
      coverages: [], drivers: [], vehicles: [], locations: [],
      loss_history: [], additional_interests: [], forms_endorsements: [],
    })) as HouseholdDetail['policies'],
    service_summary: (over.txnStates ?? []).map((s, i) => ({
      id: `d0000000-0000-0000-0000-00000000000${i}`,
      reference: `TXN-${i}`,
      txn_type: 'endorsement' as const,
      state: s as 'draft',
      reason: null,
      effective_date: null,
      opened_at: '2026-07-01T00:00:00.000Z',
      closed_at: null,
      carrier_name: 'Pembridge',
      events: [],
    })),
    consent: [],
  };
}

const inDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

describe('computeMetrics', () => {
  test('counts only in-force policies toward premium', () => {
    const m = computeMetrics([
      household({
        policies: [
          { premium: 1000, status: 'in_force' },
          { premium: 9999, status: 'cancelled' },
          { premium: 5000, status: 'quoted' },
        ],
      }),
    ]);
    assert.equal(m.policies_in_force, 1);
    assert.equal(m.premium_in_force, 1000, 'cancelled and quoted premium must not inflate the book');
  });

  test('treats numeric strings from pg as numbers', () => {
    const h = household({ policies: [{ premium: 0 }] });
    // pg returns numeric columns as strings; the UI must not concatenate them.
    (h.policies[0] as { annual_premium: unknown }).annual_premium = '2140.00';
    const m = computeMetrics([h]);
    assert.equal(m.premium_in_force, 2140);
  });

  test('counts renewals inside the 90 day window only', () => {
    const m = computeMetrics([
      household({
        policies: [
          { premium: 100, expiry: inDays(30) },   // in
          { premium: 100, expiry: inDays(89) },   // in
          { premium: 100, expiry: inDays(120) },  // out — beyond the window
          { premium: 100, expiry: inDays(-5) },   // out — already expired
          { premium: 100, expiry: null },         // out — no expiry on file
        ],
      }),
    ]);
    assert.equal(m.renewals_90d, 2);
  });

  test('excludes terminal transactions from the active count', () => {
    const m = computeMetrics([
      household({ txnStates: ['draft', 'submitted', 'completed', 'rejected'] }),
    ]);
    assert.equal(m.active_transactions, 2, 'completed and rejected are closed, not in flight');
  });

  test('counts prospects from account status', () => {
    const m = computeMetrics([
      household({ status: 'prospect' }),
      household({ status: 'active' }),
    ]);
    assert.equal(m.book_size, 2);
    assert.equal(m.prospects, 1);
  });

  test('groups premium by carrier and labels a missing carrier', () => {
    const m = computeMetrics([
      household({
        policies: [
          { premium: 1000, carrier: 'Pembridge' },
          { premium: 500, carrier: 'Pembridge' },
          { premium: 200, carrier: null },
        ],
      }),
    ]);
    const byName = Object.fromEntries(m.premium_by_carrier.map((c) => [c.label, c.value]));
    assert.equal(byName.Pembridge, 1500);
    assert.equal(byName.Unassigned, 200, 'a policy with no carrier must still be counted, not dropped');
  });

  test('labels a missing source rather than dropping the household', () => {
    const m = computeMetrics([household({ source: null })]);
    assert.deepEqual(m.by_source, [{ label: 'Unknown', value: 1 }]);
  });

  test('handles an empty book without dividing by zero', () => {
    const m = computeMetrics([]);
    assert.deepEqual(
      [m.book_size, m.policies_in_force, m.premium_in_force, m.active_transactions, m.renewals_90d],
      [0, 0, 0, 0, 0],
    );
    assert.deepEqual(m.by_status, []);
  });
});

describe('against the real snapshot', () => {
  test('produces a coherent dashboard', () => {
    const m = computeMetrics(Object.values(DEMO_HOUSEHOLDS));
    assert.equal(m.book_size, Object.keys(DEMO_HOUSEHOLDS).length);
    assert.ok(m.premium_in_force > 0, 'the preview dashboard must not show a zero book');
    const statusTotal = m.by_status.reduce((s, x) => s + x.value, 0);
    assert.equal(statusTotal, m.book_size, 'every household must fall into exactly one status bucket');
    const carrierTotal = m.premium_by_carrier.reduce((s, x) => s + x.value, 0);
    assert.ok(
      Math.abs(carrierTotal - m.premium_in_force) <= m.premium_by_carrier.length,
      'carrier premium must reconcile to the headline (rounding aside)',
    );
  });
});
