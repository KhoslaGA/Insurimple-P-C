'use client';

import { useState, useTransition } from 'react';
import { Avatar, Badge, Button, Field, Input, Modal, Select } from '@insurimple/design-system';
import type { TeamRoster, TeamMember, LicenceRow } from '@insurimple/contracts';
import { grantRole, recordLicence, revokeGrant } from '../app/(app)/team/actions';

const CLASS_LABEL: Record<string, string> = {
  ribo_l1: 'RIBO Level 1',
  ribo_l2: 'RIBO Level 2',
  ribo_l3: 'RIBO Level 3',
  llqp: 'LLQP',
  mortgage_agent: 'Mortgage agent',
  unlicensed: 'Unlicensed',
};

const fmtDate = (v: string | null) => {
  if (!v) return '—';
  const d = new Date(`${v.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
};

function LicenceBadge({ l }: { l: LicenceRow }) {
  if (l.status !== 'active') return <Badge tone="danger">{l.status}</Badge>;
  if (l.expired) return <Badge tone="danger">Expired</Badge>;
  if (l.expiring_soon) return <Badge tone="warning">Expiring soon</Badge>;
  return <Badge tone="success">Active</Badge>;
}

export function TeamView({
  roster,
  canManage,
  preview = false,
}: {
  roster: TeamRoster;
  canManage: boolean;
  preview?: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [licenceFor, setLicenceFor] = useState<TeamMember | null>(null);
  const [grantFor, setGrantFor] = useState<TeamMember | null>(null);

  // licence form
  const [lClass, setLClass] = useState('ribo_l1');
  const [lNumber, setLNumber] = useState('');
  const [lExpires, setLExpires] = useState('');
  // grant form
  const [gRole, setGRole] = useState(roster.roles[0]?.code ?? '');
  const [gLicence, setGLicence] = useState('');

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, close: () => void) => {
    setError(null);
    start(async () => {
      const r = await fn();
      if (r.ok) close();
      else setError(r.error ?? 'The action was refused.');
    });
  };

  const disabled = !canManage || preview || pending;

  return (
    <>
      {!canManage ? (
        <div className="mb-4 rounded-card border border-border-1 bg-surface-panel px-4 py-3 text-small text-text-2">
          <i className="ti ti-lock mr-1.5 text-[15px]" />
          You can view the roster but not change it — recording a licence or granting a
          role requires the <span className="tabular-nums">team.manage</span> capability,
          held by the principal broker. The database enforces this.
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {roster.members.map((m) => (
          <section key={m.id} className="rounded-card border border-border-1 bg-surface-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar name={m.full_name} size="sm" />
              <div className="min-w-0">
                <div className="font-medium text-text-1">{m.full_name}</div>
                <div className="text-caption text-text-3">{m.email}</div>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" disabled={disabled} onClick={() => { setLicenceFor(m); setError(null); }}>
                  Record licence
                </Button>
                <Button variant="secondary" size="sm" disabled={disabled} onClick={() => { setGrantFor(m); setError(null); }}>
                  Grant role
                </Button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <h3 className="mb-1.5 text-caption font-medium uppercase tracking-caps text-text-3">Licences</h3>
                {m.licences.length ? (
                  <div className="flex flex-col gap-1.5">
                    {m.licences.map((l) => (
                      <div key={l.id} className="flex flex-wrap items-center gap-2 text-small">
                        <span className="text-text-1">{CLASS_LABEL[l.licence_class] ?? l.licence_class}</span>
                        <span className="tabular-nums text-text-3">{l.licence_number ?? '—'}</span>
                        <span className="tabular-nums text-caption text-text-3">exp {fmtDate(l.expires_on)}</span>
                        <LicenceBadge l={l} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-small text-text-3">None on file — no transaction authority.</p>
                )}
              </div>

              <div>
                <h3 className="mb-1.5 text-caption font-medium uppercase tracking-caps text-text-3">Roles</h3>
                {m.grants.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {m.grants.map((g) => (
                      <span key={g.id} className="inline-flex items-center gap-1">
                        <Badge tone="accent">{g.role_name}</Badge>
                        {canManage && !preview ? (
                          <button
                            aria-label={`Revoke ${g.role_name}`}
                            disabled={pending}
                            onClick={() => run(() => revokeGrant(g.id), () => {})}
                            className="text-text-3 hover:text-danger"
                          >
                            <i className="ti ti-x text-[13px]" />
                          </button>
                        ) : null}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-small text-text-3">No roles granted.</p>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Record licence */}
      <Modal
        open={!!licenceFor}
        title={`Record licence — ${licenceFor?.full_name ?? ''}`}
        onClose={() => setLicenceFor(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setLicenceFor(null)} disabled={pending}>Cancel</Button>
            <Button
              disabled={disabled}
              onClick={() =>
                run(
                  () => recordLicence({
                    staffId: licenceFor!.id,
                    licenceClass: lClass,
                    licenceNumber: lNumber.trim() || undefined,
                    regulator: lClass.startsWith('ribo') ? 'RIBO' : 'FSRA',
                    expiresOn: lExpires || undefined,
                  }),
                  () => setLicenceFor(null),
                )
              }
            >
              {pending ? 'Saving…' : 'Record licence'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Class" required>
            <Select value={lClass} onChange={(e) => setLClass(e.target.value)}>
              {Object.entries(CLASS_LABEL).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Licence number">
            <Input value={lNumber} placeholder="RIBO-100200" onChange={(e) => setLNumber(e.target.value)} />
          </Field>
          <Field label="Expires" help="Authority stops the day after this date — the database enforces it.">
            <Input type="date" value={lExpires} onChange={(e) => setLExpires(e.target.value)} />
          </Field>
          {error ? <p className="m-0 text-small text-danger">{error}</p> : null}
        </div>
      </Modal>

      {/* Grant role */}
      <Modal
        open={!!grantFor}
        title={`Grant role — ${grantFor?.full_name ?? ''}`}
        onClose={() => setGrantFor(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setGrantFor(null)} disabled={pending}>Cancel</Button>
            <Button
              disabled={disabled}
              onClick={() =>
                run(
                  () => grantRole({
                    staffId: grantFor!.id,
                    roleCode: gRole,
                    licenceId: gLicence || undefined,
                  }),
                  () => setGrantFor(null),
                )
              }
            >
              {pending ? 'Granting…' : 'Grant role'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Role" required>
            <Select value={gRole} onChange={(e) => setGRole(e.target.value)}>
              {roster.roles.map((r) => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </Select>
          </Field>
          <Field
            label="Anchor to licence"
            help="Anchored grants stop working the moment the licence lapses. Leave unset only for non-transacting roles."
          >
            <Select value={gLicence} onChange={(e) => setGLicence(e.target.value)}>
              <option value="">No licence anchor</option>
              {(grantFor?.licences ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {CLASS_LABEL[l.licence_class] ?? l.licence_class} · exp {fmtDate(l.expires_on)}
                </option>
              ))}
            </Select>
          </Field>
          {error ? <p className="m-0 text-small text-danger">{error}</p> : null}
        </div>
      </Modal>
    </>
  );
}
