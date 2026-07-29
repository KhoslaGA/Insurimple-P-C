import type {
  AccountSummary, HouseholdDetail, WorkQueues, TxnSummary, TxnDetail, MeProfile,
  TeamRoster, DocumentRow, DocumentTemplate, BillingOverview, ComplianceOverview,
  ClaimRow, PolicyListRow, MarketRow,
} from "@insurimple/contracts";

/**
 * Preview data — deterministic seed snapshot captured from the RLS-scoped API
 * for tenant 1111…. Used ONLY when no API is configured (a keyless preview
 * deploy) so the whole app is viewable without a backend. Never live carrier
 * data (invariant 7); screens badge it "Preview data". When API_URL is set the
 * real path is used and this module is never read.
 */
export const DEMO_ACCOUNTS = ([
  {
    "id": "a0000000-0000-0000-0000-000000000001",
    "lookup_code": "ABTAHISE01",
    "display_name": "Seyed Moein Abtahi",
    "kind": "personal",
    "status": "cancelling",
    "source": "toprates.ca",
    "policy_count": "1",
    "annual_premium": "2140.00"
  },
  {
    "id": "a0000000-0000-0000-0000-000000000002",
    "lookup_code": "GILLAM01",
    "display_name": "Amrit Gill",
    "kind": "personal",
    "status": "active",
    "source": "referral",
    "policy_count": "1",
    "annual_premium": "1720.00"
  },
  {
    "id": "a0000000-0000-0000-0000-000000000004",
    "lookup_code": "KAPOORGA01",
    "display_name": "Gautam & Tanvi Kapoor",
    "kind": "personal",
    "status": "active",
    "source": "referral",
    "policy_count": "3",
    "annual_premium": "4660.00"
  },
  {
    "id": "a0000000-0000-0000-0000-000000000005",
    "lookup_code": "SANDHUGU01",
    "display_name": "Gurpreet Sandhu",
    "kind": "personal",
    "status": "prospect",
    "source": "toprates.ca",
    "policy_count": "1",
    "annual_premium": "2010.00"
  },
  {
    "id": "a0000000-0000-0000-0000-000000000006",
    "lookup_code": "PETROVNI01",
    "display_name": "Nikolai Petrov",
    "kind": "personal",
    "status": "lapsed",
    "source": "walk-in",
    "policy_count": "1",
    "annual_premium": "1540.00"
  },
  {
    "id": "a0000000-0000-0000-0000-000000000003",
    "lookup_code": "MEHTARA01",
    "display_name": "Rahul Mehta",
    "kind": "personal",
    "status": "active",
    "source": "toprates.ca",
    "policy_count": "2",
    "annual_premium": "2300.00"
  }
]) as unknown as AccountSummary[];

