/* Drop, recreate, migrate, seed. Development only — it destroys data.
 *
 * Refuses to touch anything that does not look like a local development
 * database, because "reset" against a real one is unrecoverable.
 */

import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");

const connectionString =
  process.env.DATABASE_URL ?? "postgres://localhost:5432/insurimple_dev";

const url = new URL(connectionString);
const dbName = url.pathname.replace(/^\//, "");
const isLocal = ["localhost", "127.0.0.1", "::1", ""].includes(url.hostname);

if (!isLocal || !/_dev$|_test$/.test(dbName)) {
  console.error(
    `\n  Refusing to reset "${dbName}" on "${url.hostname || "localhost"}".\n` +
      `  reset only runs against a local database whose name ends in _dev or _test.\n`,
  );
  process.exit(1);
}

// Connect to the maintenance database so the target can be dropped.
const admin = new pg.Client({
  connectionString: new URL("/postgres", url).toString(),
});
await admin.connect();

console.log(`  dropping ${dbName}`);
await admin.query(
  `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
   WHERE datname = $1 AND pid <> pg_backend_pid()`,
  [dbName],
);
await admin.query(`DROP DATABASE IF EXISTS ${JSON.stringify(dbName).replace(/"/g, '"')}`);
await admin.query(`CREATE DATABASE ${JSON.stringify(dbName).replace(/"/g, '"')}`);
await admin.end();
console.log(`  created ${dbName}`);

execFileSync("node", [join(here, "migrate.mjs")], { stdio: "inherit" });

console.log("  seeding");
const client = new pg.Client({ connectionString });
await client.connect();
const { readFileSync } = await import("node:fs");
await client.query(readFileSync(join(pkgRoot, "seed.sql"), "utf8"));
await client.end();
console.log("  done");
