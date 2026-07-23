/**
 * Canonical AUTO risk — shaped to Ontario's OAF 1 (Application for Automobile
 * Insurance) so the same captured object drives both a quote and an OAF 1
 * application with no re-entry.
 *
 * Post-2026 SABS reform: several Statutory Accident Benefits became optional
 * elections. Each optional benefit is captured as an explicit election —
 * recorded whether elected or declined.
 */
import { z } from 'zod';
import {
  AddressSchema,
  CoverageLimitSchema,
  DeductibleSchema,
  EndorsementSchema,
  NamedInsuredSchema,
  PartyRefSchema,
  ProvinceSchema,
} from './common';

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------

/** Ontario licence classes (the common personal-lines subset). */
export const LicenceClassSchema = z.enum(['G', 'G1', 'G2', 'M', 'M1', 'M2', 'other']);

export const ConvictionSchema = z.object({
  date: z.string().date(),
  severity: z.enum(['minor', 'major', 'serious', 'criminal']),
  description: z.string().optional(),
});
export type Conviction = z.infer<typeof ConvictionSchema>;

export const DriverSchema = z.object({
  id: z.string().min(1), // stable within the risk; vehicles reference it
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().date(),
  gender: z.enum(['male', 'female', 'x', 'undisclosed']).optional(),
  maritalStatus: z
    .enum(['single', 'married', 'common_law', 'divorced', 'widowed', 'separated'])
    .optional(),
  relationshipToApplicant: z.enum(['applicant', 'spouse', 'child', 'other']).default('applicant'),
  licence: z.object({
    number: z.string().min(1),
    province: ProvinceSchema,
    class: LicenceClassSchema,
    dateFirstLicensed: z.string().date(), // drives "years licensed" rating
  }),
  driverTrainingCertified: z.boolean().default(false),
  convictions: z.array(ConvictionSchema).default([]),
});
export type Driver = z.infer<typeof DriverSchema>;

// ---------------------------------------------------------------------------
// Vehicles + physical damage
// ---------------------------------------------------------------------------

export const PhysicalDamageCoverageSchema = z.object({
  elected: z.boolean(),
  deductible: DeductibleSchema.optional(),
});

export const VehicleSchema = z.object({
  id: z.string().min(1),
  year: z.number().int().gte(1900),
  make: z.string().min(1),
  model: z.string().min(1),
  vin: z.string().min(1),
  primaryDriverId: z.string().min(1), // references Driver.id
  use: z.enum(['pleasure', 'commute', 'business', 'farm']),
  annualKm: z.number().int().nonnegative().optional(),
  commuteOneWayKm: z.number().int().nonnegative().optional(),
  ownership: z.enum(['owned', 'financed', 'leased']).default('owned'),
  physicalDamage: z.object({
    collision: PhysicalDamageCoverageSchema.optional(),
    comprehensive: PhysicalDamageCoverageSchema.optional(),
    allPerils: PhysicalDamageCoverageSchema.optional(),
    specifiedPerils: PhysicalDamageCoverageSchema.optional(),
  }),
  /** Vehicle-level OPCF endorsements (e.g. OPCF 20, 43). Declined items stay on file. */
  endorsements: z.array(EndorsementSchema).default([]),
});
export type Vehicle = z.infer<typeof VehicleSchema>;

// ---------------------------------------------------------------------------
// Policy-level coverages (incl. post-2026 SABS elections)
// ---------------------------------------------------------------------------

/** SABS optional benefits that became elective under the post-2026 Ontario reform. */
export const SabsOptionalBenefitSchema = z.enum([
  'increased_medical_rehab',
  'increased_attendant_care',
  'caregiver',
  'housekeeping_and_home_maintenance',
  'dependant_care',
  'indexation',
  'income_replacement_topup',
  'death_and_funeral',
]);
export type SabsOptionalBenefit = z.infer<typeof SabsOptionalBenefitSchema>;

export const SabsElectionSchema = z.object({
  benefit: SabsOptionalBenefitSchema,
  elected: z.boolean(),
  limit: CoverageLimitSchema.optional(),
});
export type SabsElection = z.infer<typeof SabsElectionSchema>;

export const AccidentBenefitsSchema = z.object({
  package: z.literal('sabs_standard').default('sabs_standard'),
  /** One entry per optional benefit — elected or explicitly declined, both recorded. */
  optionalElections: z.array(SabsElectionSchema).default([]),
});
export type AccidentBenefits = z.infer<typeof AccidentBenefitsSchema>;

export const AutoPolicyCoveragesSchema = z.object({
  /** Third-party liability (bodily injury + property damage) combined limit. */
  liabilityLimit: CoverageLimitSchema,
  accidentBenefits: AccidentBenefitsSchema,
  /** Direct Compensation – Property Damage (mandatory in ON). */
  directCompensationPropertyDamage: CoverageLimitSchema,
  uninsuredAutomobile: CoverageLimitSchema,
  /** Policy-level OPCF endorsements (e.g. OPCF 44 Family Protection). */
  endorsements: z.array(EndorsementSchema).default([]),
});
export type AutoPolicyCoverages = z.infer<typeof AutoPolicyCoveragesSchema>;

// ---------------------------------------------------------------------------
// Prior insurance / history
// ---------------------------------------------------------------------------

export const AutoHistorySchema = z.object({
  priorInsurer: z.string().optional(),
  priorPolicyNumber: z.string().optional(),
  continuousYearsInsured: z.number().nonnegative().optional(),
  cancellations: z
    .array(
      z.object({
        date: z.string().date(),
        reason: z.enum(['non_payment', 'material_change', 'other']),
      }),
    )
    .default([]),
  atFaultClaims: z
    .array(
      z.object({
        date: z.string().date(),
        atFaultPercent: z.number().min(0).max(100).optional(),
        description: z.string().optional(),
      }),
    )
    .default([]),
});
export type AutoHistory = z.infer<typeof AutoHistorySchema>;

// ---------------------------------------------------------------------------
// The auto risk
// ---------------------------------------------------------------------------

export const AutoRiskSchema = z.object({
  line: z.literal('auto'),
  party: PartyRefSchema,
  effectiveDate: z.string().date(),
  province: ProvinceSchema.default('ON'),
  namedInsured: NamedInsuredSchema,
  drivers: z.array(DriverSchema).min(1),
  vehicles: z.array(VehicleSchema).min(1),
  coverages: AutoPolicyCoveragesSchema,
  history: AutoHistorySchema.default({}),
});
export type AutoRisk = z.infer<typeof AutoRiskSchema>;
