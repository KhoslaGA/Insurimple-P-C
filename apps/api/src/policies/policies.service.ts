import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.module';
import { Ctx } from '../common/ctx';

/** The flat book — every policy with the household and risk counts. */
@Injectable()
export class PoliciesService {
  constructor(private readonly db: DbService) {}

  list(ctx: Ctx) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const r = await q(
        `SELECT p.id, p.policy_number, p.line, p.status,
                p.effective_date::text AS effective_date,
                p.expiry_date::text AS expiry_date,
                p.annual_premium, p.billing_type, p.payment_plan,
                c.name AS carrier_name,
                a.id AS account_id, a.display_name AS account_name, a.lookup_code,
                (SELECT count(*) FROM vehicle v WHERE v.policy_id = p.id)::int AS vehicle_count,
                (SELECT count(*) FROM dwelling d WHERE d.policy_id = p.id)::int AS dwelling_count,
                (SELECT count(*) FROM coverage cv WHERE cv.policy_id = p.id)::int AS coverage_count,
                CASE WHEN p.expiry_date IS NULL THEN NULL
                     ELSE (p.expiry_date - current_date) END AS days_to_expiry
           FROM policy p
           JOIN account a ON a.id = p.account_id
           LEFT JOIN carrier c ON c.id = p.carrier_id
          ORDER BY a.display_name, p.line`,
      );
      return r.rows.map((x) => ({
        ...x,
        days_to_expiry: x.days_to_expiry == null ? null : Number(x.days_to_expiry),
      }));
    });
  }
}
