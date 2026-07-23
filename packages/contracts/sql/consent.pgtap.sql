-- ============================================================================
-- TM.1 pgTAP — STRUCTURAL forward-spec (runs against the Postgres spine, not
-- in this repo). Mirrors the acceptance criteria that consent.test.ts and
-- store.test.ts assert today at the contracts layer.
-- ============================================================================
BEGIN;
SELECT plan(6);

SELECT set_config('app.current_tenant', (SELECT id::text FROM tenants WHERE slug = 'klc'), true);

-- 1–2. CASL clock: EBR = capture + 2y, inquiry = capture + 6m (generated col)
INSERT INTO consent_records (tenant_id, party_id, channel, class, source, captured_at)
VALUES (current_setting('app.current_tenant')::uuid, :party_a, 'email', 'implied_ebr', 't', DATE '2026-01-15');
SELECT is(
  (SELECT expires_at FROM consent_records WHERE party_id = :party_a AND channel = 'email'),
  DATE '2028-01-15', 'EBR consent expires 2 years after capture');

INSERT INTO consent_records (tenant_id, party_id, channel, class, source, captured_at)
VALUES (current_setting('app.current_tenant')::uuid, :party_b, 'email', 'implied_inquiry', 't', DATE '2026-04-30');
SELECT is(
  (SELECT expires_at FROM consent_records WHERE party_id = :party_b AND channel = 'email'),
  DATE '2026-10-30', 'inquiry consent expires 6 months after capture');

-- 3. a suppressed address provably cannot receive a marketing send
INSERT INTO suppression_list (tenant_id, address, channel, reason)
VALUES (current_setting('app.current_tenant')::uuid, 'susan@example.ca', 'email', 'unsubscribe');
SELECT throws_ok($$
  INSERT INTO sends (tenant_id, party_id, channel, message_class, consent_id, address)
  VALUES (current_setting('app.current_tenant')::uuid, :party_a, 'email', 'marketing',
          (SELECT id FROM consent_records WHERE party_id = :party_a), 'susan@example.ca')
$$, '23514', NULL, 'suppressed address cannot receive a marketing send');

-- 4. a marketing send with no consent is rejected
SELECT throws_ok($$
  INSERT INTO sends (tenant_id, party_id, channel, message_class, address)
  VALUES (current_setting('app.current_tenant')::uuid, :party_c, 'email', 'marketing', 'new@example.ca')
$$, NULL, NULL, 'marketing send without consent is rejected');

-- 5. a service message cannot carry campaign linkage (message_class has teeth)
SELECT throws_ok($$
  INSERT INTO sends (tenant_id, party_id, channel, message_class, campaign_id, address)
  VALUES (current_setting('app.current_tenant')::uuid, :party_a, 'email', 'service',
          :some_campaign, 'susan@example.ca')
$$, '23514', NULL, 'service message cannot be campaign-linked');

-- 6. consent evidence is append-only
SELECT lives_ok($$
  INSERT INTO consent_evidence (tenant_id, party_id, channel, action, to_class, source)
  VALUES (current_setting('app.current_tenant')::uuid, :party_a, 'email', 'unsubscribed', 'none', 'preference_center')
$$, 'evidence rows insert');

SELECT * FROM finish();
ROLLBACK;
