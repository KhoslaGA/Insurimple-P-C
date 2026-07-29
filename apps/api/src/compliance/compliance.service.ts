import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.module';
import { Ctx } from '../common/ctx';

/**
 * Book & compliance — the principal broker's supervision view (RIBO
 * requirement) plus the book-of-business cut.
 *
 * The exceptions list is the E&O trail read backwards: things that are
 * *missing* rather than things that happened. Every row is derived, never a
 * flag someone has to remember to set.
 */
@Injectable()
export class ComplianceService {
  constructor(private readonly db: DbService) {}

  overview(ctx: Ctx) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const byLine = await q(
        `SELECT line AS label, count(*)::int AS value,
                round(coalesce(sum(annual_premium),0))::int AS premium
           FROM policy WHERE status = 'in_force'
          GROUP BY line ORDER BY premium DESC`,
      );
      const byCarrier = await q(
        `SELECT coalesce(c.name,'Unassigned') AS label, count(*)::int AS value,
                round(coalesce(sum(p.annual_premium),0))::int AS premium
           FROM policy p LEFT JOIN carrier c ON c.id = p.carrier_id
          WHERE p.status = 'in_force'
          GROUP BY c.name ORDER BY premium DESC`,
      );
      const byExpiryMonth = await q(
        `SELECT to_char(expiry_date,'Mon YYYY') AS label,
                date_trunc('month', expiry_date) AS sort_key,
                count(*)::int AS value,
                round(coalesce(sum(annual_premium),0))::int AS premium
           FROM policy
          WHERE status = 'in_force' AND expiry_date IS NOT NULL
            AND expiry_date <= current_date + interval '12 months'
          GROUP BY 1, 2 ORDER BY 2`,
      );

      const retention = await q(
        `SELECT count(*) FILTER (WHERE status = 'in_force')::int AS in_force,
                count(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
                count(*) FILTER (WHERE status = 'lapsed')::int AS lapsed
           FROM policy`,
      );

      /* ---- E&O exceptions: what is missing, not what happened ---- */

      const overdue = await q(
        `SELECT a.id, a.title, a.due_at::text AS due_at,
                acc.display_name AS account_name, acc.id AS account_id
           FROM activity a LEFT JOIN account acc ON acc.id = a.account_id
          WHERE a.status = 'open' AND a.due_at IS NOT NULL AND a.due_at < now()
          ORDER BY a.due_at`,
      );

      // A transaction that reached signature stage but has no signature row.
      const unsigned = await q(
        `SELECT t.id, t.reference, t.txn_type, t.state,
                acc.display_name AS account_name, acc.id AS account_id
           FROM txn t
           JOIN account acc ON acc.id = t.account_id
          WHERE t.state IN ('sig_pending','signed','submitted','carrier_ack','completed')
            AND NOT EXISTS (
                  SELECT 1 FROM signature s
                    JOIN document d ON d.id = s.document_id
                   WHERE d.txn_id = t.id)
          ORDER BY t.opened_at`,
      );

      // Submitted to a carrier but never acknowledged, past a reasonable wait.
      const unacknowledged = await q(
        `SELECT t.id, t.reference, t.txn_type,
                acc.display_name AS account_name, acc.id AS account_id,
                cs.submitted_at::text AS submitted_at,
                (current_date - cs.submitted_at::date) AS days_waiting
           FROM txn t
           JOIN account acc ON acc.id = t.account_id
           JOIN carrier_submission cs ON cs.txn_id = t.id
          WHERE cs.status = 'sent' AND cs.acknowledged_at IS NULL
            AND cs.submitted_at < now() - interval '3 days'
          ORDER BY cs.submitted_at`,
      );

      // Licences lapsed or lapsing — the supervision duty.
      const licences = await q(
        `SELECT l.id, s.full_name, l.licence_class, l.licence_number,
                l.expires_on::text AS expires_on,
                (l.expires_on < current_date) AS expired
           FROM licence l JOIN staff s ON s.id = l.staff_id
          WHERE l.status = 'active' AND l.expires_on IS NOT NULL
            AND l.expires_on < current_date + interval '90 days'
          ORDER BY l.expires_on`,
      );

      // Still flagged in force after the expiry date — either the renewal was
      // never processed or the status was never updated. Both are coverage
      // questions, which is why this is an exception and not a report.
      const expiredInForce = await q(
        `SELECT p.id, p.policy_number, p.line, p.expiry_date::text AS expiry_date,
                (current_date - p.expiry_date) AS days_past,
                a.id AS account_id, a.display_name AS account_name
           FROM policy p JOIN account a ON a.id = p.account_id
          WHERE p.status = 'in_force' AND p.expiry_date IS NOT NULL
            AND p.expiry_date < current_date
          ORDER BY p.expiry_date`,
      );

      // Marketing without a CASL basis on the primary contact.
      const consentGaps = await q(
        `SELECT a.id AS account_id, a.display_name AS account_name, a.lookup_code
           FROM account a
           JOIN account_party ap ON ap.account_id = a.id AND ap.is_primary
          WHERE NOT EXISTS (
                  SELECT 1 FROM consent c
                   WHERE c.party_id = ap.party_id
                     AND c.basis IN ('express','implied'))
          ORDER BY a.display_name`,
      );

      return {
        book: {
          by_line: byLine.rows,
          by_carrier: byCarrier.rows,
          by_expiry_month: byExpiryMonth.rows.map((r) => ({
            label: r.label,
            value: r.value,
            premium: r.premium,
          })),
        },
        retention: retention.rows[0],
        exceptions: {
          overdue_activities: overdue.rows,
          unsigned_transactions: unsigned.rows,
          unacknowledged_submissions: unacknowledged.rows.map((r) => ({
            ...r,
            days_waiting: Number(r.days_waiting),
          })),
          licence_alerts: licences.rows,
          expired_in_force: expiredInForce.rows.map((r) => ({
            ...r,
            days_past: Number(r.days_past),
          })),
          consent_gaps: consentGaps.rows,
        },
      };
    });
  }
}
