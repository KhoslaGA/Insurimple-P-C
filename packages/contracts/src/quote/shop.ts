/**
 * quote_shop (TR.3) — a shopping event: one risk version shopped to N carriers.
 *
 * This is the sleeper asset. Every shop — which carriers were approached, what
 * each returned, what was presented, and what won and why — is Take-All-Comers
 * evidence and, in aggregate, a proprietary dataset. It costs a table, not a
 * rating engine.
 *
 * `tenantId` is first-class from row one (CLAUDE.md invariant #2). DB-level RLS
 * is deferred with persistence; until then reads are scoped in code (see tenant.ts).
 */
import { z } from 'zod';
import { RiskRefSchema } from '../risk';

export const ShopPurposeSchema = z.enum(['new_business', 'remarket', 'renewal_shop']);
export type ShopPurpose = z.infer<typeof ShopPurposeSchema>;

/** The chosen-carrier decision, with a documented reason (audited for the file). */
export const ShopSelectionSchema = z.object({
  resultId: z.string().min(1),
  reason: z.string().min(1),
  selectedAt: z.string().datetime(),
});
export type ShopSelection = z.infer<typeof ShopSelectionSchema>;

export const QuoteShopSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  riskRef: RiskRefSchema, // the exact risk version being shopped (TR.1)
  purpose: ShopPurposeSchema,
  requestedBy: z.string().min(1), // user id of the broker/CSR who opened the shop
  createdAt: z.string().datetime(),
  /** For remarket / renewal shops, the existing policy being reshopped (TR.6 links here). */
  policyRef: z.string().optional(),
  /** The chosen carrier + documented reason, once the shop is decided. */
  selection: ShopSelectionSchema.optional(),
});
export type QuoteShop = z.infer<typeof QuoteShopSchema>;
