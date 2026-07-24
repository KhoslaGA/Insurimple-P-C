'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { AutoRisk, CoverageLimit, PropertyRisk, Risk } from '@insurimple/contracts';
import { Badge, Button, Card, Field, Input, Select, Switch, Tabs } from '@insurimple/design-system';
import type { Household, PriorHomePolicy, PriorPolicy } from '@/lib/mock/household';
import {
  blankAutoRisk,
  blankPropertyRisk,
  prefillAutoFromPrior,
  prefillPropertyFromPrior,
} from '@/lib/quote/prefill';
import { clearDraft, loadDraft, saveDraft, type QuoteDraft } from '@/lib/quote/draft';

const AUTO_TABS = [
  { value: 'applicant', label: 'Applicant' },
  { value: 'drivers', label: 'Drivers' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'coverages', label: 'Coverages' },
];
const PROPERTY_TABS = [
  { value: 'dwelling', label: 'Dwelling' },
  { value: 'construction', label: 'Construction' },
  { value: 'protection', label: 'Protection' },
  { value: 'pcoverages', label: 'Coverages' },
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

const DWELLING_TYPES = ['detached', 'semi_detached', 'townhouse', 'apartment_unit', 'rented_house', 'condo_unit_owned', 'basement_apartment', 'seasonal'] as const;
const OCCUPANCY = ['owner_occupied', 'tenant_occupied', 'rented_to_others', 'seasonal', 'vacant'] as const;
const WALL = ['brick_veneer', 'frame', 'solid_brick', 'stone'] as const;
const ROOF = ['asphalt_shingle', 'metal', 'tile', 'flat_membrane'] as const;
const HEATING = ['forced_air_gas', 'electric_baseboard', 'heat_pump', 'oil', 'wood_stove'] as const;
const ELECTRICAL = ['breakers_200_amp', 'breakers_100_amp', 'fuses'] as const;
const PLUMBING = ['copper_pex', 'kitec', 'galvanized'] as const;
const BASEMENT = ['finished', 'partially_finished', 'unfinished', 'none_slab'] as const;
const HYDRANT = ['within_300m', '300m_to_1km', 'over_1km'] as const;
const FIREHALL = ['within_5km', '5km_to_8km', 'over_8km'] as const;
const ALARM = ['fire_and_burglary', 'fire_only', 'local_only', 'none'] as const;

function humanize(s: string): string {
  return s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}
function limitCents(limit: CoverageLimit): number {
  return limit.kind === 'amount' ? limit.value.amountCents : 0;
}
function centsToLimit(cents: number): CoverageLimit {
  return { kind: 'amount', value: { currency: 'CAD', amountCents: cents } };
}
function nowLabel(): string {
  // App UI may read the clock; the domain never does.
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

export function QuoteWorkspace({
  household,
  priorAuto,
  priorHome,
}: {
  household: Household;
  priorAuto: PriorPolicy;
  priorHome: PriorHomePolicy;
}) {
  const router = useRouter();
  const [risk, setRisk] = useState<Risk | null>(null);
  const [tab, setTab] = useState('applicant');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [resumable, setResumable] = useState<QuoteDraft | null>(null);

  useEffect(() => {
    setResumable(loadDraft(household.id));
  }, [household.id]);

  function start(next: Risk, firstTab: string) {
    setRisk(next);
    setTab(firstTab);
    setSavedAt(null);
  }
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

  const updateAuto = (fn: (r: AutoRisk) => AutoRisk) =>
    setRisk((r) => (r && r.line === 'auto' ? fn(r) : r));
  const updateProperty = (fn: (r: PropertyRisk) => PropertyRisk) =>
    setRisk((r) => (r && r.line === 'property' ? fn(r) : r));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <PartyHeader household={household} />

      {risk === null ? (
        <StartPanel
          priorAuto={priorAuto}
          priorHome={priorHome}
          resumable={resumable}
          onPrefillAuto={() => start(prefillAutoFromPrior(household, priorAuto, priorAuto.expiresOn), 'applicant')}
          onBlankAuto={() => start(blankAutoRisk(household, priorAuto.expiresOn), 'applicant')}
          onPrefillHome={() => start(prefillPropertyFromPrior(household, priorHome, priorHome.expiresOn), 'dwelling')}
          onBlankHome={() => start(blankPropertyRisk(household, priorHome.expiresOn), 'dwelling')}
          onResume={() => resumable && start(resumable.risk, resumable.risk.line === 'auto' ? 'applicant' : 'dwelling')}
          onDiscard={handleDiscard}
        />
      ) : (
        <Card className="flex flex-col gap-4 p-0">
          <div className="flex items-center gap-2 border-b border-border-1 px-5 pt-4">
            <Tabs tabs={risk.line === 'auto' ? AUTO_TABS : PROPERTY_TABS} value={tab} onValueChange={setTab} />
            <Badge tone="accent" className="ml-auto mb-2">{risk.line === 'auto' ? 'Auto' : 'Home'}</Badge>
          </div>

          <div className="px-5 pb-5">
            {risk.line === 'auto' ? (
              <>
                {tab === 'applicant' && <ApplicantTab risk={risk} update={updateAuto} />}
                {tab === 'drivers' && <DriversTab risk={risk} update={updateAuto} />}
                {tab === 'vehicles' && <VehiclesTab risk={risk} update={updateAuto} />}
                {tab === 'coverages' && <CoveragesTab risk={risk} update={updateAuto} />}
              </>
            ) : (
              <>
                {tab === 'dwelling' && <DwellingTab risk={risk} update={updateProperty} />}
                {tab === 'construction' && <ConstructionTab risk={risk} update={updateProperty} />}
                {tab === 'protection' && <ProtectionTab risk={risk} update={updateProperty} />}
                {tab === 'pcoverages' && <PropertyCoveragesTab risk={risk} update={updateProperty} />}
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border-1 bg-surface-panel px-5 py-3">
            <span className="text-caption text-text-3">
              Indicative until a carrier quotes this exact risk. Quoting never binds.
            </span>
            <span className="ml-auto flex items-center gap-3">
              {savedAt ? <span className="text-caption text-text-3">Saved {savedAt}</span> : null}
              <Button variant="ghost" size="sm" onClick={handleDiscard}>
                Start over
              </Button>
              {risk.line === 'auto' ? (
                <Button variant="ghost" size="sm" onClick={() => router.push('/oaf1')}>
                  Preview OAF 1
                </Button>
              ) : null}
              <Button variant="secondary" size="sm" onClick={handleSave}>
                Save draft
              </Button>
              <Button variant="primary" size="sm" onClick={() => router.push('/compare')}>
                Shop this risk
              </Button>
            </span>
          </div>
        </Card>
      )}
    </div>
  );
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
        <div className="text-small text-text-3">
          {household.primaryContact.mailingAddress.line1}, {household.primaryContact.mailingAddress.city}{' '}
          {household.primaryContact.mailingAddress.province} {household.primaryContact.mailingAddress.postalCode}
        </div>
      </div>
    </Card>
  );
}

function StartPanel({
  priorAuto,
  priorHome,
  resumable,
  onPrefillAuto,
  onBlankAuto,
  onPrefillHome,
  onBlankHome,
  onResume,
  onDiscard,
}: {
  priorAuto: PriorPolicy;
  priorHome: PriorHomePolicy;
  resumable: QuoteDraft | null;
  onPrefillAuto: () => void;
  onBlankAuto: () => void;
  onPrefillHome: () => void;
  onBlankHome: () => void;
  onResume: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {resumable ? (
        <Card className="flex items-center gap-3 bg-tenant-primary-tint/40">
          <div>
            <div className="text-small font-medium text-text-1">You have a saved draft for this household</div>
            <div className="text-caption text-text-3">Last updated {resumable.updatedAt}. Resume it, or start over.</div>
          </div>
          <span className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" onClick={onDiscard}>Start over</Button>
            <Button variant="primary" size="sm" onClick={onResume}>Resume draft</Button>
          </span>
        </Card>
      ) : null}

      <div>
        <h3 className="text-body font-medium text-text-1">Start a quote</h3>
        <p className="text-small text-text-2">
          The risk is captured once and reused for every carrier. Prefilling reuses last term&apos;s risk —
          nothing is re-keyed from the party record.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LineStartCard title="Auto" policyNumber={priorAuto.policyNumber} carrier={priorAuto.carrier} expiresOn={priorAuto.expiresOn} onPrefill={onPrefillAuto} onBlank={onBlankAuto} />
        <LineStartCard title="Home" policyNumber={priorHome.policyNumber} carrier={priorHome.carrier} expiresOn={priorHome.expiresOn} onPrefill={onPrefillHome} onBlank={onBlankHome} />
      </div>
    </div>
  );
}

function LineStartCard({
  title,
  policyNumber,
  carrier,
  expiresOn,
  onPrefill,
  onBlank,
}: {
  title: string;
  policyNumber: string;
  carrier: string;
  expiresOn: string;
  onPrefill: () => void;
  onBlank: () => void;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <h3 className="text-body font-medium text-text-1">{title}</h3>
      <div className="rounded-card border border-border-1 bg-surface-panel p-3">
        <div className="text-caption font-medium uppercase tracking-[0.06em] text-text-3">Prior policy</div>
        <div className="mt-1 text-small text-text-1">{policyNumber} · {carrier} · expires {expiresOn}</div>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={onPrefill}>Prefill from prior policy</Button>
        <Button variant="secondary" size="sm" onClick={onBlank}>Blank</Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared field helpers
// ---------------------------------------------------------------------------

function EnumSelect({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      {({ id }) => (
        <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o} value={o}>{humanize(o)}</option>
          ))}
        </Select>
      )}
    </Field>
  );
}

