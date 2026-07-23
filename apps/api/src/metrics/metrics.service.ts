import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.module';
import { Ctx } from '../common/ctx';

/**
 * Tenant-scoped book aggregates for the admin dashboard. All under one
 * RLS-scoped transaction; every count/sum is already filtered to the tenant
 * by row-level security.
 */
@Injectable()
export class MetricsService {
  constructor(private readonly db: DbService) {}

  book(ctx: Ctx) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const headline = await q(
        `SELECT
           (SELECT count(*) FROM account) AS book_size,
           (SELECT count(*) FROM account WHERE status='prospect') AS prospects,
           (SELECT count(*) FROM policy WHERE status='in_force') AS policies_in_force,
           (SELECT coalesce(sum(annual_premium),0) FROM policy WHERE status='in_force') AS premium_in_force,
           (SELECT count(*) FROM txn WHERE state NOT IN ('completed','rejected')) AS active_transactions,
           (SELECT count(*) FROM policy
             WHERE status='in_force' AND expiry_date IS NOT NULL
               AND expiry_date BETWEEN current_date AND current_date + INTERVAL '90 days') AS renewals_90d`,
      );
      const byStatus = await q(
        `SELECT initcap(status) AS label, count(*)::int AS value
           FROM account GROUP BY status ORDER BY value DESC`,
      );
      const bySource = await q(
        `SELECT coalesce(source,'Unknown') AS label, count(*)::int AS value
           FROM account GROUP BY source ORDER BY value DESC`,
      );
      const byCarrier = await q(
        `SELECT coalesce(c.name,'Unassigned') AS label, round(sum(p.annual_premium))::int AS value
           FROM policy p LEFT JOIN carrier c ON c.id = p.carrier_id
          WHERE p.status='in_force'
          GROUP BY c.name ORDER BY value DESC`,
      );
      const pipeline = await q(
        `SELECT state, count(*)::int AS value FROM txn GROUP BY state`,
      );
      const h = headline.rows[0];
      return {
        book_size: Number(h.book_size),
        prospects: Number(h.prospects),
        policies_in_force: Number(h.policies_in_force),
        premium_in_force: Number(h.premium_in_force),
        active_transactions: Number(h.active_transactions),
        renewals_90d: Number(h.renewals_90d),
        by_status: byStatus.rows,
        by_source: bySource.rows,
        premium_by_carrier: byCarrier.rows,
        pipeline: pipeline.rows.map((r) => ({ state: r.state, value: r.value })),
      };
    });
  }
}
