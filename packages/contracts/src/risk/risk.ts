/**
 * The canonical Risk (auto | property) and its immutable versioning.
 *
 * One risk, captured once, is reused by quoting, application, and endorsement
 * (never re-keyed per carrier). Every material change produces a new frozen
 * version; the prior version is never mutated. `createdAt` is caller-supplied —
 * the domain reads no clock, so versioning is deterministic and replayable.
 */
import { z } from 'zod';
import { deepFreeze, type RiskVersion } from './common';
import { AutoRiskSchema } from './auto';
import { PropertyRiskSchema } from './property';

export const RiskSchema = z.discriminatedUnion('line', [AutoRiskSchema, PropertyRiskSchema]);
export type Risk = z.infer<typeof RiskSchema>;

/** Validate a payload as a canonical Risk, applying schema defaults. */
export function parseRisk(input: unknown): Risk {
  return RiskSchema.parse(input);
}

function freezeVersion<T>(v: RiskVersion<T>): RiskVersion<T> {
  return deepFreeze({ ...v }) as RiskVersion<T>;
}

/**
 * Create version 1 of a risk. The payload is validated (structural compliance)
 * and the returned envelope is deep-frozen.
 */
export function createRiskVersion<T extends Risk>(
  riskId: string,
  payload: T,
  createdAt: string,
): RiskVersion<T> {
  const validated = RiskSchema.parse(payload) as T;
  return freezeVersion({
    riskId,
    version: 1,
    createdAt,
    supersedesVersion: null,
    payload: validated,
  });
}

/**
 * Revise a risk. Returns a NEW frozen version (version + 1, `supersedesVersion`
 * pointing at the prior one). The previous version object is left untouched.
 */
export function reviseRisk<T extends Risk>(
  previous: RiskVersion<T>,
  next: T,
  createdAt: string,
): RiskVersion<T> {
  const validated = RiskSchema.parse(next) as T;
  return freezeVersion({
    riskId: previous.riskId,
    version: previous.version + 1,
    createdAt,
    supersedesVersion: previous.version,
    payload: validated,
  });
}
