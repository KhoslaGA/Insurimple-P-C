-- ============================================================================
-- TM.1 pgTAP — STRUCTURAL forward-spec (runs against the Postgres spine, not
-- in this repo). Mirrors the acceptance criteria that consent.test.ts and
-- store.test.ts assert today at the contracts layer.
--
-- NOTE: uses LITERAL uuids, never psql :vars — psql does not interpolate :vars
-- inside dollar-quoted ($q$...$q$) bodies, so throws_ok/lives_ok payloads must
-- be self-contained SQL.
-- ============================================================================
BEGIN;
SELECT plan(9);

-- fixture tenant + RLS context (all literal)
SELECT set_config('app.current_tenant', '11111111-1111-1111-1111-111111111111', true);
INSERT INTO parties (id, tenant_id, email, phone) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'susan@example.ca', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'marcus@example.ca', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'nobody@example.ca', NULL),
  ('aaaaaaaa-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', NULL, NULL);

-- 1–2. CASL clock: generated expires_at = capture + 2y (EBR) / + 6m (inquiry)
INSERT INTO consent_records (tenant_id, party_id, channel, class, source, captured_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', 'email', 'implied_ebr', 't', DATE '2026-01-15');
SELECT is(
  (SELECT expires_at FROM consent_records WHERE party_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  DATE '2028-01-15', 'EBR consent expires 2 years after capture');

INSERT INTO consent_records (tenant_id, party_id, channel, class, source, captured_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000002', 'email', 'implied_inquiry', 't', DATE '2026-04-30');
SELECT is(
  (SELECT expires_at FROM consent_records WHERE party_id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  DATE '2026-10-30', 'inquiry consent expires 6 months after capture');

-- 3. a suppressed address provably cannot receive a marketing send
INSERT INTO suppression_list (tenant_id, address, channel, reason)
VALUES ('11111111-1111-1111-1111-111111111111', 'susan@example.ca', 'email', 'unsubscribe');
SELECT throws_ok($q$
  INSERT INTO sends (tenant_id, party_id, channel, message_class, consent_id, address)
  VALUES ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', 'email', 'marketing',
          (SELECT id FROM consent_records WHERE party_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'susan@example.ca')
$q$, '23514', NULL, 'suppressed address cannot receive a marketing send');

-- 4. a marketing send with no consent is rejected
SELECT throws_ok($q$
  INSERT INTO sends (tenant_id, party_id, channel, message_class, address)
  VALUES ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000002', 'email', 'marketing', 'marcus@example.ca')
$q$, '23514', NULL, 'marketing send without consent is rejected');

-- 5. a service message cannot carry campaign linkage (message_class has teeth)
SELECT throws_ok($q$
  INSERT INTO sends (tenant_id, party_id, channel, message_class, campaign_id, address)
  VALUES ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000002', 'email', 'service',
          'cccccccc-0000-0000-0000-000000000001', 'marcus@example.ca')
$q$, '23514', NULL, 'service message cannot be campaign-linked');

-- 6–8. criterion C: apply_preference_update commits consent + evidence +
--      suppression atomically (unsubscribe on party #2).
SELECT lives_ok($q$
  SELECT apply_preference_update('aaaaaaaa-0000-0000-0000-000000000002', 'email', 'unsubscribe', 'preference_center')
$q$, 'atomic preference update commits');
SELECT is(
  (SELECT class FROM consent_records WHERE party_id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  'none'::consent_class, 'unsubscribe flips consent to none');
SELECT ok(
  EXISTS (SELECT 1 FROM suppression_list
          WHERE address = 'marcus@example.ca' AND channel = 'email')
  AND EXISTS (SELECT 1 FROM consent_evidence
          WHERE party_id = 'aaaaaaaa-0000-0000-0000-000000000002' AND action = 'unsubscribed'),
  'unsubscribe writes suppression AND evidence in the same call');

-- 9. atomic update on a party with no address rolls the whole call back
SELECT throws_ok($q$
  SELECT apply_preference_update('aaaaaaaa-0000-0000-0000-000000000004', 'email', 'unsubscribe', 'preference_center')
$q$, '23514', NULL, 'update on an addressless party is rejected (all-or-nothing)');

SELECT * FROM finish();
ROLLBACK;
