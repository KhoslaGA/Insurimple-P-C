import type { TeamMember } from '@insurimple/contracts';

/**
 * What a role requires of a licence, and whether a given person can satisfy it.
 *
 * Both facts live in the database and neither reached the screen. The grant
 * guard (0011_capability_licence_scope.sql) refuses an unanchored grant for a
 * licensed role, and refuses an anchor whose class cannot carry the role — so
 * the principal broker discovered the rule by submitting the form and reading a
 * 403, once per role.
 *
 * In `lib` rather than inside TeamView because the rule is the valuable part
 * and the grant form is a closed modal on first paint: a static render cannot
 * see inside it, so logic left in the component is logic that cannot be
 * asserted without driving a browser.
 *
 * Two different questions, deliberately kept apart:
 *
 *   CAN IT BE GRANTED — does the member hold a licence of an accepted class?
 *     That is what the database checks at grant time.
 *   WILL IT CONFER AUTHORITY — is that licence active and unexpired? The guard
 *     does NOT check this; `actor_capabilities()` resolves it at USE time, so a
 *     grant anchored to a lapsed licence saves cleanly and silently confers
 *     nothing. Saying so is the whole point of showing any of this.
 */
export const CLASS_LABEL: Record<string, string> = {
  ribo_l1: 'RIBO Level 1',
  ribo_l2: 'RIBO Level 2',
  ribo_l3: 'RIBO Level 3',
  llqp: 'LLQP',
  mortgage_agent: 'Mortgage agent',
  unlicensed: 'Unlicensed',
};

export const classList = (classes: string[]) =>
  classes.map((c) => CLASS_LABEL[c] ?? c).join(', ');

export interface RoleEligibility {
  /** The role declares accepted licence classes, so a grant MUST be anchored. */
  needsLicence: boolean;
  /** Licences of an accepted class — what the DB guard will accept. */
  eligible: TeamMember['licences'];
  /** Of those, the ones actually active and unexpired — what will confer authority. */
  live: TeamMember['licences'];
}

export function roleEligibility(
  role: { code: string; licence_classes: string[] },
  member: Pick<TeamMember, 'licences'> | null,
): RoleEligibility {
  const accepted = role.licence_classes;
  if (accepted.length === 0) return { needsLicence: false, eligible: [], live: [] };

  const eligible = (member?.licences ?? []).filter((l) => accepted.includes(l.licence_class));
  const live = eligible.filter((l) => l.status === 'active' && !l.expired);
  return { needsLicence: true, eligible, live };
}

/** The one sentence the form shows, or null when there is nothing to say. */
export function eligibilityMessage(
  role: { name: string; licence_classes: string[] },
  e: RoleEligibility,
): string {
  if (!e.needsLicence) {
    return `${role.name} carries no licensed capability, so it needs no anchor.`;
  }
  const base = `${role.name} requires a licence on file: ${classList(role.licence_classes)}.`;
  if (e.eligible.length === 0) {
    return `${base} This person holds none of those — record the licence first.`;
  }
  if (e.live.length === 0) {
    return `${base} The only matching licence has lapsed: the grant will save and confer nothing until it is renewed.`;
  }
  return base;
}