function TextField({ label, value, onChange, className, hint }: { label: string; value: string; onChange: (v: string) => void; className?: string; hint?: string }) {
  return (
    <Field label={label} hint={hint} className={className}>
      {({ id }) => <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />}
    </Field>
  );
}

function DollarField({ label, cents, onCents }: { label: string; cents: number; onCents: (c: number) => void }) {
  return (
    <Field label={label} hint="whole dollars">
      {({ id }) => <Input id={id} type="number" value={Math.round(cents / 100)} onChange={(e) => onCents(Number(e.target.value) * 100)} />}
    </Field>
  );
}

function Prefilled(): ReactNode {
  return <p className="text-caption text-text-3">Prefilled from the party record — review and adjust.</p>;
}

// ---------------------------------------------------------------------------
// Auto tabs
// ---------------------------------------------------------------------------

type AutoTab = { risk: AutoRisk; update: (fn: (r: AutoRisk) => AutoRisk) => void };

function ApplicantTab({ risk, update }: AutoTab) {
  const ni = risk.namedInsured;
  const setNi = (patch: Partial<AutoRisk['namedInsured']>) => update((r) => ({ ...r, namedInsured: { ...r.namedInsured, ...patch } }));
  const setAddr = (patch: Partial<AutoRisk['namedInsured']['mailingAddress']>) => update((r) => ({ ...r, namedInsured: { ...r.namedInsured, mailingAddress: { ...r.namedInsured.mailingAddress, ...patch } } }));
  return (
    <div className="flex flex-col gap-4">
      <Prefilled />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="First name" value={ni.firstName} onChange={(v) => setNi({ firstName: v })} />
        <TextField label="Last name" value={ni.lastName} onChange={(v) => setNi({ lastName: v })} />
        <TextField label="Date of birth" hint="YYYY-MM-DD" value={ni.dateOfBirth ?? ''} onChange={(v) => setNi({ dateOfBirth: v })} />
        <TextField label="Effective date" hint="YYYY-MM-DD" value={risk.effectiveDate} onChange={(v) => update((r) => ({ ...r, effectiveDate: v }))} />
        <TextField label="Address" className="col-span-2" value={ni.mailingAddress.line1} onChange={(v) => setAddr({ line1: v })} />
        <TextField label="City" value={ni.mailingAddress.city} onChange={(v) => setAddr({ city: v })} />
        <TextField label="Postal code" value={ni.mailingAddress.postalCode} onChange={(v) => setAddr({ postalCode: v })} />
      </div>
    </div>
  );
}