export const DEMO_HOUSEHOLDS = ({
  "a0000000-0000-0000-0000-000000000001": {
    "header": {
      "id": "a0000000-0000-0000-0000-000000000001",
      "lookup_code": "ABTAHISE01",
      "display_name": "Seyed Moein Abtahi",
      "kind": "personal",
      "status": "cancelling",
      "source": "toprates.ca",
      "city": "Richmond Hill, ON",
      "servicing_broker": "Gautam Khosla",
      "servicing_csr": null
    },
    "applicants": [
      {
        "id": "40000000-0000-0000-0000-000000000001",
        "role": "named_insured",
        "is_primary": true,
        "party_type": "person",
        "name": "Seyed Moein Abtahi",
        "email": "abtmoien@gmail.com",
        "phone": "(647) 553-7656",
        "address": {
          "city": "Richmond Hill",
          "prov": "ON",
          "line1": "Ph01-23 Oneida Cres",
          "postal": "L4B 0A2"
        }
      }
    ],
    "policies": [
      {
        "id": "90000000-0000-0000-0000-000000000001",
        "policy_number": "240517202",
        "line": "auto",
        "status": "in_force",
        "carrier_name": "Pembridge",
        "effective_date": "2026-06-24",
        "expiry_date": "2027-06-24",
        "annual_premium": "2140.00",
        "billing_type": "agency",
        "payment_plan": "monthly PAD",
        "coverages": [
          {
            "csio_code": "TPL",
            "description": "Third Party Liability",
            "limit_amount": "2000000.00",
            "deductible": null,
            "premium": "980.00"
          },
          {
            "csio_code": "DCPD",
            "description": "Direct Compensation — Property Damage",
            "limit_amount": null,
            "deductible": "0.00",
            "premium": "240.00"
          },
          {
            "csio_code": "COLL",
            "description": "Collision",
            "limit_amount": null,
            "deductible": "1000.00",
            "premium": "520.00"
          },
          {
            "csio_code": "COMP",
            "description": "Comprehensive",
            "limit_amount": null,
            "deductible": "1000.00",
            "premium": "400.00"
          }
        ],
        "drivers": [
          {
            "party_id": "40000000-0000-0000-0000-000000000001",
            "name": "Seyed Moein Abtahi",
            "licence_number": "A1234-56789-01234",
            "licence_class": "G",
            "at_fault_count": 0
          }
        ],
        "vehicles": [
          {
            "id": "7e000000-0000-0000-0000-000000000001",
            "year": 2019,
            "make": "Honda",
            "model": "CR-V",
            "vin": "2HKRW2H59KH100001",
            "primary_use": "commute",
            "annual_km": 18000,
            "ownership": "financed"
          }
        ],
        "locations": [],
        "loss_history": [
          {
            "loss_date": "2023-02-11",
            "loss_type": "Comprehensive — Windshield",
            "at_fault": false,
            "amount": "780.00",
            "insured_from": "2020-06-24",
            "insured_to": null
          }
        ],
        "additional_interests": [
          {
            "kind": "Lienholder",
            "name": "TD Auto Finance",
            "on": "2019 Honda CR-V"
          }
        ],
        "forms_endorsements": [
          {
            "form_code": "OPCF 20",
            "description": "Coverage for Transportation Replacement",
            "premium": "48.00",
            "effective_date": "2025-06-24"
          },
          {
            "form_code": "OPCF 47R",
            "description": "Agreement Not to Rely on Certain Optional Benefits",
            "premium": "0.00",
            "effective_date": "2025-06-24"
          }
        ]
      }
    ],
    "service_summary": [
      {
        "id": "d0000000-0000-0000-0000-000000000001",
        "reference": "TXN-3041",
        "txn_type": "cancellation",
        "state": "submitted",
        "reason": "Client sold the vehicle — cancel auto, flat rate",
        "effective_date": "2026-07-15",
        "opened_at": "2026-07-20 13:52:44.457987+00",
        "closed_at": null,
        "carrier_name": "Pembridge",
        "events": [
          {
            "from_state": null,
            "to_state": "draft",
            "actor": "Gautam Khosla",
            "at": "2026-07-20 13:52:44.457987+00"
          },
          {
            "from_state": "draft",
            "to_state": "doc_generated",
            "actor": "Gautam Khosla",
            "at": "2026-07-20 14:12:44.457987+00"
          },
          {
            "from_state": "doc_generated",
            "to_state": "sig_pending",
            "actor": "Gautam Khosla",
            "at": "2026-07-21 13:52:44.457987+00"
          },
          {
            "from_state": "sig_pending",
            "to_state": "signed",
            "actor": "Gautam Khosla",
            "at": "2026-07-23 13:52:44.457987+00"
          },
          {
            "from_state": "signed",
            "to_state": "submitted",
            "actor": "Gautam Khosla",
            "at": "2026-07-24 13:52:44.457987+00"
          }
        ]
      }
    ],
    "consent": [
      {
        "channel": "email",
        "basis": "express",
        "captured_at": "2025-06-24 13:52:44.457987+00",
        "expires_at": null,
        "source": "signed application"
      },
      {
        "channel": "phone",
        "basis": "did_not_obtain",
        "captured_at": null,
        "expires_at": null,
        "source": null
      },
      {
        "channel": "sms",
        "basis": "did_not_obtain",
        "captured_at": null,
        "expires_at": null,
        "source": null
      }
    ]
  },
  "a0000000-0000-0000-0000-000000000002": {
    "header": {
      "id": "a0000000-0000-0000-0000-000000000002",
      "lookup_code": "GILLAM01",
      "display_name": "Amrit Gill",
      "kind": "personal",
      "status": "active",
      "source": "referral",
      "city": "Brampton, ON",
      "servicing_broker": "Gautam Khosla",
      "servicing_csr": null
    },
    "applicants": [
      {
        "id": "40000000-0000-0000-0000-000000000002",
        "role": "named_insured",
        "is_primary": true,
        "party_type": "person",
        "name": "Amrit Gill",
        "email": "amrit.gill@email.ca",
        "phone": "(905) 555-0217",
        "address": {
          "city": "Brampton",
          "prov": "ON",
          "line1": "12 Sunforest Dr",
          "postal": "L6R 1A1"
        }
      }
    ],
    "policies": [
      {
        "id": "90000000-0000-0000-0000-000000000002",
        "policy_number": "GM-771204",
        "line": "auto",
        "status": "in_force",
        "carrier_name": "Gore Mutual",
        "effective_date": "2025-09-01",
        "expiry_date": "2026-09-01",
        "annual_premium": "1720.00",
        "billing_type": "direct",
        "payment_plan": "monthly",
        "coverages": [
          {
            "csio_code": "TPL",
            "description": "Third Party Liability",
            "limit_amount": "1000000.00",
            "deductible": null,
            "premium": "760.00"
          },
          {
            "csio_code": "DCPD",
            "description": "Direct Compensation — Property Damage",
            "limit_amount": null,
            "deductible": "0.00",
            "premium": "210.00"
          },
          {
            "csio_code": "COLL",
            "description": "Collision",
            "limit_amount": null,
            "deductible": "1000.00",
            "premium": "470.00"
          }
        ],
        "drivers": [
          {
            "party_id": "40000000-0000-0000-0000-000000000002",
            "name": "Amrit Gill",
            "licence_number": "G2100-11111-22222",
            "licence_class": "G",
            "at_fault_count": 0
          }
        ],
        "vehicles": [
          {
            "id": "7e000000-0000-0000-0000-000000000002",
            "year": 2018,
            "make": "Ford",
            "model": "Fusion",
            "vin": "3FA6P0H73HR100002",
            "primary_use": "commute",
            "annual_km": 16000,
            "ownership": "owned"
          }
        ],
        "locations": [],
        "loss_history": [],
        "additional_interests": [],
        "forms_endorsements": []
      }
    ],
    "service_summary": [
      {
        "id": "d0000000-0000-0000-0000-000000000002",
        "reference": "TXN-3055",
        "txn_type": "new_business",
        "state": "completed",
        "reason": "New auto policy — bound at Gore Mutual",
        "effective_date": "2025-09-01",
        "opened_at": "2026-06-24 13:52:44.457987+00",
        "closed_at": "2026-07-01 13:52:44.457987+00",
        "carrier_name": "Gore Mutual",
        "events": [
          {
            "from_state": null,
            "to_state": "draft",
            "actor": "Gautam Khosla",
            "at": "2026-06-24 13:52:44.457987+00"
          },
          {
            "from_state": "draft",
            "to_state": "doc_generated",
            "actor": "Gautam Khosla",
            "at": "2026-06-25 13:52:44.457987+00"
          },
          {
            "from_state": "doc_generated",
            "to_state": "sig_pending",
            "actor": "Gautam Khosla",
            "at": "2026-06-26 13:52:44.457987+00"
          },
          {
            "from_state": "sig_pending",
            "to_state": "signed",
            "actor": "Gautam Khosla",
            "at": "2026-06-27 13:52:44.457987+00"
          },
          {
            "from_state": "signed",
            "to_state": "submitted",
            "actor": "Gautam Khosla",
            "at": "2026-06-28 13:52:44.457987+00"
          },
          {
            "from_state": "submitted",
            "to_state": "carrier_ack",
            "actor": "Gautam Khosla",
            "at": "2026-06-30 13:52:44.457987+00"
          },
          {
            "from_state": "carrier_ack",
            "to_state": "completed",
            "actor": "Gautam Khosla",
            "at": "2026-07-01 13:52:44.457987+00"
          }
        ]
      }
    ],
    "consent": [
      {
        "channel": "email",
        "basis": "express",
        "captured_at": "2026-01-10 13:52:44.457987+00",
        "expires_at": null,
        "source": "signed application"
      }
    ]
  },
  "a0000000-0000-0000-0000-000000000004": {
    "header": {
      "id": "a0000000-0000-0000-0000-000000000004",
      "lookup_code": "KAPOORGA01",
      "display_name": "Gautam & Tanvi Kapoor",
      "kind": "personal",
      "status": "active",
      "source": "referral",
      "city": "Brampton, ON",
      "servicing_broker": "Gautam Khosla",
      "servicing_csr": null
    },
    "applicants": [
      {
        "id": "40000000-0000-0000-0000-000000000004",
        "role": "named_insured",
        "is_primary": true,
        "party_type": "person",
        "name": "Gautam Kapoor",
        "email": "gautamkhosla75@gmail.com",
        "phone": "(647) 870-8623",
        "address": {
          "city": "Brampton",
          "prov": "ON",
          "line1": "5 Financial Dr",
          "postal": "L6Y 0M4"
        }
      },
      {
        "id": "40000000-0000-0000-0000-000000000014",
        "role": "co_insured",
        "is_primary": false,
        "party_type": "person",
        "name": "Tanvi Kapoor",
        "email": "tanvi.kapoor@email.ca",
        "phone": "(647) 870-8624",
        "address": {
          "city": "Brampton",
          "prov": "ON",
          "line1": "5 Financial Dr",
          "postal": "L6Y 0M4"
        }
      }
    ],
    "policies": [
      {
        "id": "90000000-0000-0000-0000-000000000004",
        "policy_number": "PB-450992",
        "line": "auto",
        "status": "in_force",
        "carrier_name": "Pembridge",
        "effective_date": "2026-01-10",
        "expiry_date": "2027-01-10",
        "annual_premium": "2460.00",
        "billing_type": "agency",
        "payment_plan": "monthly PAD",
        "coverages": [
          {
            "csio_code": "TPL",
            "description": "Third Party Liability",
            "limit_amount": "2000000.00",
            "deductible": null,
            "premium": "1020.00"
          },
          {
            "csio_code": "COLL",
            "description": "Collision",
            "limit_amount": null,
            "deductible": "1000.00",
            "premium": "720.00"
          },
          {
            "csio_code": "COMP",
            "description": "Comprehensive",
            "limit_amount": null,
            "deductible": "1000.00",
            "premium": "520.00"
          }
        ],
        "drivers": [
          {
            "party_id": "40000000-0000-0000-0000-000000000004",
            "name": "Gautam Kapoor",
            "licence_number": "K4400-55555-66666",
            "licence_class": "G",
            "at_fault_count": 0
          },
          {
            "party_id": "40000000-0000-0000-0000-000000000014",
            "name": "Tanvi Kapoor",
            "licence_number": "K4400-77777-88888",
            "licence_class": "G",
            "at_fault_count": 0
          }
        ],
        "vehicles": [
          {
            "id": "7e000000-0000-0000-0000-000000000004",
            "year": 2020,
            "make": "Toyota",
            "model": "RAV4",
            "vin": "2T3H1RFV8LC100004",
            "primary_use": "pleasure",
            "annual_km": 12000,
            "ownership": "owned"
          }
        ],
        "locations": [],
        "loss_history": [],
        "additional_interests": [],
        "forms_endorsements": []
      },
      {
        "id": "90000000-0000-0000-0000-000000000024",
        "policy_number": "PB-HAB-77120",
        "line": "property",
        "status": "in_force",
        "carrier_name": "Pembridge",
        "effective_date": "2026-01-10",
        "expiry_date": "2027-01-10",
        "annual_premium": "1840.00",
        "billing_type": "agency",
        "payment_plan": "monthly PAD",
        "coverages": [
          {
            "csio_code": "DWELL",
            "description": "Dwelling — guaranteed replacement cost",
            "limit_amount": "780000.00",
            "deductible": "1000.00",
            "premium": "910.00"
          },
          {
            "csio_code": "CONT",
            "description": "Contents",
            "limit_amount": "546000.00",
            "deductible": "1000.00",
            "premium": "320.00"
          },
          {
            "csio_code": "PLIA",
            "description": "Personal liability",
            "limit_amount": "2000000.00",
            "deductible": null,
            "premium": "180.00"
          },
          {
            "csio_code": "SEWER",
            "description": "Sewer backup",
            "limit_amount": "25000.00",
            "deductible": "2500.00",
            "premium": "240.00"
          },
          {
            "csio_code": "OVLND",
            "description": "Overland water",
            "limit_amount": "25000.00",
            "deductible": "2500.00",
            "premium": "190.00"
          }
        ],
        "drivers": [],
        "vehicles": [],
        "locations": [
          {
            "id": "da000000-0000-0000-0000-000000000001",
            "address": {
              "city": "Brampton",
              "prov": "ON",
              "line1": "5 Financial Dr",
              "postal": "L6Y 0M4"
            },
            "occupancy": "owner",
            "year_built": 2012,
            "construction": "Brick veneer",
            "roof_age": 6,
            "heating": "Forced air gas",
            "has_knob_tube": false,
            "has_oil_tank": false,
            "replacement_cost": "780000.00"
          }
        ],
        "loss_history": [],
        "additional_interests": [
          {
            "kind": "Mortgagee",
            "name": "TD Canada Trust — Mortgage Services",
            "on": "Dwelling"
          }
        ],
        "forms_endorsements": [
          {
            "form_code": "SEF/HOM 43",
            "description": "Guaranteed replacement cost on the dwelling",
            "premium": "0.00",
            "effective_date": "2026-01-10"
          },
          {
            "form_code": "WATER PKG",
            "description": "Combined sewer backup + overland water package",
            "premium": "430.00",
            "effective_date": "2026-01-10"
          }
        ]
      },
      {
        "id": "90000000-0000-0000-0000-000000000014",
        "policy_number": "GM-451001",
        "line": "tenant",
        "status": "in_force",
        "carrier_name": "Gore Mutual",
        "effective_date": "2026-01-10",
        "expiry_date": "2027-01-10",
        "annual_premium": "360.00",
        "billing_type": "direct",
        "payment_plan": "annual",
        "coverages": [
          {
            "csio_code": "CONT",
            "description": "Contents",
            "limit_amount": "45000.00",
            "deductible": "500.00",
            "premium": "210.00"
          },
          {
            "csio_code": "PLIA",
            "description": "Personal liability",
            "limit_amount": "1000000.00",
            "deductible": null,
            "premium": "90.00"
          }
        ],
        "drivers": [],
        "vehicles": [],
        "locations": [
          {
            "id": "da000000-0000-0000-0000-000000000002",
            "address": {
              "city": "Brampton",
              "prov": "ON",
              "line1": "5 Financial Dr, Unit B",
              "postal": "L6Y 0M4"
            },
            "occupancy": "tenant",
            "year_built": 2012,
            "construction": "Brick veneer",
            "roof_age": 6,
            "heating": "Forced air gas",
            "has_knob_tube": false,
            "has_oil_tank": false,
            "replacement_cost": null
          }
        ],
        "loss_history": [],
        "additional_interests": [],
        "forms_endorsements": []
      }
    ],
    "service_summary": [],
    "consent": [
      {
        "channel": "email",
        "basis": "express",
        "captured_at": "2025-10-02 13:52:44.457987+00",
        "expires_at": null,
        "source": "signed application"
      }
    ]
  },
  "a0000000-0000-0000-0000-000000000005": {
    "header": {
      "id": "a0000000-0000-0000-0000-000000000005",
      "lookup_code": "SANDHUGU01",
      "display_name": "Gurpreet Sandhu",
      "kind": "personal",
      "status": "prospect",
      "source": "toprates.ca",
      "city": "Brampton, ON",
      "servicing_broker": "Gautam Khosla",
      "servicing_csr": null
    },
    "applicants": [
      {
        "id": "40000000-0000-0000-0000-000000000005",
        "role": "named_insured",
        "is_primary": true,
        "party_type": "person",
        "name": "Gurpreet Sandhu",
        "email": "g.sandhu@email.ca",
        "phone": "(416) 555-0633",
        "address": {
          "city": "Brampton",
          "prov": "ON",
          "line1": "200 Queen St",
          "postal": "L6W 2B3"
        }
      }
    ],
    "policies": [
      {
        "id": "90000000-0000-0000-0000-000000000005",
        "policy_number": "PB-QUOTE-51",
        "line": "auto",
        "status": "quoted",
        "carrier_name": "Pembridge",
        "effective_date": "2026-08-01",
        "expiry_date": null,
        "annual_premium": "2010.00",
        "billing_type": "agency",
        "payment_plan": null,
        "coverages": [],
        "drivers": [],
        "vehicles": [],
        "locations": [],
        "loss_history": [],
        "additional_interests": [],
        "forms_endorsements": []
      }
    ],
    "service_summary": [],
    "consent": [
      {
        "channel": "phone",
        "basis": "express",
        "captured_at": "2026-07-19 13:52:44.457987+00",
        "expires_at": null,
        "source": "quote intake call"
      }
    ]
  },
  "a0000000-0000-0000-0000-000000000006": {
    "header": {
      "id": "a0000000-0000-0000-0000-000000000006",
      "lookup_code": "PETROVNI01",
      "display_name": "Nikolai Petrov",
      "kind": "personal",
      "status": "lapsed",
      "source": "walk-in",
      "city": "Brampton, ON",
      "servicing_broker": "Gautam Khosla",
      "servicing_csr": null
    },
    "applicants": [
      {
        "id": "40000000-0000-0000-0000-000000000006",
        "role": "named_insured",
        "is_primary": true,
        "party_type": "person",
        "name": "Nikolai Petrov",
        "email": "n.petrov@email.ca",
        "phone": "(905) 555-0466",
        "address": {
          "city": "Brampton",
          "prov": "ON",
          "line1": "47 Vodden St",
          "postal": "L6V 1M9"
        }
      }
    ],
    "policies": [
      {
        "id": "90000000-0000-0000-0000-000000000006",
        "policy_number": "GM-220417",
        "line": "auto",
        "status": "cancelled",
        "carrier_name": "Gore Mutual",
        "effective_date": "2024-05-01",
        "expiry_date": "2025-05-01",
        "annual_premium": "1540.00",
        "billing_type": "direct",
        "payment_plan": "monthly",
        "coverages": [],
        "drivers": [],
        "vehicles": [],
        "locations": [],
        "loss_history": [],
        "additional_interests": [],
        "forms_endorsements": []
      }
    ],
    "service_summary": [],
    "consent": []
  },
  "a0000000-0000-0000-0000-000000000003": {
    "header": {
      "id": "a0000000-0000-0000-0000-000000000003",
      "lookup_code": "MEHTARA01",
      "display_name": "Rahul Mehta",
      "kind": "personal",
      "status": "active",
      "source": "toprates.ca",
      "city": "Mississauga, ON",
      "servicing_broker": "Gautam Khosla",
      "servicing_csr": null
    },
    "applicants": [
      {
        "id": "40000000-0000-0000-0000-000000000003",
        "role": "named_insured",
        "is_primary": true,
        "party_type": "person",
        "name": "Rahul Mehta",
        "email": "r.mehta@email.ca",
        "phone": "(647) 555-0529",
        "address": {
          "city": "Mississauga",
          "prov": "ON",
          "line1": "88 Eglinton Ave",
          "postal": "L5R 3G1"
        }
      }
    ],
    "policies": [
      {
        "id": "90000000-0000-0000-0000-000000000003",
        "policy_number": "PB-330871",
        "line": "auto",
        "status": "in_force",
        "carrier_name": "Pembridge",
        "effective_date": "2025-11-15",
        "expiry_date": "2026-11-15",
        "annual_premium": "1980.00",
        "billing_type": "agency",
        "payment_plan": "annual",
        "coverages": [
          {
            "csio_code": "TPL",
            "description": "Third Party Liability",
            "limit_amount": "2000000.00",
            "deductible": null,
            "premium": "880.00"
          },
          {
            "csio_code": "COLL",
            "description": "Collision",
            "limit_amount": null,
            "deductible": "500.00",
            "premium": "640.00"
          },
          {
            "csio_code": "COMP",
            "description": "Comprehensive",
            "limit_amount": null,
            "deductible": "500.00",
            "premium": "460.00"
          }
        ],
        "drivers": [
          {
            "party_id": "40000000-0000-0000-0000-000000000003",
            "name": "Rahul Mehta",
            "licence_number": "M3300-33333-44444",
            "licence_class": "G",
            "at_fault_count": 1
          }
        ],
        "vehicles": [
          {
            "id": "7e000000-0000-0000-0000-000000000003",
            "year": 2021,
            "make": "Tesla",
            "model": "Model 3",
            "vin": "5YJ3E1EA7KF100003",
            "primary_use": "commute",
            "annual_km": 22000,
            "ownership": "financed"
          }
        ],
        "locations": [],
        "loss_history": [],
        "additional_interests": [],
        "forms_endorsements": []
      },
      {
        "id": "90000000-0000-0000-0000-000000000013",
        "policy_number": "GM-880132",
        "line": "tenant",
        "status": "in_force",
        "carrier_name": "Gore Mutual",
        "effective_date": "2025-11-15",
        "expiry_date": "2026-11-15",
        "annual_premium": "320.00",
        "billing_type": "direct",
        "payment_plan": "annual",
        "coverages": [
          {
            "csio_code": "CONT",
            "description": "Contents",
            "limit_amount": "60000.00",
            "deductible": "500.00",
            "premium": "190.00"
          },
          {
            "csio_code": "PLIA",
            "description": "Personal liability",
            "limit_amount": "1000000.00",
            "deductible": null,
            "premium": "90.00"
          },
          {
            "csio_code": "SEWER",
            "description": "Sewer backup",
            "limit_amount": "15000.00",
            "deductible": "1000.00",
            "premium": "40.00"
          }
        ],
        "drivers": [],
        "vehicles": [],
        "locations": [
          {
            "id": "da000000-0000-0000-0000-000000000003",
            "address": {
              "city": "Mississauga",
              "prov": "ON",
              "line1": "88 Eglinton Ave, Unit 1204",
              "postal": "L5R 3G1"
            },
            "occupancy": "tenant",
            "year_built": 2005,
            "construction": "Concrete high-rise",
            "roof_age": null,
            "heating": "Electric baseboard",
            "has_knob_tube": false,
            "has_oil_tank": false,
            "replacement_cost": null
          }
        ],
        "loss_history": [],
        "additional_interests": [],
        "forms_endorsements": []
      }
    ],
    "service_summary": [
      {
        "id": "d0000000-0000-0000-0000-000000000003",
        "reference": "TXN-3062",
        "txn_type": "endorsement",
        "state": "draft",
        "reason": "Add winter tire discount",
        "effective_date": "2026-07-25",
        "opened_at": "2026-07-28 13:52:44.457987+00",
        "closed_at": null,
        "carrier_name": "Pembridge",
        "events": [
          {
            "from_state": null,
            "to_state": "draft",
            "actor": "Gautam Khosla",
            "at": "2026-07-28 13:52:44.457987+00"
          }
        ]
      },
      {
        "id": "d0000000-0000-0000-0000-000000000004",
        "reference": "TXN-3070",
        "txn_type": "claim_fnol",
        "state": "submitted",
        "reason": "Rear-ended at a stop light — not at fault",
        "effective_date": "2026-07-18",
        "opened_at": "2026-07-18 13:52:44.457987+00",
        "closed_at": null,
        "carrier_name": "Pembridge",
        "events": [
          {
            "from_state": null,
            "to_state": "draft",
            "actor": "Gautam Khosla",
            "at": "2026-07-18 13:52:44.457987+00"
          },
          {
            "from_state": "draft",
            "to_state": "doc_generated",
            "actor": "Gautam Khosla",
            "at": "2026-07-18 14:07:44.457987+00"
          },
          {
            "from_state": "doc_generated",
            "to_state": "sig_pending",
            "actor": "Gautam Khosla",
            "at": "2026-07-18 14:22:44.457987+00"
          },
          {
            "from_state": "sig_pending",
            "to_state": "signed",
            "actor": "Gautam Khosla",
            "at": "2026-07-19 13:52:44.457987+00"
          },
          {
            "from_state": "signed",
            "to_state": "submitted",
            "actor": "Gautam Khosla",
            "at": "2026-07-19 13:52:44.457987+00"
          }
        ]
      }
    ],
    "consent": [
      {
        "channel": "email",
        "basis": "implied",
        "captured_at": "2026-04-30 13:52:44.457987+00",
        "expires_at": null,
        "source": "existing client"
      }
    ]
  }
}) as unknown as Record<string, HouseholdDetail>;

