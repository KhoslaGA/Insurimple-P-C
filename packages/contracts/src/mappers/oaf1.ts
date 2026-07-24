/**
 * Canonical AUTO risk → OAF 1 (Ontario Application for Automobile Insurance).
 *
 * `toOaf1Application` takes ONLY a risk version — no other input — so a risk
 * captured once populates the OAF 1 application with zero re-entry, by
 * construction. The output carries `riskRef` back to the exact version it came
 * from (provenance for the file).
 */
import { z } from 'zod';
import {
  AddressSchema,
  AutoHistorySchema,
  AutoPolicyCoveragesSchema,
  type AutoRisk,
  DriverSchema,
  RiskRefSchema,
  riskRefOf,
  type RiskVersion,
  VehicleSchema,
} from '../risk';

export const Oaf1ApplicationSchema = z.object({
  formType: z.literal('OAF1'),
  province: z.literal('ON'),
  riskRef: RiskRefSchema,
  effectiveDate: z.string().date(),
  applicant: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dateOfBirth: z.string().date().optional(),
    address: AddressSchema,
  }),
  // OAF 1 section: "Listed drivers" — carried through from the risk unchanged.
  listedDrivers: z.array(DriverSchema),
  // OAF 1 section: "Described automobiles".
  describedAutomobiles: z.array(VehicleSchema),
  // OAF 1 coverage sections, incl. post-2026 SABS optional elections.
  coverages: AutoPolicyCoveragesSchema,
  // OAF 1 "Previous insurance / history".
  previousInsurance: AutoHistorySchema,
});
export type Oaf1Application = z.infer<typeof Oaf1ApplicationSchema>;

export function toOaf1Application(version: RiskVersion<AutoRisk>): Oaf1Application {
  const risk = version.payload;
  return {
    formType: 'OAF1',
    province: 'ON', // OAF 1 is the Ontario form; auto is Ontario-first per the module brief.
    riskRef: riskRefOf(version),
    effectiveDate: risk.effectiveDate,
    applicant: {
      firstName: risk.namedInsured.firstName,
      lastName: risk.namedInsured.lastName,
      dateOfBirth: risk.namedInsured.dateOfBirth,
      address: risk.namedInsured.mailingAddress,
    },
    listedDrivers: risk.drivers,
    describedAutomobiles: risk.vehicles,
    coverages: risk.coverages,
    previousInsurance: risk.history,
  };
}
