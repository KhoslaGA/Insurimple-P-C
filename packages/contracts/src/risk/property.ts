/**
 * Canonical PROPERTY risk — shaped to a habitational application. Construction,
 * protection, and coverage vocabularies mirror the Property-Lines prototype
 * (dwelling / tenant-condo / interests / coverage & endorsements), so the same
 * captured object drives both a quote and a habitational application.
 *
 * ITV (rebuild valuation) is a bought data product, not built here — the
 * evaluator's figures are carried under `valuation`, flagged as evaluator-sourced.
 */
import { z } from 'zod';
import {
  AddressSchema,
  CoverageLimitSchema,
  DeductibleSchema,
  EndorsementSchema,
  MoneySchema,
  NamedInsuredSchema,
  PartyRefSchema,
  ProvinceSchema,
} from './common';

// ---------------------------------------------------------------------------
// Dwelling classification
// ---------------------------------------------------------------------------

export const DwellingTypeSchema = z.enum([
  'detached',
  'semi_detached',
  'townhouse',
  'apartment_unit',
  'rented_house',
  'condo_unit_owned',
  'basement_apartment',
  'seasonal',
]);
export type DwellingType = z.infer<typeof DwellingTypeSchema>;

export const OccupancySchema = z.enum([
  'owner_occupied',
  'tenant_occupied',
  'rented_to_others',
  'seasonal',
  'vacant',
]);
export type Occupancy = z.infer<typeof OccupancySchema>;

// ---------------------------------------------------------------------------
// Construction (enums mirror the Property-Lines prototype)
// ---------------------------------------------------------------------------

export const WallConstructionSchema = z.enum(['brick_veneer', 'frame', 'solid_brick', 'stone']);
export const RoofSchema = z.enum(['asphalt_shingle', 'metal', 'tile', 'flat_membrane']);
export const HeatingSchema = z.enum([
  'forced_air_gas',
  'electric_baseboard',
  'heat_pump',
  'oil',
  'wood_stove',
]);
export const ElectricalSchema = z.enum(['breakers_200_amp', 'breakers_100_amp', 'fuses']);
export const PlumbingSchema = z.enum(['copper_pex', 'kitec', 'galvanized']);
export const BasementSchema = z.enum(['finished', 'partially_finished', 'unfinished', 'none_slab']);

export const ConstructionSchema = z.object({
  yearBuilt: z.number().int().gte(1800),
  storeys: z.number().positive().optional(),
  squareFeet: z.number().int().positive().optional(),
  wall: WallConstructionSchema,
  roof: RoofSchema,
  roofUpdatedYear: z.number().int().optional(),
  heating: HeatingSchema,
  auxiliaryHeating: HeatingSchema.optional(),
  electrical: ElectricalSchema,
  plumbing: PlumbingSchema, // 'kitec' is an underwriting flag
  basement: BasementSchema,
});
export type Construction = z.infer<typeof ConstructionSchema>;

// ---------------------------------------------------------------------------
// Protection
// ---------------------------------------------------------------------------

export const HydrantDistanceSchema = z.enum(['within_300m', '300m_to_1km', 'over_1km']);
export const FireHallDistanceSchema = z.enum(['within_5km', '5km_to_8km', 'over_8km']);
export const AlarmSchema = z.enum(['fire_and_burglary', 'fire_only', 'local_only', 'none']);

export const ProtectionSchema = z.object({
  hydrantDistance: HydrantDistanceSchema,
  fireHallDistance: FireHallDistanceSchema,
  alarm: AlarmSchema,
  monitored: z.boolean().default(false),
});
export type Protection = z.infer<typeof ProtectionSchema>;

// ---------------------------------------------------------------------------
// Coverages A–F + valuation + interests
// ---------------------------------------------------------------------------

export const HabitationalCoveragesSchema = z.object({
  dwellingA: CoverageLimitSchema, // Coverage A — dwelling
  detachedStructuresB: CoverageLimitSchema, // Coverage B
  contentsC: CoverageLimitSchema, // Coverage C — personal property
  additionalLivingD: CoverageLimitSchema, // Coverage D — additional living expense
  personalLiabilityE: CoverageLimitSchema, // Coverage E
  voluntaryMedicalF: CoverageLimitSchema, // Coverage F
  deductible: DeductibleSchema,
  waterDeductible: DeductibleSchema.optional(),
  /** Offered items are documented even when declined. */
  endorsements: z.array(EndorsementSchema).default([]),
});
export type HabitationalCoverages = z.infer<typeof HabitationalCoveragesSchema>;

/** ITV rebuild valuation — a bought data product; figures carried, not computed here. */
export const ValuationSchema = z.object({
  source: z.literal('evaluator'),
  evaluatedAt: z.string().date(),
  rebuildCostA: MoneySchema,
  detachedStructuresPct: z.number().nonnegative().optional(),
  contentsPct: z.number().nonnegative().optional(),
  additionalLivingPct: z.number().nonnegative().optional(),
});
export type Valuation = z.infer<typeof ValuationSchema>;

export const InterestTypeSchema = z.enum([
  'mortgagee',
  'lienholder',
  'landlord',
  'loss_payee',
  'additional_insured',
]);

export const AdditionalInterestSchema = z.object({
  id: z.string().min(1),
  type: InterestTypeSchema,
  name: z.string().min(1),
  address: AddressSchema.optional(),
  reference: z.string().optional(),
});
export type AdditionalInterest = z.infer<typeof AdditionalInterestSchema>;

/** Condo-unit-specific coverages — only meaningful when dwellingType is a condo unit. */
export const CondoCoverageSchema = z.object({
  lossAssessment: CoverageLimitSchema.optional(),
  unitImprovements: CoverageLimitSchema.optional(),
});
export type CondoCoverage = z.infer<typeof CondoCoverageSchema>;

// ---------------------------------------------------------------------------
// The property risk
// ---------------------------------------------------------------------------

export const PropertyRiskSchema = z.object({
  line: z.literal('property'),
  party: PartyRefSchema,
  effectiveDate: z.string().date(),
  province: ProvinceSchema,
  namedInsured: NamedInsuredSchema,
  riskAddress: AddressSchema, // the insured location (may differ from mailing address)
  dwellingType: DwellingTypeSchema,
  occupancy: OccupancySchema,
  construction: ConstructionSchema,
  protection: ProtectionSchema,
  coverages: HabitationalCoveragesSchema,
  interests: z.array(AdditionalInterestSchema).default([]),
  valuation: ValuationSchema.optional(),
  condoCoverage: CondoCoverageSchema.optional(),
});
export type PropertyRisk = z.infer<typeof PropertyRiskSchema>;
