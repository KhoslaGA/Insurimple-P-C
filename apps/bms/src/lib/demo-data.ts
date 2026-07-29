import type {
  AccountSummary, HouseholdDetail, WorkQueues, TxnSummary, TxnDetail, MeProfile,
  TeamRoster,
} from "@insurimple/contracts";

/**
 * Preview data — deterministic seed snapshot captured from the RLS-scoped API
 * (GET /accounts, /accounts/:id, /queues, /txns, /txns/:id, /me) for tenant
 * 1111…. Used ONLY when no API is configured (a keyless preview deploy) so the
 * whole app is viewable without a backend. Never live carrier data
 * (invariant 7); screens badge it "Preview data". When API_URL is set, the real
 * path is used and this module is never read.
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
    "policy_count": "2",
    "annual_premium": "2820.00"
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
        "coverages": [],
        "drivers": [],
        "vehicles": [],
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
        "opened_at": "2026-06-20 22:57:46.499998+00",
        "closed_at": "2026-06-27 22:57:46.499998+00",
        "carrier_name": "Gore Mutual",
        "events": [
          {
            "from_state": null,
            "to_state": "draft",
            "actor": "Gautam Khosla",
            "at": "2026-06-20 22:57:46.499998+00"
          },
          {
            "from_state": "draft",
            "to_state": "doc_generated",
            "actor": "Gautam Khosla",
            "at": "2026-06-21 22:57:46.499998+00"
          },
          {
            "from_state": "doc_generated",
            "to_state": "sig_pending",
            "actor": "Gautam Khosla",
            "at": "2026-06-22 22:57:46.499998+00"
          },
          {
            "from_state": "sig_pending",
            "to_state": "signed",
            "actor": "Gautam Khosla",
            "at": "2026-06-23 22:57:46.499998+00"
          },
          {
            "from_state": "signed",
            "to_state": "submitted",
            "actor": "Gautam Khosla",
            "at": "2026-06-24 22:57:46.499998+00"
          },
          {
            "from_state": "submitted",
            "to_state": "carrier_ack",
            "actor": "Gautam Khosla",
            "at": "2026-06-26 22:57:46.499998+00"
          },
          {
            "from_state": "carrier_ack",
            "to_state": "completed",
            "actor": "Gautam Khosla",
            "at": "2026-06-27 22:57:46.499998+00"
          }
        ]
      }
    ],
    "consent": [
      {
        "channel": "email",
        "basis": "express",
        "captured_at": "2026-01-06 22:57:46.499998+00",
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
        "coverages": [],
        "drivers": [],
        "vehicles": [],
        "locations": [],
        "loss_history": [],
        "additional_interests": [],
        "forms_endorsements": []
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
        "channel": "email",
        "basis": "express",
        "captured_at": "2025-09-28 22:57:46.499998+00",
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
        "captured_at": "2026-07-15 22:57:46.499998+00",
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
        "coverages": [],
        "drivers": [],
        "vehicles": [],
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
        "coverages": [],
        "drivers": [],
        "vehicles": [],
        "locations": [],
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
        "opened_at": "2026-07-24 22:57:46.499998+00",
        "closed_at": null,
        "carrier_name": "Pembridge",
        "events": [
          {
            "from_state": null,
            "to_state": "draft",
            "actor": "Gautam Khosla",
            "at": "2026-07-24 22:57:46.499998+00"
          }
        ]
      }
    ],
    "consent": [
      {
        "channel": "email",
        "basis": "implied",
        "captured_at": "2026-04-26 22:57:46.499998+00",
        "expires_at": null,
        "source": "existing client"
      }
    ]
  },
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
        "effective_date": "2025-06-24",
        "expiry_date": "2026-06-24",
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
        "opened_at": "2026-07-16 22:57:46.499998+00",
        "closed_at": null,
        "carrier_name": "Pembridge",
        "events": [
          {
            "from_state": null,
            "to_state": "draft",
            "actor": "Gautam Khosla",
            "at": "2026-07-16 22:57:46.499998+00"
          },
          {
            "from_state": "draft",
            "to_state": "doc_generated",
            "actor": "Gautam Khosla",
            "at": "2026-07-16 23:17:46.499998+00"
          },
          {
            "from_state": "doc_generated",
            "to_state": "sig_pending",
            "actor": "Gautam Khosla",
            "at": "2026-07-17 22:57:46.499998+00"
          },
          {
            "from_state": "sig_pending",
            "to_state": "signed",
            "actor": "Gautam Khosla",
            "at": "2026-07-19 22:57:46.499998+00"
          },
          {
            "from_state": "signed",
            "to_state": "submitted",
            "actor": "Gautam Khosla",
            "at": "2026-07-20 22:57:46.499998+00"
          }
        ]
      }
    ],
    "consent": [
      {
        "channel": "email",
        "basis": "express",
        "captured_at": "2025-06-20 22:57:46.499998+00",
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
  }
}) as unknown as Record<string, HouseholdDetail>;

export const DEMO_QUEUES = ({
  "activities": [
    {
      "id": "2952aca0-70da-4190-b227-359bf1e2d66f",
      "title": "Prospect follow-up — Gurpreet Sandhu quote",
      "body": "Quoted auto at $2,010. Follow up on bind decision.",
      "activity_type": "follow_up",
      "priority": "high",
      "due_at": "2026-07-23 22:57:46.499998+00",
      "overdue": true,
      "account_id": "a0000000-0000-0000-0000-000000000005",
      "account_name": "Gurpreet Sandhu",
      "lookup_code": "SANDHUGU01"
    },
    {
      "id": "c71b4837-65cd-425a-936f-8bf5b53fd3aa",
      "title": "eDoc received — tenant policy confirmation",
      "body": "Auto-filed from CSIOnet. Review and close.",
      "activity_type": "edoc_received",
      "priority": "low",
      "due_at": "2026-07-26 22:57:46.499998+00",
      "overdue": false,
      "account_id": "a0000000-0000-0000-0000-000000000003",
      "account_name": "Rahul Mehta",
      "lookup_code": "MEHTARA01"
    },
    {
      "id": "95d5a039-5ed8-411a-914c-91a9980cd586",
      "title": "Chase Pembridge — cancellation acknowledgement",
      "body": "Submitted 5 days ago, no ack yet. Confirm flat-rate effective date.",
      "activity_type": "follow_up",
      "priority": "high",
      "due_at": "2026-07-27 22:57:46.499998+00",
      "overdue": false,
      "account_id": "a0000000-0000-0000-0000-000000000001",
      "account_name": "Seyed Moein Abtahi",
      "lookup_code": "ABTAHISE01"
    },
    {
      "id": "4f03768f-1f48-4a24-a722-25f595f397c2",
      "title": "Verify OPCF 47R on file — Kapoor auto",
      "body": "SABS optionality: confirm signed 47R before the reform effective date.",
      "activity_type": "compliance_note",
      "priority": "high",
      "due_at": "2026-07-28 22:57:46.499998+00",
      "overdue": false,
      "account_id": "a0000000-0000-0000-0000-000000000004",
      "account_name": "Gautam & Tanvi Kapoor",
      "lookup_code": "KAPOORGA01"
    },
    {
      "id": "ecc772cf-1b84-4037-ba15-6d9c6e4c4fec",
      "title": "Renewal review — Amrit Gill (expires Sep 1)",
      "body": "Auto renewal at Gore Mutual. Check for premium increase before offer goes out.",
      "activity_type": "renew",
      "priority": "medium",
      "due_at": "2026-08-03 22:57:46.499998+00",
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
      "days_to_expiry": 38,
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
      "days_to_expiry": 113,
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
      "days_to_expiry": 113,
      "annual_premium": "320.00"
    }
  ],
  "suspense": [
    {
      "txn_id": "d0000000-0000-0000-0000-000000000001",
      "reference": "TXN-3041",
      "txn_type": "cancellation",
      "state": "submitted",
      "account_id": "a0000000-0000-0000-0000-000000000001",
      "account_name": "Seyed Moein Abtahi",
      "carrier_name": "Pembridge",
      "reason": "Client sold the vehicle — cancel auto, flat rate",
      "opened_at": "2026-07-16 22:57:46.499998+00"
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
    "opened_at": "2026-07-24T22:57:46.499Z",
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
    "opened_at": "2026-07-16T22:57:46.499Z",
    "closed_at": null,
    "account_name": "Seyed Moein Abtahi",
    "carrier_name": "Pembridge"
  },
  {
    "id": "d0000000-0000-0000-0000-000000000002",
    "reference": "TXN-3055",
    "txn_type": "new_business",
    "state": "completed",
    "reason": "New auto policy — bound at Gore Mutual",
    "effective_date": "2025-09-01T00:00:00.000Z",
    "opened_at": "2026-06-20T22:57:46.499Z",
    "closed_at": "2026-06-27T22:57:46.499Z",
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
    "opened_at": "2026-07-24T22:57:46.499Z",
    "closed_at": null,
    "created_at": "2026-07-25T22:57:46.499Z",
    "updated_at": "2026-07-25T22:57:46.499Z",
    "module": "pc",
    "account_name": "Rahul Mehta",
    "carrier_name": "Pembridge",
    "events": [
      {
        "from_state": null,
        "to_state": "draft",
        "actor": "Gautam Khosla",
        "at": "2026-07-24T22:57:46.499Z"
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
    "opened_at": "2026-07-16T22:57:46.499Z",
    "closed_at": null,
    "created_at": "2026-07-25T22:57:46.499Z",
    "updated_at": "2026-07-25T22:57:46.499Z",
    "module": "pc",
    "account_name": "Seyed Moein Abtahi",
    "carrier_name": "Pembridge",
    "events": [
      {
        "from_state": null,
        "to_state": "draft",
        "actor": "Gautam Khosla",
        "at": "2026-07-16T22:57:46.499Z"
      },
      {
        "from_state": "draft",
        "to_state": "doc_generated",
        "actor": "Gautam Khosla",
        "at": "2026-07-16T23:17:46.499Z"
      },
      {
        "from_state": "doc_generated",
        "to_state": "sig_pending",
        "actor": "Gautam Khosla",
        "at": "2026-07-17T22:57:46.499Z"
      },
      {
        "from_state": "sig_pending",
        "to_state": "signed",
        "actor": "Gautam Khosla",
        "at": "2026-07-19T22:57:46.499Z"
      },
      {
        "from_state": "signed",
        "to_state": "submitted",
        "actor": "Gautam Khosla",
        "at": "2026-07-20T22:57:46.499Z"
      }
    ],
    "submissions": [
      {
        "channel": "portal",
        "status": "sent",
        "carrier_ref": null,
        "submitted_at": "2026-07-20T22:57:46.499Z",
        "acknowledged_at": null
      }
    ],
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
    "opened_at": "2026-06-20T22:57:46.499Z",
    "closed_at": "2026-06-27T22:57:46.499Z",
    "created_at": "2026-07-25T22:57:46.499Z",
    "updated_at": "2026-07-25T22:57:46.499Z",
    "module": "pc",
    "account_name": "Amrit Gill",
    "carrier_name": "Gore Mutual",
    "events": [
      {
        "from_state": null,
        "to_state": "draft",
        "actor": "Gautam Khosla",
        "at": "2026-06-20T22:57:46.499Z"
      },
      {
        "from_state": "draft",
        "to_state": "doc_generated",
        "actor": "Gautam Khosla",
        "at": "2026-06-21T22:57:46.499Z"
      },
      {
        "from_state": "doc_generated",
        "to_state": "sig_pending",
        "actor": "Gautam Khosla",
        "at": "2026-06-22T22:57:46.499Z"
      },
      {
        "from_state": "sig_pending",
        "to_state": "signed",
        "actor": "Gautam Khosla",
        "at": "2026-06-23T22:57:46.499Z"
      },
      {
        "from_state": "signed",
        "to_state": "submitted",
        "actor": "Gautam Khosla",
        "at": "2026-06-24T22:57:46.499Z"
      },
      {
        "from_state": "submitted",
        "to_state": "carrier_ack",
        "actor": "Gautam Khosla",
        "at": "2026-06-26T22:57:46.499Z"
      },
      {
        "from_state": "carrier_ack",
        "to_state": "completed",
        "actor": "Gautam Khosla",
        "at": "2026-06-27T22:57:46.499Z"
      }
    ],
    "submissions": [
      {
        "channel": "portal",
        "status": "acknowledged",
        "carrier_ref": "GM-771204",
        "submitted_at": "2026-06-24T22:57:46.499Z",
        "acknowledged_at": "2026-06-26T22:57:46.499Z"
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
      "granted_at": "2026-07-29 13:17:56.782046+00"
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
          "id": "d4b236f7-6740-499c-ba2f-f8182fdc0fb2",
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
          "id": "ca078531-6872-4850-9a4e-b4bf3499e666",
          "staff_id": "50000000-0000-0000-0000-0000000000c5",
          "role_code": "pc_service",
          "role_name": "P&C service",
          "licence_id": "d4b236f7-6740-499c-ba2f-f8182fdc0fb2",
          "granted_at": "2026-07-29 13:18:17.228204+00"
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
          "id": "3f51d7b5-39e5-4009-95fd-67195fe85c91",
          "staff_id": "50000000-0000-0000-0000-000000000001",
          "role_code": "admin_principal",
          "role_name": "Admin / Principal broker",
          "licence_id": "11c00000-0000-0000-0000-000000000001",
          "granted_at": "2026-07-29 13:17:56.782046+00"
        }
      ]
    }
  ]
}) as unknown as TeamRoster;