export const DEMO_QUEUES = ({
  "activities": [
    {
      "id": "d6190f51-aed5-4336-9c35-9a3382ed8c32",
      "title": "Prospect follow-up — Gurpreet Sandhu quote",
      "body": "Quoted auto at $2,010. Follow up on bind decision.",
      "activity_type": "follow_up",
      "priority": "high",
      "due_at": "2026-07-27 13:52:44.457987+00",
      "overdue": true,
      "account_id": "a0000000-0000-0000-0000-000000000005",
      "account_name": "Gurpreet Sandhu",
      "lookup_code": "SANDHUGU01"
    },
    {
      "id": "6f84621c-d57d-4dde-8111-764b4d3365ea",
      "title": "eDoc received — tenant policy confirmation",
      "body": "Auto-filed from CSIOnet. Review and close.",
      "activity_type": "edoc_received",
      "priority": "low",
      "due_at": "2026-07-30 13:52:44.457987+00",
      "overdue": false,
      "account_id": "a0000000-0000-0000-0000-000000000003",
      "account_name": "Rahul Mehta",
      "lookup_code": "MEHTARA01"
    },
    {
      "id": "50f8d1de-4fc2-4d63-9561-5eef2d6d10ba",
      "title": "Chase Pembridge — cancellation acknowledgement",
      "body": "Submitted 5 days ago, no ack yet. Confirm flat-rate effective date.",
      "activity_type": "follow_up",
      "priority": "high",
      "due_at": "2026-07-31 13:52:44.457987+00",
      "overdue": false,
      "account_id": "a0000000-0000-0000-0000-000000000001",
      "account_name": "Seyed Moein Abtahi",
      "lookup_code": "ABTAHISE01"
    },
    {
      "id": "c2c4e9be-b32b-4410-bd38-276a66f21baf",
      "title": "Verify OPCF 47R on file — Kapoor auto",
      "body": "SABS optionality: confirm signed 47R before the reform effective date.",
      "activity_type": "compliance_note",
      "priority": "high",
      "due_at": "2026-08-01 13:52:44.457987+00",
      "overdue": false,
      "account_id": "a0000000-0000-0000-0000-000000000004",
      "account_name": "Gautam & Tanvi Kapoor",
      "lookup_code": "KAPOORGA01"
    },
    {
      "id": "4e2421b3-e4ea-4cb0-af8c-ca30be278550",
      "title": "Renewal review — Amrit Gill (expires Sep 1)",
      "body": "Auto renewal at Gore Mutual. Check for premium increase before offer goes out.",
      "activity_type": "renew",
      "priority": "medium",
      "due_at": "2026-08-07 13:52:44.457987+00",
      "overdue": false,
      "account_id": "a0000000-0000-0000-0000-000000000002",
      "account_name": "Amrit Gill",
      "lookup_code": "GILLAM01"
    }
  ],
  "renewals": [
    {
      "policy_id": "90000000-0000-0000-0000-000000000002",
      "account_id": "a0000000-0000-0000-0000-000000000002",
      "account_name": "Amrit Gill",
      "lookup_code": "GILLAM01",
      "line": "auto",
      "carrier_name": "Gore Mutual",
      "policy_number": "GM-771204",
      "expiry_date": "2026-09-01",
      "days_to_expiry": 34,
      "annual_premium": "1720.00"
    },
    {
      "policy_id": "90000000-0000-0000-0000-000000000003",
      "account_id": "a0000000-0000-0000-0000-000000000003",
      "account_name": "Rahul Mehta",
      "lookup_code": "MEHTARA01",
      "line": "auto",
      "carrier_name": "Pembridge",
      "policy_number": "PB-330871",
      "expiry_date": "2026-11-15",
      "days_to_expiry": 109,
      "annual_premium": "1980.00"
    },
    {
      "policy_id": "90000000-0000-0000-0000-000000000013",
      "account_id": "a0000000-0000-0000-0000-000000000003",
      "account_name": "Rahul Mehta",
      "lookup_code": "MEHTARA01",
      "line": "tenant",
      "carrier_name": "Gore Mutual",
      "policy_number": "GM-880132",
      "expiry_date": "2026-11-15",
      "days_to_expiry": 109,
      "annual_premium": "320.00"
    }
  ],
  "suspense": [
    {
      "txn_id": "d0000000-0000-0000-0000-000000000004",
      "reference": "TXN-3070",
      "txn_type": "claim_fnol",
      "state": "submitted",
      "account_id": "a0000000-0000-0000-0000-000000000003",
      "account_name": "Rahul Mehta",
      "carrier_name": "Pembridge",
      "reason": "Rear-ended at a stop light — not at fault",
      "opened_at": "2026-07-18 13:52:44.457987+00"
    },
    {
      "txn_id": "d0000000-0000-0000-0000-000000000001",
      "reference": "TXN-3041",
      "txn_type": "cancellation",
      "state": "submitted",
      "account_id": "a0000000-0000-0000-0000-000000000001",
      "account_name": "Seyed Moein Abtahi",
      "carrier_name": "Pembridge",
      "reason": "Client sold the vehicle — cancel auto, flat rate",
      "opened_at": "2026-07-20 13:52:44.457987+00"
    }
  ]
}) as unknown as WorkQueues;

