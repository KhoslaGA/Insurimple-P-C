-- 0003 — users and licences
--
-- Invariant #3: THE LICENCE IS THE SECURITY BOUNDARY. Capability is not a role
-- string an admin can toggle — it derives from a licence on file that has an
-- expiry. A Life-only user cannot create a P&C transaction, and that is
-- enforced by a guard the write path cannot skip, not by hiding a button.

BEGIN;

CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  -- Identity comes from Clerk. The org claim supplies tenant context; this is
  -- the subject claim. Never trusted from a request body.
  clerk_user_id  text NOT NULL,
  full_name      text NOT NULL,
  email          citext,
  status         text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'invited', 'suspended')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, clerk_user_id)
);

CREATE INDEX users_tenant_idx ON users (tenant_id);

/* Licence classes, and the module each one authorises. This mapping is the
   whole of invariant #3: a class grants exactly one module's capability. */
CREATE TABLE licence_classes (
  code         text PRIMARY KEY,
  name         text NOT NULL,
  regulator    text NOT NULL,
  module_code  text NOT NULL REFERENCES modules (code)
);

INSERT INTO licence_classes (code, name, regulator, module_code) VALUES
  ('ribo',     'RIBO general insurance',        'RIBO',  'pc'),
  ('llqp',     'Life licence (LLQP)',           'FSRA',  'life'),
  ('mortgage', 'Mortgage agent / broker',       'FSRA',  'mortgage')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE licences (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  class_code      text NOT NULL REFERENCES licence_classes (code),
  licence_number  text NOT NULL,
  issued_on       date NOT NULL,
  expires_on      date NOT NULL,
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'revoked', 'surrendered')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT licences_period_valid CHECK (expires_on >= issued_on),
  UNIQUE (tenant_id, user_id, class_code, licence_number)
);

CREATE INDEX licences_tenant_user_idx ON licences (tenant_id, user_id);

COMMENT ON TABLE licences IS
  'Invariant #3. Expiry is load-bearing: a lapsed licence removes capability the same day, with no admin action.';

/* Does the acting user hold a valid, unexpired licence authorising this module?
   Reads both the user and tenant from GUCs, so it cannot be spoofed by a
   parameter. Fails closed when context is unset. */
CREATE OR REPLACE FUNCTION app.user_is_licensed_for_module(p_module text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM licences l
    JOIN licence_classes lc ON lc.code = l.class_code
    WHERE l.tenant_id = app.current_tenant_id()
      AND l.user_id   = app.current_user_id()
      AND lc.module_code = p_module
      AND l.status = 'active'
      AND l.issued_on  <= current_date
      AND l.expires_on >= current_date
  )
$$;

COMMENT ON FUNCTION app.user_is_licensed_for_module(text) IS
  'Invariant #3: licensing gate. False when unlicensed, expired, revoked, or context unset.';

/* The combined gate every module-scoped write must pass: the brokerage must be
   entitled to sell the module (commercial, #4) AND the individual must be
   licensed to transact it (regulatory, #3). Both, always — they are different
   boundaries and neither substitutes for the other. */
CREATE OR REPLACE FUNCTION app.may_transact_module(p_module text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT app.tenant_has_module(p_module)
     AND app.user_is_licensed_for_module(p_module)
$$;

COMMIT;
