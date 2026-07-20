import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.module';
import { Ctx } from '../common/ctx';

@Injectable()
export class AccountsService {
  constructor(private readonly db: DbService) {}

  list(ctx: Ctx) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const r = await q(
        `SELECT a.id, a.lookup_code, a.display_name, a.kind, a.status, a.source,
                count(p.id) AS policy_count,
                coalesce(sum(p.annual_premium), 0) AS annual_premium
           FROM account a
           LEFT JOIN policy p ON p.account_id = a.id
          GROUP BY a.id
          ORDER BY a.display_name`,
      );
      return r.rows;
    });
  }
}
