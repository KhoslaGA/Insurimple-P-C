import { Injectable, Module, OnModuleDestroy, Global } from '@nestjs/common';
import { Pool, PoolClient, QueryResult } from 'pg';

export type Q = (sql: string, params?: unknown[]) => Promise<QueryResult>;

/**
 * Every query runs inside a transaction that first sets
 *   app.current_tenant  and  app.current_actor
 * with set_config(..., is_local=true) — scoped to that transaction only.
 * Postgres Row-Level Security reads these; isolation is enforced by the
 * database, not by remembering WHERE clauses in application code.
 *
 * In dev we connect as a superuser (which bypasses RLS), so DB_SET_ROLE=app
 * switches each connection to the non-superuser `app` role. In production,
 * connect directly as a non-superuser login role and leave DB_SET_ROLE unset.
 */
@Injectable()
export class DbService implements OnModuleDestroy {
  private pool: Pool;
  private readonly setRole = process.env.DB_SET_ROLE;

  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  async withTenant<T>(
    tenantId: string,
    actor: string,
    fn: (q: Q) => Promise<T>,
  ): Promise<T> {
    const client: PoolClient = await this.pool.connect();
    try {
      await client.query('BEGIN');
      if (this.setRole) {
        // transaction-scoped: reverts on COMMIT/ROLLBACK, no pool-state leakage
        await client.query(`SET LOCAL ROLE ${this.setRole}`);
      }
      await client.query(
        `SELECT set_config('app.current_tenant', $1, true),
                set_config('app.current_actor',  $2, true)`,
        [tenantId, actor],
      );
      const result = await fn((sql, params) => client.query(sql, params));
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Pre-tenant-context query, used ONLY by the auth guard to resolve
   * tenant by clerk_org_id before any RLS scope exists. The tenant table
   * itself is not tenant-scoped; everything else must go through withTenant.
   */
  async adminQuery(sql: string, params?: unknown[]): Promise<QueryResult> {
    return this.pool.query(sql, params);
  }

  async ping(): Promise<boolean> {
    const r = await this.pool.query('SELECT 1 AS ok');
    return r.rows[0]?.ok === 1;
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}

@Global()
@Module({ providers: [DbService], exports: [DbService] })
export class DbModule {}