export const DEMO_TXNS = ([
  {
    "id": "d0000000-0000-0000-0000-000000000003",
    "reference": "TXN-3062",
    "txn_type": "endorsement",
    "state": "draft",
    "reason": "Add winter tire discount",
    "effective_date": "2026-07-25T00:00:00.000Z",
    "opened_at": "2026-07-28T13:52:44.457Z",
    "closed_at": null,
    "account_name": "Rahul Mehta",
    "carrier_name": "Pembridge"
  },
  {
    "id": "d0000000-0000-0000-0000-000000000001",
    "reference": "TXN-3041",
    "txn_type": "cancellation",
    "state": "submitted",
    "reason": "Client sold the vehicle — cancel auto, flat rate",
    "effective_date": "2026-07-15T00:00:00.000Z",
    "opened_at": "2026-07-20T13:52:44.457Z",
    "closed_at": null,
    "account_name": "Seyed Moein Abtahi",
    "carrier_name": "Pembridge"
  },
  {
    "id": "d0000000-0000-0000-0000-000000000004",
    "reference": "TXN-3070",
    "txn_type": "claim_fnol",
    "state": "submitted",
    "reason": "Rear-ended at a stop light — not at fault",
    "effective_date": "2026-07-18T00:00:00.000Z",
    "opened_at": "2026-07-18T13:52:44.457Z",
    "closed_at": null,
    "account_name": "Rahul Mehta",
    "carrier_name": "Pembridge"
  },
  {
    "id": "d0000000-0000-0000-0000-000000000002",
    "reference": "TXN-3055",
    "txn_type": "new_business",
    "state": "completed",
    "reason": "New auto policy — bound at Gore Mutual",
    "effective_date": "2025-09-01T00:00:00.000Z",
    "opened_at": "2026-06-24T13:52:44.457Z",
    "closed_at": "2026-07-01T13:52:44.457Z",
    "account_name": "Amrit Gill",
    "carrier_name": "Gore Mutual"
  }
]) as unknown as TxnSummary[];

