import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.module';
import { Ctx } from '../common/ctx';

/**
 * The CSR's day — tenant-scoped work queues (P&C leg §3). One RLS-scoped
 * transaction; every row is already filtered to the tenant by RLS.
 */
@Injectable()
export class QueuesService {
  book(ctx: Ctx, renewalWindowDays = 120) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const activities = await q(
        `SELECT a.id, a.title, a.body, a.activity_type, a.priority,
                a.due_at::text AS due_at,
                (a.due_at IS NOT NULL AND a.due_at < now()) AS overdue,
                a.account_id, acc.display_name AS account_name, acc.lookup_code
           FROM activity a
           LEFT JOIN account acc ON acc.id = a.account_id
          WHERE a.status = 'open'
          ORDER BY a.sla_breached DESC, a.due_at ASC NULLS LAST`,
      );
      const renewals = await q(
        `SELECT p.id AS policy_id, p.account_id, acc.display_name AS account_name,
                acc.lookup_code, p.line, c.name AS carrier_name, p.policy_number,
                p.expiry_date::text AS expiry_date,
                (p.expiry_date - current_date) AS days_to_expiry,
                p.annual_premium
           FROM policy p
           JOIN account acc ON acc.id = p.account_id
           LEFT JOIN carrier c ON c.id = p.carrier_id
          WHERE p.status = 'in_force' AND p.expiry_date IS NOT NULL
            AND p.expiry_date BETWEEN current_date AND current_date + ($1 || ' days')::interval
          ORDER BY p.expiry_date ASC`,
        [renewalWindowDays],
      );
      const suspense = await q(
        `SELECT t.id AS txn_id, t.reference, t.txn_type, t.state,
                t.account_id, acc.display_name AS account_name,
                c.name AS carrier_name, t.reason, t.opened_at::text AS opened_at
           FROM txn t
           JOIN account acc ON acc.id = t.account_id
           LEFT JOIN carrier c ON c.id = t.carrier_id
          WHERE t.state IN ('submitted', 'carrier_ack')
          ORDER BY t.opened_at ASC`,
      );
      return {
        activities: activities.rows.map((a) => ({ ...a, overdue: a.overdue === true })),
        renewals: renewals.rows.map((r) => ({ ...r, days_to_expiry: Number(r.days_to_expiry) })),
        suspense: suspense.rows,
      };
    });
  }

  constructor(private readonly db: DbService) {}
}
