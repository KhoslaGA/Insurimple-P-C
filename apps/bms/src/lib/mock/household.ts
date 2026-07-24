/**
 * Deterministic mock party spine (CLAUDE.md #7: mock data is first-class). Stands in
 * for the NestJS + Postgres party/policy layer until that backend is wired. Shapes the
 * household + a prior auto policy the quote workspace prefills from.
 */
import { AutoRiskSchema, type AutoRisk, type NamedInsured } from '@insurimple/contracts';

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
