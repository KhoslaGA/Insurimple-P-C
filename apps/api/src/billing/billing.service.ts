import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.module';
import { Ctx } from '../common/ctx';

/**
 * Billing & receivables. Read-only for now: the ledger is written by the
 * transaction spine, never by a screen. Trust surplus is the number that
 * matters — a negative surplus is a trust shortfall and a RIBO reportable
 * event, so it is surfaced rather than buried in a report.
 */
@Injectable()
export class BillingService {
  constructor(private readonly db: DbService) {}

  overview(ctx: Ctx) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const trust = await q(
        `SELECT coalesce(trust_assets,0) AS trust_assets,
                coalesce(trust_liabilities,0) AS trust_liabilities,
                coalesce(trust_surplus,0) AS trust_surplus
           FROM trust_position WHERE tenant_id = current_tenant()`,
      );

      const entries = await q(
        `SELECT je.id, je.book, je.reference, je.description,
                je.entry_date::text AS entry_date, je.posted,
                coalesce(sum(jl.debit), 0) AS amount
           FROM journal_entry je
           LEFT JOIN journal_line jl ON jl.entry_id = je.id
          GROUP BY je.id
          ORDER BY je.entry_date DESC, je.created_at DESC
          LIMIT 50`,
      );

      const commissions = await q(
        `SELECT ce.id, ce.period::text AS period, ce.expected, ce.received, ce.status,
                coalesce(ce.expected,0) - coalesce(ce.received,0) AS variance,
                c.name AS carrier_name, p.policy_number, p.line,
                a.display_name AS account_name
           FROM commission_entry ce
           LEFT JOIN carrier c ON c.id = ce.carrier_id
           LEFT JOIN policy p ON p.id = ce.policy_id
           LEFT JOIN account a ON a.id = p.account_id
          ORDER BY ce.status, c.name`,
      );

      // Sub-ledger: what is held in trust per household.
      const byAccount = await q(
        `SELECT a.id AS account_id, a.display_name AS account_name, a.lookup_code,
                sum(jl.credit - jl.debit) AS held_in_trust
           FROM journal_line jl
           JOIN journal_entry je ON je.id = jl.entry_id AND je.posted AND je.book = 'trust'
           JOIN ledger_account la ON la.id = jl.account_id AND la.type = 'liability'
           JOIN account a ON a.id = jl.party_account_id
          GROUP BY a.id
         HAVING sum(jl.credit - jl.debit) <> 0
          ORDER BY a.display_name`,
      );

      const t = trust.rows[0] ?? {};
      const expected = commissions.rows.reduce((s, r) => s + Number(r.expected ?? 0), 0);
      const received = commissions.rows.reduce((s, r) => s + Number(r.received ?? 0), 0);

      return {
        trust: {
          assets: Number(t.trust_assets ?? 0),
          liabilities: Number(t.trust_liabilities ?? 0),
          surplus: Number(t.trust_surplus ?? 0),
        },
        commission_summary: {
          expected,
          received,
          variance: expected - received,
          open: commissions.rows.filter((r) => r.status === 'open').length,
          in_variance: commissions.rows.filter((r) => r.status === 'variance').length,
        },
        entries: entries.rows,
        commissions: commissions.rows,
        held_in_trust: byAccount.rows,
      };
    });
  }
}
