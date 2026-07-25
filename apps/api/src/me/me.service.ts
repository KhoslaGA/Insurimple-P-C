import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.module';
import { Ctx } from '../common/ctx';

/**
 * Who the caller is and what they may do — the licence boundary made legible.
 * Capabilities come from actor_capabilities(), the same function the DB guard
 * uses, so the UI can never disagree with enforcement.
 */
@Injectable()
export class MeService {
  constructor(private readonly db: DbService) {}

  profile(ctx: Ctx) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const staff = await q(
        `SELECT s.id, s.full_name, s.email, s.role, s.ribo_level,
                t.trade_name, t.legal_name
           FROM staff s CROSS JOIN tenant t
          WHERE s.id = $1 AND t.id = current_tenant()`,
        [ctx.actor],
      );
      const licences = await q(
        `SELECT id, licence_class, licence_number, regulator,
                issued_on::text AS issued_on, expires_on::text AS expires_on, status,
                (expires_on IS NOT NULL AND expires_on < current_date) AS expired,
                (expires_on IS NOT NULL
                  AND expires_on >= current_date
                  AND expires_on < current_date + 60) AS expiring_soon
           FROM licence WHERE staff_id = $1 ORDER BY expires_on NULLS LAST`,
        [ctx.actor],
      );
      const roles = await q(
        `SELECT g.role_code, r.name AS role_name, g.licence_id,
                g.granted_at::text AS granted_at
           FROM staff_role_grant g
           JOIN app_role r ON r.code = g.role_code
          WHERE g.staff_id = $1 AND g.revoked_at IS NULL
          ORDER BY r.name`,
        [ctx.actor],
      );
      const caps = await q(`SELECT code FROM actor_capabilities() ORDER BY code`);
      const modules = await q(
        `SELECT module FROM tenant_module
          WHERE tenant_id = current_tenant() AND active ORDER BY module`,
      );
      return {
        staff: staff.rows[0]
          ? {
              id: staff.rows[0].id,
              full_name: staff.rows[0].full_name,
              email: staff.rows[0].email,
              role: staff.rows[0].role,
              ribo_level: staff.rows[0].ribo_level,
              tenant_name: staff.rows[0].trade_name ?? staff.rows[0].legal_name,
            }
          : null,
        licences: licences.rows,
        roles: roles.rows,
        capabilities: caps.rows.map((r) => r.code as string),
        modules: modules.rows.map((r) => r.module as string),
      };
    });
  }
}
