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
    const [{ drizzle }, { migrate }, postgresModule] = await Promise.all([
      import('drizzle-orm/postgres-js'),
      import('drizzle-orm/postgres-js/migrator'),
      import('postgres'),
    ]);
    // max: 1 keeps us inside the connection budget of serverless Postgres.
    const client = postgresModule.default(url, { max: 1 });
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder });
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

export function getDb(): Promise<Db> {
  globalForDb.__botchinDb ??= connect();
  return globalForDb.__botchinDb;
}
