/**
 * TR.4 — the stub adapter can never pass as live carrier data (CLAUDE.md #7), and is
 * deterministic (same input → same premium).
 */
import { describe, it, expect } from 'vitest';
import { createStubApiAdapter, isPresentableAsFirm } from '../src';
import { autoQuoteRequestFixture } from './fixtures';

const carrier = { id: 'STUB', name: 'Stub Carrier' };

describe('stub adapter honesty', () => {
  const request = autoQuoteRequestFixture();

  it('stub results are simulated + indicative, and not presentable as firm', async () => {
    const resp = await createStubApiAdapter(carrier).quote(request);
    const r = resp.results[0];
    expect(r?.simulated).toBe(true);
    expect(r?.provenance).toBe('indicative');
    expect(isPresentableAsFirm(r!)).toBe(false);
  });

  it('is deterministic — same input yields the same premium', async () => {
    const a = (await createStubApiAdapter(carrier).quote(request)).results[0];
    const b = (await createStubApiAdapter(carrier).quote(request)).results[0];
    expect(a?.premium).toEqual(b?.premium);
  });

  it('honours a deterministic decline predicate', async () => {
    const resp = await createStubApiAdapter(carrier, { declineIf: () => true }).quote(request);
    const r = resp.results[0];
    expect(r?.outcome).toBe('declined');
    expect(r?.premium).toBeUndefined();
    expect((r?.declineReason ?? '').length).toBeGreaterThan(0);
  });
});
