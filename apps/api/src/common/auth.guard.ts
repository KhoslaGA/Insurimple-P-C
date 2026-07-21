import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken, createClerkClient } from '@clerk/backend';
import type { Request } from 'express';
import { DbService } from '../db/db.module';
import { Ctx } from './ctx';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Dev-header auth is permitted ONLY here. Anywhere else, JWT is required. */
export function devHeaderMode(): boolean {
  return process.env.NODE_ENV === 'development' && !process.env.CLERK_SECRET_KEY;
}

/**
 * Resolves the request context and attaches it as req.ctx.
 *
 * clerk-jwt mode (production, and any env with CLERK_SECRET_KEY set):
 *   Authorization: Bearer <session token> -> verifyToken -> org claim is the
 *   tenant key (tenant.clerk_org_id), sub is the staff key (external_auth_id).
 *   Staff rows auto-provision on first request, role mapped from org membership.
 *
 * dev-headers mode (NODE_ENV=development AND CLERK_SECRET_KEY unset):
 *   x-tenant-id / x-actor-id headers, exactly the pre-Clerk dev slice.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly log = new Logger('Auth');
  private readonly clerk = process.env.CLERK_SECRET_KEY
    ? createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
    : null;

  constructor(private readonly db: DbService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { ctx?: Ctx }>();
    if (req.path === '/health') return true; // liveness stays unauthenticated

    req.ctx = devHeaderMode() ? this.fromHeaders(req) : await this.fromJwt(req);
    return true;
  }

  private fromHeaders(req: Request): Ctx {
    const tenantId = String(req.headers['x-tenant-id'] ?? '');
    const actor = String(req.headers['x-actor-id'] ?? '');
    if (!UUID_RE.test(tenantId)) {
      throw new UnauthorizedException('missing or invalid x-tenant-id');
    }
    if (!actor) throw new UnauthorizedException('missing x-actor-id');
    return { tenantId, actor };
  }

  private async fromJwt(req: Request): Promise<Ctx> {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new UnauthorizedException(
        'CLERK_SECRET_KEY is not configured and dev-header auth is disabled outside development',
      );
    }
    const header = String(req.headers.authorization ?? '');
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new UnauthorizedException('missing bearer token');

    let payload: Record<string, unknown>;
    try {
      payload = (await verifyToken(token, { secretKey })) as unknown as Record<string, unknown>;
    } catch {
      throw new UnauthorizedException('invalid or expired session token');
    }

    const sub = String(payload.sub ?? '');
    // Session token v2 nests org claims under `o`; v1 uses org_id/org_role.
    const o = (payload.o ?? {}) as Record<string, unknown>;
    const orgId = String(payload.org_id ?? o.id ?? '');
    const orgRole = String(payload.org_role ?? o.rol ?? '');
    if (!sub) throw new UnauthorizedException('token has no subject');
    if (!orgId) {
      throw new UnauthorizedException(
        'no active organization on the session — pick one in the org switcher',
      );
    }

    const tenant = await this.db.adminQuery(
      'SELECT id FROM tenant WHERE clerk_org_id=$1',
      [orgId],
    );
    if (tenant.rowCount === 0) {
      this.log.warn(`org ${orgId} has no tenant mapping (tenant.clerk_org_id)`);
      throw new UnauthorizedException('organization is not provisioned as a tenant');
    }
    const tenantId: string = tenant.rows[0].id;

    const actor = await this.resolveStaff(tenantId, sub, orgRole);
    return { tenantId, actor };
  }

  /** Find staff by Clerk user id; auto-provision on first request. */
  private async resolveStaff(tenantId: string, sub: string, orgRole: string): Promise<string> {
    return this.db.withTenant(tenantId, 'system', async (q) => {
      const found = await q(
        'SELECT id FROM staff WHERE external_auth_id=$1 AND active',
        [sub],
      );
      if ((found.rowCount ?? 0) > 0) return found.rows[0].id as string;

      // First request from this user: pull profile from Clerk, map org role.
      let fullName = 'Clerk user';
      let email = `${sub}@users.clerk.local`;
      if (this.clerk) {
        try {
          const u = await this.clerk.users.getUser(sub);
          fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || fullName;
          email = u.primaryEmailAddress?.emailAddress ?? u.emailAddresses[0]?.emailAddress ?? email;
        } catch (e) {
          this.log.warn(`could not fetch Clerk profile for ${sub}: ${String(e)}`);
        }
      }
      const role = /admin/i.test(orgRole) ? 'principal_broker' : 'csr';
      const ins = await q(
        `INSERT INTO staff (tenant_id, full_name, email, role, external_auth_id)
         VALUES (current_tenant(), $1, $2, $3, $4)
         ON CONFLICT (tenant_id, email) DO UPDATE SET external_auth_id=$4, active=true
         RETURNING id`,
        [fullName, email, role, sub],
      );
      this.log.log(`provisioned staff ${ins.rows[0].id} (${email}, ${role}) for ${sub}`);
      return ins.rows[0].id as string;
    });
  }
}
