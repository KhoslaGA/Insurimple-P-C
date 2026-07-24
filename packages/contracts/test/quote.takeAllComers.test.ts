/**
 * TR.3 acceptance — "Take-All-Comers report reconstructs what was offered and what
 * was chosen, with reasons."
 */
import { describe, it, expect } from 'vitest';
import { takeAllComersReport } from '../src';
import { quoteResultsFixture, quoteShopFixture } from './fixtures';

describe('Take-All-Comers report', () => {
  const shop = quoteShopFixture();
  const results = quoteResultsFixture();
  const report = takeAllComersReport(shop, results);

  it('reconstructs every carrier approached', () => {
    expect(report.approached).toBe(3);
    expect(report.entries.map((e) => e.carrier.name).sort()).toEqual([
      'Cascadia General',
      'Maple Mutual',
      'True North P&C',
    ]);
  });

  it('captures declines with their reasons', () => {
    expect(report.declines).toHaveLength(1);
    expect(report.declines[0]?.carrier.name).toBe('Cascadia General');
    expect(report.declines[0]?.reason).toMatch(/not writing/i);
  });

  it('records what was presented to the client', () => {
    expect(report.presented.map((e) => e.carrier.name).sort()).toEqual([
      'Maple Mutual',
      'True North P&C',
    ]);
  });

  it('records the chosen carrier with a documented reason', () => {
    expect(report.chosen).not.toBeNull();
    expect(report.chosen?.carrier.name).toBe('Maple Mutual');
    expect(report.chosen?.reason).toMatch(/lowest firm premium/i);
  });

  it('counts firm vs indicative responses', () => {
    expect(report.firmCount).toBe(3);
    expect(report.indicativeCount).toBe(0);
  });

  it('ties the report to the exact risk version shopped', () => {
    expect(report.riskRef).toEqual({ riskId: 'risk-auto-1', version: 1 });
    expect(report.purpose).toBe('new_business');
  });
});