export const DEMO_TXN_DETAIL = ({
  "d0000000-0000-0000-0000-000000000003": {
    "id": "d0000000-0000-0000-0000-000000000003",
    "tenant_id": "11111111-1111-1111-1111-111111111111",
    "branch_id": null,
    "reference": "TXN-3062",
    "txn_type": "endorsement",
    "account_id": "a0000000-0000-0000-0000-000000000003",
    "policy_id": "90000000-0000-0000-0000-000000000003",
    "carrier_id": "c0000000-0000-0000-0000-000000000001",
    "state": "draft",
    "reason": "Add winter tire discount",
    "effective_date": "Sat Jul 25",
    "owner_id": "50000000-0000-0000-0000-000000000001",
    "premium_delta": null,
    "metadata": {},
    "opened_at": "2026-07-28T13:52:44.457Z",
    "closed_at": null,
    "created_at": "2026-07-29T13:52:44.457Z",
    "updated_at": "2026-07-29T13:52:44.457Z",
    "module": "pc",
    "account_name": "Rahul Mehta",
    "carrier_name": "Pembridge",
    "events": [
      {
        "from_state": null,
        "to_state": "draft",
        "actor": "Gautam Khosla",
        "at": "2026-07-28T13:52:44.457Z"
      }
    ],
    "submissions": [],
    "documents": []
  },
  "d0000000-0000-0000-0000-000000000001": {
    "id": "d0000000-0000-0000-0000-000000000001",
    "tenant_id": "11111111-1111-1111-1111-111111111111",
    "branch_id": null,
    "reference": "TXN-3041",
    "txn_type": "cancellation",
    "account_id": "a0000000-0000-0000-0000-000000000001",
    "policy_id": "90000000-0000-0000-0000-000000000001",
    "carrier_id": "c0000000-0000-0000-0000-000000000001",
    "state": "submitted",
    "reason": "Client sold the vehicle — cancel auto, flat rate",
    "effective_date": "Wed Jul 15",
    "owner_id": "50000000-0000-0000-0000-000000000001",
    "premium_delta": null,
    "metadata": {},
    "opened_at": "2026-07-20T13:52:44.457Z",
    "closed_at": null,
    "created_at": "2026-07-29T13:52:44.457Z",
    "updated_at": "2026-07-29T13:52:44.457Z",
    "module": "pc",
    "account_name": "Seyed Moein Abtahi",
    "carrier_name": "Pembridge",
    "events": [
      {
        "from_state": null,
        "to_state": "draft",
        "actor": "Gautam Khosla",
        "at": "2026-07-20T13:52:44.457Z"
      },
      {
        "from_state": "draft",
        "to_state": "doc_generated",
        "actor": "Gautam Khosla",
        "at": "2026-07-20T14:12:44.457Z"
      },
      {
        "from_state": "doc_generated",
        "to_state": "sig_pending",
        "actor": "Gautam Khosla",
        "at": "2026-07-21T13:52:44.457Z"
      },
      {
        "from_state": "sig_pending",
        "to_state": "signed",
        "actor": "Gautam Khosla",
        "at": "2026-07-23T13:52:44.457Z"
      },
      {
        "from_state": "signed",
        "to_state": "submitted",
        "actor": "Gautam Khosla",
        "at": "2026-07-24T13:52:44.457Z"
      }
    ],
    "submissions": [
      {
        "channel": "portal",
        "status": "sent",
        "carrier_ref": null,
        "submitted_at": "2026-07-24T13:52:44.457Z",
        "acknowledged_at": null
      }
    ],
    "documents": []
  },
  "d0000000-0000-0000-0000-000000000004": {
    "id": "d0000000-0000-0000-0000-000000000004",
    "tenant_id": "11111111-1111-1111-1111-111111111111",
    "branch_id": null,
    "reference": "TXN-3070",
    "txn_type": "claim_fnol",
    "account_id": "a0000000-0000-0000-0000-000000000003",
    "policy_id": "90000000-0000-0000-0000-000000000003",
    "carrier_id": "c0000000-0000-0000-0000-000000000001",
    "state": "submitted",
    "reason": "Rear-ended at a stop light — not at fault",
    "effective_date": "Sat Jul 18",
    "owner_id": "50000000-0000-0000-0000-000000000001",
    "premium_delta": null,
    "metadata": {},
    "opened_at": "2026-07-18T13:52:44.457Z",
    "closed_at": null,
    "created_at": "2026-07-29T13:52:44.457Z",
    "updated_at": "2026-07-29T13:52:44.457Z",
    "module": "pc",
    "account_name": "Rahul Mehta",
    "carrier_name": "Pembridge",
    "events": [
      {
        "from_state": null,
        "to_state": "draft",
        "actor": "Gautam Khosla",
        "at": "2026-07-18T13:52:44.457Z"
      },
      {
        "from_state": "draft",
        "to_state": "doc_generated",
        "actor": "Gautam Khosla",
        "at": "2026-07-18T14:07:44.457Z"
      },
      {
        "from_state": "doc_generated",
        "to_state": "sig_pending",
        "actor": "Gautam Khosla",
        "at": "2026-07-18T14:22:44.457Z"
      },
      {
        "from_state": "sig_pending",
        "to_state": "signed",
        "actor": "Gautam Khosla",
        "at": "2026-07-19T13:52:44.457Z"
      },
      {
        "from_state": "signed",
        "to_state": "submitted",
        "actor": "Gautam Khosla",
        "at": "2026-07-19T13:52:44.457Z"
      }
    ],
    "submissions": [],
    "documents": []
  },
  "d0000000-0000-0000-0000-000000000002": {
    "id": "d0000000-0000-0000-0000-000000000002",
    "tenant_id": "11111111-1111-1111-1111-111111111111",
    "branch_id": null,
    "reference": "TXN-3055",
    "txn_type": "new_business",
    "account_id": "a0000000-0000-0000-0000-000000000002",
    "policy_id": "90000000-0000-0000-0000-000000000002",
    "carrier_id": "c0000000-0000-0000-0000-000000000002",
    "state": "completed",
    "reason": "New auto policy — bound at Gore Mutual",
    "effective_date": "Mon Sep 01",
    "owner_id": "50000000-0000-0000-0000-000000000001",
    "premium_delta": null,
    "metadata": {},
    "opened_at": "2026-06-24T13:52:44.457Z",
    "closed_at": "2026-07-01T13:52:44.457Z",
    "created_at": "2026-07-29T13:52:44.457Z",
    "updated_at": "2026-07-29T13:52:44.457Z",
    "module": "pc",
    "account_name": "Amrit Gill",
    "carrier_name": "Gore Mutual",
    "events": [
      {
        "from_state": null,
        "to_state": "draft",
        "actor": "Gautam Khosla",
        "at": "2026-06-24T13:52:44.457Z"
      },
      {
        "from_state": "draft",
        "to_state": "doc_generated",
        "actor": "Gautam Khosla",
        "at": "2026-06-25T13:52:44.457Z"
      },
      {
        "from_state": "doc_generated",
        "to_state": "sig_pending",
        "actor": "Gautam Khosla",
        "at": "2026-06-26T13:52:44.457Z"
      },
      {
        "from_state": "sig_pending",
        "to_state": "signed",
        "actor": "Gautam Khosla",
        "at": "2026-06-27T13:52:44.457Z"
      },
      {
        "from_state": "signed",
        "to_state": "submitted",
        "actor": "Gautam Khosla",
        "at": "2026-06-28T13:52:44.457Z"
      },
      {
        "from_state": "submitted",
        "to_state": "carrier_ack",
        "actor": "Gautam Khosla",
        "at": "2026-06-30T13:52:44.457Z"
      },
      {
        "from_state": "carrier_ack",
        "to_state": "completed",
        "actor": "Gautam Khosla",
        "at": "2026-07-01T13:52:44.457Z"
      }
    ],
    "submissions": [
      {
        "channel": "portal",
        "status": "acknowledged",
        "carrier_ref": "GM-771204",
        "submitted_at": "2026-06-28T13:52:44.457Z",
        "acknowledged_at": "2026-06-30T13:52:44.457Z"
      }
    ],
    "documents": []
  }
}) as unknown as Record<string, TxnDetail>;

