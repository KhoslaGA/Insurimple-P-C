/**
 * Tenant-scoped database access.
 *
 * Every query in the product goes through `withTenant`. That is not a style
 * preference — it is the only place tenant context is established, so it is the
 * only place the pooler-leak bug can be prevented.
 *
 * The rule from CLAUDE.md invariant #2: set context with
 *   SELECT set_config('app.current_tenant', $1, true)
 * inside BEGIN/COMMIT, never plain `SET`. A plain SET persists on the pooled
 * connection after it is returned, so the next checkout — a different tenant —
 * inherits it. `true` makes the setting transaction-local, discarded on
 * COMMIT or ROLLBACK.
 */

import pg from "pg";

/* Money is stored as bigint cents. node-postgres hands bigint back as a string
   to avoid precision loss; we parse to number deliberately, because cents stay
   exact in a float64 well past any premium a brokerage will ever write
   (2^53 cents is ~$90 trillion). Parsing here means callers get numbers. */
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => Number(v));

/* DATE without a timezone shift. The default parser builds a local-midnight
   Date, which silently moves an effective date across a day boundary west of
   UTC — an off-by-one on a policy term is a real compliance problem. */
pg.types.setTypeParser(pg.types.builtins.DATE, (v) => v);

let pool: pg.Pool | undefined;

function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set. Data access is server-side only — check this is not running in a browser bundle.",
      );
    }
    pool = new pg.Pool({
      connectionString,
      max: Number(process.env.PGPOOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      // The app connects as the non-owner role; RLS applies to it.
      application_name: "insurimple-bms",
    });
  }
  return pool;
}

export type TenantContext = {
  /** Tenant id from the Clerk org claim. Never from a route param or body. */
  tenantId: string;
  /** Acting user, for the licence guards. Clerk subject claim. */
  userId?: string;
};

export type Queryable = {
  query<R extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<pg.QueryResult<R>>;
};

/**
 * Run `fn` inside a transaction with tenant context established.
 *
 * Commits on success, rolls back on any throw. The connection is always
 * released, and because the GUCs are transaction-local they are gone before it
 * returns to the pool.
 */
export async function withTenant<T>(
  ctx: TenantContext,
  fn: (db: Queryable) => Promise<T>,
): Promise<T> {
  if (!ctx.tenantId) {
    // Fail loudly rather than running with no context. RLS would deny every
    // row anyway, but an empty result set reads like "no data" and gets
    // debugged as a data problem instead of an auth one.
    throw new Error("withTenant called without a tenantId");
  }

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_tenant', $1, true)", [
      ctx.tenantId,
    ]);
    await client.query("SELECT set_config('app.current_user', $1, true)", [
      ctx.userId ?? "",
    ]);

    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // A rollback failure means the connection is already broken; releasing
      // it below discards it. Surface the original error, not this one.
    }
    throw err;
  } finally {
    client.release();
  }
}

/** Convenience for a single read. Same guarantees as withTenant. */
export async function queryAsTenant<R extends pg.QueryResultRow = pg.QueryResultRow>(
  ctx: TenantContext,
  text: string,
  values: unknown[] = [],
): Promise<R[]> {
  return withTenant(ctx, async (db) => (await db.query<R>(text, values)).rows);
}

export * from "./queries/households";
