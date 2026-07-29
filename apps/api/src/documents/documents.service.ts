import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DbService, Q } from '../db/db.module';
import { Ctx } from '../common/ctx';

export interface IssueProofDto {
  policyId: string;
  templateCode: string;
  issuedTo?: string;
}

/** Maps a template to the doc_type the DB guard recognises as a proof. */
const DOC_TYPE: Record<string, string> = {
  PINK_SLIP: 'pink_slip',
  BINDER_LETTER: 'binder_letter',
  LOE: 'loe',
  CONFIRMATION: 'confirmation',
};

const money = (v: unknown) =>
  v == null ? '—' : `$${Number(v).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`;

/**
 * node-pg returns `date` columns as JS Date objects, so stringifying first
 * yields "Tue Jun 24 2025…" and slicing it mangles the date. Normalize both
 * shapes to ISO yyyy-mm-dd.
 */
const date = (v: unknown) => {
  if (!v) return '—';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
};

@Injectable()
export class DocumentsService {
  constructor(private readonly db: DbService) {}

  /** Everything issued, newest first, with its retention clock. */
  list(ctx: Ctx, accountId?: string) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const r = await q(
        `SELECT d.id, d.doc_type, d.filename, d.source, d.issued_to,
                d.retention_until::text AS retention_until,
                d.created_at::text AS created_at,
                d.account_id, a.display_name AS account_name, a.lookup_code,
                d.policy_id, p.policy_number, p.line
           FROM document d
           LEFT JOIN account a ON a.id = d.account_id
           LEFT JOIN policy p ON p.id = d.policy_id
          WHERE ($1::uuid IS NULL OR d.account_id = $1::uuid)
          ORDER BY d.created_at DESC
          LIMIT 200`,
        [accountId ?? null],
      );
      return r.rows;
    });
  }

  templates(ctx: Ctx) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const r = await q(
        `SELECT code, name, version FROM document_template
          WHERE active ORDER BY name`,
      );
      return r.rows;
    });
  }

  /**
   * Render a template against live policy data and file the result as a
   * document. Authority is enforced by the DB (0012_proofs.sql): issuing a
   * proof requires pc.proof.issue, which is licence-gated.
   */
  issue(ctx: Ctx, dto: IssueProofDto) {
    return this.db
      .withTenant(ctx.tenantId, ctx.actor, async (q) => {
        const tpl = await q(
          `SELECT id, code, name, body FROM document_template
            WHERE code = $1 AND active ORDER BY version DESC LIMIT 1`,
          [dto.templateCode],
        );
        if (tpl.rowCount === 0) throw new NotFoundException('template not found');

        const fields = await this.mergeFields(q, dto.policyId, dto.issuedTo);
        const body = String(tpl.rows[0].body).replace(
          /\{\{(\w+)\}\}/g,
          (_, k: string) => fields[k] ?? '—',
        );

        const docType = DOC_TYPE[dto.templateCode] ?? 'confirmation';
        const stamp = new Date().toISOString().slice(0, 10);
        const filename = `${fields.lookup_code ?? 'DOC'}-${dto.templateCode}-${stamp}.pdf`;

        const doc = await q(
          `INSERT INTO document (tenant_id, account_id, policy_id, template_id,
                                 doc_type, filename, source, issued_to, rendered_body)
           VALUES (current_tenant(), $1, $2, $3, $4, $5, 'generated', $6, $7)
           RETURNING id, doc_type, filename, issued_to,
                     retention_until::text AS retention_until,
                     created_at::text AS created_at`,
          [fields._account_id, dto.policyId, tpl.rows[0].id, docType, filename,
           dto.issuedTo ?? null, body],
        );
        return { ...doc.rows[0], rendered_body: body, template_name: tpl.rows[0].name };
      })
      .catch((e: unknown) => {
        const err = e as { code?: string; message?: string };
        if (err?.code === '42501') {
          throw new ForbiddenException(err.message ?? 'not authorized to issue this proof');
        }
        throw e;
      });
  }

  /** Pull everything the templates can merge, from one policy. */
  private async mergeFields(
    q: Q,
    policyId: string,
    issuedTo?: string,
  ): Promise<Record<string, string> & { _account_id: string }> {
    const p = await q(
      `SELECT p.id, p.policy_number, p.line, p.effective_date, p.expiry_date,
              p.account_id, c.name AS carrier_name,
              a.display_name, a.lookup_code,
              t.trade_name, t.legal_name
         FROM policy p
         JOIN account a ON a.id = p.account_id
         CROSS JOIN tenant t
         LEFT JOIN carrier c ON c.id = p.carrier_id
        WHERE p.id = $1 AND t.id = current_tenant()`,
      [policyId],
    );
    if (p.rowCount === 0) throw new BadRequestException('policy not found');
    const row = p.rows[0];

    const party = await q(
      `SELECT pt.address
         FROM account_party ap JOIN party pt ON pt.id = ap.party_id
        WHERE ap.account_id = $1
        ORDER BY ap.is_primary DESC LIMIT 1`,
      [row.account_id],
    );
    const addr = (party.rows[0]?.address ?? {}) as Record<string, unknown>;
    const address =
      [addr.line1, addr.city, addr.prov, addr.postal].filter(Boolean).join(', ') || '—';

    const vehicles = await q(
      `SELECT year, make, model, vin FROM vehicle WHERE policy_id = $1`,
      [policyId],
    );
    const coverages = await q(
      `SELECT description, limit_amount, deductible FROM coverage WHERE policy_id = $1`,
      [policyId],
    );
    const losses = await q(
      `SELECT loss_date::text AS loss_date, loss_type, at_fault, amount
         FROM loss_history WHERE policy_id = $1 ORDER BY loss_date DESC`,
      [policyId],
    );

    return {
      _account_id: row.account_id,
      policy_number: row.policy_number ?? '—',
      carrier_name: row.carrier_name ?? '—',
      insured_name: row.display_name,
      lookup_code: row.lookup_code ?? '—',
      insured_address: address,
      effective_date: date(row.effective_date),
      expiry_date: date(row.expiry_date),
      brokerage_name: row.trade_name ?? row.legal_name,
      issued_on: new Date().toISOString().slice(0, 10),
      issued_to: issuedTo ?? '—',
      vehicles:
        vehicles.rows
          .map((v) => `  ${[v.year, v.make, v.model].filter(Boolean).join(' ')} — VIN ${v.vin ?? '—'}`)
          .join('\n') || '  —',
      coverages:
        coverages.rows
          .map((c) => `  ${c.description}: ${money(c.limit_amount)}${c.deductible ? ` (deductible ${money(c.deductible)})` : ''}`)
          .join('\n') || '  —',
      loss_history:
        losses.rows
          .map((l) => `  ${l.loss_date} — ${l.loss_type} (${l.at_fault ? 'at fault' : 'not at fault'}) ${money(l.amount)}`)
          .join('\n') || '  No losses on file.',
    };
  }
}