export const DEMO_ME = ({
  "staff": {
    "id": "50000000-0000-0000-0000-000000000001",
    "full_name": "Gautam Khosla",
    "email": "gautam@insurimple.ca",
    "role": "principal_broker",
    "ribo_level": "L1",
    "tenant_name": "Insurimple"
  },
  "licences": [
    {
      "id": "11c00000-0000-0000-0000-000000000001",
      "licence_class": "ribo_l2",
      "licence_number": "RIBO-100200",
      "regulator": "RIBO",
      "issued_on": "2019-03-01",
      "expires_on": "2027-05-25",
      "status": "active",
      "expired": false,
      "expiring_soon": false
    }
  ],
  "roles": [
    {
      "role_code": "admin_principal",
      "role_name": "Admin / Principal broker",
      "licence_id": "11c00000-0000-0000-0000-000000000001",
      "granted_at": "2026-07-29 13:52:44.457987+00"
    }
  ],
  "capabilities": [
    "account.read",
    "account.write",
    "compliance.review",
    "life.policy.write",
    "life.txn.create",
    "mortgage.txn.create",
    "pc.policy.write",
    "pc.proof.issue",
    "pc.quote.create",
    "pc.txn.create",
    "team.manage"
  ],
  "modules": [
    "pc"
  ]
}) as unknown as MeProfile;

export const DEMO_TEAM = ({
  "roles": [
    {
      "code": "admin_principal",
      "name": "Admin / Principal broker",
      "description": "Full access incl. compliance sign-off"
    },
    {
      "code": "llqp_no_life",
      "name": "LLQP (no life sales)",
      "description": "Support role; no life or P&C transaction authority"
    },
    {
      "code": "life_only",
      "name": "Life only",
      "description": "Life/A&S business only — no P&C authority"
    },
    {
      "code": "mortgage",
      "name": "Mortgage",
      "description": "Mortgage referrals only"
    },
    {
      "code": "pc_sales",
      "name": "P&C sales",
      "description": "Quotes and new P&C business"
    },
    {
      "code": "pc_service",
      "name": "P&C service",
      "description": "Services the existing P&C book"
    }
  ],
  "members": [
    {
      "id": "50000000-0000-0000-0000-0000000000c5",
      "full_name": "Dana CSR",
      "email": "dana@insurimple.ca",
      "role": "csr",
      "ribo_level": null,
      "licences": [
        {
          "id": "8971aab0-4659-4561-b13a-40bdee8e28cc",
          "staff_id": "50000000-0000-0000-0000-0000000000c5",
          "licence_class": "ribo_l1",
          "licence_number": "RIBO-204411",
          "regulator": "RIBO",
          "issued_on": null,
          "expires_on": "2027-02-28",
          "status": "active",
          "expired": false,
          "expiring_soon": false
        }
      ],
      "grants": [
        {
          "id": "3ca07a96-1fac-4528-83b0-304bc1ab290b",
          "staff_id": "50000000-0000-0000-0000-0000000000c5",
          "role_code": "pc_service",
          "role_name": "P&C service",
          "licence_id": "8971aab0-4659-4561-b13a-40bdee8e28cc",
          "granted_at": "2026-07-29 13:53:05.624906+00"
        }
      ]
    },
    {
      "id": "50000000-0000-0000-0000-000000000001",
      "full_name": "Gautam Khosla",
      "email": "gautam@insurimple.ca",
      "role": "principal_broker",
      "ribo_level": "L1",
      "licences": [
        {
          "id": "11c00000-0000-0000-0000-000000000001",
          "staff_id": "50000000-0000-0000-0000-000000000001",
          "licence_class": "ribo_l2",
          "licence_number": "RIBO-100200",
          "regulator": "RIBO",
          "issued_on": "2019-03-01",
          "expires_on": "2027-05-25",
          "status": "active",
          "expired": false,
          "expiring_soon": false
        }
      ],
      "grants": [
        {
          "id": "717753f2-f3f2-4b7e-85b9-3ebcde5f759b",
          "staff_id": "50000000-0000-0000-0000-000000000001",
          "role_code": "admin_principal",
          "role_name": "Admin / Principal broker",
          "licence_id": "11c00000-0000-0000-0000-000000000001",
          "granted_at": "2026-07-29 13:52:44.457987+00"
        }
      ]
    }
  ]
}) as unknown as TeamRoster;

export const DEMO_DOCUMENTS = ([
  {
    "id": "a4d4875a-2d1f-4621-95d5-5524e28ab3e7",
    "doc_type": "loe",
    "filename": "GILLAM01-LOE-2026-07-29.pdf",
    "source": "generated",
    "issued_to": null,
    "retention_until": "2032-07-29",
    "created_at": "2026-07-29 13:53:05.502477+00",
    "account_id": "a0000000-0000-0000-0000-000000000002",
    "account_name": "Amrit Gill",
    "lookup_code": "GILLAM01",
    "policy_id": "90000000-0000-0000-0000-000000000002",
    "policy_number": "GM-771204",
    "line": "auto"
  },
  {
    "id": "cb2ea92d-53b9-4456-8bf4-cc868b6c8cc8",
    "doc_type": "binder_letter",
    "filename": "KAPOORGA01-BINDER_LETTER-2026-07-29.pdf",
    "source": "generated",
    "issued_to": "TD Canada Trust — Mortgage Services",
    "retention_until": "2032-07-29",
    "created_at": "2026-07-29 13:53:05.484951+00",
    "account_id": "a0000000-0000-0000-0000-000000000004",
    "account_name": "Gautam & Tanvi Kapoor",
    "lookup_code": "KAPOORGA01",
    "policy_id": "90000000-0000-0000-0000-000000000024",
    "policy_number": "PB-HAB-77120",
    "line": "property"
  },
  {
    "id": "5d32b4b2-b023-46ba-b337-d6ae35110044",
    "doc_type": "pink_slip",
    "filename": "ABTAHISE01-PINK_SLIP-2026-07-29.pdf",
    "source": "generated",
    "issued_to": null,
    "retention_until": "2032-07-29",
    "created_at": "2026-07-29 13:53:05.437923+00",
    "account_id": "a0000000-0000-0000-0000-000000000001",
    "account_name": "Seyed Moein Abtahi",
    "lookup_code": "ABTAHISE01",
    "policy_id": "90000000-0000-0000-0000-000000000001",
    "policy_number": "240517202",
    "line": "auto"
  }
]) as unknown as DocumentRow[];

