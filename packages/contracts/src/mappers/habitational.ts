/**
 * Canonical PROPERTY risk → habitational application.
 *
 * Like the OAF 1 mapper, `toHabitationalApplication` takes ONLY a risk version,
 * so the same captured risk populates a habitational application without
 * re-entry. Output carries `riskRef` provenance.
 */
import { z } from 'zod';
import {
  AdditionalInterestSchema,
  AddressSchema,
  CondoCoverageSchema,
  ConstructionSchema,
  DwellingTypeSchema,
  HabitationalCoveragesSchema,
  OccupancySchema,
  type PropertyRisk,
  ProtectionSchema,
  ProvinceSchema,
  type RiskVersion,
  ValuationSchema,
} from '../risk';

export const HabitationalApplicationSchema = z.object({
  formType: z.literal('HABITATIONAL'),
  province: ProvinceSchema,
  riskRef: z.object({ riskId: z.string().min(1), version: z.number().int().positive() }),
  effectiveDate: z.string().date(),
  applicant: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dateOfBirth: z.string().date().optional(),
    mailingAddress: AddressSchema,
  }),
  riskLocation: AddressSchema,
  dwellingType: DwellingTypeSchema,
  occupancy: OccupancySchema,
  construction: ConstructionSchema,
  protection: ProtectionSchema,
  coverages: HabitationalCoveragesSchema,
  additionalInterests: z.array(AdditionalInterestSchema),
  valuation: ValuationSchema.optional(),
  condoCoverage: CondoCoverageSchema.optional(),
});
export type HabitationalApplication = z.infer<typeof HabitationalApplicationSchema>;

export function toHabitationalApplication(
  version: RiskVersion<PropertyRisk>,
): HabitationalApplication {
  const risk = version.payload;
  return {
    formType: 'HABITATIONAL',
    province: risk.province,
    riskRef: { riskId: version.riskId, version: version.version },
    effectiveDate: risk.effectiveDate,
    applicant: {
      firstName: risk.namedInsured.firstName,
      lastName: risk.namedInsured.lastName,
      dateOfBirth: risk.namedInsured.dateOfBirth,
      mailingAddress: risk.namedInsured.mailingAddress,
    },
    riskLocation: risk.riskAddress,
    dwellingType: risk.dwellingType,
    occupancy: risk.occupancy,
    construction: risk.construction,
    protection: risk.protection,
    coverages: risk.coverages,
    additionalInterests: risk.interests,
    valuation: risk.valuation,
    condoCoverage: risk.condoCoverage,
  };
}
