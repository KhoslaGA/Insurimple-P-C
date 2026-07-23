/**
 * TR.1 acceptance — the property equivalent: one captured property risk
 * populates both a quote and a habitational application without re-entry.
 */
import { describe, it, expect } from 'vitest';
import {
  HabitationalApplicationSchema,
  QuoteInputSchema,
  createRiskVersion,
  toHabitationalApplication,
  toQuoteInput,
} from '../src';
import { propertyRiskFixture } from './fixtures';

describe('property risk → quote + habitational application (no re-entry)', () => {
  const version = createRiskVersion('risk-prop-1', propertyRiskFixture(), '2026-06-01T09:00:00.000Z');
  const application = toHabitationalApplication(version);
  const quote = toQuoteInput(version);
  const risk = version.payload;

  it('both outputs trace back to the same captured risk version', () => {
    expect(application.riskRef).toEqual({ riskId: 'risk-prop-1', version: 1 });
    expect(quote.riskRef).toEqual({ riskId: 'risk-prop-1', version: 1 });
    expect(quote.line).toBe('property');
  });

  it('the named insured flows into both, keyed once', () => {
    const name = `${risk.namedInsured.firstName} ${risk.namedInsured.lastName}`;
    expect(quote.insured.name).toBe(name);
    expect(`${application.applicant.firstName} ${application.applicant.lastName}`).toBe(name);
  });

  it('the risk location flows into both', () => {
    expect(application.riskLocation).toEqual(risk.riskAddress);
    expect(quote.property?.riskAddress).toEqual(risk.riskAddress);
  });

  it('Coverage A (dwelling limit) flows into both', () => {
    expect(application.coverages.dwellingA).toEqual(risk.coverages.dwellingA);
    expect(quote.property?.coverages.dwellingA).toEqual(risk.coverages.dwellingA);
  });

  it('construction (roof) flows into both', () => {
    expect(application.construction.roof).toBe(risk.construction.roof);
    expect(quote.property?.construction.roof).toBe(risk.construction.roof);
  });

  it('offered-but-declined coverage endorsements are documented, not dropped', () => {
    const declined = application.coverages.endorsements.filter((e) => e.elected === false);
    expect(declined.length).toBeGreaterThan(0);
    expect(application.coverages.endorsements).toEqual(risk.coverages.endorsements);
  });

  it('ITV valuation carries through flagged as evaluator-sourced', () => {
    expect(application.valuation?.source).toBe('evaluator');
    expect(quote.property?.valuation).toEqual(risk.valuation);
  });

  it('both mapper outputs validate against their own schemas', () => {
    expect(() => HabitationalApplicationSchema.parse(application)).not.toThrow();
    expect(() => QuoteInputSchema.parse(quote)).not.toThrow();
  });
});