export const DEMO_TEMPLATES = ([
  {
    "code": "BINDER_LETTER",
    "name": "Evidence of property insurance (lender)",
    "version": 1
  },
  {
    "code": "LOE",
    "name": "Letter of experience",
    "version": 1
  },
  {
    "code": "PINK_SLIP",
    "name": "Ontario liability slip (pink card)",
    "version": 1
  }
]) as unknown as DocumentTemplate[];

export const DEMO_BILLING = ({
  "trust": {
    "assets": 3500,
    "liabilities": 3500,
    "surplus": 0
  },
  "commission_summary": {
    "expected": 1206,
    "received": 728.5,
    "variance": 477.5,
    "open": 2,
    "in_variance": 1
  },
  "entries": [
    {
      "id": "1e000000-0000-0000-0000-000000000003",
      "book": "trust",
      "reference": "RCP-4408",
      "description": "Premium receipt — Mehta auto + tenant",
      "entry_date": "2026-07-24",
      "posted": true,
      "amount": "2300.00"
    },
    {
      "id": "1e000000-0000-0000-0000-000000000002",
      "book": "trust",
      "reference": "REM-2210",
      "description": "Remittance to Pembridge — January statement",
      "entry_date": "2026-07-17",
      "posted": true,
      "amount": "3100.00"
    },
    {
      "id": "1e000000-0000-0000-0000-000000000001",
      "book": "trust",
      "reference": "RCP-4401",
      "description": "Premium receipt — Kapoor home + auto",
      "entry_date": "2026-07-08",
      "posted": true,
      "amount": "4300.00"
    }
  ],
  "commissions": [
    {
      "id": "537da2ea-a030-4b77-a263-cd2c5184b165",
      "period": "2026-06-01",
      "expected": "215.00",
      "received": "215.00",
      "status": "matched",
      "variance": "0.00",
      "carrier_name": "Gore Mutual",
      "policy_number": "GM-771204",
      "line": "auto",
      "account_name": "Amrit Gill"
    },
    {
      "id": "c5c93224-3e74-4261-9ee6-6af7a645f9ef",
      "period": "2026-06-01",
      "expected": "267.50",
      "received": "267.50",
      "status": "matched",
      "variance": "0.00",
      "carrier_name": "Pembridge",
      "policy_number": "240517202",
      "line": "auto",
      "account_name": "Seyed Moein Abtahi"
    },
    {
      "id": "304f74cd-0e02-47f0-b52c-25ce850667db",
      "period": "2026-06-01",
      "expected": "48.00",
      "received": null,
      "status": "open",
      "variance": "48.00",
      "carrier_name": "Gore Mutual",
      "policy_number": "GM-880132",
      "line": "tenant",
      "account_name": "Rahul Mehta"
    },
    {
      "id": "90770ff5-728f-4900-b817-2bd706c2635e",
      "period": "2026-06-01",
      "expected": "368.00",
      "received": null,
      "status": "open",
      "variance": "368.00",
      "carrier_name": "Pembridge",
      "policy_number": "PB-HAB-77120",
      "line": "property",
      "account_name": "Gautam & Tanvi Kapoor"
    },
    {
      "id": "77a30ffb-0c2d-466a-9bf7-3dece63ea476",
      "period": "2026-06-01",
      "expected": "307.50",
      "received": "246.00",
      "status": "variance",
      "variance": "61.50",
      "carrier_name": "Pembridge",
      "policy_number": "PB-450992",
      "line": "auto",
      "account_name": "Gautam & Tanvi Kapoor"
    }
  ],
  "held_in_trust": [
    {
      "account_id": "a0000000-0000-0000-0000-000000000004",
      "account_name": "Gautam & Tanvi Kapoor",
      "lookup_code": "KAPOORGA01",
      "held_in_trust": "1200.00"
    },
    {
      "account_id": "a0000000-0000-0000-0000-000000000003",
      "account_name": "Rahul Mehta",
      "lookup_code": "MEHTARA01",
      "held_in_trust": "2300.00"
    }
  ]
}) as unknown as BillingOverview;

export const DEMO_COMPLIANCE = ({
  "book": {
    "by_line": [
      {
        "label": "auto",
        "value": 4,
        "premium": 8300
      },
      {
        "label": "property",
        "value": 1,
        "premium": 1840
      },
      {
        "label": "tenant",
        "value": 2,
        "premium": 680
      }
    ],
    "by_carrier": [
      {
        "label": "Pembridge",
        "value": 4,
        "premium": 8420
      },
      {
        "label": "Gore Mutual",
        "value": 3,
        "premium": 2400
      }
    ],
    "by_expiry_month": [
      {
        "label": "Sep 2026",
        "value": 1,
        "premium": 1720
      },
      {
        "label": "Nov 2026",
        "value": 2,
        "premium": 2300
      },
      {
        "label": "Jan 2027",
        "value": 3,
        "premium": 4660
      },
      {
        "label": "Jun 2027",
        "value": 1,
        "premium": 2140
      }
    ]
  },
  "retention": {
    "in_force": 7,
    "cancelled": 1,
    "lapsed": 0
  },
  "exceptions": {
    "overdue_activities": [
      {
        "id": "d6190f51-aed5-4336-9c35-9a3382ed8c32",
        "title": "Prospect follow-up — Gurpreet Sandhu quote",
        "due_at": "2026-07-27 13:52:44.457987+00",
        "account_name": "Gurpreet Sandhu",
        "account_id": "a0000000-0000-0000-0000-000000000005"
      }
    ],
    "unsigned_transactions": [
      {
        "id": "d0000000-0000-0000-0000-000000000002",
        "reference": "TXN-3055",
        "txn_type": "new_business",
        "state": "completed",
        "account_name": "Amrit Gill",
        "account_id": "a0000000-0000-0000-0000-000000000002"
      },
      {
        "id": "d0000000-0000-0000-0000-000000000004",
        "reference": "TXN-3070",
        "txn_type": "claim_fnol",
        "state": "submitted",
        "account_name": "Rahul Mehta",
        "account_id": "a0000000-0000-0000-0000-000000000003"
      },
      {
        "id": "d0000000-0000-0000-0000-000000000001",
        "reference": "TXN-3041",
        "txn_type": "cancellation",
        "state": "submitted",
        "account_name": "Seyed Moein Abtahi",
        "account_id": "a0000000-0000-0000-0000-000000000001"
      }
    ],
    "unacknowledged_submissions": [
      {
        "id": "d0000000-0000-0000-0000-000000000001",
        "reference": "TXN-3041",
        "txn_type": "cancellation",
        "account_name": "Seyed Moein Abtahi",
        "account_id": "a0000000-0000-0000-0000-000000000001",
        "submitted_at": "2026-07-24 13:52:44.457987+00",
        "days_waiting": 5
      }
    ],
    "licence_alerts": [],
    "expired_in_force": [],
    "consent_gaps": [
      {
        "account_id": "a0000000-0000-0000-0000-000000000006",
        "account_name": "Nikolai Petrov",
        "lookup_code": "PETROVNI01"
      }
    ]
  }
}) as unknown as ComplianceOverview;

export const DEMO_CLAIMS = ([
  {
    "id": "c1a00000-0000-0000-0000-000000000001",
    "claim_number": "PEMB-CL-88214",
    "loss_date": "2026-07-18",
    "reported_date": "2026-07-18",
    "status": "in_progress",
    "adjuster": "J. Whitfield, Pembridge Claims",
    "reserve": "8500.00",
    "paid": "0.00",
    "account_id": "a0000000-0000-0000-0000-000000000003",
    "account_name": "Rahul Mehta",
    "lookup_code": "MEHTARA01",
    "policy_id": "90000000-0000-0000-0000-000000000003",
    "policy_number": "PB-330871",
    "line": "auto",
    "txn_id": "d0000000-0000-0000-0000-000000000004",
    "txn_reference": "TXN-3070",
    "txn_state": "submitted",
    "carrier_name": "Pembridge",
    "days_open": 11
  }
]) as unknown as ClaimRow[];

