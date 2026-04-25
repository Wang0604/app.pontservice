import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import postgres from 'postgres';
import * as schema from './schema';

type Db = ReturnType<typeof createDbPostgres>;

const globalForDb = globalThis as unknown as {
  db: Db | undefined;
  pgClient: ReturnType<typeof postgres> | undefined;
  pgliteClient: unknown;
  schemaApplied: boolean | undefined;
};

/**
 * Decide which DB driver to use:
 *   1. DATABASE_URL starts with `pglite:` → embedded PGlite (zero install, file-backed)
 *   2. DATABASE_URL set to a real Postgres URL → postgres-js (Railway / 本地 PG / Supabase / 阿里云 RDS)
 *   3. DATABASE_URL empty AND NODE_ENV != production → fall back to PGlite at .local.pgdata
 *      (so dev can come up without configuring anything)
 *   4. Empty in production → throw, refuse to silently use PGlite
 */
function shouldUsePglite(): boolean {
  const url = process.env.DATABASE_URL?.trim() ?? '';
  if (url.startsWith('pglite:')) return true;
  if (!url && process.env.NODE_ENV !== 'production') return true;
  return false;
}

function createDbPostgres() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const client =
    globalForDb.pgClient ??
    postgres(connectionString, {
      max: process.env.NODE_ENV === 'production' ? 10 : 5,
      idle_timeout: 20,
      connect_timeout: 10,
    });

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.pgClient = client;
  }

  return drizzlePostgres(client, {
    schema,
    logger: process.env.NODE_ENV === 'development',
  });
}

function createDbPglite() {
  // Use a require so the postgres-only build (e.g., production) doesn't have to
  // ship the PGlite WASM blob. In dev / pglite mode, this is fine.
  const runtimeRequire = eval('require') as NodeRequire;
  const { PGlite } = runtimeRequire('@electric-sql/pglite') as {
    PGlite: new (dataDir?: string) => {
      exec: (sql: string) => Promise<unknown>;
      query: (sql: string) => Promise<unknown>;
    };
  };

  const url = process.env.DATABASE_URL?.trim() ?? '';
  // Accept formats:
  //   pglite://memory      → in-memory
  //   pglite://./path      → file-backed at ./path
  //   (empty)              → file-backed at .local.pgdata
  let dataDir: string | undefined = '.local.pgdata';
  if (url.startsWith('pglite:')) {
    const after = url.slice('pglite:'.length).replace(/^\/\//, '');
    if (after === 'memory' || after === '') dataDir = undefined;
    else dataDir = after;
  }

  const client =
    (globalForDb.pgliteClient as InstanceType<typeof PGlite> | undefined) ??
    (dataDir ? new PGlite(dataDir) : new PGlite());
  globalForDb.pgliteClient = client;

  // eslint-disable-next-line no-console
  console.log(`[db] using PGlite (${dataDir ?? 'memory'})`);

  const drizzle = drizzlePglite as unknown as (
    client: unknown,
    config: { schema: typeof schema; logger: boolean },
  ) => Db;

  return drizzle(client, {
    schema,
    logger: process.env.NODE_ENV === 'development',
  });
}

function createDbReal(): Db {
  return shouldUsePglite() ? createDbPglite() : createDbPostgres();
}

/**
 * Lazy Proxy: defer real DB client creation until first real query.
 * Next.js build needs this so module imports succeed without runtime env.
 */
function lazyDb(): Db {
  if (globalForDb.db) return globalForDb.db;

  const proxy = new Proxy({} as Db, {
    get(_, prop) {
      if (!globalForDb.db) globalForDb.db = createDbReal();
      const value = (globalForDb.db as unknown as Record<string | symbol, unknown>)[
        prop as string | symbol
      ];
      if (typeof value === 'function') {
        return (value as (...args: unknown[]) => unknown).bind(globalForDb.db);
      }
      return value;
    },
  });

  return proxy;
}

export const db = lazyDb();

export { schema };
export * from './schema';

export function isUsingPglite(): boolean {
  return shouldUsePglite();
}

export function getPgliteClient():
  | { exec: (sql: string) => Promise<unknown>; query: (sql: string) => Promise<unknown> }
  | undefined {
  // Touch the proxy so the client is created if we're in pglite mode
  if (shouldUsePglite() && !globalForDb.db) globalForDb.db = createDbReal();
  return globalForDb.pgliteClient as never;
}

export function markSchemaApplied() {
  globalForDb.schemaApplied = true;
}

export function isSchemaApplied(): boolean {
  return Boolean(globalForDb.schemaApplied);
}
