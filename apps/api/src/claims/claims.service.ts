import { ForbiddenException, Injectable } from '@nestjs/common';
import { DbService } from '../db/db.module';
import { newId } from '../db/id';
import { Ctx } from '../common/ctx';

export interface FnolDto {
  accountId: string;
  policyId: string;
  carrierId?: string;
  lossDate: string;
  description: string;
  reserve?: number;
}

/**
 * Claims — intake and carrier referral only. The carrier is the system of
 * record for adjudication; what we own is the evidence that the loss was
 * reported, when, by whom, and what came back.
 *
 * The FNOL is a transaction like everything else (txn_type = claim_fnol), so
 * it inherits the state machine, the authority guard and the audit trail
 * rather than inventing a parallel workflow.
 */
@Injectable()
export class ClaimsService {
  constructor(private readonly db: DbService) {}

  list(ctx: Ctx) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const r = await q(
        `SELECT cl.id, cl.claim_number, cl.loss_date::text AS loss_date,
                cl.reported_date::text AS reported_date, cl.status, cl.adjuster,
                cl.reserve, cl.paid,
                cl.account_id, a.display_name AS account_name, a.lookup_code,
                cl.policy_id, p.policy_number, p.line,
                cl.txn_id, t.reference AS txn_reference, t.state AS txn_state,
                c.name AS carrier_name,
                (current_date - cl.reported_date) AS days_open
           FROM claim cl
           JOIN account a ON a.id = cl.account_id
           LEFT JOIN policy p ON p.id = cl.policy_id
           LEFT JOIN txn t ON t.id = cl.txn_id
           LEFT JOIN carrier c ON c.id = cl.carrier_id
          ORDER BY cl.reported_date DESC`,
      );
      return r.rows.map((x) => ({ ...x, days_open: Number(x.days_open ?? 0) }));
    });
  }

  /**
   * Take a first notice of loss: open the FNOL transaction, then file the
   * claim against it. Authority is the DB's call — a user without
   * pc.txn.create cannot open the transaction, so they cannot take an FNOL.
   */
  report(ctx: Ctx, dto: FnolDto) {
    return this.db
      .withTenant(ctx.tenantId, ctx.actor, async (q) => {
        const txn = await q(
          `INSERT INTO txn (id, tenant_id, txn_type, account_id, policy_id, carrier_id,
                            reason, effective_date)
           VALUES ($1, current_tenant(), 'claim_fnol', $2, $3, $4, $5, $6)
           RETURNING id, reference, state`,
          [newId(), dto.accountId, dto.policyId, dto.carrierId ?? null,
           dto.description, dto.lossDate],
        );
        const claim = await q(
          `INSERT INTO claim (id, tenant_id, account_id, policy_id, txn_id, carrier_id,
                              loss_date, reported_date, status, reserve)
           VALUES ($1, current_tenant(), $2, $3, $4, $5, $6, current_date, 'open', $7)
           RETURNING id, status, loss_date::text AS loss_date,
                     reported_date::text AS reported_date, reserve`,
          [newId(), dto.accountId, dto.policyId, txn.rows[0].id, dto.carrierId ?? null,
           dto.lossDate, dto.reserve ?? null],
        );
        // The E&O diary entry — a reported loss must be chased.
        await q(
          `INSERT INTO activity (id, tenant_id, account_id, policy_id, txn_id,
                                 activity_type, title, body, priority, due_at)
           VALUES ($1, current_tenant(), $2, $3, $4, 'claim_fnol',
                   'Refer claim to carrier and confirm claim number', $5, 'high',
                   now() + interval '1 day')`,
          [newId(), dto.accountId, dto.policyId, txn.rows[0].id, dto.description],
        );
        return { claim: claim.rows[0], txn: txn.rows[0] };
      })
      .catch((e: unknown) => {
        const err = e as { code?: string; message?: string };
        if (err?.code === '42501') {
          throw new ForbiddenException(err.message ?? 'not authorized to take an FNOL');
        }
        throw e;
      });
  }
}
