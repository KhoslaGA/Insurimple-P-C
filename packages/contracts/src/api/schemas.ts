/**
 * Response shapes for the Insurimple-ARS backend read endpoints. The backend stores
 * money as integer-cent columns and dates as ISO datetime strings; these schemas match
 * the wire format, and the client (client.ts) maps them to the canonical contracts types
 * (cents → Money, ISO → date).
 */
import { z } from 'zod';
import { NamedInsuredSchema, RiskSchema } from '../risk';
import { QuoteOutcomeSchema, QuoteProvenanceSchema, QuoteSourceSchema } from '../quote';

export const ApiHouseholdSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  code: z.string(),
  displayName: z.string(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  primaryContact: NamedInsuredSchema,
});
export type ApiHousehold = z.infer<typeof ApiHouseholdSchema>;

export const ApiPolicySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  householdId: z.string(),
  policyNumber: z.string(),
  line: z.enum(['auto', 'property']),
  carrier: z.string(),
  status: z.string(),
  effectiveDate: z.string(),
  expiresOn: z.string(),
  risk: RiskSchema,
});
export type ApiPolicy = z.infer<typeof ApiPolicySchema>;

export const ApiRenewalSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  policyRef: z.string(),
  householdId: z.string(),
  line: z.enum(['auto', 'property']),
  expiringPremiumCents: z.number().int(),
  effectiveDate: z.string(),
  status: z.enum(['due', 'shopping', 'completed']),
  shopId: z.string().nullable().optional(),
  outcome: z.unknown().nullable().optional(),
});
export type ApiRenewal = z.infer<typeof ApiRenewalSchema>;

export const ApiQuoteResultSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  shopId: z.string(),
  carrierId: z.string(),
  carrierName: z.string(),
  source: QuoteSourceSchema,
  outcome: QuoteOutcomeSchema,
  provenance: QuoteProvenanceSchema,
  premiumCents: z.number().int().nullable().optional(),
  coverageVariant: z.string().nullable().optional(),
  declineReason: z.string().nullable().optional(),
  respondedAt: z.string(),
  presentedToClient: z.boolean(),
  simulated: z.boolean(),
});
export type ApiQuoteResult = z.infer<typeof ApiQuoteResultSchema>;
