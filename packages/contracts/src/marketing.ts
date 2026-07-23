import { z } from "zod";
import { ConsentChannel, ConsentClass } from "./spine";

/* ============================================================================
 * Marketing module entities. `message_class` is the load-bearing distinction
 * (design rule #2): a marketing CEM requires consent + sender id + unsubscribe;
 * a service message can never carry marketing content or campaign linkage.
 * ==========================================================================*/

export const MessageClass = z.enum(["service", "marketing"]);
export type MessageClass = z.infer<typeof MessageClass>;

export const Template = z.object({
  id: z.string(),
  tenantId: z.string(),
  channel: ConsentChannel,
  messageClass: MessageClass,
  name: z.string(),
  subject: z.string().nullable(),
  /** Marketing-class templates MUST carry an unsubscribe block. */
  hasUnsubscribeBlock: z.boolean(),
  updatedAt: z.string(),
});
export type Template = z.infer<typeof Template>;

/** Declarative segment definition over book data — recomputes on demand. */
export const SegmentDefinition = z.object({
  renewalWindowDays: z
    .object({ from: z.number(), to: z.number() })
    .nullable()
    .optional(),
  linesHeld: z.array(z.string()).optional(),
  linesNotHeld: z.array(z.string()).optional(),
  carrier: z.string().nullable().optional(),
  premiumBand: z
    .object({ min: z.number(), max: z.number() })
    .nullable()
    .optional(),
  minTenureMonths: z.number().nullable().optional(),
  /** Marketing segments auto-exclude no-consent / suppressed parties. */
  consentClasses: z.array(ConsentClass).optional(),
});
export type SegmentDefinition = z.infer<typeof SegmentDefinition>;

export const Segment = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  definition: SegmentDefinition,
  memberCount: z.number(),
  updatedAt: z.string(),
});
export type Segment = z.infer<typeof Segment>;

export const CampaignStatus = z.enum([
  "draft",
  "scheduled",
  "sending",
  "sent",
  "paused",
]);
export type CampaignStatus = z.infer<typeof CampaignStatus>;

export const SendStats = z.object({
  queued: z.number(),
  sent: z.number(),
  delivered: z.number(),
  bounced: z.number(),
  complained: z.number(),
  engaged: z.number(),
});
export type SendStats = z.infer<typeof SendStats>;

export const Campaign = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  channel: ConsentChannel,
  templateId: z.string(),
  segmentId: z.string(),
  status: CampaignStatus,
  scheduledAt: z.string().nullable(),
  stats: SendStats,
});
export type Campaign = z.infer<typeof Campaign>;

export const SequenceTrigger = z.enum([
  "new_client",
  "renewal_t45",
  "policy_added",
  "lead_intake",
]);
export type SequenceTrigger = z.infer<typeof SequenceTrigger>;

export const SequenceStatus = z.enum(["draft", "active", "paused"]);
export type SequenceStatus = z.infer<typeof SequenceStatus>;

export const Sequence = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  trigger: SequenceTrigger,
  status: SequenceStatus,
  stepCount: z.number(),
  enrolled: z.number(),
  active: z.number(),
  completed: z.number(),
  exited: z.number(),
});
export type Sequence = z.infer<typeof Sequence>;

export const SendStatus = z.enum([
  "queued",
  "sent",
  "delivered",
  "bounced",
  "complained",
]);
export type SendStatus = z.infer<typeof SendStatus>;

export const Send = z.object({
  id: z.string(),
  tenantId: z.string(),
  campaignId: z.string().nullable(),
  sequenceId: z.string().nullable(),
  partyId: z.string(),
  channel: ConsentChannel,
  messageClass: MessageClass,
  status: SendStatus,
  /** FK to the consent record that authorized this send (no consent, no row). */
  consentRecordId: z.string().nullable(),
  sentAt: z.string(),
});
export type Send = z.infer<typeof Send>;

export const SuppressionReason = z.enum([
  "unsubscribe",
  "bounce",
  "complaint",
  "sms_stop",
  "manual",
]);
export type SuppressionReason = z.infer<typeof SuppressionReason>;

export const Suppression = z.object({
  id: z.string(),
  tenantId: z.string(),
  address: z.string(),
  channel: ConsentChannel,
  reason: SuppressionReason,
  capturedAt: z.string(),
});
export type Suppression = z.infer<typeof Suppression>;

/* --------------------- dashboard view-model (TM.8) ----------------------- */

export type TrendPoint = { label: string; value: number };

export type MarketingDashboard = {
  tenantName: string;
  isSampleData: boolean;
  stats: {
    activeCampaigns: number;
    sentLast30d: number;
    consentCoverage: number; // 0..1 of marketable parties with valid consent
    suppressedCount: number;
    deltas: {
      activeCampaigns: number;
      sentLast30d: number;
      consentCoverage: number;
      suppressedCount: number;
    };
  };
  engagementSeries: {
    categories: string[];
    sent: number[];
    delivered: number[];
    engaged: number[];
  };
  consentMix: { label: string; value: number }[];
  sequences: Sequence[];
  recentCampaigns: Campaign[];
};
