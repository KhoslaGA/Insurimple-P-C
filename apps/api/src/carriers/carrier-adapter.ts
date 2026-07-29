/* ============================================================================
 * The CarrierAdapter seam.
 *
 * Every carrier integration — a CSIO JSON API, a rater bridge, a portal we
 * drive, or an email we send — implements this one interface. Nothing above
 * this line knows which it is. That is the point: the quoter, the submission
 * tracker and the download reconciler are written once against the seam, so
 * a real appointment becomes a new adapter rather than a new code path
 * threaded through the app.
 *
 * Until appointments exist there is exactly one implementation, and its
 * results are marked at the source (`is_mock`) so a fixture can never be
 * mistaken for a live carrier response (invariant 7). The UI reads that flag;
 * it does not infer it from configuration.
 * ========================================================================= */

export type QuoteChannel = 'csio_json_api' | 'direct_api' | 'rater' | 'portal' | 'manual';

/** What we send to be rated. Deliberately carrier-neutral. */
export interface RiskSubmission {
  line: string;
  /** Postal FSA only — rating territory, not the full address. */
  territory: string;
  effectiveDate: string;
  drivers?: Array<{
    licensedYears: number;
    atFaultCount: number;
    convictionCount?: number;
  }>;
  vehicles?: Array<{
    year: number;
    make: string;
    model: string;
    annualKm: number;
    primaryUse: string;
    winterTires?: boolean;
  }>;
  dwelling?: {
    yearBuilt?: number;
    construction?: string;
    replacementCost?: number;
    hasKnobTube?: boolean;
    hasOilTank?: boolean;
  };
  /** Requested deductible, where the line has one. */
  deductible?: number;
}

export interface QuoteLineItem {
  description: string;
  premium: number;
}

export interface CarrierQuote {
  carrierId: string;
  carrierName: string;
  channel: QuoteChannel;
  /** Indicative annual premium. Never a bindable price. */
  annualPremium: number;
  breakdown: QuoteLineItem[];
  /** Why the number moved — the substantiation Bill C-59 expects. */
  factors: string[];
  declined?: boolean;
  declineReason?: string;
  /** TRUE whenever the number did not come from a live carrier. */
  is_mock: true | false;
  quotedAt: string;
}

export interface CarrierAdapter {
  readonly channel: QuoteChannel;
  /** Indicative rating only — there is no bind method on this seam, and there
   *  will not be one until the brokerage is licensed and appointed. */
  quote(market: MarketContext, risk: RiskSubmission): Promise<CarrierQuote>;
}

export interface MarketContext {
  carrierId: string;
  carrierName: string;
  line: string;
  brokerCode: string | null;
  quoteChannel: QuoteChannel;
  /** False until a real appointment is in place. */
  appointed: boolean;
}

/* ---------------------------------------------------------------------------
 * MockCarrierAdapter — deterministic, explainable, and unmistakably fake.
 *
 * Deterministic because a demo that produces different numbers on every reload
 * is useless for testing a comparison screen: the same risk always returns the
 * same premium. The spread between carriers comes from a per-carrier bias, so
 * the compare view exercises real ordering logic rather than noise.
 * ------------------------------------------------------------------------ */

