'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Badge, TxnStateBadge } from '@insurimple/design-system';
import type {
  HouseholdDetail,
  PolicyLineDetail,
  ConsentRow,
} from '@insurimple/contracts';

const STATUS_TONE: Record<
  HouseholdDetail['header']['status'],
  'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'accent'
> = {
  prospect: 'accent',
  active: 'success',
  review: 'info',
  cancelling: 'warning',
  lapsed: 'danger',
  closed: 'neutral',
};

const CONSENT_TONE: Record<ConsentRow['basis'], 'success' | 'info' | 'neutral' | 'danger'> = {
  express: 'success',
  implied: 'info',
  did_not_obtain: 'neutral',
  withdrawn: 'danger',
};

const money = (v: number | string | null | undefined) =>
  v == null || v === ''
    ? '—'
    : Number(v).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });

const fmtDate = (v: string | null | undefined) => {
  if (!v) return '—';
  const d = new Date(`${v.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
};

const titleCase = (s: string) => s.replace(/(^|_)([a-z])/g, (_, p, c) => (p ? ' ' : '') + c.toUpperCase());

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-border-1 px-5 py-4 last:border-0">
      <h3 className="mb-2 text-caption font-medium uppercase tracking-caps text-text-3">{title}</h3>
      {children}
    </section>
  );
}

function KV({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-text-3">{label}</span>
      <span className="text-small text-text-1">{value ?? '—'}</span>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-small text-text-3">{children}</p>;
}

const LINE_LABEL: Record<string, string> = {
  auto: 'AUTO',
  property: 'HAB',
  tenant: 'TENA',
  condo: 'CONDO',
  umbrella: 'UMBR',
  commercial: 'COMM',
  life: 'LIFE',
};

function LinePanel({
  policy,
  applicants,
}: {
  policy: PolicyLineDetail;
  applicants: HouseholdDetail['applicants'];
}) {
  return (
    <div className="rounded-card border border-border-1 bg-surface-card">
      <Section title="Applicant">
        <div className="flex flex-col gap-2">
          {applicants.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-small font-medium text-text-1">{a.name}</span>
              <Badge tone="neutral">{titleCase(a.role)}</Badge>
              {a.email ? <span className="text-caption text-text-3">{a.email}</span> : null}
              {a.phone ? <span className="text-caption tabular-nums text-text-3">{a.phone}</span> : null}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Policy info">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <KV label="Carrier" value={policy.carrier_name} />
          <KV label="Policy number" value={<span className="tabular-nums">{policy.policy_number ?? '—'}</span>} />
          <KV label="Stage" value={<Badge tone="info">{titleCase(policy.status)}</Badge>} />
          <KV label="Effective" value={fmtDate(policy.effective_date)} />
          <KV label="Expiry" value={fmtDate(policy.expiry_date)} />
          <KV label="Annual premium" value={money(policy.annual_premium)} />
        </div>
      </Section>

      <Section title="Coverages">
        {policy.coverages.length ? (
          <table className="w-full text-small">
            <thead>
              <tr className="text-left text-caption text-text-3">
                <th className="py-1 font-medium">Coverage</th>
                <th className="py-1 font-medium">Limit</th>
                <th className="py-1 font-medium">Deductible</th>
                <th className="py-1 text-right font-medium">Premium</th>
              </tr>
            </thead>
            <tbody>
              {policy.coverages.map((c, i) => (
                <tr key={i} className="border-t border-border-1">
                  <td className="py-1.5 text-text-1">{c.description}</td>
                  <td className="py-1.5 tabular-nums text-text-2">{c.limit_amount == null ? '—' : money(c.limit_amount)}</td>
                  <td className="py-1.5 tabular-nums text-text-2">{c.deductible == null ? '—' : money(c.deductible)}</td>
                  <td className="py-1.5 text-right tabular-nums text-text-2">{money(c.premium)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>No structured coverages on file.</Empty>
        )}
      </Section>

      <Section title="Drivers">
        {policy.drivers.length ? (
          <div className="flex flex-col gap-1.5">
            {policy.drivers.map((d) => (
              <div key={d.party_id} className="flex flex-wrap items-center gap-x-3 text-small">
                <span className="font-medium text-text-1">{d.name}</span>
                <span className="text-caption text-text-3">Class {d.licence_class ?? '—'}</span>
                <span className="text-caption tabular-nums text-text-3">{d.licence_number ?? '—'}</span>
                <span className="text-caption text-text-3">{Number(d.at_fault_count)} at-fault</span>
              </div>
            ))}
          </div>
        ) : (
          <Empty>No drivers on this line.</Empty>
        )}
      </Section>

      <Section title="Vehicles">
        {policy.vehicles.length ? (
          <div className="flex flex-col gap-1.5">
            {policy.vehicles.map((v) => (
              <div key={v.id} className="flex flex-wrap items-center gap-x-3 text-small">
                <span className="font-medium text-text-1">{[v.year, v.make, v.model].filter(Boolean).join(' ') || '—'}</span>
                <span className="text-caption tabular-nums text-text-3">VIN {v.vin ?? '—'}</span>
                <span className="text-caption text-text-3">{titleCase(v.primary_use ?? '')}</span>
                {v.annual_km ? <span className="text-caption tabular-nums text-text-3">{v.annual_km.toLocaleString('en-CA')} km/yr</span> : null}
                {v.ownership ? <span className="text-caption text-text-3">{titleCase(v.ownership)}</span> : null}
              </div>
            ))}
          </div>
        ) : (
          <Empty>No vehicles on this line.</Empty>
        )}
      </Section>

      <Section title="Locations">
        {policy.locations.length ? (
          <div className="flex flex-col gap-1.5">
            {policy.locations.map((l) => {
              const a = (l.address ?? {}) as Record<string, unknown>;
              const line = [a.line1, a.city, a.prov].filter(Boolean).join(', ');
              return (
                <div key={l.id} className="flex flex-wrap items-center gap-x-3 text-small">
                  <span className="font-medium text-text-1">{line || '—'}</span>
                  {l.occupancy ? <span className="text-caption text-text-3">{titleCase(l.occupancy)}</span> : null}
                  {l.year_built ? <span className="text-caption tabular-nums text-text-3">Built {l.year_built}</span> : null}
                  {l.construction ? <span className="text-caption text-text-3">{l.construction}</span> : null}
                </div>
              );
            })}
          </div>
        ) : (
          <Empty>No locations on this line.</Empty>
        )}
      </Section>

      <Section title="Loss history">
        {policy.loss_history.length ? (
          <div className="flex flex-col gap-1.5">
            {policy.loss_history.map((l, i) => (
              <div key={i} className="flex flex-wrap items-center gap-x-3 text-small">
                <span className="tabular-nums text-text-2">{fmtDate(l.loss_date)}</span>
                <span className="font-medium text-text-1">{l.loss_type ?? '—'}</span>
                <Badge tone={l.at_fault ? 'warning' : 'neutral'}>{l.at_fault ? 'At fault' : 'Not at fault'}</Badge>
                <span className="tabular-nums text-text-2">{money(l.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <Empty>No losses on file.</Empty>
        )}
      </Section>

      <Section title="Additional interests">
        {policy.additional_interests.length ? (
          <div className="flex flex-col gap-1.5">
            {policy.additional_interests.map((ai, i) => (
              <div key={i} className="flex flex-wrap items-center gap-x-3 text-small">
                <Badge tone="neutral">{ai.kind}</Badge>
                <span className="font-medium text-text-1">{ai.name}</span>
                <span className="text-caption text-text-3">on {ai.on}</span>
              </div>
            ))}
          </div>
        ) : (
          <Empty>No additional interests on this line.</Empty>
        )}
      </Section>

      <Section title="Forms & endorsements">
        {policy.forms_endorsements.length ? (
          <div className="flex flex-col gap-1.5">
            {policy.forms_endorsements.map((e, i) => (
              <div key={i} className="flex flex-wrap items-center gap-x-3 text-small">
                <span className="font-medium tabular-nums text-text-1">{e.form_code}</span>
                <span className="text-text-2">{e.description ?? '—'}</span>
                <span className="ml-auto tabular-nums text-text-3">{money(e.premium)}</span>
              </div>
            ))}
          </div>
        ) : (
          <Empty>No endorsements on this line.</Empty>
        )}
      </Section>

      <Section title="Payment authorization">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <KV label="Billing" value={policy.billing_type ? titleCase(policy.billing_type) : '—'} />
          <KV label="Payment plan" value={policy.payment_plan ?? '—'} />
        </div>
      </Section>
    </div>
  );
}

export function HouseholdDetailView({
  detail,
  preview = false,
}: {
  detail: HouseholdDetail;
  preview?: boolean;
}) {
  const { header, applicants, policies, service_summary, consent } = detail;
  const [sel, setSel] = useState(0);
  const active = policies[sel];

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col px-8 py-6">
      <header className="mb-5">
        <Link href="/locate" className="mb-2 inline-flex items-center gap-1 text-small text-text-link">
          <i className="ti ti-arrow-left text-[16px]" /> Back to Locate
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-small font-medium tabular-nums text-text-3">{header.lookup_code ?? '—'}</span>
          <h1 className="text-h1 text-text-1">{header.display_name}</h1>
          <Badge tone={STATUS_TONE[header.status]}>{titleCase(header.status)}</Badge>
          {preview ? <Badge tone="warning">Preview data</Badge> : null}
        </div>
        <p className="mt-1 text-small text-text-2">
          {[
            header.city,
            header.servicing_broker ? `Serviced by ${header.servicing_broker}` : null,
            titleCase(header.kind),
          ]
            .filter(Boolean)
            .join('  ·  ')}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Policy tree */}
        <aside>
          <h2 className="mb-2 text-caption font-medium uppercase tracking-caps text-text-3">Policies</h2>
          {policies.length ? (
            <nav className="flex flex-col gap-1">
              {policies.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setSel(i)}
                  className={`flex flex-col items-start gap-0.5 rounded-control border px-3 py-2 text-left transition-colors ${
                    i === sel
                      ? 'border-accent bg-accent-tint'
                      : 'border-border-1 bg-surface-card hover:bg-surface-panel'
                  }`}
                >
                  <span className="flex items-center gap-2 text-small font-medium text-text-1">
                    <span className="tabular-nums">{LINE_LABEL[p.line] ?? p.line.toUpperCase()}</span>
                    <Badge tone={p.status === 'cancelled' ? 'danger' : p.status === 'quoted' ? 'accent' : 'success'}>
                      {titleCase(p.status)}
                    </Badge>
                  </span>
                  <span className="text-caption tabular-nums text-text-3">{p.policy_number ?? '—'}</span>
                </button>
              ))}
            </nav>
          ) : (
            <p className="text-small text-text-3">No policies on this household yet.</p>
          )}
        </aside>

        {/* Per-line detail panel */}
        {active ? <LinePanel policy={active} applicants={applicants} /> : <div />}
      </div>

      {/* Service summary — the transaction chain */}
      <section className="mt-6">
        <h2 className="mb-2 text-caption font-medium uppercase tracking-caps text-text-3">Service summary</h2>
        {service_summary.length ? (
          <div className="flex flex-col gap-3">
            {service_summary.map((t) => (
              <div key={t.id} className="rounded-card border border-border-1 bg-surface-card p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-small font-medium tabular-nums text-text-1">{t.reference ?? 'TXN'}</span>
                  <span className="text-small text-text-2">{titleCase(t.txn_type)}</span>
                  <TxnStateBadge state={t.state} />
                  {t.carrier_name ? <span className="text-caption text-text-3">{t.carrier_name}</span> : null}
                  <span className="ml-auto text-caption text-text-3">Opened {fmtDate(t.opened_at)}</span>
                </div>
                {t.reason ? <p className="mt-1.5 text-small text-text-2">{t.reason}</p> : null}
                {t.events.length ? (
                  <ol className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-text-3">
                    {t.events.map((e, i) => (
                      <li key={i} className="flex items-center gap-2">
                        {i > 0 ? <i className="ti ti-chevron-right text-[13px] opacity-60" /> : null}
                        <span className="text-text-2">{titleCase(e.to_state)}</span>
                        <span className="tabular-nums">{fmtDate(e.at)}</span>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-small text-text-3">No transactions on this household yet.</p>
        )}
      </section>

      {/* Consent — typed CASL rows, never a comment blob */}
      <section className="mt-6 mb-2">
        <h2 className="mb-2 text-caption font-medium uppercase tracking-caps text-text-3">CASL consent</h2>
        <div className="overflow-hidden rounded-card border border-border-1 bg-surface-card">
          {consent.length ? (
            <table className="w-full text-small">
              <thead>
                <tr className="border-b border-border-1 text-left text-caption text-text-3">
                  <th className="px-4 py-2 font-medium">Channel</th>
                  <th className="px-4 py-2 font-medium">Basis</th>
                  <th className="px-4 py-2 font-medium">Captured</th>
                  <th className="px-4 py-2 font-medium">Expires</th>
                  <th className="px-4 py-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {consent.map((c, i) => (
                  <tr key={i} className="border-b border-border-1 last:border-0">
                    <td className="px-4 py-2 text-text-1">{titleCase(c.channel)}</td>
                    <td className="px-4 py-2"><Badge tone={CONSENT_TONE[c.basis]}>{titleCase(c.basis)}</Badge></td>
                    <td className="px-4 py-2 tabular-nums text-text-2">{fmtDate(c.captured_at)}</td>
                    <td className="px-4 py-2 tabular-nums text-text-2">{fmtDate(c.expires_at)}</td>
                    <td className="px-4 py-2 text-text-2">{c.source ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-3 text-small text-text-3">No consent records captured.</p>
          )}
        </div>
      </section>
    </div>
  );
}
