import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.module';
import { Ctx } from '../common/ctx';

export interface OpenTxnDto {
  txnType:
    | 'new_business' | 'renewal' | 'endorsement' | 'cancellation'
    | 'reinstatement' | 'remarket' | 'claim_fnol';
  accountId: string;
  policyId?: string;
  carrierId?: string;
  reason?: string;
  effectiveDate?: string;
  reference?: string;
}

@Injectable()
export class TxnsService {
  constructor(private readonly db: DbService) {}

  /** Open a transaction in draft — and write the E&O activity alongside it. */
  open(ctx: Ctx, dto: OpenTxnDto) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const r = await q(
        `INSERT INTO txn (tenant_id, reference, txn_type, account_id, policy_id,
                          carrier_id, reason, effective_date)
         VALUES (current_tenant(), $1, $2, $3, $4, $5, $6, $7)
         RETURNING id, reference, txn_type, state, opened_at`,
        [dto.reference ?? null, dto.txnType, dto.accountId, dto.policyId ?? null,
         dto.carrierId ?? null, dto.reason ?? null, dto.effectiveDate ?? null],
      );
      const txn = r.rows[0];
      await q(
        `INSERT INTO activity (tenant_id, account_id, policy_id, txn_id,
                               activity_type, title, body)
         VALUES (current_tenant(), $1, $2, $3, $4, $5, $6)`,
        [dto.accountId, dto.policyId ?? null, txn.id,
         dto.txnType === 'claim_fnol' ? 'claim_fnol' : 'follow_up',
         `${dto.txnType} opened`, dto.reason ?? null],
      );
      return txn;
    });
  }

  /** Generate the transaction's document (LPV, application, ...) from policy data. */
  generateDocument(ctx: Ctx, txnId: string, docType: string, filename: string) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const t = await this.mustGet(q, txnId);
      const doc = await q(
        `INSERT INTO document (tenant_id, account_id, policy_id, txn_id, doc_type, filename, source)
         VALUES (current_tenant(), $1, $2, $3, $4, $5, 'generated')
         RETURNING id, filename, retention_until`,
        [t.account_id, t.policy_id, txnId, docType, filename],
      );
      await q(`UPDATE txn SET state='doc_generated' WHERE id=$1`, [txnId]);
      return { txnId, state: 'doc_generated', document: doc.rows[0] };
    });
  }

  requestSignature(ctx: Ctx, txnId: string) {
    return this.setState(ctx, txnId, 'sig_pending');
  }

  /** Capture the e-sign event on the txn's document, then advance to signed. */
  sign(ctx: Ctx, txnId: string, signerPartyId?: string, signerIp?: string) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const d = await q(
        `SELECT id FROM document WHERE txn_id=$1 ORDER BY created_at DESC LIMIT 1`,
        [txnId],
      );
      if (d.rowCount === 0) throw new BadRequestException('no document to sign');
      await q(
        `INSERT INTO signature (tenant_id, document_id, signer_party_id, method,
                                signed_at, signer_ip, verified)
         VALUES (current_tenant(), $1, $2, 'esign', now(), $3, true)`,
        [d.rows[0].id, signerPartyId ?? null, signerIp ?? null],
      );
      await q(`UPDATE txn SET state='signed' WHERE id=$1`, [txnId]);
      return { txnId, state: 'signed', documentId: d.rows[0].id };
    });
  }

  /** Submit to the carrier through its channel; the out-of-band step, tracked. */
  submit(ctx: Ctx, txnId: string, channel: string, payload?: Record<string, unknown>) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const t = await this.mustGet(q, txnId);
      const d = await q(
        `SELECT id FROM document WHERE txn_id=$1 ORDER BY created_at DESC LIMIT 1`,
        [txnId],
      );
      const sub = await q(
        `INSERT INTO carrier_submission (tenant_id, txn_id, carrier_id, document_id,
                                         channel, status, submitted_at, payload)
         VALUES (current_tenant(), $1, $2, $3, $4, 'sent', now(), $5)
         RETURNING id, channel, status, submitted_at`,
        [txnId, t.carrier_id, d.rows[0]?.id ?? null, channel,
         JSON.stringify(payload ?? {})],
      );
      await q(`UPDATE txn SET state='submitted' WHERE id=$1`, [txnId]);
      // follow-up diary task so the acknowledgement is chased, never lost
      await q(
        `INSERT INTO activity (tenant_id, account_id, policy_id, txn_id,
                               activity_type, title, due_at)
         VALUES (current_tenant(), $1, $2, $3, 'follow_up',
                 'Chase carrier acknowledgement', now() + interval '3 days')`,
        [t.account_id, t.policy_id, txnId],
      );
      return { txnId, state: 'submitted', submission: sub.rows[0] };
    });
  }

  /** Record the carrier acknowledgement; optionally complete in the same call. */
  acknowledge(ctx: Ctx, txnId: string, carrierRef?: string, complete = false) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      await q(
        `UPDATE carrier_submission
            SET status='acknowledged', acknowledged_at=now(), carrier_ref=$2
          WHERE txn_id=$1`,
        [txnId, carrierRef ?? null],
      );
      await q(`UPDATE txn SET state='carrier_ack' WHERE id=$1`, [txnId]);
      if (complete) {
        await q(`UPDATE txn SET state='completed' WHERE id=$1`, [txnId]);
      }
      const t = await this.mustGet(q, txnId);
      return { txnId, state: t.state, closedAt: t.closed_at };
    });
  }

  list(ctx: Ctx) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const r = await q(
        `SELECT t.id, t.reference, t.txn_type, t.state, t.reason,
                t.effective_date, t.opened_at, t.closed_at,
                a.display_name AS account_name, c.name AS carrier_name
           FROM txn t
           JOIN account a ON a.id = t.account_id
           LEFT JOIN carrier c ON c.id = t.carrier_id
          ORDER BY t.opened_at DESC`,
      );
      return r.rows;
    });
  }

  get(ctx: Ctx, txnId: string) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const t = await this.mustGet(q, txnId);
      const names = await q(
        `SELECT a.display_name AS account_name, c.name AS carrier_name
           FROM txn t
           JOIN account a ON a.id = t.account_id
           LEFT JOIN carrier c ON c.id = t.carrier_id
          WHERE t.id = $1`,
        [txnId],
      );
      const events = await q(
        `SELECT from_state, to_state, actor, at
           FROM txn_event WHERE txn_id=$1 ORDER BY at`,
        [txnId],
      );
      const subs = await q(
        `SELECT channel, status, carrier_ref, submitted_at, acknowledged_at
           FROM carrier_submission WHERE txn_id=$1`,
        [txnId],
      );
      const docs = await q(
        `SELECT id, doc_type, filename, retention_until
           FROM document WHERE txn_id=$1`,
        [txnId],
      );
      return {
        ...t,
        account_name: names.rows[0]?.account_name ?? null,
        carrier_name: names.rows[0]?.carrier_name ?? null,
        effective_date: t.effective_date ? String(t.effective_date).slice(0, 10) : null,
        opened_at: t.opened_at ? new Date(t.opened_at).toISOString() : t.opened_at,
        closed_at: t.closed_at ? new Date(t.closed_at).toISOString() : null,
        events: events.rows,
        submissions: subs.rows,
        documents: docs.rows,
      };
    });
  }

  private setState(ctx: Ctx, txnId: string, state: string) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      await this.mustGet(q, txnId);
      await q(`UPDATE txn SET state=$2 WHERE id=$1`, [txnId, state]);
      return { txnId, state };
    });
  }

  private async mustGet(
    q: (sql: string, p?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }>,
    txnId: string,
  ) {
    const r = await q(`SELECT * FROM txn WHERE id=$1`, [txnId]);
    if (r.rowCount === 0) throw new NotFoundException('transaction not found');
    return r.rows[0];
  }
}
