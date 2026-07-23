/**
 * @insurimple/contracts — the single source of shared types + zod schemas.
 *
 * TR.1 lands the canonical risk model and its mappers here. This package is
 * headless and carries NO binding capability: no bind/issue functions, no
 * bound-policy identifiers — quoting never crosses into binding (module
 * invariant). Later tickets add quote_shop / quote_results (TR.3), the
 * CarrierAdapter contract (TR.4), and so on.
 */
export * from './risk';
export * from './mappers';
