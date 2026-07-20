/* Task runner with a Node bootstrap.
 *
 * The toolchain needs Node 22+ (pnpm 9 needs >=18.12, Next 16 needs >=20). When
 * the shell's ambient Node is older, the failure surfaces deep in the toolchain
 * as a pnpm error, which points at the wrong thing entirely.
 *
 * So: if the current Node is too old, find a new enough one already installed
 * under nvm and re-run the task with that on PATH. Everything downstream —
 * turbo, pnpm, next — then inherits the right version. If no suitable Node
 * exists, fail immediately with something actionable.
 *
 * Written in conservative syntax: it has to parse on the old versions it exists
 * to work around.
 */

import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const REQUIRED_MAJOR = 22;

const args = process.argv.slice(2);
if (args.length === 0) {
  process.stderr.write("usage: node scripts/run.mjs <turbo-task> [args...]\n");
  process.exit(1);
}

function majorOf(version) {
  return Number(String(version).replace(/^v/, "").split(".")[0]);
}

/* Highest installed nvm Node that meets the floor, or null. */
function findUsableNodeBin() {
  const root = join(homedir(), ".nvm", "versions", "node");
  if (!existsSync(root)) return null;

  const usable = readdirSync(root)
    .filter((name) => /^v\d+\.\d+\.\d+$/.test(name))
    .map((name) => ({
      name,
      parts: name.replace(/^v/, "").split(".").map(Number),
    }))
    .filter((entry) => entry.parts[0] >= REQUIRED_MAJOR)
    .sort((a, b) => {
      for (let i = 0; i < 3; i++) {
        if (b.parts[i] !== a.parts[i]) return b.parts[i] - a.parts[i];
      }
      return 0;
    });

  for (const entry of usable) {
    const bin = join(root, entry.name, "bin");
    if (existsSync(join(bin, "node"))) return bin;
  }
  return null;
}

const env = { ...process.env };
let usingBin = null;

if (majorOf(process.versions.node) < REQUIRED_MAJOR) {
  usingBin = findUsableNodeBin();

  if (!usingBin) {
    process.stderr.write(
      "\n  This repo needs Node " +
        REQUIRED_MAJOR +
        "+, and your shell has v" +
        process.versions.node +
        ".\n" +
        "  No suitable version is installed under nvm.\n\n" +
        "      nvm install " +
        REQUIRED_MAJOR +
        "\n\n",
    );
    process.exit(1);
  }

  /* Announce it — a silent version switch is worse than the original bug. */
  process.stderr.write(
    "  [run] shell Node is v" +
      process.versions.node +
      "; using " +
      usingBin +
      " instead\n" +
      "  [run] to fix the shell itself: nvm use\n\n",
  );

  env.PATH = usingBin + ":" + env.PATH;
}

const turbo = join(process.cwd(), "node_modules", ".bin", "turbo");
const command = existsSync(turbo) ? turbo : "turbo";

const child = spawn(command, args, { stdio: "inherit", env });

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code === null ? 1 : code);
});

child.on("error", (err) => {
  process.stderr.write("  [run] could not start turbo: " + err.message + "\n");
  process.exit(1);
});
