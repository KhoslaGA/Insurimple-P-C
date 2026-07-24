'use client';

import { useEffect, useState } from 'react';
import type { AutoRisk, CoverageLimit } from '@insurimple/contracts';
import { Badge, Button, Card, Field, Input, Select, Tabs } from '@insurimple/design-system';
import type { Household, PriorPolicy } from '@/lib/mock/household';
import { blankAutoRisk, prefillAutoFromPrior } from '@/lib/quote/prefill';
import { clearDraft, loadDraft, saveDraft, type QuoteDraft } from '@/lib/quote/draft';

const TABS = [
  { value: 'applicant', label: 'Applicant' },
  { value: 'drivers', label: 'Drivers' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'coverages', label: 'Coverages' },
];

const TPL_OPTIONS = [
  { label: '$1,000,000', cents: 100_000_000 },
  { label: '$2,000,000', cents: 200_000_000 },
];

const SABS_LABELS: Record<string, string> = {
  increased_medical_rehab: 'Increased medical & rehab',
  increased_attendant_care: 'Increased attendant care',
  caregiver: 'Caregiver',
  housekeeping_and_home_maintenance: 'Housekeeping & home maintenance',
  dependant_care: 'Dependant care',
  indexation: 'Indexation',
  income_replacement_topup: 'Income replacement top-up',
  death_and_funeral: 'Death & funeral',
};

function limitCents(limit: CoverageLimit): number | null {
  return limit.kind === 'amount' ? limit.value.amountCents : null;
}

