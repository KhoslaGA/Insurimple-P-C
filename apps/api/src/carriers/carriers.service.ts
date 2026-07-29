import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from '../db/db.module';
import { Ctx } from '../common/ctx';
import {
  adapterFor,
  CarrierQuote,
  MarketContext,
  QuoteChannel,
  RiskSubmission,
} from './carrier-adapter';

@Injectable()
export class CarriersService {
  constructor(private readonly db: DbService) {}

  /** The market list: who we can place with, per line, and how they're reached. */
  markets(ctx: Ctx) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const r = await q(
        `SELECT ma.id, ma.line, ma.broker_code, ma.commission_rate,
                ma.quote_channel, ma.submit_channel, ma.download_channel,
                ma.fnol_routing, ma.active,
                c.id AS carrier_id, c.name AS carrier_name, c.csio_code
           FROM market_availability ma
           JOIN carrier c ON c.id = ma.carrier_id
          ORDER BY c.name, ma.line`,
      );
      return r.rows;
    });
  }

  /**
   * Quote a policy's risk across every market that writes its line.
   *
   * Every market is quoted and every result is written to quote_log — including
   * declines — because Take-All-Comers is an evidentiary obligation: the record
   * of which markets were approached and why each was or wasn't selected is the
   * thing a regulator asks for, and it cannot be reconstructed later.
   */
  quoteForPolicy(ctx: Ctx, policyId: string) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const p = await q(
        `SELECT p.id, p.line, p.account_id, p.effective_date::text AS effective_date,
                a.display_name AS account_name,
                (SELECT pt.address FROM account_party ap
                   JOIN party pt ON pt.id = ap.party_id
                  WHERE ap.account_id = p.account_id
                  ORDER BY ap.is_primary DESC LIMIT 1) AS address
           FROM policy p JOIN account a ON a.id = p.account_id
          WHERE p.id = $1`,
        [policyId],
      );
      if (p.rowCount === 0) throw new BadRequestException('policy not found');
      const policy = p.rows[0];

      const risk = await this.buildRisk(q, policy);

      const markets = await q(
        `SELECT ma.broker_code, ma.quote_channel, ma.active,
                c.id AS carrier_id, c.name AS carrier_name
           FROM market_availability ma
           JOIN carrier c ON c.id = ma.carrier_id
          WHERE ma.line = $1
          ORDER BY c.name`,
        [policy.line],
      );

      const quotes: CarrierQuote[] = [];
      for (const m of markets.rows) {
        const ctxMarket: MarketContext = {
          carrierId: m.carrier_id,
          carrierName: m.carrier_name,
          line: policy.line,
          brokerCode: m.broker_code,
          quoteChannel: (m.quote_channel ?? 'manual') as QuoteChannel,
          appointed: m.active === true,
        };
        const quote = await adapterFor(ctxMarket.quoteChannel).quote(ctxMarket, risk);
        quotes.push(quote);

        await q(
          `INSERT INTO quote_log (tenant_id, account_id, carrier_id, line,
                                  quoted_premium, outcome, rationale)
           VALUES (current_tenant(), $1, $2, $3, $4, $5, $6)`,
          [policy.account_id, m.carrier_id, policy.line,
           quote.declined ? null : quote.annualPremium,
           quote.declined ? 'declined_by_carrier' : 'not_selected',
           quote.declined ? quote.declineReason : quote.factors.join('; ')],
        );
      }

      const offered = quotes.filter((x) => !x.declined).sort((a, b) => a.annualPremium - b.annualPremium);

      return {
        policy: {
          id: policy.id,
          line: policy.line,
          account_id: policy.account_id,
          account_name: policy.account_name,
        },
        risk,
        quotes,
        best: offered[0] ?? null,
        /** True while no adapter is a live carrier connection. */
        indicative_only: true,
      };
    });
  }

  /** Assemble the carrier-neutral risk from what the policy already holds. */
  private async buildRisk(
    q: (sql: string, p?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>,
    policy: Record<string, unknown>,
  ): Promise<RiskSubmission> {
    const addr = (policy.address ?? {}) as Record<string, unknown>;
    const postal = String(addr.postal ?? '');
    const territory = postal ? postal.replace(/\s/g, '').slice(0, 3).toUpperCase() : 'UNK';

    const drivers = await q(
      `SELECT dr.at_fault_count, dr.licence_date,
              extract(year from age(current_date, dr.licence_date))::int AS licensed_years
         FROM driver_record dr
         JOIN account_party ap ON ap.party_id = dr.party_id
        WHERE ap.account_id = $1`,
      [policy.account_id],
    );
    const vehicles = await q(
      `SELECT year, make, model, annual_km, primary_use, winter_tires
         FROM vehicle WHERE policy_id = $1`,
      [policy.id],
    );
    const dwellings = await q(
      `SELECT year_built, construction, replacement_cost, has_knob_tube, has_oil_tank
         FROM dwelling WHERE policy_id = $1 LIMIT 1`,
      [policy.id],
    );
    const d = dwellings.rows[0];

    return {
      line: String(policy.line),
      territory,
      effectiveDate: String(policy.effective_date ?? ''),
      drivers: drivers.rows.map((x) => ({
        licensedYears: Number(x.licensed_years ?? 10),
        atFaultCount: Number(x.at_fault_count ?? 0),
      })),
      vehicles: vehicles.rows.map((v) => ({
        year: Number(v.year ?? 0),
        make: String(v.make ?? ''),
        model: String(v.model ?? ''),
        annualKm: Number(v.annual_km ?? 0),
        primaryUse: String(v.primary_use ?? ''),
        winterTires: v.winter_tires === true,
      })),
      dwelling: d
        ? {
            yearBuilt: d.year_built == null ? undefined : Number(d.year_built),
            construction: d.construction == null ? undefined : String(d.construction),
            replacementCost: d.replacement_cost == null ? undefined : Number(d.replacement_cost),
            hasKnobTube: d.has_knob_tube === true,
            hasOilTank: d.has_oil_tank === true,
          }
        : undefined,
    };
  }
}
