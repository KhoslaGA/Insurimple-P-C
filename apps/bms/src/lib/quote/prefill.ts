/**
 * TR.2 prior-policy prefill. Every field of the new-term draft is sourced from the
 * party record (household) + the prior risk — nothing is re-keyed. The broker reviews
 * and adjusts from here.
 */
import type { AutoRisk, PropertyRisk } from '@insurimple/contracts';
import type { Household, PriorHomePolicy, PriorPolicy } from '../mock/household';

export function prefillAutoFromPrior(
  household: Household,
  prior: PriorPolicy,
  effectiveDate: string,
): AutoRisk {
  return {
    ...prior.risk,
    // identity comes from the party record, never re-keyed
    party: { householdId: household.id, clientId: prior.risk.party.clientId },
    namedInsured: household.primaryContact,
    // new term
    effectiveDate,
  };
}

/**
 * A blank new-business auto risk. Even here the named insured comes from the party
 * record (no re-key); the broker fills the rest. Empty strings are placeholders the
 * form overwrites — the draft is validated against AutoRiskSchema only on submit.
 */
export function blankAutoRisk(household: Household, effectiveDate: string): AutoRisk {
  return {
    line: 'auto',
    party: { householdId: household.id },
    effectiveDate,
    province: 'ON',
    namedInsured: household.primaryContact,
    drivers: [
      {
        id: 'drv-1',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        relationshipToApplicant: 'applicant',
        licence: { number: '', province: 'ON', class: 'G', dateFirstLicensed: '' },
        driverTrainingCertified: false,
        convictions: [],
      },
    ],
    vehicles: [
      {
        id: 'veh-1',
        year: 2026,
        make: '',
        model: '',
        vin: '',
        primaryDriverId: 'drv-1',
        use: 'commute',
        ownership: 'owned',
        physicalDamage: {},
        endorsements: [],
      },
    ],
    coverages: {
      liabilityLimit: { kind: 'amount', value: { currency: 'CAD', amountCents: 100000000 } },
      accidentBenefits: { package: 'sabs_standard', optionalElections: [] },
      directCompensationPropertyDamage: { kind: 'included' },
      uninsuredAutomobile: { kind: 'included' },
      endorsements: [],
    },
    history: { cancellations: [], atFaultClaims: [] },
  };
}

export function prefillPropertyFromPrior(
  household: Household,
  prior: PriorHomePolicy,
  effectiveDate: string,
): PropertyRisk {
  return {
    ...prior.risk,
    party: { householdId: household.id, clientId: prior.risk.party.clientId },
    namedInsured: household.primaryContact,
    effectiveDate,
  };
}

export function blankPropertyRisk(household: Household, effectiveDate: string): PropertyRisk {
  const zero = { kind: 'amount' as const, value: { currency: 'CAD' as const, amountCents: 0 } };
  return {
    line: 'property',
    party: { householdId: household.id },
    effectiveDate,
    province: 'ON',
    namedInsured: household.primaryContact,
    riskAddress: household.primaryContact.mailingAddress,
    dwellingType: 'detached',
    occupancy: 'owner_occupied',
    construction: {
      yearBuilt: 2000,
      wall: 'brick_veneer',
      roof: 'asphalt_shingle',
      heating: 'forced_air_gas',
      electrical: 'breakers_200_amp',
      plumbing: 'copper_pex',
      basement: 'unfinished',
    },
    protection: { hydrantDistance: 'within_300m', fireHallDistance: 'within_5km', alarm: 'none', monitored: false },
    coverages: {
      dwellingA: zero,
      detachedStructuresB: zero,
      contentsC: zero,
      additionalLivingD: zero,
      personalLiabilityE: zero,
      voluntaryMedicalF: zero,
      deductible: zero,
      endorsements: [],
    },
    interests: [],
  };
}
