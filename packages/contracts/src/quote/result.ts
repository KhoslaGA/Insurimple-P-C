/**
 * quote_results (TR.3) — one carrier's response within a shop.
 *
 * Two flags carry the compliance weight:
 *  - `provenance` (indicative | firm): a first-class DATA flag, never a UI label
 *    (kickoff rule #1). `firm` means the carrier returned this for THIS exact risk;
 *    anything else is `indicative` and can never be presented as bindable. A wrong
 *    number shown as firm is an E&O event, so the distinction lives in the data.
 *  - `source` (portal | rater | manual | api): which CarrierAdapter produced it.
 *    Manual entry is a first-class source, not a fallback (TR.4 formalizes adapters).
 *
 * Cross-field compliance (a quoted result has a premium; a declined/referral one
 * has a reason and no premium) is enforced structurally at parse time, not by UI.
 */
import { z } from 'zod';
import { MoneySchema } from '../risk';

/** The CarrierAdapter source that produced this result. */
export const QuoteSourceSchema = z.enum(['portal', 'rater', 'manual', 'api']);
export type QuoteSource = z.infer<typeof QuoteSourceSchema>;

/** Whether the carrier returned this for the exact risk (firm) or it is estimated (indicative). */
export const QuoteProvenanceSchema = z.enum(['indicative', 'firm']);
export type QuoteProvenance = z.infer<typeof QuoteProvenanceSchema>;

export const QuoteOutcomeSchema = z.enum(['quoted', 'referral', 'declined']);
export type QuoteOutcome = z.infer<typeof QuoteOutcomeSchema>;

export const CarrierRefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});
export type CarrierRef = z.infer<typeof CarrierRefSchema>;

export const QuoteResultSchema = z
  .object({
    id: z.string().min(1),
    shopId: z.string().min(1),
    tenantId: z.string().min(1),
    carrier: CarrierRefSchema,
    source: QuoteSourceSchema,
    outcome: QuoteOutcomeSchema,
    provenance: QuoteProvenanceSchema,
    premium: MoneySchema.optional(), // present iff quoted
    coverageVariant: z.string().optional(),
    declineReason: z.string().optional(), // present iff referral/declined
    notes: z.string().optional(),
    respondedAt: z.string().datetime(),
    presentedToClient: z.boolean().default(false),
  })
  .superRefine((r, ctx) => {
    if (r.outcome === 'quoted' && !r.premium) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['premium'],
        message: 'A quoted result must carry a premium.',
      });
    }
    if (r.outcome !== 'quoted' && r.premium) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['premium'],
        message: 'A declined or referral result must not carry a premium.',
      });
    }
    if (r.outcome !== 'quoted' && !r.declineReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['declineReason'],
        message: 'A declined or referral result must document a reason.',
      });
    }
  });
export type QuoteResult = z.infer<typeof QuoteResultSchema>;

/**
 * Whether a result may be shown to a client as a firm, quotable number. Only a
 * carrier-returned firm quote qualifies; indicative numbers never do. This governs
 * PRESENTATION only — binding does not exist anywhere in the module.
 */
export function isPresentableAsFirm(result: QuoteResult): boolean {
  return result.provenance === 'firm' && result.outcome === 'quoted';
}