export function QuoteWorkspace({ household, prior }: { household: Household; prior: PriorPolicy }) {
  const [risk, setRisk] = useState<AutoRisk | null>(null);
  const [tab, setTab] = useState('applicant');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [resumable, setResumable] = useState<QuoteDraft | null>(null);

  // Duplicate / resume detection: is there already a saved draft for this household?
  useEffect(() => {
    setResumable(loadDraft(household.id));
  }, [household.id]);

  function handleSave() {
    if (!risk) return;
    const draft: QuoteDraft = { householdId: household.id, updatedAt: nowLabel(), risk };
    saveDraft(draft);
    setResumable(draft);
    setSavedAt(draft.updatedAt);
  }

  function handleDiscard() {
    clearDraft(household.id);
    setResumable(null);
    setRisk(null);
    setSavedAt(null);
  }

  const update = (fn: (r: AutoRisk) => AutoRisk) => setRisk((r) => (r ? fn(r) : r));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <PartyHeader household={household} />

      {risk === null ? (
        <StartPanel
          prior={prior}
          resumable={resumable}
          onPrefill={() => setRisk(prefillAutoFromPrior(household, prior, prior.expiresOn))}
          onBlank={() => setRisk(blankAutoRisk(household, prior.expiresOn))}
          onResume={() => resumable && setRisk(resumable.risk)}
          onDiscard={handleDiscard}
        />
      ) : (
        <Card className="flex flex-col gap-4 p-0">
          <div className="border-b border-border-1 px-5 pt-4">
            <Tabs tabs={TABS} value={tab} onValueChange={setTab} />
          </div>

          <div className="px-5 pb-5">
            {tab === 'applicant' && <ApplicantTab risk={risk} update={update} />}
            {tab === 'drivers' && <DriversTab risk={risk} update={update} />}
            {tab === 'vehicles' && <VehiclesTab risk={risk} update={update} />}
            {tab === 'coverages' && <CoveragesTab risk={risk} update={update} />}
          </div>

          <div className="flex items-center gap-3 border-t border-border-1 bg-surface-panel px-5 py-3">
            <span className="text-caption text-text-3">
              Indicative until a carrier quotes this exact risk. Quoting never binds.
            </span>
            <span className="ml-auto flex items-center gap-3">
              {savedAt ? <span className="text-caption text-text-3">Saved {savedAt}</span> : null}
              <Button variant="secondary" size="sm" onClick={handleSave}>
                Save draft
              </Button>
              <Button variant="primary" size="sm" disabled title="Shopping arrives with the rating screen">
                Shop this risk
              </Button>
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}

function nowLabel(): string {
  // App UI may read the clock; the domain never does.
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function PartyHeader({ household }: { household: Household }) {
  return (
    <Card className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-h2 font-medium text-text-1">{household.displayName}</h2>
          <Badge tone="accent">Returning client</Badge>
        </div>
        <div className="text-small text-text-3">
          Household · {household.code} · {household.email} · {household.phone}
        </div>
        <div className="text-small text-text-3">{household.primaryContact.mailingAddress.line1},{' '}
          {household.primaryContact.mailingAddress.city} {household.primaryContact.mailingAddress.province}{' '}
          {household.primaryContact.mailingAddress.postalCode}
        </div>
      </div>
    </Card>
  );
}

function StartPanel({
  prior,
  resumable,
  onPrefill,
  onBlank,
  onResume,
  onDiscard,
}: {
  prior: PriorPolicy;
  resumable: QuoteDraft | null;
  onPrefill: () => void;
  onBlank: () => void;
  onResume: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {resumable ? (
        <Card className="flex items-center gap-3 border-tenant-primary/40 bg-tenant-primary-tint/40">
          <div>
            <div className="text-small font-medium text-text-1">You have a saved draft for this household</div>
            <div className="text-caption text-text-3">Last updated {resumable.updatedAt}. Resume it, or start over.</div>
          </div>
          <span className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" onClick={onDiscard}>
              Start over
            </Button>
            <Button variant="primary" size="sm" onClick={onResume}>
              Resume draft
            </Button>
          </span>
        </Card>
      ) : null}

      <Card className="flex flex-col gap-4">
        <div>
          <h3 className="text-body font-medium text-text-1">Start an auto quote</h3>
          <p className="text-small text-text-2">
            The risk is captured once and reused for every carrier. Prefilling reuses last term&apos;s
            risk — nothing is re-keyed from the party record.
          </p>
        </div>
        <div className="rounded-card border border-border-1 bg-surface-panel p-4">
          <div className="text-caption font-medium uppercase tracking-[0.06em] text-text-3">Prior policy</div>
          <div className="mt-1 text-small text-text-1">
            {prior.policyNumber} · {prior.carrier} · expires {prior.expiresOn}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={onPrefill}>
            Prefill from prior policy
          </Button>
          <Button variant="secondary" onClick={onBlank}>
            Start a blank quote
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ApplicantTab({ risk, update }: { risk: AutoRisk; update: (fn: (r: AutoRisk) => AutoRisk) => void }) {
  const ni = risk.namedInsured;
  const setNi = (patch: Partial<AutoRisk['namedInsured']>) =>
    update((r) => ({ ...r, namedInsured: { ...r.namedInsured, ...patch } }));
  const setAddr = (patch: Partial<AutoRisk['namedInsured']['mailingAddress']>) =>
    update((r) => ({ ...r, namedInsured: { ...r.namedInsured, mailingAddress: { ...r.namedInsured.mailingAddress, ...patch } } }));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-caption text-text-3">Prefilled from the party record — review and adjust.</p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name">
          {({ id }) => <Input id={id} value={ni.firstName} onChange={(e) => setNi({ firstName: e.target.value })} />}
        </Field>
        <Field label="Last name">
          {({ id }) => <Input id={id} value={ni.lastName} onChange={(e) => setNi({ lastName: e.target.value })} />}
        </Field>
        <Field label="Date of birth" hint="YYYY-MM-DD">
          {({ id }) => <Input id={id} value={ni.dateOfBirth ?? ''} onChange={(e) => setNi({ dateOfBirth: e.target.value })} />}
        </Field>
        <Field label="Effective date" hint="YYYY-MM-DD">
          {({ id }) => <Input id={id} value={risk.effectiveDate} onChange={(e) => update((r) => ({ ...r, effectiveDate: e.target.value }))} />}
        </Field>
        <Field label="Address" className="col-span-2">
          {({ id }) => <Input id={id} value={ni.mailingAddress.line1} onChange={(e) => setAddr({ line1: e.target.value })} />}
        </Field>
        <Field label="City">
          {({ id }) => <Input id={id} value={ni.mailingAddress.city} onChange={(e) => setAddr({ city: e.target.value })} />}
        </Field>
        <Field label="Postal code">
          {({ id }) => <Input id={id} value={ni.mailingAddress.postalCode} onChange={(e) => setAddr({ postalCode: e.target.value })} />}
        </Field>
      </div>
    </div>
  );
}

function DriversTab({ risk, update }: { risk: AutoRisk; update: (fn: (r: AutoRisk) => AutoRisk) => void }) {
  const setDriver = (i: number, fn: (d: AutoRisk['drivers'][number]) => AutoRisk['drivers'][number]) =>
    update((r) => ({ ...r, drivers: r.drivers.map((d, j) => (j === i ? fn(d) : d)) }));

  return (
    <div className="flex flex-col gap-4">
      {risk.drivers.map((d, i) => (
        <div key={d.id} className="rounded-card border border-border-1 p-4">
          <div className="mb-3 text-caption font-medium uppercase tracking-[0.06em] text-text-3">
            Driver {i + 1} · {d.relationshipToApplicant}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name">
              {({ id }) => <Input id={id} value={d.firstName} onChange={(e) => setDriver(i, (x) => ({ ...x, firstName: e.target.value }))} />}
            </Field>
            <Field label="Last name">
              {({ id }) => <Input id={id} value={d.lastName} onChange={(e) => setDriver(i, (x) => ({ ...x, lastName: e.target.value }))} />}
            </Field>
            <Field label="Licence number">
              {({ id }) => (
                <Input
                  id={id}
                  value={d.licence.number}
                  onChange={(e) => setDriver(i, (x) => ({ ...x, licence: { ...x.licence, number: e.target.value } }))}
                />
              )}
            </Field>
            <Field label="Licence class">
              {({ id }) => (
                <Select
                  id={id}
                  value={d.licence.class}
                  onChange={(e) => setDriver(i, (x) => ({ ...x, licence: { ...x.licence, class: e.target.value as typeof x.licence.class } }))}
                >
                  {['G', 'G1', 'G2', 'M', 'M1', 'M2', 'other'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        </div>
      ))}
    </div>
  );
}

function VehiclesTab({ risk, update }: { risk: AutoRisk; update: (fn: (r: AutoRisk) => AutoRisk) => void }) {
  const setVehicle = (i: number, fn: (v: AutoRisk['vehicles'][number]) => AutoRisk['vehicles'][number]) =>
    update((r) => ({ ...r, vehicles: r.vehicles.map((v, j) => (j === i ? fn(v) : v)) }));

  return (
    <div className="flex flex-col gap-4">
      {risk.vehicles.map((v, i) => (
        <div key={v.id} className="rounded-card border border-border-1 p-4">
          <div className="mb-3 text-caption font-medium uppercase tracking-[0.06em] text-text-3">Vehicle {i + 1}</div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Year">
              {({ id }) => (
                <Input id={id} type="number" value={v.year} onChange={(e) => setVehicle(i, (x) => ({ ...x, year: Number(e.target.value) }))} />
              )}
            </Field>
            <Field label="Make">
              {({ id }) => <Input id={id} value={v.make} onChange={(e) => setVehicle(i, (x) => ({ ...x, make: e.target.value }))} />}
            </Field>
            <Field label="Model">
              {({ id }) => <Input id={id} value={v.model} onChange={(e) => setVehicle(i, (x) => ({ ...x, model: e.target.value }))} />}
            </Field>
            <Field label="VIN">
              {({ id }) => <Input id={id} value={v.vin} onChange={(e) => setVehicle(i, (x) => ({ ...x, vin: e.target.value }))} />}
            </Field>
          </div>
        </div>
      ))}
    </div>
  );
}

function CoveragesTab({ risk, update }: { risk: AutoRisk; update: (fn: (r: AutoRisk) => AutoRisk) => void }) {
  const tpl = limitCents(risk.coverages.liabilityLimit);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Third-party liability limit">
          {({ id }) => (
            <Select
              id={id}
              value={tpl ?? ''}
              onChange={(e) =>
                update((r) => ({
                  ...r,
                  coverages: {
                    ...r.coverages,
                    liabilityLimit: { kind: 'amount', value: { currency: 'CAD', amountCents: Number(e.target.value) } },
                  },
                }))
              }
            >
              {TPL_OPTIONS.map((o) => (
                <option key={o.cents} value={o.cents}>{o.label}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div>
        <div className="mb-2 text-caption font-medium uppercase tracking-[0.06em] text-text-3">
          Accident benefits — post-2026 SABS elections
        </div>
        <div className="flex flex-col gap-1.5">
          {risk.coverages.accidentBenefits.optionalElections.length === 0 ? (
            <span className="text-small text-text-3">No optional benefits elected.</span>
          ) : (
            risk.coverages.accidentBenefits.optionalElections.map((el) => (
              <div key={el.benefit} className="flex items-center gap-2 text-small text-text-1">
                <Badge tone={el.elected ? 'success' : 'neutral'} dot>
                  {el.elected ? 'Elected' : 'Declined'}
                </Badge>
                {SABS_LABELS[el.benefit] ?? el.benefit}
              </div>
            ))
          )}
        </div>
        <p className="mt-2 text-caption text-text-3">
          Offered items are documented even when declined.
        </p>
      </div>
    </div>
  );
}
