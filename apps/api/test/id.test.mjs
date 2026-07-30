/**
 * Key format.
 *
 * The whole point of UUIDv7 is that keys sort in creation order, so inserts
 * append to the right edge of the B-tree rather than landing in a random leaf.
 * If that property does not hold, the migration away from v4 bought nothing —
 * and it is exactly the kind of thing that looks fine in a code review and is
 * only visible under volume.
 *
 * These run without a database: the generator is the thing under test.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { newId } from '../dist/db/id.js';

const V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('primary keys are UUIDv7', () => {
  it('mints 10,000 ids that are strictly increasing as strings', () => {
    const ids = Array.from({ length: 10_000 }, () => newId());
    for (let i = 1; i < ids.length; i++) {
      assert.ok(
        ids[i] > ids[i - 1],
        `id ${i} (${ids[i]}) does not sort after id ${i - 1} (${ids[i - 1]}) — ` +
        'lexical order is what Postgres indexes, so this is the property that matters',
      );
    }
  });

  it('carries version 7 and the RFC 9562 variant bits', () => {
    for (let i = 0; i < 1000; i++) {
      const id = newId();
      assert.match(id, V7, `${id} is not a well-formed UUIDv7`);
    }
  });

  it('mints 10,000 distinct ids', () => {
    const ids = new Set(Array.from({ length: 10_000 }, () => newId()));
    assert.equal(ids.size, 10_000);
  });

  it('encodes the current time in the leading 48 bits', () => {
    const before = Date.now();
    const id = newId();
    const after = Date.now();
    const ms = parseInt(id.replace(/-/g, '').slice(0, 12), 16);
    assert.ok(
      ms >= before && ms <= after,
      `timestamp ${ms} is outside [${before}, ${after}] — the id is not time-ordered`,
    );
  });
});
