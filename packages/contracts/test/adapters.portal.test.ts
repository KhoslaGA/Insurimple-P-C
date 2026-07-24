/**
 * TR.4 — the portal-assisted adapter exports the risk (deep link + payload) and
 * returns no premature quote; the broker keys the result back via manual entry.
 */
import { describe, it, expect } from 'vitest';
import { createPortalAdapter } from '../src';
import { autoQuoteRequestFixture } from './fixtures';

const carrier = { id: 'MM', name: 'Maple Mutual' };

describe('portal-assisted adapter', () => {
  const request = autoQuoteRequestFixture();

  it('returns an export (deep link + payload) and no results', async () => {
    const resp = await createPortalAdapter(carrier).quote(request);

    expect(resp.results).toHaveLength(0);
    expect(resp.export).toBeDefined();
    expect(resp.export?.method).toBe('deep_link');
    expect(resp.export?.deepLink).toContain(`shop=${request.shopId}`);
    expect(resp.export?.payload?.insured).toBe(request.input.insured.name);
  });
});
