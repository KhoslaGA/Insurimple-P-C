import { uuidv7 } from 'uuidv7';

/**
 * Primary keys for every table in the platform.
 *
 * UUIDv7 is time-ordered: a millisecond timestamp in the high 48 bits, so
 * inserts append to the right edge of the B-tree instead of landing in a random
 * leaf. At the book size this platform is built for — 50k accounts, 100k
 * policies, ~3M audit rows a year — random v4 keys mean a cache miss per
 * insert, write amplification in WAL, and an index that bloats faster than the
 * table. It is also the least reversible decision in the schema: changing key
 * format later is a full rewrite of a live book.
 *
 * Generated here rather than by the database, and the tables carry no default,
 * so a caller that forgets an id gets a NOT NULL violation on the first insert
 * rather than a working system with quietly random keys. It also means the id
 * exists before the write: it can be logged with the request, and a retried
 * insert carries the same key instead of creating a second row.
 *
 * `uuidv7()` keeps a counter across calls within the same millisecond, so ids
 * minted in a burst still order correctly.
 */
export function newId(): string {
  return uuidv7();
}
