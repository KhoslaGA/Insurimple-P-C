import type { CoverageLimit, Deductible, Oaf1Application } from '@insurimple/contracts';
import { Badge, Card, Table } from '@insurimple/design-system';
import { PrintButton } from './PrintButton';

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-CA')}`;
}
function limit(l: CoverageLimit): string {
  switch (l.kind) {
    case 'amount':
      return money(l.value.amountCents);
    case 'unlimited':
      return 'Unlimited';
    case 'included':
      return 'Included';
    case 'declined':
      return 'Declined';
  }
}
function deductible(d?: Deductible): string {
  if (!d) return '—';
  switch (d.kind) {
    case 'amount':
      return money(d.value.amountCents);
    case 'none':
      return 'None';
    case 'waived':
      return 'Waived';
  }
}

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-caption font-medium uppercase tracking-[0.06em] text-text-3">{title}</div>
      {children}
    </div>
  );
}

export function Oaf1Preview({ oaf1 }: { oaf1: Oaf1Application }) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-h2 font-medium text-text-1">OAF 1 — Application for Automobile Insurance</h2>
          <p className="text-small text-text-3">
            Ontario · from risk {oaf1.riskRef.riskId} v{oaf1.riskRef.version} · effective {oaf1.effectiveDate} · populated from the captured risk, no re-entry
          </p>
        </div>
        <span className="ml-auto">
          <PrintButton />
        </span>
      </div>

      <Card className="flex flex-col gap-5">
        <Section title="Applicant">
          <div className="text-body text-text-1">
            {oaf1.applicant.firstName} {oaf1.applicant.lastName}
            {oaf1.applicant.dateOfBirth ? <span className="text-text-3"> · born {oaf1.applicant.dateOfBirth}</span> : null}
          </div>
          <div className="text-small text-text-2">
            {oaf1.applicant.address.line1}, {oaf1.applicant.address.city} {oaf1.applicant.address.province}{' '}
            {oaf1.applicant.address.postalCode}
          </div>
        </Section>

        <Section title="Listed drivers">
          <Table
            rows={oaf1.listedDrivers}
            rowKey={(d) => d.id}
            columns={[
              { header: 'Name', render: (d) => `${d.firstName} ${d.lastName}` },
              { header: 'Date of birth', render: (d) => d.dateOfBirth },
              { header: 'Licence', render: (d) => d.licence.number },
              { header: 'Class', render: (d) => d.licence.class },
              { header: 'First licensed', render: (d) => d.licence.dateFirstLicensed },
              {
                header: 'Training',
                render: (d) => (d.driverTrainingCertified ? <Badge tone="success">Yes</Badge> : <span className="text-text-3">No</span>),
              },
              { header: 'Convictions', align: 'right', render: (d) => String(d.convictions.length) },
            ]}
          />
        </Section>

        <Section title="Described automobiles">
          <Table
            rows={oaf1.describedAutomobiles}
            rowKey={(v) => v.id}
            columns={[
              { header: 'Vehicle', render: (v) => `${v.year} ${v.make} ${v.model}` },
              { header: 'VIN', render: (v) => v.vin },
              { header: 'Use', render: (v) => v.use },
              { header: 'Collision', render: (v) => deductible(v.physicalDamage.collision?.deductible) },
              { header: 'Comprehensive', render: (v) => deductible(v.physicalDamage.comprehensive?.deductible) },
              { header: 'Endorsements', align: 'right', render: (v) => String(v.endorsements.filter((e) => e.elected).length) },
            ]}
          />
        </Section>

        <Section title="Coverages">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-small">
            <Row label="Third-party liability" value={limit(oaf1.coverages.liabilityLimit)} />
            <Row label="Direct compensation – PD" value={limit(oaf1.coverages.directCompensationPropertyDamage)} />
            <Row label="Uninsured automobile" value={limit(oaf1.coverages.uninsuredAutomobile)} />
          </div>
          <div className="mt-3">
            <div className="mb-1.5 text-caption text-text-3">Accident benefits — post-2026 SABS elections</div>
            <div className="flex flex-col gap-1">
              {oaf1.coverages.accidentBenefits.optionalElections.length === 0 ? (
                <span className="text-small text-text-3">Standard package; no optional benefits elected.</span>
              ) : (
                oaf1.coverages.accidentBenefits.optionalElections.map((el) => (
                  <div key={el.benefit} className="flex items-center gap-2 text-small text-text-1">
                    <Badge tone={el.elected ? 'success' : 'neutral'} dot>
                      {el.elected ? 'Elected' : 'Declined'}
                    </Badge>
                    {SABS_LABELS[el.benefit] ?? el.benefit}
                    {el.limit ? <span className="text-text-3">· {limit(el.limit)}</span> : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </Section>

        <Section title="Previous insurance">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-small">
            <Row label="Prior insurer" value={oaf1.previousInsurance.priorInsurer ?? '—'} />
            <Row label="Prior policy #" value={oaf1.previousInsurance.priorPolicyNumber ?? '—'} />
            <Row
              label="Continuous years insured"
              value={oaf1.previousInsurance.continuousYearsInsured != null ? String(oaf1.previousInsurance.continuousYearsInsured) : '—'}
            />
            <Row label="Cancellations" value={String(oaf1.previousInsurance.cancellations.length)} />
            <Row label="At-fault claims" value={String(oaf1.previousInsurance.atFaultClaims.length)} />
          </div>
        </Section>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border-1 py-1 last:border-0">
      <span className="text-text-2">{label}</span>
      <span className="font-medium text-text-1">{value}</span>
    </div>
  );
}
