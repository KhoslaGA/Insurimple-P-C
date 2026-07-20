import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

export interface Ctx {
  tenantId: string;
  actor: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Dev-slice auth: tenant + actor arrive as headers.
 * Production replaces this with Clerk JWT verification, mapping
 * Clerk org -> tenant_id and Clerk user -> staff.id. The rest of the
 * codebase is unchanged because everything downstream consumes Ctx.
 */
export function getCtx(req: Request): Ctx {
  const tenantId = String(req.headers['x-tenant-id'] ?? '');
  const actor = String(req.headers['x-actor-id'] ?? '');
  if (!UUID_RE.test(tenantId)) {
    throw new UnauthorizedException('missing or invalid x-tenant-id');
  }
  if (!actor) {
    throw new UnauthorizedException('missing x-actor-id');
  }
  return { tenantId, actor };
}