function DriversTab({ risk, update }: AutoTab) {
  const setDriver = (i: number, fn: (d: AutoRisk['drivers'][number]) => AutoRisk['drivers'][number]) => update((r) => ({ ...r, drivers: r.drivers.map((d, j) => (j === i ? fn(d) : d)) }));
  return (
    <div className="flex flex-col gap-4">
      {risk.drivers.map((d, i) => (
        <div key={d.id} className="rounded-card border border-border-1 p-4">
          <div className="mb-3 text-caption font-medium uppercase tracking-[0.06em] text-text-3">Driver {i + 1} · {d.relationshipToApplicant}</div>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="First name" value={d.firstName} onChange={(v) => setDriver(i, (x) => ({ ...x, firstName: v }))} />
            <TextField label="Last name" value={d.lastName} onChange={(v) => setDriver(i, (x) => ({ ...x, lastName: v }))} />
            <TextField label="Licence number" value={d.licence.number} onChange={(v) => setDriver(i, (x) => ({ ...x, licence: { ...x.licence, number: v } }))} />
            <EnumSelect label="Licence class" options={['G', 'G1', 'G2', 'M', 'M1', 'M2', 'other']} value={d.licence.class} onChange={(v) => setDriver(i, (x) => ({ ...x, licence: { ...x.licence, class: v as AutoRisk['drivers'][number]['licence']['class'] } }))} />
          </div>
        </div>
      ))}
    </div>
  );
}

