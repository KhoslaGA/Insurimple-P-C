/**
 * Deterministic risk fixtures (CLAUDE.md invariant #7: mock data is first-class).
 * Numbers mirror the Property-Lines / Rating-and-Carrier prototypes — the
 * Okonkwo & Mensah household in Brampton, ON.
 *
 * Each fixture is returned already parsed (schema defaults applied), so tests
 * get a fully-formed canonical risk without restating every defaulted field.
 */
import { AutoRiskSchema, PropertyRiskSchema, cad, type AutoRisk, type PropertyRisk } from '../src';

export function autoRiskFixture(): AutoRisk {
  return AutoRiskSchema.parse({
    line: 'auto',
    party: { householdId: 'OKONKA01', clientId: 'CL-AMARA' },
    effectiveDate: '2026-07-01',
    namedInsured: {
      firstName: 'Amara',
      lastName: 'Okonkwo',
      dateOfBirth: '1986-04-12',
      mailingAddress: {
        line1: '42 Sunnybrae Crescent',
        city: 'Brampton',
        province: 'ON',
        postalCode: 'L6Z 1R6',
      },
    },
    drivers: [
      {
        id: 'drv-1',
        firstName: 'Amara',
        lastName: 'Okonkwo',
        dateOfBirth: '1986-04-12',
        relationshipToApplicant: 'applicant',
        licence: {
          number: 'O1234-56789-01234',
          province: 'ON',
          class: 'G',
          dateFirstLicensed: '2004-05-01',
        },
        driverTrainingCertified: true,
      },
      {
        id: 'drv-2',
        firstName: 'Daniel',
        lastName: 'Mensah',
        dateOfBirth: '1984-09-30',
        relationshipToApplicant: 'spouse',
        licence: {
          number: 'M9876-54321-09876',
          province: 'ON',
          class: 'G',
          dateFirstLicensed: '2002-11-20',
        },
        convictions: [{ date: '2024-03-15', severity: 'minor', description: 'Speeding 20km/h over' }],
      },
    ],
    vehicles: [
      {
        id: 'veh-1',
        year: 2022,
        make: 'Toyota',
        model: 'RAV4',
        vin: '2T3P1RFV5NW123456',
        primaryDriverId: 'drv-1',
        use: 'commute',
        annualKm: 18000,
        commuteOneWayKm: 22,
        ownership: 'financed',
        physicalDamage: {
          collision: { elected: true, deductible: { kind: 'amount', value: cad(1000) } },
          comprehensive: { elected: true, deductible: { kind: 'amount', value: cad(1000) } },
        },
        endorsements: [
          { code: 'OPCF 20', name: 'Loss of use', elected: true },
          { code: 'OPCF 43', name: 'Removing depreciation deduction', elected: false },
        ],
      },
    ],
    coverages: {
      liabilityLimit: { kind: 'amount', value: cad(1000000) },
      accidentBenefits: {
        optionalElections: [
          { benefit: 'increased_medical_rehab', elected: true, limit: { kind: 'amount', value: cad(1000000) } },
          { benefit: 'caregiver', elected: false },
          { benefit: 'income_replacement_topup', elected: true, limit: { kind: 'amount', value: cad(1000) } },
        ],
      },
      directCompensationPropertyDamage: { kind: 'included' },
      uninsuredAutomobile: { kind: 'included' },
      endorsements: [{ code: 'OPCF 44', name: 'Family protection coverage', elected: true }],
    },
    history: {
      priorInsurer: 'Maple Mutual',
      priorPolicyNumber: 'MM-889-2201',
      continuousYearsInsured: 6,
    },
  });
}

export function propertyRiskFixture(): PropertyRisk {
  return PropertyRiskSchema.parse({
    line: 'property',
    party: { householdId: 'OKONKA01', clientId: 'CL-AMARA' },
    effectiveDate: '2026-07-01',
    province: 'ON',
    namedInsured: {
      firstName: 'Amara',
      lastName: 'Okonkwo',
      dateOfBirth: '1986-04-12',
      mailingAddress: {
        line1: '42 Sunnybrae Crescent',
        city: 'Brampton',
        province: 'ON',
        postalCode: 'L6Z 1R6',
      },
    },
    riskAddress: {
      line1: '128 Chinguacousy Road',
      city: 'Brampton',
      province: 'ON',
      postalCode: 'L6Y 2R4',
    },
    dwellingType: 'detached',
    occupancy: 'owner_occupied',
    construction: {
      yearBuilt: 1998,
      storeys: 2,
      squareFeet: 2100,
      wall: 'brick_veneer',
      roof: 'asphalt_shingle',
      heating: 'forced_air_gas',
      electrical: 'breakers_200_amp',
      plumbing: 'copper_pex',
      basement: 'finished',
    },
    protection: {
      hydrantDistance: 'within_300m',
      fireHallDistance: 'within_5km',
      alarm: 'fire_and_burglary',
      monitored: true,
    },
    coverages: {
      dwellingA: { kind: 'amount', value: cad(684000) },
      detachedStructuresB: { kind: 'amount', value: cad(68400) },
      contentsC: { kind: 'amount', value: cad(478800) },
      additionalLivingD: { kind: 'amount', value: cad(136800) },
      personalLiabilityE: { kind: 'amount', value: cad(1000000) },
      voluntaryMedicalF: { kind: 'amount', value: cad(5000) },
      deductible: { kind: 'amount', value: cad(2500) },
      waterDeductible: { kind: 'amount', value: cad(5000) },
      endorsements: [
        { code: 'SEWER', name: 'Sewer backup', elected: true, limit: { kind: 'amount', value: cad(25000) } },
        { code: 'OVERLAND', name: 'Overland water', elected: false },
      ],
    },
    interests: [
      { id: 'int-1', type: 'mortgagee', name: 'First Dominion Bank', reference: 'FD-88213307' },
    ],
    valuation: {
      source: 'evaluator',
      evaluatedAt: '2026-07-15',
      rebuildCostA: cad(684000),
      detachedStructuresPct: 10,
      contentsPct: 70,
      additionalLivingPct: 20,
    },
  });
}
