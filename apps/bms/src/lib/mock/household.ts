/**
 * Deterministic mock party spine (CLAUDE.md #7: mock data is first-class). Stands in
 * for the NestJS + Postgres party/policy layer until that backend is wired. Shapes the
 * household + a prior auto policy the quote workspace prefills from.
 */
import {
  AutoRiskSchema,
  PropertyRiskSchema,
  type AutoRisk,
  type NamedInsured,
  type PropertyRisk,
} from '@insurimple/contracts';

export interface Household {
  id: string;
  code: string;
  displayName: string;
  primaryContact: NamedInsured;
  phone: string;
  email: string;
}

export interface PriorPolicy {
  policyNumber: string;
  line: 'auto';
  carrier: string;
  expiresOn: string;
  /** The risk as last written — a full canonical AutoRisk from the prior term. */
  risk: AutoRisk;
}

export const mockHousehold: Household = {
  id: 'OKONKA01',
  code: 'OKONKA01',
  displayName: 'Amara Okonkwo & Daniel Mensah',
  phone: '(647) 555-0182',
  email: 'amara.okonkwo@email.ca',
  primaryContact: {
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
};

export const mockPriorAutoPolicy: PriorPolicy = {
  policyNumber: 'A21677149PLA',
  line: 'auto',
  carrier: 'True North P&C',
  expiresOn: '2026-12-24',
  risk: AutoRiskSchema.parse({
    line: 'auto',
    party: { householdId: 'OKONKA01', clientId: 'CL-AMARA' },
    effectiveDate: '2025-12-24',
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
        licence: { number: 'O1234-56789-01234', province: 'ON', class: 'G', dateFirstLicensed: '2004-05-01' },
        driverTrainingCertified: true,
      },
      {
        id: 'drv-2',
        firstName: 'Daniel',
        lastName: 'Mensah',
        dateOfBirth: '1984-09-30',
        relationshipToApplicant: 'spouse',
        licence: { number: 'M9876-54321-09876', province: 'ON', class: 'G', dateFirstLicensed: '2002-11-20' },
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
        ownership: 'financed',
        physicalDamage: {
          collision: { elected: true, deductible: { kind: 'amount', value: { currency: 'CAD', amountCents: 100000 } } },
          comprehensive: { elected: true, deductible: { kind: 'amount', value: { currency: 'CAD', amountCents: 100000 } } },
        },
      },
    ],
    coverages: {
      liabilityLimit: { kind: 'amount', value: { currency: 'CAD', amountCents: 100000000 } },
      accidentBenefits: {
        optionalElections: [
          { benefit: 'increased_medical_rehab', elected: true, limit: { kind: 'amount', value: { currency: 'CAD', amountCents: 100000000 } } },
        ],
      },
      directCompensationPropertyDamage: { kind: 'included' },
      uninsuredAutomobile: { kind: 'included' },
    },
    history: { priorInsurer: 'Maple Mutual', priorPolicyNumber: 'MM-889-2201', continuousYearsInsured: 6 },
  }),
};

export interface PriorHomePolicy {
  policyNumber: string;
  line: 'property';
  carrier: string;
  expiresOn: string;
  risk: PropertyRisk;
}

export const mockPriorHomePolicy: PriorHomePolicy = {
  policyNumber: 'H55231887HAB',
  line: 'property',
  carrier: 'Laurier Insurance',
  expiresOn: '2026-12-24',
  risk: PropertyRiskSchema.parse({
    line: 'property',
    party: { householdId: 'OKONKA01', clientId: 'CL-AMARA' },
    effectiveDate: '2025-12-24',
    province: 'ON',
    namedInsured: {
      firstName: 'Amara',
      lastName: 'Okonkwo',
      dateOfBirth: '1986-04-12',
      mailingAddress: { line1: '42 Sunnybrae Crescent', city: 'Brampton', province: 'ON', postalCode: 'L6Z 1R6' },
    },
    riskAddress: { line1: '128 Chinguacousy Road', city: 'Brampton', province: 'ON', postalCode: 'L6Y 2R4' },
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
    protection: { hydrantDistance: 'within_300m', fireHallDistance: 'within_5km', alarm: 'fire_and_burglary', monitored: true },
    coverages: {
      dwellingA: { kind: 'amount', value: { currency: 'CAD', amountCents: 68400000 } },
      detachedStructuresB: { kind: 'amount', value: { currency: 'CAD', amountCents: 6840000 } },
      contentsC: { kind: 'amount', value: { currency: 'CAD', amountCents: 47880000 } },
      additionalLivingD: { kind: 'amount', value: { currency: 'CAD', amountCents: 13680000 } },
      personalLiabilityE: { kind: 'amount', value: { currency: 'CAD', amountCents: 100000000 } },
      voluntaryMedicalF: { kind: 'amount', value: { currency: 'CAD', amountCents: 500000 } },
      deductible: { kind: 'amount', value: { currency: 'CAD', amountCents: 250000 } },
      waterDeductible: { kind: 'amount', value: { currency: 'CAD', amountCents: 500000 } },
      endorsements: [
        { code: 'SEWER', name: 'Sewer backup', elected: true, limit: { kind: 'amount', value: { currency: 'CAD', amountCents: 2500000 } } },
        { code: 'OVERLAND', name: 'Overland water', elected: false },
      ],
    },
    interests: [{ id: 'int-1', type: 'mortgagee', name: 'First Dominion Bank', reference: 'FD-88213307' }],
  }),
};
