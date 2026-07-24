/**
 * TR.5 acceptance — "an indicative result cannot render on a client-facing document
 * without its indicative marking; the presented document is stored and linked to the
 * shop."
 */
import { describe, it, expect } from 'vitest';
import {
  assertClientSummarySafe,
  draftClientQuoteSummary,
  presentDocument,
  type ClientQuoteSummary,
} from '../src';
import { indicativeResultFixture, quoteResultsFixture, quoteShopFixture } from './fixtures';

describe('drafter gate — client quote summary', () => {
  const shop = quoteShopFixture();
  const results = [...quoteResultsFixture(), indicativeResultFixture()];
  const summary = draftClientQuoteSummary(shop, results, {
    generatedAt: '2026-06-15T15:30:00.000Z',
    insuredName: 'Amara Okonkwo',
  });

  it('marks every line, and every indicative line carries its indicative notice', () => {
    const stub = summary.lines.find((l) => l.carrier === 'Stub Mutual');
    expect(stub).toBeDefined();
    if (!stub || stub.marking !== 'indicative') throw new Error('expected an indicative stub line');
    expect(stub.indicativeNotice.length).toBeGreaterThan(0);

    const maple = summary.lines.find((l) => l.carrier === 'Maple Mutual');
    expect(maple?.marking).toBe('firm');
  });

  it('a safely-drafted summary passes the gate', () => {
    expect(() => assertClientSummarySafe(summary)).not.toThrow();
  });

  it('an indicative line stripped of its marking cannot pass the gate', () => {
    const tampered: ClientQuoteSummary = {
      ...summary,
      lines: summary.lines.map((l) =>
        l.marking === 'indicative' ? { ...l, indicativeNotice: '' } : l,
      ),
    };
    expect(() => assertClientSummarySafe(tampered)).toThrow(/indicative/i);
  });

  it('presenting records a version linked to the shop; an unsafe summary cannot be presented', () => {
    const doc = presentDocument(shop, summary, {
      id: 'pres-1',
      version: 1,
      generatedAt: '2026-06-15T15:31:00.000Z',
    });
    expect(doc.shopId).toBe(shop.id);
    expect(doc.tenantId).toBe(shop.tenantId);
    expect(doc.version).toBe(1);
    expect(doc.summary.lines).toHaveLength(4);

    const tampered: ClientQuoteSummary = {
      ...summary,
      lines: summary.lines.map((l) =>
        l.marking === 'indicative' ? { ...l, indicativeNotice: '   ' } : l,
      ),
    };
    expect(() => presentDocument(shop, tampered, { id: 'x', version: 2, generatedAt: 'x' })).toThrow();
  });
});
