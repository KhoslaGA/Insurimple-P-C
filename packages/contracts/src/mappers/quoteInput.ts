/**
 * Canonical risk → normalized quote input.
 *
 * This is the line-agnostic shape a quote shop hands to every CarrierAdapter
 * (manual, portal, rater, or API — TR.4). Building it from the risk here means
 * the risk is captured once and reused for every carrier and every remarket,
 * never re-keyed. `toQuoteInput` takes only a risk version.
 *
 * Note: this is quote INPUT only. It carries no premium, no bind affordance,
 * and no indicative/firm flag — those belong to quote *results* (TR.3).
 */
import { z } from 'zod';
import {
  AddressSchema,
  AutoHistorySchema,
  AutoPolicyCoveragesSchema,
  ConstructionSchema,
  DriverSchema,
  DwellingTypeSchema,
  HabitationalCoveragesSchema,
  OccupancySchema,
  ProtectionSchema,
  ProvinceSchema,
  type Risk,
  type RiskVersion,
  ValuationSchema,
  VehicleSchema,
} from '../risk';

export const QuoteInputSchema = z.object({
  riskRef: z.object({ riskId: z.string().min(1), version: z.number().int().positive() }),
  line: z.enum(['auto', 'property']),
  effectiveDate: z.string().date(),
  province: ProvinceSchema,
  insured: z.object({
    name: z.string().min(1),
    mailingAddress: AddressSchema,
  }),
  auto: z
    .object({
      drivers: z.array(DriverSchema),
      vehicles: z.array(VehicleSchema),
      coverages: AutoPolicyCoveragesSchema,
      history: AutoHistorySchema,
    })
    .optional(),
  property: z
    .object({
      riskAddress: AddressSchema,
      dwellingType: DwellingTypeSchema,
      occupancy: OccupancySchema,
      construction: ConstructionSchema,
      protection: ProtectionSchema,
      coverages: HabitationalCoveragesSchema,
      valuation: ValuationSchema.optional(),
    })
    .optional(),
});
export type QuoteInput = z.infer<typeof QuoteInputSchema>;

export function toQuoteInput(version: RiskVersion<Risk>): QuoteInput {
  const risk = version.payload;
  const base = {
    riskRef: { riskId: version.riskId, version: version.version },
    line: risk.line,
    effectiveDate: risk.effectiveDate,
    province: risk.province,
    insured: {
      name: `${risk.namedInsured.firstName} ${risk.namedInsured.lastName}`,
      mailingAddress: risk.namedInsured.mailingAddress,
    },
  } as const;

  if (risk.line === 'auto') {
    return {
      ...base,
      auto: {
        drivers: risk.drivers,
        vehicles: risk.vehicles,
        coverages: risk.coverages,
        history: risk.history,
      },
    };
  }

  return {
    ...base,
    property: {
      riskAddress: risk.riskAddress,
      dwellingType: risk.dwellingType,
      occupancy: risk.occupancy,
      construction: risk.construction,
      protection: risk.protection,
      coverages: risk.coverages,
      valuation: risk.valuation,
    },
  };
}
