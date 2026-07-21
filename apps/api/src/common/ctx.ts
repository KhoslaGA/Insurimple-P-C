import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

export interface Ctx {
  tenantId: string;
  actor: string;
}

/**
 * The AuthGuard (common/auth.guard.ts) resolves auth — Clerk JWT in
 * production, x-tenant-id/x-actor-id headers only in development with
 * CLERK_SECRET_KEY unset — and attaches the result as req.ctx.
 * Everything downstream keeps consuming Ctx unchanged.
 */
export function getCtx(req: Request): Ctx {
  const ctx = (req as Request & { ctx?: Ctx }).ctx;
  if (!ctx) {
    throw new UnauthorizedException('request context missing — auth guard did not run');
  }
  return ctx;
}
