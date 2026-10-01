import 'server-only';

import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';

import * as schema from './schema';

/**
 * One type for both drivers. Pinning the common base keeps every call site free
 * of driver-specific unions, which otherwise break method overloads like
 * `.returning()`.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * Two backends, one schema:
 *
 * - `DATABASE_URL` set   -> real Postgres over postgres-js (deployment).
 * - `DATABASE_URL` unset -> PGlite, Postgres compiled to wasm, stored in
 *   `./.pglite`. Same SQL, nothing to install, so `npm run dev` works on a
 *   fresh clone.
 *
 * Migrations are applied once per process, on first access.
 */
async function connect(): Promise<Db> {
  const migrationsFolder = 'drizzle';
  const url = process.env.DATABASE_URL;

  if (url) {
    const [{ drizzle }, { migrate }, { sql }, postgresModule] = await Promise.all([
      import('drizzle-orm/postgres-js'),
      import('drizzle-orm/postgres-js/migrator'),
      import('drizzle-orm'),
      import('postgres'),
    ]);
    // max: 1 keeps us inside the connection budget of serverless Postgres.
    const client = postgresModule.default(url, { max: 1 });
    const db = drizzle(client, { schema });

    // Serverless scales out by starting instances, and each one arrives here on
    // its first request — so without a lock a deploy can run the same migration
    // from several processes at once. The advisory lock is held for the session
    // and released explicitly; the key is an arbitrary constant shared by all
    // instances of this app.
    await db.execute(sql`select pg_advisory_lock(8471294016)`);
    try {
      await migrate(db, { migrationsFolder });
    } finally {
      await db.execute(sql`select pg_advisory_unlock(8471294016)`);
    }
    return db as unknown as Db;
  }

  const [{ PGlite }, { drizzle }, { migrate }] = await Promise.all([
    import('@electric-sql/pglite'),
    import('drizzle-orm/pglite'),
    import('drizzle-orm/pglite/migrator'),
  ]);
  const client = new PGlite(process.env.PGLITE_DIR ?? '.pglite');
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
  return db as unknown as Db;
}

// Next.js re-evaluates modules on hot reload; without this, each reload would
// open another PGlite instance on the same directory and fight over the lock.
const globalForDb = globalThis as unknown as { __botchinDb?: Promise<Db> };

/**
 * Caching the promise is what makes connect-and-migrate happen once. Caching a
 * *rejected* one would make a single bad moment permanent: every later request
 * would await the same failure and the instance would never try again. So a
 * failure clears the slot and the next caller gets a fresh attempt.
 */
export function getDb(): Promise<Db> {
  if (!globalForDb.__botchinDb) {
    const pending = connect();
    globalForDb.__botchinDb = pending;
    pending.catch(() => {
      if (globalForDb.__botchinDb === pending) globalForDb.__botchinDb = undefined;
    });
  }
  return globalForDb.__botchinDb;
}