function VehiclesTab({ risk, update }: AutoTab) {
  const setVehicle = (i: number, fn: (v: AutoRisk['vehicles'][number]) => AutoRisk['vehicles'][number]) => update((r) => ({ ...r, vehicles: r.vehicles.map((v, j) => (j === i ? fn(v) : v)) }));
  return (
    <div className="flex flex-col gap-4">
      {risk.vehicles.map((v, i) => (
        <div key={v.id} className="rounded-card border border-border-1 p-4">
          <div className="mb-3 text-caption font-medium uppercase tracking-[0.06em] text-text-3">Vehicle {i + 1}</div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Year">
              {({ id }) => <Input id={id} type="number" value={v.year} onChange={(e) => setVehicle(i, (x) => ({ ...x, year: Number(e.target.value) }))} />}
            </Field>
            <TextField label="Make" value={v.make} onChange={(val) => setVehicle(i, (x) => ({ ...x, make: val }))} />
            <TextField label="Model" value={v.model} onChange={(val) => setVehicle(i, (x) => ({ ...x, model: val }))} />
            <TextField label="VIN" value={v.vin} onChange={(val) => setVehicle(i, (x) => ({ ...x, vin: val }))} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CoveragesTab({ risk, update }: AutoTab) {
  const tpl = limitCents(risk.coverages.liabilityLimit);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Third-party liability limit">
          {({ id }) => (
            <Select id={id} value={tpl} onChange={(e) => update((r) => ({ ...r, coverages: { ...r.coverages, liabilityLimit: centsToLimit(Number(e.target.value)) } }))}>
              {TPL_OPTIONS.map((o) => (
                <option key={o.cents} value={o.cents}>{o.label}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <div>
        <div className="mb-2 text-caption font-medium uppercase tracking-[0.06em] text-text-3">Accident benefits — post-2026 SABS elections</div>
        <div className="flex flex-col gap-1.5">
          {risk.coverages.accidentBenefits.optionalElections.length === 0 ? (
            <span className="text-small text-text-3">No optional benefits elected.</span>
          ) : (
            risk.coverages.accidentBenefits.optionalElections.map((el) => (
              <div key={el.benefit} className="flex items-center gap-2 text-small text-text-1">
                <Badge tone={el.elected ? 'success' : 'neutral'} dot>{el.elected ? 'Elected' : 'Declined'}</Badge>
                {SABS_LABELS[el.benefit] ?? el.benefit}
              </div>
            ))
          )}
        </div>
        <p className="mt-2 text-caption text-text-3">Offered items are documented even when declined.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Property tabs
// ---------------------------------------------------------------------------

type PropTab = { risk: PropertyRisk; update: (fn: (r: PropertyRisk) => PropertyRisk) => void };

function DwellingTab({ risk, update }: PropTab) {
  const setAddr = (patch: Partial<PropertyRisk['riskAddress']>) => update((r) => ({ ...r, riskAddress: { ...r.riskAddress, ...patch } }));
  return (
    <div className="flex flex-col gap-4">
      <Prefilled />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Risk location" className="col-span-2" value={risk.riskAddress.line1} onChange={(v) => setAddr({ line1: v })} />
        <TextField label="City" value={risk.riskAddress.city} onChange={(v) => setAddr({ city: v })} />
        <TextField label="Postal code" value={risk.riskAddress.postalCode} onChange={(v) => setAddr({ postalCode: v })} />
        <EnumSelect label="Dwelling type" options={DWELLING_TYPES} value={risk.dwellingType} onChange={(v) => update((r) => ({ ...r, dwellingType: v as PropertyRisk['dwellingType'] }))} />
        <EnumSelect label="Occupancy" options={OCCUPANCY} value={risk.occupancy} onChange={(v) => update((r) => ({ ...r, occupancy: v as PropertyRisk['occupancy'] }))} />
        <TextField label="Effective date" hint="YYYY-MM-DD" value={risk.effectiveDate} onChange={(v) => update((r) => ({ ...r, effectiveDate: v }))} />
      </div>
    </div>
  );
}

function ConstructionTab({ risk, update }: PropTab) {
  const c = risk.construction;
  const set = (patch: Partial<PropertyRisk['construction']>) => update((r) => ({ ...r, construction: { ...r.construction, ...patch } }));
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="Year built">
        {({ id }) => <Input id={id} type="number" value={c.yearBuilt} onChange={(e) => set({ yearBuilt: Number(e.target.value) })} />}
      </Field>
      <EnumSelect label="Wall" options={WALL} value={c.wall} onChange={(v) => set({ wall: v as PropertyRisk['construction']['wall'] })} />
      <EnumSelect label="Roof" options={ROOF} value={c.roof} onChange={(v) => set({ roof: v as PropertyRisk['construction']['roof'] })} />
      <EnumSelect label="Heating" options={HEATING} value={c.heating} onChange={(v) => set({ heating: v as PropertyRisk['construction']['heating'] })} />
      <EnumSelect label="Electrical" options={ELECTRICAL} value={c.electrical} onChange={(v) => set({ electrical: v as PropertyRisk['construction']['electrical'] })} />
      <EnumSelect label="Plumbing" options={PLUMBING} value={c.plumbing} onChange={(v) => set({ plumbing: v as PropertyRisk['construction']['plumbing'] })} />
      <EnumSelect label="Basement" options={BASEMENT} value={c.basement} onChange={(v) => set({ basement: v as PropertyRisk['construction']['basement'] })} />
    </div>
  );
}

function ProtectionTab({ risk, update }: PropTab) {
  const p = risk.protection;
  const set = (patch: Partial<PropertyRisk['protection']>) => update((r) => ({ ...r, protection: { ...r.protection, ...patch } }));
  return (
    <div className="grid grid-cols-2 gap-4">
      <EnumSelect label="Distance to hydrant" options={HYDRANT} value={p.hydrantDistance} onChange={(v) => set({ hydrantDistance: v as PropertyRisk['protection']['hydrantDistance'] })} />
      <EnumSelect label="Distance to fire hall" options={FIREHALL} value={p.fireHallDistance} onChange={(v) => set({ fireHallDistance: v as PropertyRisk['protection']['fireHallDistance'] })} />
      <EnumSelect label="Alarm" options={ALARM} value={p.alarm} onChange={(v) => set({ alarm: v as PropertyRisk['protection']['alarm'] })} />
      <div className="flex items-end pb-2">
        <Switch label="Monitored" checked={p.monitored} onChange={(e) => set({ monitored: e.target.checked })} />
      </div>
    </div>
  );
}

function PropertyCoveragesTab({ risk, update }: PropTab) {
  const cov = risk.coverages;
  const setCov = (patch: Partial<PropertyRisk['coverages']>) => update((r) => ({ ...r, coverages: { ...r.coverages, ...patch } }));
  return (
    <div className="flex flex-col gap-4">
      <Prefilled />
      <div className="grid grid-cols-2 gap-4">
        <DollarField label="Coverage A — dwelling" cents={limitCents(cov.dwellingA)} onCents={(c) => setCov({ dwellingA: centsToLimit(c) })} />
        <DollarField label="Coverage C — contents" cents={limitCents(cov.contentsC)} onCents={(c) => setCov({ contentsC: centsToLimit(c) })} />
        <DollarField label="Coverage E — personal liability" cents={limitCents(cov.personalLiabilityE)} onCents={(c) => setCov({ personalLiabilityE: centsToLimit(c) })} />
        <DollarField label="Deductible" cents={cov.deductible.kind === 'amount' ? cov.deductible.value.amountCents : 0} onCents={(c) => setCov({ deductible: { kind: 'amount', value: { currency: 'CAD', amountCents: c } } })} />
      </div>
      <div>
        <div className="mb-2 text-caption font-medium uppercase tracking-[0.06em] text-text-3">Endorsements</div>
        <div className="flex flex-col gap-1.5">
          {cov.endorsements.length === 0 ? (
            <span className="text-small text-text-3">No endorsements.</span>
          ) : (
            cov.endorsements.map((e) => (
              <div key={e.code} className="flex items-center gap-2 text-small text-text-1">
                <Badge tone={e.elected ? 'success' : 'neutral'} dot>{e.elected ? 'Elected' : 'Declined'}</Badge>
                {e.name}
              </div>
            ))
          )}
        </div>
        <p className="mt-2 text-caption text-text-3">Offered items are documented even when declined.</p>
      </div>
    </div>
  );
}
