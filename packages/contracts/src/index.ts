import { z } from 'zod';

/* ============================================================
   @insurimple/contracts — the single source of shared types.
   New shared types land HERE first (CLAUDE.md §6). Both the API
   and the web app import from this package; neither redefines shapes.
   These mirror the validated PostgreSQL schema (packages/db).
   ============================================================ */

/** Transaction lifecycle — must match the DB state-machine guard (0005_transactions.sql). */
export const txnState = z.enum([
  'draft',
  'doc_generated',
  'sig_pending',
  'signed',
  'submitted',
  'carrier_ack',
  'completed',
  'rejected',
]);
export type TxnState = z.infer<typeof txnState>;

/** Transaction types — the spine's configurable actions across modules. */
export const txnType = z.enum([
  'new_business',
  'renewal',
  'endorsement',
  'cancellation',
  'reinstatement',
  'remarket',
  'claim_fnol',
]);
export type TxnType = z.infer<typeof txnType>;

/** Lines of business (P&C module). */
export const line = z.enum([
  'auto',
  'property',
  'tenant',
  'condo',
  'umbrella',
  'commercial',
  'life',
]);
export type Line = z.infer<typeof line>;

/** The only legal state transitions. Mirrors the DB trigger; used for optimistic UI. */
export const TXN_TRANSITIONS: ReadonlyArray<readonly [TxnState, TxnState]> = [
  ['draft', 'doc_generated'],
  ['doc_generated', 'sig_pending'],
  ['sig_pending', 'signed'],
  ['signed', 'submitted'],
  ['submitted', 'carrier_ack'],
  ['carrier_ack', 'completed'],
  ['submitted', 'rejected'],
  ['carrier_ack', 'rejected'],
  ['rejected', 'draft'],
];

export function canTransition(from: TxnState, to: TxnState): boolean {
  return TXN_TRANSITIONS.some(([a, b]) => a === from && b === to);
}

/* ---- API DTOs ---- */

export const openTxnDto = z.object({
  txnType,
  accountId: z.string().uuid(),
  policyId: z.string().uuid().optional(),
  carrierId: z.string().uuid().optional(),
  reason: z.string().max(500).optional(),
  effectiveDate: z.string().optional(),
  reference: z.string().max(40).optional(),
});
export type OpenTxnDto = z.infer<typeof openTxnDto>;

export const txnSummary = z.object({
  id: z.string().uuid(),
  reference: z.string().nullable(),
  txn_type: txnType,
  state: txnState,
  reason: z.string().nullable(),
  effective_date: z.string().nullable(),
  opened_at: z.string(),
  closed_at: z.string().nullable(),
  account_name: z.string().optional(),
  carrier_name: z.string().nullable().optional(),
});
export type TxnSummary = z.infer<typeof txnSummary>;

export const txnEvent = z.object({
  from_state: txnState.nullable(),
  to_state: txnState,
  actor: z.string(),
  at: z.string(),
});
export type TxnEvent = z.infer<typeof txnEvent>;

export const accountSummary = z.object({
  id: z.string().uuid(),
  lookup_code: z.string().nullable(),
  display_name: z.string(),
  kind: z.enum(['personal', 'commercial', 'benefits']),
  status: z.enum(['prospect', 'active', 'review', 'cancelling', 'lapsed', 'closed']),
  source: z.string().nullable(),
  policy_count: z.union([z.number(), z.string()]),
  annual_premium: z.union([z.number(), z.string()]),
});
export type AccountSummary = z.infer<typeof accountSummary>;
