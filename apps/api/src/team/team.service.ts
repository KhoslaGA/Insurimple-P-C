import { ForbiddenException, Injectable } from '@nestjs/common';
import { DbService } from '../db/db.module';
import { newId } from '../db/id';
import { Ctx } from '../common/ctx';

export interface RecordLicenceDto {
  staffId: string;
  licenceClass: string;
  licenceNumber?: string;
  regulator?: string;
  issuedOn?: string;
  expiresOn?: string;
}

export interface GrantRoleDto {
  staffId: string;
  roleCode: string;
  licenceId?: string;
}

/** Postgres insufficient_privilege — the DB guard refused the write. */
const DENIED = '42501';

/**
 * Team administration. Every write here is gated by `team.manage` at the DB
 * layer (0010_team_admin.sql), so this service never needs to check
 * permissions itself — it only translates the refusal into a 403.
 */
@Injectable()
export class TeamService {
  constructor(private readonly db: DbService) {}

  private denied<T>(p: Promise<T>): Promise<T> {
    return p.catch((e: unknown) => {
      const err = e as { code?: string; message?: string };
      if (err?.code === DENIED) {
        throw new ForbiddenException(err.message ?? 'not authorized');
      }
      throw e;
    });
  }

  /** The roster: every staff member with their licences and live grants. */
  list(ctx: Ctx) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const staff = await q(
        `SELECT id, full_name, email, role, ribo_level, active
           FROM staff WHERE active ORDER BY full_name`,
      );
      const licences = await q(
        `SELECT id, staff_id, licence_class, licence_number, regulator,
                issued_on::text AS issued_on, expires_on::text AS expires_on, status,
                (expires_on IS NOT NULL AND expires_on < current_date) AS expired,
                (expires_on IS NOT NULL AND expires_on >= current_date
                  AND expires_on < current_date + 60) AS expiring_soon
           FROM licence ORDER BY expires_on NULLS LAST`,
      );
      const grants = await q(
        `SELECT g.id, g.staff_id, g.role_code, r.name AS role_name, g.licence_id,
                g.granted_at::text AS granted_at
           FROM staff_role_grant g
           JOIN app_role r ON r.code = g.role_code
          WHERE g.revoked_at IS NULL`,
      );
      const roles = await q(
        `SELECT code, name, description FROM app_role ORDER BY name`,
      );
      const byStaff = <T extends { staff_id: string }>(rows: T[], id: string) =>
        rows.filter((r) => r.staff_id === id);

      return {
        roles: roles.rows,
        members: staff.rows.map((s) => ({
          id: s.id,
          full_name: s.full_name,
          email: s.email,
          role: s.role,
          ribo_level: s.ribo_level,
          licences: byStaff(licences.rows as { staff_id: string }[], s.id),
          grants: byStaff(grants.rows as { staff_id: string }[], s.id),
        })),
      };
    });
  }

  recordLicence(ctx: Ctx, dto: RecordLicenceDto) {
    return this.denied(
      this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
        const r = await q(
          `INSERT INTO licence (id, tenant_id, staff_id, licence_class, licence_number,
                                regulator, issued_on, expires_on)
           VALUES ($1, current_tenant(), $2, $3, $4, $5, $6, $7)
           RETURNING id, licence_class, licence_number, expires_on::text AS expires_on`,
          [newId(), dto.staffId, dto.licenceClass, dto.licenceNumber ?? null,
           dto.regulator ?? null, dto.issuedOn ?? null, dto.expiresOn ?? null],
        );
        return r.rows[0];
      }),
    );
  }

  grantRole(ctx: Ctx, dto: GrantRoleDto) {
    return this.denied(
      this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
        const r = await q(
          `INSERT INTO staff_role_grant (id, tenant_id, staff_id, role_code, licence_id)
           VALUES ($1, current_tenant(), $2, $3, $4)
           ON CONFLICT (staff_id, role_code)
             DO UPDATE SET revoked_at = NULL, licence_id = EXCLUDED.licence_id
           RETURNING id, staff_id, role_code, licence_id`,
          [newId(), dto.staffId, dto.roleCode, dto.licenceId ?? null],
        );
        return r.rows[0];
      }),
    );
  }

  revokeGrant(ctx: Ctx, grantId: string) {
    return this.denied(
      this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
        await q(`UPDATE staff_role_grant SET revoked_at = now() WHERE id = $1`, [grantId]);
        return { id: grantId, revoked: true };
      }),
    );
  }
}