export const DEMO_POLICIES = ([
  {
    "id": "90000000-0000-0000-0000-000000000002",
    "policy_number": "GM-771204",
    "line": "auto",
    "status": "in_force",
    "effective_date": "2025-09-01",
    "expiry_date": "2026-09-01",
    "annual_premium": "1720.00",
    "billing_type": "direct",
    "payment_plan": "monthly",
    "carrier_name": "Gore Mutual",
    "account_id": "a0000000-0000-0000-0000-000000000002",
    "account_name": "Amrit Gill",
    "lookup_code": "GILLAM01",
    "vehicle_count": 1,
    "dwelling_count": 0,
    "coverage_count": 3,
    "days_to_expiry": 34
  },
  {
    "id": "90000000-0000-0000-0000-000000000004",
    "policy_number": "PB-450992",
    "line": "auto",
    "status": "in_force",
    "effective_date": "2026-01-10",
    "expiry_date": "2027-01-10",
    "annual_premium": "2460.00",
    "billing_type": "agency",
    "payment_plan": "monthly PAD",
    "carrier_name": "Pembridge",
    "account_id": "a0000000-0000-0000-0000-000000000004",
    "account_name": "Gautam & Tanvi Kapoor",
    "lookup_code": "KAPOORGA01",
    "vehicle_count": 1,
    "dwelling_count": 0,
    "coverage_count": 3,
    "days_to_expiry": 165
  },
  {
    "id": "90000000-0000-0000-0000-000000000024",
    "policy_number": "PB-HAB-77120",
    "line": "property",
    "status": "in_force",
    "effective_date": "2026-01-10",
    "expiry_date": "2027-01-10",
    "annual_premium": "1840.00",
    "billing_type": "agency",
    "payment_plan": "monthly PAD",
    "carrier_name": "Pembridge",
    "account_id": "a0000000-0000-0000-0000-000000000004",
    "account_name": "Gautam & Tanvi Kapoor",
    "lookup_code": "KAPOORGA01",
    "vehicle_count": 0,
    "dwelling_count": 1,
    "coverage_count": 5,
    "days_to_expiry": 165
  },
  {
    "id": "90000000-0000-0000-0000-000000000014",
    "policy_number": "GM-451001",
    "line": "tenant",
    "status": "in_force",
    "effective_date": "2026-01-10",
    "expiry_date": "2027-01-10",
    "annual_premium": "360.00",
    "billing_type": "direct",
    "payment_plan": "annual",
    "carrier_name": "Gore Mutual",
    "account_id": "a0000000-0000-0000-0000-000000000004",
    "account_name": "Gautam & Tanvi Kapoor",
    "lookup_code": "KAPOORGA01",
    "vehicle_count": 0,
    "dwelling_count": 1,
    "coverage_count": 2,
    "days_to_expiry": 165
  },
  {
    "id": "90000000-0000-0000-0000-000000000005",
    "policy_number": "PB-QUOTE-51",
    "line": "auto",
    "status": "quoted",
    "effective_date": "2026-08-01",
    "expiry_date": null,
    "annual_premium": "2010.00",
    "billing_type": "agency",
    "payment_plan": null,
    "carrier_name": "Pembridge",
    "account_id": "a0000000-0000-0000-0000-000000000005",
    "account_name": "Gurpreet Sandhu",
    "lookup_code": "SANDHUGU01",
    "vehicle_count": 0,
    "dwelling_count": 0,
    "coverage_count": 0,
    "days_to_expiry": null
  },
  {
    "id": "90000000-0000-0000-0000-000000000006",
    "policy_number": "GM-220417",
    "line": "auto",
    "status": "cancelled",
    "effective_date": "2024-05-01",
    "expiry_date": "2025-05-01",
    "annual_premium": "1540.00",
    "billing_type": "direct",
    "payment_plan": "monthly",
    "carrier_name": "Gore Mutual",
    "account_id": "a0000000-0000-0000-0000-000000000006",
    "account_name": "Nikolai Petrov",
    "lookup_code": "PETROVNI01",
    "vehicle_count": 0,
    "dwelling_count": 0,
    "coverage_count": 0,
    "days_to_expiry": -454
  },
  {
    "id": "90000000-0000-0000-0000-000000000003",
    "policy_number": "PB-330871",
    "line": "auto",
    "status": "in_force",
    "effective_date": "2025-11-15",
    "expiry_date": "2026-11-15",
    "annual_premium": "1980.00",
    "billing_type": "agency",
    "payment_plan": "annual",
    "carrier_name": "Pembridge",
    "account_id": "a0000000-0000-0000-0000-000000000003",
    "account_name": "Rahul Mehta",
    "lookup_code": "MEHTARA01",
    "vehicle_count": 1,
    "dwelling_count": 0,
    "coverage_count": 3,
    "days_to_expiry": 109
  },
  {
    "id": "90000000-0000-0000-0000-000000000013",
    "policy_number": "GM-880132",
    "line": "tenant",
    "status": "in_force",
    "effective_date": "2025-11-15",
    "expiry_date": "2026-11-15",
    "annual_premium": "320.00",
    "billing_type": "direct",
    "payment_plan": "annual",
    "carrier_name": "Gore Mutual",
    "account_id": "a0000000-0000-0000-0000-000000000003",
    "account_name": "Rahul Mehta",
    "lookup_code": "MEHTARA01",
    "vehicle_count": 0,
    "dwelling_count": 1,
    "coverage_count": 3,
    "days_to_expiry": 109
  },
  {
    "id": "90000000-0000-0000-0000-000000000001",
    "policy_number": "240517202",
    "line": "auto",
    "status": "in_force",
    "effective_date": "2026-06-24",
    "expiry_date": "2027-06-24",
    "annual_premium": "2140.00",
    "billing_type": "agency",
    "payment_plan": "monthly PAD",
    "carrier_name": "Pembridge",
    "account_id": "a0000000-0000-0000-0000-000000000001",
    "account_name": "Seyed Moein Abtahi",
    "lookup_code": "ABTAHISE01",
    "vehicle_count": 1,
    "dwelling_count": 0,
    "coverage_count": 4,
    "days_to_expiry": 330
  }
]) as unknown as PolicyListRow[];

export const DEMO_MARKETS = ([
  {
    "id": "97dd0527-3c7d-46fa-ac03-1132a6e1d091",
    "line": "auto",
    "broker_code": "INS-GORE-04",
    "commission_rate": "0.1250",
    "quote_channel": "portal",
    "submit_channel": "secure_delivery",
    "download_channel": "csio_edocs",
    "fnol_routing": {
      "phone": "1-800-555-0220"
    },
    "active": false,
    "carrier_id": "c0000000-0000-0000-0000-000000000002",
    "carrier_name": "Gore Mutual",
    "csio_code": "GORE"
  },
  {
    "id": "299f77fb-d52d-4a67-96cf-47f67b57c5c2",
    "line": "tenant",
    "broker_code": "INS-GORE-04",
    "commission_rate": "0.2000",
    "quote_channel": "portal",
    "submit_channel": "email",
    "download_channel": "none",
    "fnol_routing": {
      "phone": "1-800-555-0220"
    },
    "active": false,
    "carrier_id": "c0000000-0000-0000-0000-000000000002",
    "carrier_name": "Gore Mutual",
    "csio_code": "GORE"
  },
  {
    "id": "02fbd7bd-55fa-43db-8d2a-e971cf3e6e26",
    "line": "auto",
    "broker_code": "INS-PEMB-01",
    "commission_rate": "0.1250",
    "quote_channel": "rater",
    "submit_channel": "portal",
    "download_channel": "csio_edocs",
    "fnol_routing": {
      "email": "claims@pembridge.example",
      "phone": "1-800-555-0110"
    },
    "active": false,
    "carrier_id": "c0000000-0000-0000-0000-000000000001",
    "carrier_name": "Pembridge",
    "csio_code": "PEMB"
  },
  {
    "id": "9517124b-2821-4a7e-b040-fd14c0e794a3",
    "line": "property",
    "broker_code": "INS-PEMB-01",
    "commission_rate": "0.2000",
    "quote_channel": "rater",
    "submit_channel": "portal",
    "download_channel": "csio_edocs",
    "fnol_routing": {
      "phone": "1-800-555-0110"
    },
    "active": false,
    "carrier_id": "c0000000-0000-0000-0000-000000000001",
    "carrier_name": "Pembridge",
    "csio_code": "PEMB"
  }
]) as unknown as MarketRow[];
