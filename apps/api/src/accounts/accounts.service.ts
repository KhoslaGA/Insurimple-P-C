import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService, Q } from '../db/db.module';
import { Ctx } from '../common/ctx';

@Injectable()
export class AccountsService {
  constructor(private readonly db: DbService) {}

  list(ctx: Ctx) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const r = await q(
        `SELECT a.id, a.lookup_code, a.display_name, a.kind, a.status, a.source,
                count(p.id) AS policy_count,
                coalesce(sum(p.annual_premium), 0) AS annual_premium
           FROM account a
           LEFT JOIN policy p ON p.account_id = a.id
          GROUP BY a.id
          ORDER BY a.display_name`,
      );
      return r.rows;
    });
  }

  /**
   * The anchor screen (T1.2). One account, its parties, every policy line with
   * the Epic tree branches, the transaction chain with state history, and typed
   * CASL consent. All under one RLS-scoped transaction.
   */
  detail(ctx: Ctx, accountId: string) {
    return this.db.withTenant(ctx.tenantId, ctx.actor, async (q) => {
      const acc = await q(
        `SELECT a.id, a.lookup_code, a.display_name, a.kind, a.status, a.source,
                sb.full_name AS servicing_broker, sc.full_name AS servicing_csr
           FROM account a
           LEFT JOIN staff sb ON sb.id = a.servicing_broker
           LEFT JOIN staff sc ON sc.id = a.servicing_csr
          WHERE a.id = $1`,
        [accountId],
      );
      if (acc.rowCount === 0) throw new NotFoundException('household not found');

      const parties = await q(
        `SELECT ap.party_id AS id, ap.role, ap.is_primary, p.party_type,
                coalesce(p.legal_name, trim(concat_ws(' ', p.first_name, p.last_name))) AS name,
                p.email, p.phone, p.address
           FROM account_party ap
           JOIN party p ON p.id = ap.party_id
          WHERE ap.account_id = $1
          ORDER BY ap.is_primary DESC, name`,
        [accountId],
      );
      const partyIds = parties.rows.map((r) => r.id);
      const primary =
        parties.rows.find((r) => r.is_primary) ?? parties.rows[0] ?? null;
      const addr = (primary?.address ?? null) as Record<string, unknown> | null;
      const city = addr
        ? [addr.city, addr.prov].filter(Boolean).join(', ') || null
        : null;

      const policies = await q(
        `SELECT p.id, p.policy_number, p.line, p.status, c.name AS carrier_name,
                p.effective_date::text AS effective_date, p.expiry_date::text AS expiry_date,
                p.annual_premium, p.billing_type, p.payment_plan
           FROM policy p
           LEFT JOIN carrier c ON c.id = p.carrier_id
          WHERE p.account_id = $1
          ORDER BY p.effective_date DESC NULLS LAST`,
        [accountId],
      );
      const policyIds: string[] = policies.rows.map((r) => r.id);

      const byPolicy = (rows: Record<string, unknown>[]) => {
        const m = new Map<string, Record<string, unknown>[]>();
        for (const row of rows) {
          const k = String(row.policy_id);
          (m.get(k) ?? m.set(k, []).get(k)!).push(row);
        }
        return m;
      };

      const [coverages, vehicles, dwellings, endorsements, losses, drivers, txns] =
        await Promise.all([
          this.forPolicies(
            q,
            `SELECT policy_id, csio_code, description, limit_amount, deductible, premium
               FROM coverage WHERE policy_id = ANY($1::uuid[]) ORDER BY created_at`,
            policyIds,
          ),
          this.forPolicies(
            q,
            `SELECT v.policy_id, v.id, v.year, v.make, v.model, v.vin, v.primary_use,
                    v.annual_km, v.ownership,
                    coalesce(lp.legal_name, trim(concat_ws(' ', lp.first_name, lp.last_name))) AS lienholder_name
               FROM vehicle v LEFT JOIN party lp ON lp.id = v.lienholder_party
              WHERE v.policy_id = ANY($1::uuid[])`,
            policyIds,
          ),
          this.forPolicies(
            q,
            `SELECT d.policy_id, d.id, d.address, d.occupancy, d.year_built, d.construction,
                    coalesce(mp.legal_name, trim(concat_ws(' ', mp.first_name, mp.last_name))) AS mortgagee_name
               FROM dwelling d LEFT JOIN party mp ON mp.id = d.mortgagee_party
              WHERE d.policy_id = ANY($1::uuid[])`,
            policyIds,
          ),
          this.forPolicies(
            q,
            `SELECT policy_id, form_code, description, premium, effective_date::text AS effective_date
               FROM policy_endorsement WHERE policy_id = ANY($1::uuid[]) ORDER BY form_code`,
            policyIds,
          ),
          this.forPolicies(
            q,
            `SELECT policy_id, loss_date::text AS loss_date, loss_type, at_fault, amount,
                    insured_from::text AS insured_from, insured_to::text AS insured_to
               FROM loss_history WHERE policy_id = ANY($1::uuid[]) ORDER BY loss_date DESC NULLS LAST`,
            policyIds,
          ),
          this.forParties(
            q,
            `SELECT dr.party_id,
                    coalesce(p.legal_name, trim(concat_ws(' ', p.first_name, p.last_name))) AS name,
                    dr.licence_number, dr.licence_class, dr.at_fault_count
               FROM driver_record dr JOIN party p ON p.id = dr.party_id
              WHERE dr.party_id = ANY($1::uuid[])`,
            partyIds,
          ),
          q(
            `SELECT t.id, t.reference, t.txn_type, t.state, t.reason,
                    t.effective_date::text AS effective_date,
                    t.opened_at::text AS opened_at, t.closed_at::text AS closed_at,
                    c.name AS carrier_name
               FROM txn t LEFT JOIN carrier c ON c.id = t.carrier_id
              WHERE t.account_id = $1
              ORDER BY t.opened_at DESC`,
            [accountId],
          ),
        ]);

      const txnIds: string[] = txns.rows.map((r) => r.id);
      const events = await this.forTxns(
        q,
        `SELECT txn_id, from_state, to_state, actor, at::text AS at
           FROM txn_event WHERE txn_id = ANY($1::uuid[]) ORDER BY at`,
        txnIds,
      );
      const consent = await this.forParties(
        q,
        `SELECT channel, basis, captured_at::text AS captured_at,
                expires_at::text AS expires_at, source
           FROM consent WHERE party_id = ANY($1::uuid[]) ORDER BY channel`,
        partyIds,
      );

      const cov = byPolicy(coverages.rows);
      const veh = byPolicy(vehicles.rows);
      const dwl = byPolicy(dwellings.rows);
      const end = byPolicy(endorsements.rows);
      const los = byPolicy(losses.rows);
      const eventsByTxn = new Map<string, Record<string, unknown>[]>();
      for (const e of events.rows) {
        const k = String(e.txn_id);
        (eventsByTxn.get(k) ?? eventsByTxn.set(k, []).get(k)!).push({
          from_state: e.from_state,
          to_state: e.to_state,
          actor: e.actor,
          at: e.at,
        });
      }

      const driverRows = drivers.rows;

      const shapedPolicies = policies.rows.map((p) => {
        const vehiclesForP = veh.get(p.id) ?? [];
        const dwellingsForP = dwl.get(p.id) ?? [];
        const interests = [
          ...vehiclesForP
            .filter((v) => v.lienholder_name)
            .map((v) => ({
              kind: 'Lienholder',
              name: String(v.lienholder_name),
              on: [v.year, v.make, v.model].filter(Boolean).join(' ') || 'Vehicle',
            })),
          ...dwellingsForP
            .filter((d) => d.mortgagee_name)
            .map((d) => ({
              kind: 'Mortgagee',
              name: String(d.mortgagee_name),
              on: 'Dwelling',
            })),
        ];
        return {
          id: p.id,
          policy_number: p.policy_number,
          line: p.line,
          status: p.status,
          carrier_name: p.carrier_name,
          effective_date: p.effective_date,
          expiry_date: p.expiry_date,
          annual_premium: p.annual_premium,
          billing_type: p.billing_type,
          payment_plan: p.payment_plan,
          coverages: (cov.get(p.id) ?? []).map((c) => ({
            csio_code: c.csio_code,
            description: c.description,
            limit_amount: c.limit_amount,
            deductible: c.deductible,
            premium: c.premium,
          })),
          // Drivers are an account-level record; surfaced on auto lines (the tree branch).
          drivers:
            p.line === 'auto'
              ? driverRows.map((d) => ({
                  party_id: d.party_id,
                  name: d.name,
                  licence_number: d.licence_number,
                  licence_class: d.licence_class,
                  at_fault_count: d.at_fault_count,
                }))
              : [],
          vehicles: vehiclesForP.map((v) => ({
            id: v.id,
            year: v.year,
            make: v.make,
            model: v.model,
            vin: v.vin,
            primary_use: v.primary_use,
            annual_km: v.annual_km,
            ownership: v.ownership,
          })),
          locations: dwellingsForP.map((d) => ({
            id: d.id,
            address: d.address,
            occupancy: d.occupancy,
            year_built: d.year_built,
            construction: d.construction,
          })),
          loss_history: (los.get(p.id) ?? []).map((l) => ({
            loss_date: l.loss_date,
            loss_type: l.loss_type,
            at_fault: l.at_fault,
            amount: l.amount,
            insured_from: l.insured_from,
            insured_to: l.insured_to,
          })),
          additional_interests: interests,
          forms_endorsements: (end.get(p.id) ?? []).map((e) => ({
            form_code: e.form_code,
            description: e.description,
            premium: e.premium,
            effective_date: e.effective_date,
          })),
        };
      });

      const serviceSummary = txns.rows.map((t) => ({
        id: t.id,
        reference: t.reference,
        txn_type: t.txn_type,
        state: t.state,
        reason: t.reason,
        effective_date: t.effective_date,
        opened_at: t.opened_at,
        closed_at: t.closed_at,
        carrier_name: t.carrier_name,
        events: eventsByTxn.get(t.id) ?? [],
      }));

      return {
        header: {
          id: acc.rows[0].id,
          lookup_code: acc.rows[0].lookup_code,
          display_name: acc.rows[0].display_name,
          kind: acc.rows[0].kind,
          status: acc.rows[0].status,
          source: acc.rows[0].source,
          city,
          servicing_broker: acc.rows[0].servicing_broker,
          servicing_csr: acc.rows[0].servicing_csr,
        },
        applicants: parties.rows.map((p) => ({
          id: p.id,
          role: p.role,
          is_primary: p.is_primary,
          party_type: p.party_type,
          name: p.name,
          email: p.email,
          phone: p.phone,
          address: p.address,
        })),
        policies: shapedPolicies,
        service_summary: serviceSummary,
        consent: consent.rows.map((c) => ({
          channel: c.channel,
          basis: c.basis,
          captured_at: c.captured_at,
          expires_at: c.expires_at,
          source: c.source,
        })),
      };
    });
  }

  private forPolicies(q: Q, sql: string, ids: string[]) {
    return ids.length ? q(sql, [ids]) : Promise.resolve({ rows: [] } as { rows: Record<string, unknown>[] });
  }
  private forParties(q: Q, sql: string, ids: string[]) {
    return ids.length ? q(sql, [ids]) : Promise.resolve({ rows: [] } as { rows: Record<string, unknown>[] });
  }
  private forTxns(q: Q, sql: string, ids: string[]) {
    return ids.length ? q(sql, [ids]) : Promise.resolve({ rows: [] } as { rows: Record<string, unknown>[] });
  }
}