/** Stable 32-bit hash — same input, same number, no randomness. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const BASE: Record<string, number> = {
  auto: 1450,
  property: 1100,
  tenant: 260,
  condo: 380,
  umbrella: 320,
  commercial: 2400,
  life: 600,
};

export class MockCarrierAdapter implements CarrierAdapter {
  constructor(readonly channel: QuoteChannel = 'manual') {}

  async quote(market: MarketContext, risk: RiskSubmission): Promise<CarrierQuote> {
    const factors: string[] = [];
    const breakdown: QuoteLineItem[] = [];
    let premium = BASE[risk.line] ?? 900;

    // Per-carrier appetite, stable per carrier+line.
    const bias = 0.88 + ((hash(market.carrierId + risk.line) % 25) / 100);
    premium *= bias;
    factors.push(`${market.carrierName} appetite factor ${bias.toFixed(2)}`);

    // Territory — the FSA is the rating unit in Ontario.
    const terr = 1 + ((hash(risk.territory) % 18) - 6) / 100;
    premium *= terr;
    factors.push(`Territory ${risk.territory} factor ${terr.toFixed(2)}`);

    if (risk.line === 'auto') {
      const d = risk.drivers ?? [];
      const worstAtFault = Math.max(0, ...d.map((x) => x.atFaultCount));
      const minYears = d.length ? Math.min(...d.map((x) => x.licensedYears)) : 10;

      if (worstAtFault > 0) {
        const f = 1 + worstAtFault * 0.35;
        premium *= f;
        factors.push(`${worstAtFault} at-fault claim(s) — surcharge ${f.toFixed(2)}`);
      }
      if (minYears < 6) {
        const f = 1 + (6 - minYears) * 0.08;
        premium *= f;
        factors.push(`Least-experienced driver ${minYears} yrs licensed — factor ${f.toFixed(2)}`);
      }
      const km = Math.max(...(risk.vehicles ?? []).map((v) => v.annualKm), 0);
      if (km > 20000) {
        premium *= 1.07;
        factors.push('Annual mileage above 20,000 km');
      }
      if ((risk.vehicles ?? []).some((v) => v.winterTires)) {
        premium *= 0.95;
        factors.push('Winter tire discount');
      }
      breakdown.push(
        { description: 'Third Party Liability', premium: Math.round(premium * 0.46) },
        { description: 'Direct Compensation — Property Damage', premium: Math.round(premium * 0.11) },
        { description: 'Collision', premium: Math.round(premium * 0.25) },
        { description: 'Comprehensive', premium: Math.round(premium * 0.18) },
      );
    } else {
      const dw = risk.dwelling ?? {};
      if (dw.replacementCost) {
        const f = 0.85 + Math.min(0.6, dw.replacementCost / 1_500_000);
        premium *= f;
        factors.push(`Replacement cost $${dw.replacementCost.toLocaleString('en-CA')} — factor ${f.toFixed(2)}`);
      }
      if (dw.yearBuilt && dw.yearBuilt < 1980) {
        premium *= 1.15;
        factors.push(`Built ${dw.yearBuilt} — older-dwelling factor 1.15`);
      }
      // The two findings that actually decline property risk in Ontario.
      if (dw.hasKnobTube) {
        return this.decline(market, 'Knob-and-tube wiring present — outside appetite');
      }
      if (dw.hasOilTank) {
        premium *= 1.25;
        factors.push('Oil tank on premises — surcharge 1.25');
      }
      breakdown.push(
        { description: 'Dwelling / contents', premium: Math.round(premium * 0.7) },
        { description: 'Personal liability', premium: Math.round(premium * 0.12) },
        { description: 'Water — sewer backup and overland', premium: Math.round(premium * 0.18) },
      );
    }

    if (risk.deductible) {
      const f = risk.deductible >= 2500 ? 0.9 : risk.deductible >= 1000 ? 1 : 1.12;
      premium *= f;
      factors.push(`$${risk.deductible.toLocaleString('en-CA')} deductible — factor ${f.toFixed(2)}`);
    }

    const annual = Math.round(premium);
    // Keep the breakdown honest against the headline number.
    const drift = annual - breakdown.reduce((s, b) => s + b.premium, 0);
    if (breakdown.length) breakdown[0].premium += drift;

    return {
      carrierId: market.carrierId,
      carrierName: market.carrierName,
      channel: market.quoteChannel,
      annualPremium: annual,
      breakdown,
      factors,
      is_mock: true,
      quotedAt: new Date().toISOString(),
    };
  }

  private decline(market: MarketContext, reason: string): CarrierQuote {
    return {
      carrierId: market.carrierId,
      carrierName: market.carrierName,
      channel: market.quoteChannel,
      annualPremium: 0,
      breakdown: [],
      factors: [],
      declined: true,
      declineReason: reason,
      is_mock: true,
      quotedAt: new Date().toISOString(),
    };
  }
}

/**
 * Adapter registry. Today every channel resolves to the mock; a real
 * appointment replaces one entry and nothing above the seam changes.
 */
export function adapterFor(channel: QuoteChannel): CarrierAdapter {
  return new MockCarrierAdapter(channel);
}
