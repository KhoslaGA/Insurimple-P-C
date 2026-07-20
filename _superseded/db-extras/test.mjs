/* Run the isolation suite and report.
 *
 * Rebuilds first: the suite asserts exact row counts, so it must run against a
 * known-clean seed rather than whatever the last dev session left behind.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");

const connectionString =
  process.env.DATABASE_URL ?? "postgres://localhost:5432/insurimple_dev";

execFileSync("node", [join(here, "reset.mjs")], { stdio: "inherit" });

const client = new pg.Client({ connectionString });
await client.connect();

/* The suite is written for psql (it uses \set, \o and an explicit ROLLBACK).
   Driving it through psql keeps one canonical file rather than maintaining a
   second copy that could drift. */
let output;
let failed = false;
try {
  output = execFileSync(
    "psql",
    ["-d", connectionString, "-f", join(pkgRoot, "tests", "isolation.sql")],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
} catch (err) {
  output = `${err.stdout ?? ""}${err.stderr ?? ""}`;
  failed = true;
}

console.log(output);
await client.end();

if (failed) {
  console.error("  isolation suite FAILED");
  process.exit(1);
}
console.log("  isolation suite passed");
