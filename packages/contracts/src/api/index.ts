/**
 * Typed API client (Phase 2) — the seam apps/bms swaps its mock spine for. The
 * wire schemas match the backend's flat-cents / ISO-string columns; the client
 * maps them to the canonical contracts types and re-validates the invariants.
 */
export * from './schemas';
export * from './client';
