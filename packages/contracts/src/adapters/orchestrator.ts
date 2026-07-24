/**
 * Orchestration (TR.4) — run one risk through many carrier adapters and collect
 * normalized results. Adding a carrier means passing another CarrierAdapter here;
 * nothing else changes, and no frontend changes.
 */
import type { QuoteResult } from '../quote';
import type { CarrierAdapter, PortalExport, QuoteRequest } from './adapter';

export interface ShopRun {
  results: QuoteResult[];
  exports: PortalExport[];
}

export async function runShop(
  request: QuoteRequest,
  adapters: readonly CarrierAdapter[],
): Promise<ShopRun> {
  const responses = await Promise.all(adapters.map((adapter) => adapter.quote(request)));
  return {
    results: responses.flatMap((response) => response.results),
    exports: responses.flatMap((response) => (response.export ? [response.export] : [])),
  };
}
