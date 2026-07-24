/**
 * @insurimple/contracts — the single source of shared types + zod schemas.
 *
 * TR.1 lands the canonical risk model and its mappers; TR.3 adds the quote shop
 * & results dataset; TR.4 adds the CarrierAdapter seam + adapters. This package is
 * headless and carries NO binding capability: no bind/issue functions, no
 * bound-policy identifiers — quoting never crosses into binding (module invariant).
 */
export * from './risk';
export * from './mappers';
export * from './quote';
export * from './adapters';
export * from './renewal';
