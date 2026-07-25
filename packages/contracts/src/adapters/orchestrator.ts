/**
 * Orchestration (TR.4) — run one risk through many carrier adapters and collect
 * normalized results. Adding a carrier means passing another CarrierAdapter here;
 * nothing else changes, and no frontend changes.
 *
 * One carrier's failure must never cost the others. A real shop fans out to ~20 carriers
 * over portals and APIs that time out and go down; with all-or-nothing semantics, even 98%
 * per-carrier reliability loses a third of shops entirely (0.98^20 ≈ 0.67). So every
 * adapter is isolated: successes are kept, failures are reported separately, and the shop
 * returns whatever the market actually gave back.
 *
 * NOTE: this runs every adapter concurrently and resolves only when all have settled,
 * which suits deterministic adapters and small fan-outs. Production fan-out to live
 * carriers belongs in a job queue — one job per (shop, carrier), with retries, timeouts
 * and per-carrier concurrency caps — writing each result as it lands so the comparison
 * fills in progressively instead of blocking on the slowest carrier.
 */
import type { QuoteResult } from '../quote';
import type {
  AdapterFailure,
  CarrierAdapter,
  PortalExport,
  QuoteRequest,
} from './adapter';

export interface ShopRun {
  results: QuoteResult[];
  exports: PortalExport[];
  /** Carriers whose interaction failed technically. Never presentable as a decline. */
  failures: AdapterFailure[];
}

export async function runShop(
  request: QuoteRequest,
  adapters: readonly CarrierAdapter[],
): Promise<ShopRun> {
  const settled = await Promise.allSettled(
    adapters.map((adapter) => adapter.quote(request)),
  );

  const results: QuoteResult[] = [];
  const exports: PortalExport[] = [];
  const failures: AdapterFailure[] = [];

  settled.forEach((outcome, i) => {
    const adapter = adapters[i];
    if (outcome.status === 'fulfilled') {
      results.push(...outcome.value.results);
      if (outcome.value.export) exports.push(outcome.value.export);
      return;
    }
    failures.push({
      carrier: adapter.carrier,
      kind: adapter.kind,
      reason: outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason),
    });
  });

  return { results, exports, failures };
}
