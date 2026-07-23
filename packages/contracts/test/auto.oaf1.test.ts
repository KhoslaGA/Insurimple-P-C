/**
 * TR.1 acceptance — "an auto risk captured once populates both a quote and an
 * OAF 1 application without re-entry."
 *
 * The proof is structural: `toOaf1Application` and `toQuoteInput` each take ONLY
 * the risk version, so neither can require re-keyed data. These tests then show
 * representative fields arriving in both outputs from that single source.
 */
import { describe, it, expect } from 'vitest';
import {
  Oaf1ApplicationSchema,
  QuoteInputSchema,
  createRiskVersion,
  toOaf1Application,
  toQuoteInput,
} from '../src';
import { autoRiskFixture } from './fixtures';

describe('auto risk → quote + OAF 1 (no re-entry)', () => {
  const version = createRiskVersion('risk-auto-1', autoRiskFixture(), '2026-06-01T09:00:00.000Z');
  const oaf1 = toOaf1Application(version);
  const quote = toQuoteInput(version);
  const risk = version.payload;

  it('both outputs trace back to the same captured risk version', () => {
    expect(oaf1.riskRef).toEqual({ riskId: 'risk-auto-1', version: 1 });
    expect(quote.riskRef).toEqual({ riskId: 'risk-auto-1', version: 1 });
    expect(quote.line).toBe('auto');
  });

  it('the named insured flows into both, keyed once', () => {
    const name = `${risk.namedInsured.firstName} ${risk.namedInsured.lastName}`;
    expect(quote.insured.name).toBe(name);
    expect(`${oaf1.applicant.firstName} ${oaf1.applicant.lastName}`).toBe(name);
    expect(oaf1.applicant.address).toEqual(risk.namedInsured.mailingAddress);
  });

  it('a vehicle VIN flows into both', () => {
    const vin = risk.vehicles[0].vin;
    expect(quote.auto?.vehicles[0].vin).toBe(vin);
    expect(oaf1.describedAutomobiles[0].vin).toBe(vin);
  });

  it('a driver licence number flows into both', () => {
    const licence = risk.drivers[0].licence.number;
    expect(quote.auto?.drivers[0].licence.number).toBe(licence);
    expect(oaf1.listedDrivers[0].licence.number).toBe(licence);
  });

  it('the third-party-liability limit flows into both', () => {
    expect(quote.auto?.coverages.liabilityLimit).toEqual(risk.coverages.liabilityLimit);
    expect(oaf1.coverages.liabilityLimit).toEqual(risk.coverages.liabilityLimit);
  });

  it('post-2026 SABS optional elections carry through, including declined items', () => {
    const elections = oaf1.coverages.accidentBenefits.optionalElections;
    expect(elections).toEqual(risk.coverages.accidentBenefits.optionalElections);
    expect(elections.some((e) => e.elected === false)).toBe(true); // declined ≠ dropped
    expect(quote.auto?.coverages.accidentBenefits.optionalElections).toEqual(elections);
  });

  it('both mapper outputs validate against their own schemas', () => {
    expect(() => Oaf1ApplicationSchema.parse(oaf1)).not.toThrow();
    expect(() => QuoteInputSchema.parse(quote)).not.toThrow();
  });
});
