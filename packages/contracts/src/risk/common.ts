/**
 * Shared value types for the canonical risk model (TR.1).
 *
 * Everything here is headless, deterministic, and free of any binding
 * capability. Monetary amounts are integer cents so that re-rating a stored
 * risk is bit-for-bit reproducible (no float drift) — the same discipline
 * TR.7 will need for replayable rating.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Geography
// ---------------------------------------------------------------------------

/** Canadian provinces + territories. OAF 1 is Ontario, but the spine is national. */
export const ProvinceSchema = z.enum([
  'ON', 'QC', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'NT', 'NU', 'YT',
]);
export type Province = z.infer<typeof ProvinceSchema>;

/** Canadian postal code, e.g. "M5V 2T6" (space optional). */
export const PostalCodeSchema = z
  .string()
  .regex(
    /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ] ?\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i,
    "That postal code doesn't look right. Check the format — like M5V 2T6.",
  );

export const AddressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  province: ProvinceSchema,
  postalCode: PostalCodeSchema,
});
export type Address = z.infer<typeof AddressSchema>;

// ---------------------------------------------------------------------------
// Money, limits, deductibles
// ---------------------------------------------------------------------------

/** Money as integer cents. `cad(684_000)` → $684,000.00. */
export const MoneySchema = z.object({
  currency: z.literal('CAD').default('CAD'),
  amountCents: z.number().int().nonnegative(),
});
export type Money = z.infer<typeof MoneySchema>;

/** Convenience constructor for whole-dollar amounts. */
export function cad(dollars: number): Money {
  return { currency: 'CAD', amountCents: Math.round(dollars * 100) };
}

/**
 * A coverage limit election. `declined` is a first-class value, not an
 * absence — an offered coverage the client turned down is still documented
 * (mirrors the prototype's "offered items documented even when declined").
 */
export const CoverageLimitSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('amount'), value: MoneySchema }),
  z.object({ kind: z.literal('unlimited') }),
  z.object({ kind: z.literal('included') }),
  z.object({ kind: z.literal('declined') }),
]);
export type CoverageLimit = z.infer<typeof CoverageLimitSchema>;

export const DeductibleSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('amount'), value: MoneySchema }),
  z.object({ kind: z.literal('none') }),
  z.object({ kind: z.literal('waived') }),
]);
export type Deductible = z.infer<typeof DeductibleSchema>;

/**
 * An endorsement / coverage rider election. `elected: false` records that the
 * item was offered and declined — kept on the file, not dropped.
 */
export const EndorsementSchema = z.object({
  code: z.string().min(1), // e.g. "OPCF 20", "OPCF 43", or a habitational rider code
  name: z.string().min(1),
  elected: z.boolean(),
  limit: CoverageLimitSchema.optional(),
  note: z.string().optional(),
});
export type Endorsement = z.infer<typeof EndorsementSchema>;

// ---------------------------------------------------------------------------
// Party spine + named insured
// ---------------------------------------------------------------------------

/**
 * A reference into the party spine (household / client). The risk points at the
 * spine — it never re-keys client identity. Persistence of the spine itself is
 * out of scope for TR.1.
 */
export const PartyRefSchema = z.object({
  householdId: z.string().min(1),
  clientId: z.string().min(1).optional(),
});
export type PartyRef = z.infer<typeof PartyRefSchema>;

export const NamedInsuredSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().date().optional(),
  mailingAddress: AddressSchema,
});
export type NamedInsured = z.infer<typeof NamedInsuredSchema>;

// ---------------------------------------------------------------------------
// Immutable version envelope
// ---------------------------------------------------------------------------

/**
 * The immutable wrapper around a captured risk. Every material change produces
 * a NEW version (TR.1 acceptance: "risk versions on change"); prior versions are
 * frozen and never mutated. `createdAt` is injected by the caller — the domain
 * never reads a clock, so versioning stays deterministic and replayable.
 */
export interface RiskVersion<T> {
  readonly riskId: string;
  readonly version: number; // 1-based
  readonly createdAt: string; // ISO 8601, caller-supplied
  readonly supersedesVersion: number | null;
  readonly payload: T;
}

/** Runtime schema for a RiskVersion around a given payload schema. */
export function riskVersionSchema<T extends z.ZodTypeAny>(payload: T) {
  return z.object({
    riskId: z.string().min(1),
    version: z.number().int().positive(),
    createdAt: z.string().datetime(),
    supersedesVersion: z.number().int().positive().nullable(),
    payload,
  });
}

/** Recursively freeze a value so a captured version can never be mutated in place. */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value as Record<string, unknown>)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }
  return value;
}
